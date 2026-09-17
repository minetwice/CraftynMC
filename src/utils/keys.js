const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const ServerKeypair = require("../models/ServerKeypair");

/**
 * Loads the RSA keypair used to sign Yggdrasil profile/texture responses.
 *
 * Tries MongoDB first (for production), falls back to local file storage
 * when MongoDB is unavailable (for development/demo mode).
 */
async function loadOrCreateKeypair() {
    // Try MongoDB first
    try {
        const existing = await ServerKeypair.findById("singleton");
        if (existing) {
            console.log("[keys] Loaded keypair from MongoDB");
            return { privateKey: existing.privateKey, publicKey: existing.publicKey };
        }
    } catch (err) {
        console.log("[keys] MongoDB not available, using local file storage");
    }

    // Fallback to file-based storage
    const keysDir = path.join(__dirname, "..", "..", ".keys");
    const privateKeyPath = path.join(keysDir, "private.pem");
    const publicKeyPath = path.join(keysDir, "public.pem");

    // Check if keys exist on disk
    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        console.log("[keys] Loaded keypair from local files");
        return {
            privateKey: fs.readFileSync(privateKeyPath, "utf8"),
            publicKey: fs.readFileSync(publicKeyPath, "utf8")
        };
    }

    // Generate new keypair
    console.log("[keys] No keypair found, generating a new 2048-bit RSA keypair...");
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    // Try to save to MongoDB first
    try {
        await ServerKeypair.create({ _id: "singleton", privateKey, publicKey });
        console.log("[keys] Keypair saved to MongoDB - it will now persist across restarts.");
    } catch (e) {
        // MongoDB not available, save to local files instead
        if (!fs.existsSync(keysDir)) {
            fs.mkdirSync(keysDir, { recursive: true });
        }
        fs.writeFileSync(privateKeyPath, privateKey);
        fs.writeFileSync(publicKeyPath, publicKey);
        console.log("[keys] Keypair saved to local files (MongoDB unavailable).");
    }

    return { privateKey, publicKey };
}

/** Signs a base64 payload string the way authlib-injector expects (SHA1withRSA). */
function signPayload(privateKey, payloadUtf8) {
    const signer = crypto.createSign("RSA-SHA1");
    signer.update(payloadUtf8, "utf8");
    signer.end();
    return signer.sign(privateKey).toString("base64");
}

module.exports = { loadOrCreateKeypair, signPayload };
