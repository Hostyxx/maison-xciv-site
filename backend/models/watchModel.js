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
    return [...watches].sort((a, b) => {
      const aO = a.displayOrder ?? Infinity;
      const bO = b.displayOrder ?? Infinity;
      if (aO !== bO) return aO - bO;
      return new Date(b.created_at) - new Date(a.created_at);
    });
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

    const maxOrder = db.watches.reduce((m, w) => Math.max(m, w.displayOrder ?? -1), -1);

    const watch = {
      id:           newId,
      displayOrder: maxOrder + 1,
      ...sanitize(data),
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString()
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
  },

  /**
   * Réorganise les montres en mettant à jour leur displayOrder.
   * @param {number[]} orderedIds  IDs dans le nouvel ordre souhaité
   */
  reorder(orderedIds) {
    const db = readDB();
    orderedIds.forEach((id, index) => {
      const watch = db.watches.find(w => w.id === id);
      if (watch) watch.displayOrder = index;
    });
    writeDB(db);
    return true;
  }

};

// ─── Helper ──────────────────────────────────────────────────

/**
 * Normalise, valide et sécurise les données entrantes.
 * Les longueurs max protègent contre les attaques DoS et la corruption de la DB.
 */
function sanitize(data) {
  const name        = String(data.name        || '').trim().slice(0, 200);
  const brand       = String(data.brand       || '').trim().slice(0, 100);
  const price       = String(data.price       || 'Sur demande').trim().slice(0, 100);
  const description = String(data.description || '').trim().slice(0, 2000);
  const message     = String(data.message     || '').trim().slice(0, 500);

  // Validation URL image : uniquement les chemins /assets/ internes
  let image = String(data.image || '').trim().slice(0, 500);
  if (image && !image.startsWith('/assets/')) {
    image = '';  // Rejette toute URL externe ou protocole non attendu
  }

  // WhatsApp : chiffres uniquement (format E.164 sans le +)
  const whatsapp = String(data.whatsapp || '33601918798')
    .replace(/\D/g, '')
    .slice(0, 15);

  // Année : entre 1900 et l'année courante + 1
  let year = data.year ? parseInt(data.year, 10) : null;
  if (year !== null && (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1)) {
    year = null;
  }

  return {
    name, brand, price, description, image, year, whatsapp, message,
    status: ['Disponible', 'Réservé', 'Vendu'].includes(data.status)
              ? data.status
              : 'Disponible',
  };
}

module.exports = WatchModel;
