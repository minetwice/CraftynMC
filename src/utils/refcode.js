const crypto = require("crypto");
const User = require("../models/User");

// A short, human-friendly referral code derived from the username.
function makeCode(username) {
    const base = String(username || "user").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "USER";
    const rnd = crypto.randomBytes(3).toString("hex").toUpperCase();
    return base + "-" + rnd;
}

// Returns the user's code, generating + saving one on first use.
async function ensureCode(user) {
    if (!user) return "";
    if (user.referralCode) return user.referralCode;
    for (let i = 0; i < 5; i++) {
        const code = makeCode(user.username);
        const clash = await User.findOne({ referralCode: code, _id: { $ne: user._id } });
        if (!clash) {
            user.referralCode = code;
            await user.save();
            return code;
        }
    }
    return "";
}

module.exports = { makeCode, ensureCode };
