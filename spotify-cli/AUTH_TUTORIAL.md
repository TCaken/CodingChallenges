# Spotify CLI — Authorization (PKCE) Step-by-Step

This guide walks you through building the OAuth 2.0 PKCE authorization flow for your Spotify CLI app.

## Overview

You'll create a file called `auth.js` that handles logging the user into Spotify. The flow:

1. Generate a random "code verifier"
2. Hash it into a "code challenge"
3. Open the user's browser to Spotify's login page
4. Start a tiny local HTTP server to catch the callback
5. Exchange the authorization code for access/refresh tokens

---

## Prerequisites

You already have these installed:
- `dotenv` — loads your `.env` file
- `open` — opens URLs in the browser
- `node-fetch` — makes HTTP requests

Your `.env` has:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_REDIRECT_URI` (http://127.0.0.1:8888/callback)

---

## Step 1: Set up the file

Create `auth.js` in the root of `spotify-cli/`.

At the top, require these built-in Node modules:
- `http` — to create the local callback server
- `crypto` — to generate random bytes and hash them
- `url` (specifically the `URL` class) — to parse the callback URL

Also load your `.env` with `dotenv` and pull out `SPOTIFY_CLIENT_ID`.

Define two constants:
- `REDIRECT_URI` = `"http://127.0.0.1:8888/callback"`
- `SCOPES` = a space-separated string of Spotify scopes you want (start with `"user-read-playback-state user-modify-playback-state user-read-currently-playing"`)

---

## Step 2: Generate the code verifier

Write a function `generateCodeVerifier()` that:
- Uses `crypto.randomBytes(64)` to get 64 random bytes
- Converts them to a base64url string (`.toString("base64url")`)
- Returns that string

This gives you a ~86 character random string that only your app knows.

---

## Step 3: Generate the code challenge

Write a function `generateCodeChallenge(verifier)` that:
- Takes the verifier string
- Creates a SHA-256 hash of it using `crypto.createHash("sha256")`
- Calls `.update(verifier)` then `.digest("base64url")`
- Returns the result

This is the one-way hash Spotify will use to verify the token request later.

---

## Step 4: Build the authorization URL

Write a function `buildAuthUrl(codeChallenge)` that:
- Creates a `URLSearchParams` object with these params:
  - `client_id` — your client ID
  - `response_type` — `"code"`
  - `redirect_uri` — your redirect URI
  - `scope` — your scopes string
  - `code_challenge_method` — `"S256"`
  - `code_challenge` — the challenge you pass in
- Returns `"https://accounts.spotify.com/authorize?" + params.toString()`

---

## Step 5: Start a local server to catch the callback

Write a function `waitForCallback()` that returns a **Promise**. Inside:
- Create an HTTP server with `http.createServer`
- In the request handler:
  - Parse the request URL using `new URL(req.url, "http://127.0.0.1:8888")`
  - Look for `code` in the search params (this is success)
  - Look for `error` in the search params (this is failure)
  - If you get a code: respond with "Success! You can close this tab.", close the server, resolve the promise with the code
  - If you get an error: respond with an error message, close the server, reject the promise
- Call `server.listen(8888, "127.0.0.1")`

---

## Step 6: Exchange the code for tokens

Write an async function `exchangeCodeForTokens(code, codeVerifier)` that:
- Imports `node-fetch` (dynamic import since it's ESM: `const fetch = (await import("node-fetch")).default`)
- POSTs to `https://accounts.spotify.com/api/token` with:
  - Header: `"Content-Type": "application/x-www-form-urlencoded"`
  - Body (as `URLSearchParams`):
    - `client_id` — your client ID
    - `grant_type` — `"authorization_code"`
    - `code` — the code from the callback
    - `redirect_uri` — your redirect URI
    - `code_verifier` — the original verifier (NOT the challenge)
- Check `response.ok`, throw if it failed
- Return `response.json()` — this gives you `{ access_token, refresh_token, expires_in }`

---

## Step 7: Wire it all together

Write an async function `login()` that:
1. Imports `open` (dynamic import: `const open = (await import("open")).default`)
2. Calls `generateCodeVerifier()` — save the result
3. Calls `generateCodeChallenge(verifier)` — save the result
4. Calls `buildAuthUrl(challenge)` — save the URL
5. Logs "Opening browser for Spotify login..."
6. Calls `open(authUrl)` — opens the browser
7. Calls `await waitForCallback()` — waits for the user to log in
8. Calls `await exchangeCodeForTokens(code, verifier)` — gets the tokens
9. Logs "Logged in successfully!"
10. Returns the tokens object

Export `{ login }` from the module.

---

## Step 8: Test it

Create a quick test script or add to your `index.js`:

```js
const { login } = require("./auth");

login().then((tokens) => {
  console.log("Access token:", tokens.access_token);
  console.log("Refresh token:", tokens.refresh_token);
  console.log("Expires in:", tokens.expires_in, "seconds");
});
```

Run `node index.js` and your browser should open, ask you to log in to Spotify, then print your tokens.

---

## What's happening under the hood

```
Your CLI                        Spotify                     Browser
  |                                |                           |
  |-- generate verifier+challenge  |                           |
  |-- start local server on :8888  |                           |
  |-- open browser --------------->|-------------------------->|
  |                                |<-- user logs in --------->|
  |<-- redirect to localhost:8888/callback?code=XXX -----------|
  |                                |                           |
  |-- POST /api/token ------------>|                           |
  |   (code + verifier)            |                           |
  |<-- { access_token, refresh } --|                           |
```

---

## Next steps (once this works)

- Save tokens to a file so users don't re-login every time
- Add a `refreshAccessToken()` function using the refresh token
- Use the access token in API calls with `Authorization: Bearer <token>` header
