const fs = require("fs");
const path = require("path");

const TOKEN_PATH = path.join(__dirname, ".tokens.json");

function saveTokens(tokens) {
  const data = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
  };
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 2));
}

function loadTokens() {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  const data = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  return data;
}

function isTokenExpired() {
  const tokens = loadTokens();
  if (!tokens) return true;
  return Date.now() >= tokens.expires_at;
}

function clearTokens() {
  if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
}

module.exports = { saveTokens, loadTokens, isTokenExpired, clearTokens };
