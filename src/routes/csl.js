const express = require("express");

const User = require("../models/User");

const router = express.Router();

// ---- CustomSkinLoader CustomSkinAPI ----
//
// CustomSkinLoader (CSL) resolves every player it draws, on any server, from the
// load list configured on the client. Each launcher user's client has this server
// in its list as a CustomSkinAPI source rooted at https://<host>/csl/, so this
// router is what lets launcher users see each other's skins and capes with no
// server-side plugin.
//
// The contract (CustomSkinAPI R2):
//   GET <root>/<username>.json          -> the player's texture ids
//   GET <root>/textures/<id>            -> the actual PNG for one of those ids
//
// CSL decides the *model* from the textures map, not from any authlib metadata:
// the first skin key in the map wins, and "slim" vs "default" selects the Alex or
// Steve arms. We therefore emit the stored model as the (single) skin key.
//
// Texture ids: "<uuid>" for the skin, "<uuid>_cape" for the cape. They are stable,
// so clients cache them; Cache-Control keeps that cache short so a re-upload
// propagates. Everything here is unauthenticated and read-only.

function skinTextureId(user) {
    return user.uuid;
}

function capeTextureId(user) {
    return user.uuid + "_cape";
}

// ---- GET /csl/<username>.json ----
router.get("/csl/:file", async (req, res) => {
    const file = req.params.file;
    if (!file.toLowerCase().endsWith(".json")) return res.status(404).end();

    const username = file.slice(0, -".json".length);
    if (!username) return res.status(404).end();

    // CSL may ask in any case; the username is unique and validated to
    // [A-Za-z0-9_]{3,16} at registration, so an anchored, case-insensitive match
    // mirrors the lookup style already used elsewhere in this server.
    const user = await User.findOne({
        username: { $regex: new RegExp("^" + username + "$", "i") },
    });
    if (!user) return res.status(404).end();

    const textures = {};
    if (user.skinPngBase64) {
        // The model CSL will use. "slim" -> Alex arms, "default" -> Steve arms.
        textures[user.skinModel === "slim" ? "slim" : "default"] = skinTextureId(user);
    }
    if (user.capePngBase64) {
        textures.cape = capeTextureId(user);
    }

    // A known user with nothing to show is not a texture source: fall through.
    if (Object.keys(textures).length === 0) return res.status(404).end();

    res.set("Cache-Control", "public, max-age=60");
    res.json({ username: user.username, textures });
});

// ---- GET /csl/textures/<id> ----
router.get("/csl/textures/:id", async (req, res) => {
    const id = req.params.id;
    const isCape = id.endsWith("_cape");
    const uuid = isCape ? id.slice(0, -"_cape".length) : id;

    const user = await User.findOne({ uuid });
    if (!user) return res.status(404).end();

    const base64 = isCape ? user.capePngBase64 : user.skinPngBase64;
    if (!base64) return res.status(404).end();

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=60");
    res.send(Buffer.from(base64, "base64"));
});

module.exports = router;
