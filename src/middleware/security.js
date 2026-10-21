/* CraftynMC / FearLauncher — security hardening
 * ------------------------------------------------------------------
 * No extra dependencies (so the Render build can never break):
 *   1) securityHeaders   — sensible hardening headers on every response
 *   2) rateLimiter(...)  — in-memory per-IP limiter for sensitive routes
 *   3) noSqlGuard        — strips MongoDB operators / dotted keys from input
 *   4) corsOptions       — only the real site (+ the launcher) may read APIs
 */

function securityHeaders(req, res, next) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    // NOTE: deliberately NO Cross-Origin-Opener-Policy — it severs window.opener
    // and can stop the HilltopAds popunder from working.
    next();
}

// Drops any key that could be a MongoDB operator ($ne, $gt, ...) or a path (a.b).
function clean(value, depth) {
    if (depth > 6) return undefined;
    if (Array.isArray(value)) return value.map((v) => clean(v, depth + 1));
    if (value && typeof value === "object") {
        const out = {};
        Object.keys(value).forEach((k) => {
            if (k.charAt(0) === "$" || k.indexOf(".") !== -1) return;
            const v = clean(value[k], depth + 1);
            if (v !== undefined) out[k] = v;
        });
        // An object that was ONLY operators (e.g. { $ne: null }) becomes empty —
        // drop it entirely so nothing operator-shaped can survive.
        return Object.keys(out).length ? out : undefined;
    }
    return value;
}

function noSqlGuard(req, res, next) {
    try {
        if (req.body && typeof req.body === "object") {
            const b = clean(req.body, 0);
            req.body = (b === undefined) ? {} : b;
        }
        if (req.query && typeof req.query === "object") {
            Object.keys(req.query).forEach((k) => {
                if (k.charAt(0) === "$" || k.indexOf(".") !== -1) delete req.query[k];
            });
        }
    } catch (e) {}
    next();
}

function rateLimiter(opts) {
    const windowMs = (opts && opts.windowMs) || 60000;
    const max = (opts && opts.max) || 60;
    const hits = new Map();

    const sweep = setInterval(() => {
        const now = Date.now();
        hits.forEach((v, k) => { if (now > v.reset) hits.delete(k); });
    }, Math.max(windowMs, 30000));
    if (sweep && typeof sweep.unref === "function") sweep.unref();

    return function (req, res, next) {
        const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
        const ip = fwd || req.ip || "unknown";
        const now = Date.now();
        let rec = hits.get(ip);
        if (!rec || now > rec.reset) {
            rec = { count: 0, reset: now + windowMs };
            hits.set(ip, rec);
        }
        rec.count += 1;
        if (rec.count > max) {
            res.setHeader("Retry-After", String(Math.ceil((rec.reset - now) / 1000)));
            return res.status(429).json({ error: "Too many requests — please slow down and try again shortly." });
        }
        next();
    };
}

const SITE_RE = /^https?:\/\/([a-z0-9-]+\.)?craftynmc\.onrender\.com$/i;
const LOCAL_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const corsOptions = {
    origin: function (origin, cb) {
        // No Origin header = same-origin page loads and the native launcher.
        if (!origin) return cb(null, true);
        if (SITE_RE.test(origin) || LOCAL_RE.test(origin)) return cb(null, true);
        return cb(null, false);
    },
    credentials: false,
};

module.exports = { securityHeaders, rateLimiter, noSqlGuard, corsOptions };
