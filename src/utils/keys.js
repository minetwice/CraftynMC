const crypto = require("crypto");
const ServerKeypair = require("../models/ServerKeypair");

/**
 * Loads the RSA keypair used to sign Yggdrasil profile/texture responses.
 *
 * IMPORTANT: this used to read/write local disk (keys/private.pem). On
 * Render's free tier, local disk is wiped on every restart (idle spin-down,
 * redeploys, crashes) - which meant a BRAND NEW keypair was generated every
 * time the server restarted. Any signature made with the old key then failed
 * verification against the new public key the moment the server came back
 * up, which is exactly the "Failed to verify property signature" error in
 * authlib-injector logs. Storing the keypair in MongoDB instead means it's
 * generated once, ever, and survives every restart.
 */
const mongoose = require("mongoose");

async function loadOrCreateKeypair() {
    if (mongoose.connection.readyState !== 1) {
        console.log("[keys] Database is not connected. Generating ephemeral 2048-bit RSA keypair for demo/testing mode...");
        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        return { privateKey, publicKey };
    }

    const existing = await ServerKeypair.findById("singleton");
    if (existing) {
        return { privateKey: existing.privateKey, publicKey: existing.publicKey };
    }

    console.log("[keys] No keypair found in the database, generating a new 2048-bit RSA keypair...");
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    try {
        await ServerKeypair.create({ _id: "singleton", privateKey, publicKey });
        console.log("[keys] Keypair generated and saved to MongoDB - it will now persist across restarts.");
    } catch (e) {
        // Handles the rare race where two instances boot at the exact same moment
        // and both try to create the singleton document - whichever loses just
        // re-reads what the winner saved instead of crashing.
        if (e.code === 11000) {
            const winner = await ServerKeypair.findById("singleton");
            return { privateKey: winner.privateKey, publicKey: winner.publicKey };
        }
        throw e;
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
