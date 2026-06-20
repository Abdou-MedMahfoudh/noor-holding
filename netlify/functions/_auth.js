// api/_auth.js
// Minimal password check + signed session token, no external dependencies.
// The token is a signed, expiring blob — not a database session, but enough
// to keep the admin endpoints from being wide open to the public internet.

const crypto = require("crypto");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET; // random long string, set in Vercel env vars
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function sign(payload) {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

function createSessionToken() {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${expires}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64");
}

function verifySessionToken(token) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [payload, sig] = decoded.split(".");
    if (!payload || !sig) return false;
    const expectedSig = sign(payload);
    if (sig !== expectedSig) return false;
    const expires = Number(payload);
    if (Date.now() > expires) return false;
    return true;
  } catch (e) {
    return false;
  }
}

function checkPassword(candidate) {
  if (!candidate || !ADMIN_PASSWORD) return false;
  // constant-time-ish comparison to avoid trivial timing attacks
  const a = Buffer.from(candidate);
  const b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Reads the Authorization: Bearer <token> header from a Netlify Functions
// `event` object and verifies it. Returns true/false — callers are
// responsible for returning the actual HTTP response.
function isAuthenticated(event) {
  const authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  return verifySessionToken(token);
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  checkPassword,
  isAuthenticated,
};
