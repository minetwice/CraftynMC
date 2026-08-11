const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Settings = require("../models/Settings");
const { offlineUUID } = require("../utils/uuid");

module.exports = function(options = {}) {
    const router = express.Router();
    router.use(express.json());
    
    const { dbConnected = true } = options;
    
    // Helper function to check DB connection
    function requireDB(req, res, next) {
        if (!dbConnected || mongoose.connection.readyState !== 1) {
            return res.status(503).json({ 
                error: "Database not connected. Running in demo mode.",
                demoMode: true 
            });
        }
        next();
    }

const requireAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: "Unauthorized: User not found" });
        }

        const isAdminAccount = user.username === "Twicefear";

        if (isAdminAccount && user.activeSessionToken && user.activeSessionToken !== token) {
            return res.status(403).json({
                error: "Admin account is already logged in from another location. Only one session allowed for admin.",
            });
        }

        if (user.role !== "admin" && user.role !== "superadmin" && !isAdminAccount) {
            return res.status(403).json({ error: "Forbidden: Admin access required" });
        }

        req.user = user;
        req.isAdminAccount = isAdminAccount;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

router.post("/admin/login", async (req, res) => {
    const { username, password } = req.body || {};

    if (username !== "Twicefear" || password !== "baiganmine1") {
        return res.status(401).json({ error: "Invalid admin credentials" });
    }

    let adminUser = await User.findOne({ username: "Twicefear" });

    if (!adminUser) {
        const passwordHash = await bcrypt.hash(password, 10);
        const uuid = offlineUUID(username);

        adminUser = await User.create({
            username: "Twicefear",
            uuid,
            passwordHash,
            role: "superadmin",
            coins: 999999,
            permissions: {
                canUploadSkins: true,
                canUploadCapes: true,
                canAccessPremiumMods: true,
                canAccessPremiumPlugins: true,
                canGiftCoins: true,
                canBanUsers: true,
                canEditUsers: true,
            },
        });
    } else {
        if (!(await bcrypt.compare(password, adminUser.passwordHash))) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        if (adminUser.activeSessionToken) {
            try {
                jwt.verify(adminUser.activeSessionToken, process.env.JWT_SECRET);
                return res.status(403).json({
                    error: "Admin account is already logged in from another location. Only one session allowed for admin.",
                    sessionLockedAt: adminUser.sessionLockedAt,
                });
            } catch (err) {
                console.log("Previous admin session expired, allowing new login");
            }
        }
    }

    const token = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    adminUser.activeSessionToken = token;
    adminUser.sessionLockedAt = new Date();
    adminUser.lastLogin = new Date();
    await adminUser.save();

    res.json({
        token,
        user: {
            username: adminUser.username,
            uuid: adminUser.uuid,
            coins: adminUser.coins,
            role: adminUser.role,
            permissions: adminUser.permissions,
        },
        message: "Admin login successful. Session locked - no other logins allowed.",
    });
});

router.post("/admin/logout", requireAdmin, async (req, res) => {
    if (req.isAdminAccount) {
        req.user.activeSessionToken = null;
        req.user.sessionLockedAt = null;
        await req.user.save();
    }
    res.json({ message: "Logged out successfully" });
});

router.get("/admin/users", requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Banned users list
router.get("/admin/bans", requireAdmin, async (req, res) => {
    try {
        const bans = await User.find({ isBanned: true })
            .select("-passwordHash -activeSessionToken")
            .sort({ bannedAt: -1 });
        res.json({ bans, count: bans.length });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch ban list" });
    }
});

router.get("/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-passwordHash");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

router.post("/admin/users/:userId/ban", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.username === "Twicefear") {
            return res.status(403).json({ error: "Cannot ban the admin account" });
        }

        const { ban, reason, duration } = req.body;

        if (ban) {
            user.isBanned = true;
            user.bannedAt = new Date();
            user.bannedBy = req.user.username;
            user.banReason = reason || "No reason provided";

            if (duration) {
                user.banExpiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
            } else {
                user.banExpiresAt = null;
            }

            await user.save();
            res.json({ message: `User ${user.username} has been banned`, user });
        } else {
            user.isBanned = false;
            user.bannedAt = null;
            user.bannedBy = null;
            user.banReason = null;
            user.banExpiresAt = null;
            await user.save();
            res.json({ message: `User ${user.username} has been unbanned`, user });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to update ban status" });
    }
});

router.post("/admin/users/:userId/role", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.username === "Twicefear") {
            return res.status(403).json({ error: "Cannot change admin account role" });
        }

        const { role } = req.body;
        if (!["user", "moderator", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        user.role = role;

        if (role === "moderator") {
            user.permissions.canBanUsers = true;
            user.permissions.canEditUsers = true;
        } else if (role === "admin") {
            user.permissions.canBanUsers = true;
            user.permissions.canEditUsers = true;
            user.permissions.canGiftCoins = true;
            user.permissions.canAccessPremiumMods = true;
            user.permissions.canAccessPremiumPlugins = true;
        } else {
            user.permissions.canBanUsers = false;
            user.permissions.canEditUsers = false;
            user.permissions.canGiftCoins = false;
        }

        await user.save();

        res.json({ message: `User ${user.username} role updated to ${role}`, user });
    } catch (err) {
        res.status(500).json({ error: "Failed to update user role" });
    }
});

router.post("/admin/users/:userId/permissions", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.username === "Twicefear") {
            return res.status(403).json({ error: "Cannot change admin account permissions" });
        }

        const permissions = req.body;

        Object.keys(permissions).forEach((key) => {
            if (user.permissions.hasOwnProperty(key)) {
                user.permissions[key] = permissions[key];
            }
        });

        await user.save();
        res.json({ message: "Permissions updated successfully", user });
    } catch (err) {
        res.status(500).json({ error: "Failed to update permissions" });
    }
});

router.post("/admin/users/:userId/gift-coins", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        user.coins += amount;
        await user.save();

        res.json({
            message: `Gifted ${amount} coins to ${user.username}`,
            newBalance: user.coins,
            user,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to gift coins" });
    }
});

router.get("/admin/stats", requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({
            lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        });
        const totalCoins = await User.aggregate([{ $group: { _id: null, total: { $sum: "$coins" } } }]);
        const bannedUsers = await User.countDocuments({ isBanned: true });
        const premiumUsers = await User.countDocuments({ role: { $in: ["admin", "moderator"] } });

        const topCountries = await User.aggregate([
            { $match: { country: { $ne: null } } },
            { $group: { _id: "$country", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const genderDemographics = await User.aggregate([
            { $match: { pronouns: { $ne: null } } },
            { $group: { _id: "$pronouns", count: { $sum: 1 } } }
        ]);

        res.json({
            totalUsers,
            activeUsers,
            totalCoins: totalCoins[0]?.total || 0,
            bannedUsers,
            premiumUsers,
            topCountries,
            genderDemographics,
            serverUptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

router.get("/admin/activity", requireAdmin, async (req, res) => {
    try {
        const recentUsers = await User.find()
            .select("username lastLogin coins role isBanned")
            .sort({ lastLogin: -1 })
            .limit(10);

        const activity = recentUsers.map((user) => ({
            type: "login",
            username: user.username,
            timestamp: user.lastLogin,
            details: `${user.username} logged in`,
        }));

        res.json({ activity });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch activity" });
    }
});

router.delete("/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.username === "Twicefear") {
            return res.status(403).json({ error: "Cannot delete the admin account" });
        }

        await User.deleteOne({ _id: req.params.userId });
        res.json({ message: `User ${user.username} has been deleted` });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

router.post("/admin/users/:userId/reset-password", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.username === "Twicefear") {
            return res.status(403).json({ error: "Cannot reset admin account password" });
        }

        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to reset password" });
    }
});

// GET Settings
router.get("/admin/settings", requireAdmin, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({
                serverName: process.env.SERVER_NAME || "CraftynMC Network",
                startingCoins: 100,
                dailyRewardCoins: 100,
            });
        }
        res.json({ settings });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

// UPDATE Settings
router.post("/admin/settings", requireAdmin, async (req, res) => {
    try {
        const { serverName, startingCoins, dailyRewardCoins } = req.body;
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        if (serverName !== undefined) settings.serverName = String(serverName).trim();
        if (startingCoins !== undefined) settings.startingCoins = parseInt(startingCoins) || 100;
        if (dailyRewardCoins !== undefined) settings.dailyRewardCoins = parseInt(dailyRewardCoins) || 100;

        await settings.save();
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ error: "Failed to update settings" });
    }
});

    return router;
};
