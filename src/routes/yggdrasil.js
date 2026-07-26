const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const GameSession = require("../models/GameSession");
const { signPayload } = require("../utils/keys");

const router = express.Router();

/**
 * Builds the "textures" property that goes inside a Yggdrasil profile response.
 * This is the piece that actually tells the Minecraft client where to download
 * the skin PNG from and whether it's the classic or slim (Alex) model.
 */
function buildTexturesProperty(user, keys, publicBaseUrl) {
    const texturePayload = {
        timestamp: Date.now(),
        profileId: user.uuid.replace(/-/g, ""),
        profileName: user.username,
        textures: {},
    };

    if (user.skinPngBase64) {
        texturePayload.textures.SKIN = {
            url: `${publicBaseUrl}/skins/${user.uuid}.png`,
        };
        if (user.skinModel === "slim") {
            texturePayload.textures.SKIN.metadata = { model: "slim" };
        }
    }

    if (user.capePngBase64) {
        texturePayload.textures.CAPE = {
            url: `${publicBaseUrl}/skins/${user.uuid}_cape.png`,
        };
    }

    const valueBase64 = Buffer.from(JSON.stringify(texturePayload), "utf8").toString("base64");
    const signature = signPayload(keys.privateKey, valueBase64);

    return { name: "textures", value: valueBase64, signature };
}

module.exports = function buildYggdrasilRouter({ keys, publicBaseUrl, serverName }) {
    // ---- Root meta endpoint. authlib-injector fetches this first to discover
    // ---- the server's capabilities and public key. ----
    router.get("/", (req, res) => {
        res.json({
            meta: {
                serverName,
                implementationName: "fearlauncher-skinserver",
                implementationVersion: "1.0.0",
                "feature.non_email_login": true,
                "feature.legacy_skin_api": false,
                "feature.no_mojang_namespace": true,
                "feature.enable_mojang_anti_features": false,
                "feature.username_check": false,
            },
            skinDomains: [new URL(publicBaseUrl).hostname],
            signaturePublickey: keys.publicKey,
        });
    });

    // ---- Login. The Minecraft client (via authlib-injector) calls this with the
    // ---- player's username/password, same credentials as the website login. ----
    router.post("/authserver/authenticate", express.json(), async (req, res) => {
        const { username, password, clientToken } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ error: "IllegalArgumentException", errorMessage: "Missing username or password" });
        }

        const user = await User.findOne({ username: username.trim() });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(403).json({ error: "ForbiddenOperationException", errorMessage: "Invalid credentials" });
        }
        if (user.banned) {
            return res.status(403).json({ error: "ForbiddenOperationException", errorMessage: "This account is banned." + (user.banReason ? " Reason: " + user.banReason : "") });
        }

        const accessToken = crypto.randomBytes(24).toString("hex");
        const finalClientToken = clientToken || crypto.randomBytes(24).toString("hex");

        await GameSession.create({ userId: user._id, accessToken, clientToken: finalClientToken });

        res.json({
            accessToken,
            clientToken: finalClientToken,
            selectedProfile: { id: user.uuid.replace(/-/g, ""), name: user.username },
            availableProfiles: [{ id: user.uuid.replace(/-/g, ""), name: user.username }],
            user: { id: user.uuid.replace(/-/g, ""), properties: [] },
        });
    });

    // ---- Refresh: the game calls this to keep a session alive without re-entering the password. ----
    router.post("/authserver/refresh", express.json(), async (req, res) => {
        const { accessToken, clientToken } = req.body || {};
        const session = await GameSession.findOne({ accessToken, valid: true });
        if (!session || (clientToken && session.clientToken !== clientToken)) {
            return res.status(403).json({ error: "ForbiddenOperationException", errorMessage: "Invalid token" });
        }

        const user = await User.findById(session.userId);
        if (!user) return res.status(403).json({ error: "ForbiddenOperationException", errorMessage: "Account no longer exists" });
        if (user.banned) {
            return res.status(403).json({ error: "ForbiddenOperationException", errorMessage: "This account is banned." });
        }

        const newAccessToken = crypto.randomBytes(24).toString("hex");
        session.accessToken = newAccessToken;
        await session.save();

        res.json({
            accessToken: newAccessToken,
            clientToken: session.clientToken,
            selectedProfile: { id: user.uuid.replace(/-/g, ""), name: user.username },
            user: { id: user.uuid.replace(/-/g, ""), properties: [] },
        });
    });

    // ---- Validate: checks whether a token is still good. ----
    router.post("/authserver/validate", express.json(), async (req, res) => {
        const { accessToken } = req.body || {};
        const session = await GameSession.findOne({ accessToken, valid: true });
        if (!session) return res.status(403).json({ error: "ForbiddenOperationException", errorMessage: "Invalid token" });
        res.status(204).end();
    });

    // ---- Invalidate / Signout: log the player out. ----
    router.post("/authserver/invalidate", express.json(), async (req, res) => {
        await GameSession.updateOne({ accessToken: req.body?.accessToken }, { valid: false });
        res.status(204).end();
    });

    router.post("/authserver/signout", express.json(), async (req, res) => {
        const { username, password } = req.body || {};
        const user = await User.findOne({ username });
        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            await GameSession.updateMany({ userId: user._id }, { valid: false });
        }
        res.status(204).end();
    });

    // ---- Profile lookup by UUID. This is what actually delivers the signed skin data. ----
    router.get("/sessionserver/session/minecraft/profile/:uuid", async (req, res) => {
        const compact = req.params.uuid.replace(/-/g, "").toLowerCase();
        const dashed = [
            compact.substring(0, 8),
            compact.substring(8, 12),
            compact.substring(12, 16),
            compact.substring(16, 20),
            compact.substring(20, 32),
        ].join("-");

        const user = await User.findOne({ uuid: dashed });
        if (!user) return res.status(204).end();

        const properties = [];
        if (user.skinPngBase64 || user.capePngBase64) {
            properties.push(buildTexturesProperty(user, keys, publicBaseUrl));
        }

        res.json({ id: compact, name: user.username, properties });
    });

    // ---- Bulk username -> uuid lookup, used by servers/tools. ----
    router.post("/api/profiles/minecraft", express.json(), async (req, res) => {
        const names = Array.isArray(req.body) ? req.body : [];
        const users = await User.find({ username: { $in: names } });
        res.json(users.map((u) => ({ id: u.uuid.replace(/-/g, ""), name: u.username })));
    });

    // ---- Server join flow (only relevant if you run/point a Minecraft server at this auth system). ----
    router.post("/sessionserver/session/minecraft/join", express.json(), async (req, res) => {
        const { accessToken, serverId } = req.body || {};
        const session = await GameSession.findOne({ accessToken, valid: true });
        if (!session) return res.status(403).json({ error: "ForbiddenOperationException", errorMessage: "Invalid token" });
        session.pendingServerId = serverId;
        session.pendingServerJoinedAt = new Date();
        await session.save();
        res.status(204).end();
    });

    router.get("/sessionserver/session/minecraft/hasJoined", async (req, res) => {
        const { username, serverId } = req.query;
        const user = await User.findOne({ username });
        if (!user) return res.status(204).end();

        const session = await GameSession.findOne({ userId: user._id, valid: true, pendingServerId: serverId });
        if (!session) return res.status(204).end();

        const properties = [];
        if (user.skinPngBase64 || user.capePngBase64) {
            properties.push(buildTexturesProperty(user, keys, publicBaseUrl));
        }
        res.json({ id: user.uuid.replace(/-/g, ""), name: user.username, properties });
    });

    return router;
};
