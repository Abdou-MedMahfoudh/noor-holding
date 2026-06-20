// api/_github.js
// Shared helper for talking to the GitHub Contents API.
// Used by every CRUD endpoint to read/write files in the repo.

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const REPO_BRANCH = process.env.REPO_BRANCH || "main";

const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

function authHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Fetch a file's content + sha. Returns null if it doesn't exist.
async function getFile(path) {
  const res = await fetch(
    `${API_BASE}/contents/${encodeURIComponent(path)}?ref=${REPO_BRANCH}`,
    { headers: authHeaders() }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub getFile failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return {
    sha: data.sha,
    // content comes back base64-encoded
    content: Buffer.from(data.content, "base64").toString("utf-8"),
  };
}

// Fetch and JSON.parse a file. Throws if missing.
async function getJsonFile(path) {
  const file = await getFile(path);
  if (!file) throw new Error(`File not found: ${path}`);
  return { sha: file.sha, json: JSON.parse(file.content) };
}

// Create or update a text file. Pass sha if updating an existing file.
async function putFile(path, contentString, message, sha) {
  const body = {
    message,
    content: Buffer.from(contentString, "utf-8").toString("base64"),
    branch: REPO_BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${API_BASE}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`GitHub putFile failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// Upload a binary file (image). base64Data should NOT include the data: prefix.
async function putBinaryFile(path, base64Data, message) {
  // check if it already exists (e.g. re-upload with same name) to get sha
  const existing = await getFile(path).catch(() => null);
  const body = {
    message,
    content: base64Data,
    branch: REPO_BRANCH,
  };
  if (existing) body.sha = existing.sha;

  const res = await fetch(`${API_BASE}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`GitHub putBinaryFile failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function deleteFile(path, message, sha) {
  const res = await fetch(`${API_BASE}/contents/${encodeURIComponent(path)}`, {
    method: "DELETE",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha, branch: REPO_BRANCH }),
  });
  if (!res.ok) {
    throw new Error(`GitHub deleteFile failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

module.exports = {
  getFile,
  getJsonFile,
  putFile,
  putBinaryFile,
  deleteFile,
};
