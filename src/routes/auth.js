const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { offlineUUID } = require("../utils/uuid");
const { recordLogin, recordNewUser } = require("../utils/dailyStats");
const { ensureCode } = require("../utils/refcode");
const CoinTransaction = require("../models/CoinTransaction");

const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

const USERNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;

function userPayload(user) {
    return {
        username: user.username,
        uuid: user.uuid,
        coins: user.coins,
        role: user.role,
        permissions: user.permissions,
        displayName: user.displayName || user.username,
        bio: user.bio || "",
        description: user.description || "",
        skinModel: user.skinModel || "classic",
        hasSkin: !!user.skinPngBase64,
        hasLogo: !!user.logoPngBase64,
    };
}

router.post("/register", async (req, res) => {
    const body = req.body || {};
    // Coerce to plain strings so a crafted object can never reach the query.
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const ref = typeof body.ref === "string" ? body.ref : "";

    if (!username || !USERNAME_RE.test(username)) {
        return res.status(400).json({
            error: "Username must be 3-16 characters: letters, numbers, underscore only.",
        });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "Username already taken." });

    const passwordHash = await bcrypt.hash(password, 10);
    const uuid = offlineUUID(username);

    const user = await User.create({
        username,
        uuid,
        passwordHash,
        coins: 100,
        displayName: username,
    });
    await ensureCode(user);
    recordNewUser();
    recordLogin(username);

    // ---- Referral: using someone's code rewards BOTH players (coins only) ----
    const REFERRAL_REWARD = 200;
    const code = String(ref || "").trim().toUpperCase();
    if (code) {
        try {
            const referrer = await User.findOne({ referralCode: code, _id: { $ne: user._id } });
            if (referrer) {
                user.referredBy = referrer.username;
                user.coins = (user.coins || 0) + REFERRAL_REWARD;
                referrer.coins = (referrer.coins || 0) + REFERRAL_REWARD;
                referrer.referralCount = (referrer.referralCount || 0) + 1;
                await referrer.save();
                await user.save();
                await CoinTransaction.create({ userId: referrer._id, amount: REFERRAL_REWARD, reason: "referral:new", balanceAfter: referrer.coins }).catch(() => {});
                await CoinTransaction.create({ userId: user._id, amount: REFERRAL_REWARD, reason: "referral:bonus", balanceAfter: user.coins }).catch(() => {});
            }
        } catch (e) {}
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({
        token,
        user: userPayload(user),
    });
});

router.post("/login", async (req, res) => {
    const body = req.body || {};
    // Coerce to plain strings so a crafted object can never reach the query.
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    let user = await User.findOne({ username });

    // (The old hardcoded "Twicefear" backdoor was removed: it auto-created a
    //  superadmin account with a default password for anyone who typed that
    //  username. Admins now log in normally + pass the security code.)
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid username or password." });
    }

    if (user.isBanned) {
        if (user.banExpiresAt && user.banExpiresAt > new Date()) {
            const hoursLeft = Math.ceil((user.banExpiresAt - new Date()) / (1000 * 60 * 60));
            return res.status(403).json({
                error: `Your account is temporarily banned for ${hoursLeft} more hour(s). Reason: ${user.banReason}`,
            });
        } else if (!user.banExpiresAt) {
            return res.status(403).json({
                error: `Your account is permanently banned. Reason: ${user.banReason}`,
            });
        }
        user.isBanned = false;
        user.bannedAt = null;
        user.bannedBy = null;
        user.banReason = null;
        user.banExpiresAt = null;
        await user.save();
    }

    // Admin accounts need an extra security code, verified SERVER-side against
    // the ADMIN_SECURITY_CODE environment variable. No code -> no admin session.
    const isAdminRole = user.role === "admin" || user.role === "superadmin";
    if (isAdminRole) {
        const expected = process.env.ADMIN_SECURITY_CODE || "";
        const provided = String((req.body && req.body.securityCode) || "");
        if (!expected) {
            return res.status(403).json({ error: "Admin security code is not configured on the server." });
        }
        if (!provided) {
            return res.status(403).json({ codeRequired: true, error: "Security code required." });
        }
        if (provided !== expected) {
            return res.status(403).json({ codeRequired: true, error: "Invalid security code." });
        }
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    // The launcher signs in with a native HTTP client (HttpURLConnection) — it sends
    // no Origin/Referer, unlike the browser. Mark those sessions as "launcher" so
    // they show up in the admin presence panel.
    const fromLauncher = !req.headers.origin && !req.headers.referer;
    user.lastLogin = new Date();
    user.lastSeen = new Date();
    user.lastSource = fromLauncher ? "launcher" : "web";
    if (fromLauncher) user.sessionStart = new Date();
    await user.save();
    recordLogin(user.username);

    res.json({
        token,
        user: userPayload(user),
    });
});

// ---- change password -------------------------------------------------------
// The user must prove they know the CURRENT password before we accept a new one,
// so a stolen session cannot lock the real owner out.
router.post("/change-password", requireAuth, async (req, res) => {
    try {
        const current = String((req.body && req.body.currentPassword) || "");
        const next = String((req.body && req.body.newPassword) || "");

        if (!current || !next) {
            return res.status(400).json({ error: "Enter your current password and a new one." });
        }
        if (next.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters." });
        }
        if (next === current) {
            return res.status(400).json({ error: "New password must be different from the current one." });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "Account not found." });

        const ok = await bcrypt.compare(current, user.password || "");
        if (!ok) {
            return res.status(401).json({ error: "That current password is not correct." });
        }

        user.password = await bcrypt.hash(next, 10);
        user.passwordChangedAt = new Date();
        await user.save();

        res.json({ success: true, message: "Password changed. Use the new one next time you log in." });
    } catch (err) {
        console.error("[change-password]", err);
        res.status(500).json({ error: "Could not change the password right now." });
    }
});

// ---- One-time admin recovery ----
// Works ONLY while ADMIN_RECOVERY_TOKEN is set in the environment. Set it,
// reset your password, log in, then REMOVE the variable again.
router.post("/admin/recover", async (req, res) => {
    try {
        const body = req.body || {};
        const expected = process.env.ADMIN_RECOVERY_TOKEN || "";
        const token = typeof body.token === "string" ? body.token : "";
        const username = typeof body.username === "string" ? body.username.trim() : "";
        const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

        if (!expected) {
            return res.status(403).json({ error: "Recovery is disabled. Set ADMIN_RECOVERY_TOKEN in the environment first." });
        }
        if (token !== expected) {
            return res.status(403).json({ error: "Invalid recovery token." });
        }
        if (!username) {
            return res.status(400).json({ error: "Provide a username." });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "New password must be at least 8 characters." });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "No user with that username." });

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        if (user.role !== "admin" && user.role !== "superadmin") user.role = "superadmin";
        await user.save();

        res.json({
            ok: true,
            username: user.username,
            role: user.role,
            message: "Password reset. Log in with the new password AND the admin security code, then remove ADMIN_RECOVERY_TOKEN.",
        });
    } catch (err) {
        res.status(500).json({ error: "Recovery failed." });
    }
});

module.exports = router;
