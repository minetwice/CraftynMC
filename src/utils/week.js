// Shared week helpers — one definition so the leaderboard, the award job and
// the online-time tracker can never disagree about where a week starts.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Monday-based week key, e.g. "2026-10-12" (UTC).
function weekKey(d) {
    const x = new Date(d || Date.now());
    const day = (x.getUTCDay() + 6) % 7; // Monday = 0
    x.setUTCDate(x.getUTCDate() - day);
    const p = (n) => String(n).padStart(2, "0");
    return x.getUTCFullYear() + "-" + p(x.getUTCMonth() + 1) + "-" + p(x.getUTCDate());
}

// Start of the week that contains `d`.
function weekStart(d) {
    const x = new Date(d || Date.now());
    const day = (x.getUTCDay() + 6) % 7;
    x.setUTCDate(x.getUTCDate() - day);
    x.setUTCHours(0, 0, 0, 0);
    return x;
}

// Roles that never appear on a leaderboard and never win a prize.
const STAFF_ROLES = ["admin", "superadmin", "owner", "moderator", "mod"];
function isStaff(role) {
    return STAFF_ROLES.indexOf(String(role || "").toLowerCase()) !== -1;
}

module.exports = { WEEK_MS, weekKey, weekStart, isStaff, STAFF_ROLES };
