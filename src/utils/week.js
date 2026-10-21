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

// ---- seasons -------------------------------------------------------------
// A season IS a week. Season 1 is the FIRST week CraftynMC ran its boards
// (Mon 19 Oct 2026); every Monday at 00:00 UTC the season rolls over, prizes
// are paid and the next season begins.
const SEASON_EPOCH = Date.UTC(2026, 9, 19);   // Monday 19 Oct 2026 = Season 1

function seasonOf(d) {
    const s = weekStart(d).getTime();
    return Math.max(1, Math.floor((s - SEASON_EPOCH) / WEEK_MS) + 1);
}

// "19 – 25 Oct 2026"
function seasonRange(d) {
    const from = weekStart(d);
    const to = new Date(from.getTime() + WEEK_MS - 1);
    const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const a = from.getUTCDate() + " " + MON[from.getUTCMonth()];
    const b = to.getUTCDate() + " " + MON[to.getUTCMonth()] + " " + to.getUTCFullYear();
    return a + " – " + b;
}

// Roles that never appear on a leaderboard and never win a prize.
const STAFF_ROLES = ["admin", "superadmin", "owner", "moderator", "mod"];
function isStaff(role) {
    return STAFF_ROLES.indexOf(String(role || "").toLowerCase()) !== -1;
}

module.exports = { WEEK_MS, weekKey, weekStart, isStaff, STAFF_ROLES, seasonOf, seasonRange, SEASON_EPOCH };
