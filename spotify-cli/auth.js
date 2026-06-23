const http = require("http");
const crypto = require("crypto");
const { URL } = require("url");
require("dotenv").config();
const { saveTokens, loadTokens, isTokenExpired } = require("./token-store");

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPES =
  "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative";

function generateCodeVerifier() {
  return crypto.randomBytes(64).toString("base64url");
}

function generateCodeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function buildAuthUrl(codeChallenge) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function waitForCallback() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.end("Authorization denied.");
        server.close();
        reject(new Error(error));
      } else if (code) {
        res.end("Success! You can close this tab.");
        server.close();
        resolve(code);
      }
    });

    server.listen(8888, "127.0.0.1");
  });
}

async function exchangeCodeForTokens(code, codeVerifier) {
  const fetch = (await import("node-fetch")).default;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

async function login() {
  const open = (await import("open")).default;

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const authUrl = buildAuthUrl(codeChallenge);

  console.log("Opening browser for Spotify login...");
  open(authUrl);

  const code = await waitForCallback();
  const tokens = await exchangeCodeForTokens(code, codeVerifier);

  console.log("Logged in successfully!");
  return tokens;
}

async function refreshAccessToken() {
  const tokens = loadTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error("No refresh token available. Please login again.");
  }

  const fetch = (await import("node-fetch")).default;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const newTokens = await response.json();
  // Spotify may or may not return a new refresh token
  const combined = {
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || tokens.refresh_token,
    expires_in: newTokens.expires_in,
  };
  saveTokens(combined);
  return combined;
}

async function getAccessToken() {
  if (!loadTokens()) {
    const tokens = await login();
    saveTokens(tokens);
    return tokens.access_token;
  }

  if (isTokenExpired()) {
    const tokens = await refreshAccessToken();
    return tokens.access_token;
  }

  return loadTokens().access_token;
}

module.exports = { login, getAccessToken, refreshAccessToken };
