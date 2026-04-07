/**
 * database/ventesDB.js
 * ─────────────────────────────────────────────────────────────
 * Lecture / écriture de la base de données des ventes (JSON).
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ventes.json');

const DEFAULT_DB = { ventes: [], lastId: 0 };

function readVentes() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeVentes(DEFAULT_DB);
      return { ...DEFAULT_DB };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { ...DEFAULT_DB };
  }
}

function writeVentes(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readVentes, writeVentes };
