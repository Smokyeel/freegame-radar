const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "..", "data", "seen-games.json");

function ensureDataDir() {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadSeenGames() {
  ensureDataDir();
  if (!fs.existsSync(STATE_FILE)) return new Set();
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return new Set(raw);
  } catch {
    return new Set();
  }
}

function saveSeenGames(seen) {
  ensureDataDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify([...seen], null, 2));
}

function gameKey(game) {
  return `${game.platform}::${game.title}`;
}

function filterNewGames(games) {
  const seen = loadSeenGames();
  const newGames = games.filter((g) => !seen.has(gameKey(g)));
  return newGames;
}

function markGamesSeen(games) {
  const seen = loadSeenGames();
  games.forEach((g) => seen.add(gameKey(g)));
  saveSeenGames(seen);
}

module.exports = { filterNewGames, markGamesSeen };
