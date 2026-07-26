const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const KEY_DIR = path.join(__dirname, "..", "..", "keys");
const PRIVATE_KEY_PATH = path.join(KEY_DIR, "private.pem");
const PUBLIC_KEY_PATH = path.join(KEY_DIR, "public.pem");

/**
 * Loads the RSA keypair used to sign Yggdrasil profile/texture responses.
 * If no keypair exists yet (first run), a new 2048-bit keypair is generated
 * and saved to disk so it stays the same across restarts.
 */
function loadOrCreateKeypair() {
    if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR, { recursive: true });

    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
        return {
            privateKey: fs.readFileSync(PRIVATE_KEY_PATH, "utf8"),
            publicKey: fs.readFileSync(PUBLIC_KEY_PATH, "utf8"),
        };
    }

    console.log("[keys] No keypair found, generating a new 2048-bit RSA keypair...");
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, "utf8");
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, "utf8");
    console.log("[keys] Keypair generated and saved to", KEY_DIR);

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
