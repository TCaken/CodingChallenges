const { program } = require("commander");
const { login } = require("./auth");
const { saveTokens } = require("./token-store");
const { getMe, getMyPlaylists } = require("./spotify");

program
  .name("spotify-cli")
  .description("A Spotify CLI client")
  .version("1.0.0");

program
  .command("login")
  .description("Authenticate with Spotify")
  .action(async () => {
    try {
      const tokens = await login();
      saveTokens(tokens);
      console.log("Logged in and tokens saved!");
    } catch (err) {
      console.error("Login failed:", err.message);
    }
  });

program
  .command("me")
  .description("Show current user profile")
  .action(async () => {
    try {
      const profile = await getMe();
      console.log(`User ID: ${profile.id}`);
      console.log(`Display Name: ${profile.display_name}`);
      console.log(`Email: ${profile.email || "N/A"}`);
      console.log(`Country: ${profile.country || "N/A"}`);
      console.log(`Profile URL: ${profile.external_urls.spotify}`);
    } catch (err) {
      console.error("Error:", err.message);
    }
  });

program
  .command("playlists")
  .description("List your playlists")
  .action(async () => {
    try {
      const data = await getMyPlaylists();
      console.log(`\nYour Playlists (${data.total} total):\n`);
      data.items.forEach((playlist, i) => {
        const tracks = playlist.tracks.total;
        const image = playlist.images?.[0]?.url || "No image";
        console.log(`${i + 1}. ${playlist.name}`);
        console.log(`   Tracks: ${tracks}`);
        console.log(`   Image: ${image}`);
        console.log();
      });
    } catch (err) {
      console.error("Error:", err.message);
    }
  });

program.parse();
