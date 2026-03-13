/**
 * database/favoritesDB.js
 * ─────────────────────────────────────────────────────────────
 * Base de données JSON pour les favoris utilisateurs.
 * Stockée dans /database/favorites.json
 *
 * Structure :
 *   { favorites: [ { userId, watchId, created_at } ] }
 */

const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'favorites.json');

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ favorites: [] }, null, 2), 'utf8');
  console.log('[DB] favorites.json créé.');
}

function readFavorites() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeFavorites(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readFavorites, writeFavorites };
