// netlify/functions/upload-image.js
// Uploads an image into assets/news/ via the GitHub Contents API.
// Expects JSON body: { filename: "my-photo.jpg", base64: "<raw base64, no data: prefix>" }
// Returns the path to use as the "picture" field, e.g. "./assets/news/my-photo.jpg"

const { isAuthenticated } = require("./_auth");
const { putBinaryFile } = require("./_github");

const MAX_BYTES = 8 * 1024 * 1024; // 8MB safety cap

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function sanitizeFilename(name) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return cleaned || `image-${Date.now()}.jpg`;
}

exports.handler = async function (event) {
  if (!isAuthenticated(event)) {
    return json(401, { error: "Not authenticated. Please log in again." });
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "Invalid JSON body" });
  }

  try {
    const { filename, base64 } = body;
    if (!filename || !base64) {
      return json(400, { error: "filename and base64 are required" });
    }

    const approxBytes = (base64.length * 3) / 4;
    if (approxBytes > MAX_BYTES) {
      return json(400, { error: "Image too large (max 8MB)" });
    }

    const safeName = sanitizeFilename(filename);
    const uniqueName = `${Date.now()}-${safeName}`;
    const repoPath = `assets/news/${uniqueName}`;

    await putBinaryFile(repoPath, base64, `Upload image ${uniqueName} via admin panel`);

    return json(201, { path: `./assets/news/${uniqueName}` });
  } catch (err) {
    console.error(err);
    return json(500, { error: err.message || "Server error" });
  }
};
