/**
 * backend/models/watchModel.js
 * ─────────────────────────────────────────────────────────────
 * Couche d'accès aux données pour les montres.
 * Toutes les opérations CRUD passent par ici.
 * Utilise la base JSON (database/database.js).
 */

const { readDB, writeDB } = require('../../database/database');

const WatchModel = {

  /**
   * Récupère toutes les montres (triées par date décroissante).
   * @returns {Array}
   */
  getAll() {
    const { watches } = readDB();
    return [...watches].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
  },

  /**
   * Récupère une montre par son ID.
   * @param {number} id
   * @returns {Object|null}
   */
  getById(id) {
    const { watches } = readDB();
    return watches.find(w => w.id === id) || null;
  },

  /**
   * Crée une nouvelle montre et retourne l'objet créé.
   * @param {Object} data
   * @returns {Object}
   */
  create(data) {
    const db    = readDB();
    const newId = db.nextId;

    const watch = {
      id:         newId,
      ...sanitize(data),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.watches.push(watch);
    db.nextId = newId + 1;
    writeDB(db);

    return watch;
  },

  /**
   * Met à jour une montre existante.
   * @param {number} id
   * @param {Object} data
   * @returns {Object|null}
   */
  update(id, data) {
    const db    = readDB();
    const index = db.watches.findIndex(w => w.id === id);

    if (index === -1) return null;

    db.watches[index] = {
      ...db.watches[index],
      ...sanitize(data),
      id,
      updated_at: new Date().toISOString()
    };

    writeDB(db);
    return db.watches[index];
  },

  /**
   * Supprime une montre.
   * @param {number} id
   * @returns {boolean}
   */
  delete(id) {
    const db         = readDB();
    const initialLen = db.watches.length;

    db.watches = db.watches.filter(w => w.id !== id);

    if (db.watches.length === initialLen) return false;

    writeDB(db);
    return true;
  }

};

// ─── Helper ──────────────────────────────────────────────────

/**
 * Normalise et sécurise les données entrantes.
 */
function sanitize(data) {
  return {
    name:        String(data.name        || '').trim(),
    brand:       String(data.brand       || '').trim(),
    price:       String(data.price       || 'Sur demande').trim(),
    description: String(data.description || '').trim(),
    image:       String(data.image       || '').trim(),
    year:        data.year ? parseInt(data.year, 10) : null,
    status:      ['Disponible', 'Réservé', 'Vendu'].includes(data.status)
                   ? data.status
                   : 'Disponible',
    whatsapp:    String(data.whatsapp    || '33601918798').trim(),
    message:     String(data.message     || '').trim()
  };
}

module.exports = WatchModel;
