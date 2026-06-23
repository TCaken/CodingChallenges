const { getAccessToken } = require("./auth");

const API_BASE = "https://api.spotify.com/v1";

async function fetchFromSpotify(endpoint) {
  const fetch = (await import("node-fetch")).default;
  const token = await getAccessToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}\n${body}`);
  }

  return response.json();
}

async function getMe() {
  return fetchFromSpotify("/me");
}

async function getMyPlaylists() {
  return fetchFromSpotify("/me/playlists");
}

module.exports = { fetchFromSpotify, getMe, getMyPlaylists };
