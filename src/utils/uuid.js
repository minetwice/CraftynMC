const crypto = require("crypto");

/**
 * Replicates Java's UUID.nameUUIDFromBytes(("OfflinePlayer:" + username).getBytes(UTF_8)),
 * which is what vanilla Minecraft uses to derive a player's UUID in offline mode.
 * Keeping this identical means the UUID we hand out matches what the game/other
 * offline-mode tooling would independently compute for the same username.
 */
function offlineUUID(username) {
    const md5 = crypto.createHash("md5").update("OfflinePlayer:" + username, "utf8").digest();

    // Set version (3) and variant bits per RFC 4122, exactly like Java's nameUUIDFromBytes.
    md5[6] = (md5[6] & 0x0f) | 0x30;
    md5[8] = (md5[8] & 0x3f) | 0x80;

    const hex = md5.toString("hex");
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32),
    ].join("-");
}

/** Same UUID but without dashes, the format Yggdrasil responses actually use. */
function offlineUUIDCompact(username) {
    return offlineUUID(username).replace(/-/g, "");
}

module.exports = { offlineUUID, offlineUUIDCompact };
