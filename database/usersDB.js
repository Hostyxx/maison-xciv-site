/**
 * database/usersDB.js
 * ─────────────────────────────────────────────────────────────
 * Base de données JSON pour les comptes utilisateurs.
 * Stockée dans /database/users.json
 */

const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'users.json');

// Initialise le fichier vide s'il n'existe pas
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ nextId: 1, users: [] }, null, 2), 'utf8');
  console.log('[DB] users.json créé.');
}

function readUsers() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeUsers(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readUsers, writeUsers };
