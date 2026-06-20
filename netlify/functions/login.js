// netlify/functions/login.js
const { checkPassword, createSessionToken } = require("./_auth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { password } = body;

  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 400));
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password" }) };
  }

  const token = createSessionToken();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  };
};
