/**
 * database/invoicesDB.js
 * ─────────────────────────────────────────────────────────────
 * Lecture / écriture de la base de données des factures (JSON).
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'invoices.json');

const DEFAULT_DB = { invoices: [], lastId: 0, lastNumber: 0 };

function readInvoices() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeInvoices(DEFAULT_DB);
      return { ...DEFAULT_DB };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { ...DEFAULT_DB };
  }
}

function writeInvoices(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readInvoices, writeInvoices };
