/**
 * backend/models/favoriteModel.js
 * ─────────────────────────────────────────────────────────────
 * CRUD pour les favoris utilisateurs.
 */

const { readFavorites, writeFavorites } = require('../../database/favoritesDB');
const { readDB }                        = require('../../database/database');

const FavoriteModel = {

  /**
   * Retourne les IDs des montres en favori pour un utilisateur.
   */
  getWatchIdsByUser(userId) {
    const { favorites } = readFavorites();
    return favorites
      .filter(f => f.userId === userId)
      .map(f => f.watchId);
  },

  /**
   * Retourne les montres complètes en favori pour un utilisateur.
   * (joint avec la DB watches)
   */
  getWatchesByUser(userId) {
    const ids = this.getWatchIdsByUser(userId);
    if (ids.length === 0) return [];

    const { watches } = readDB();
    return watches.filter(w => ids.includes(w.id));
  },

  /** Vérifie si une montre est en favori pour un utilisateur. */
  isFavorite(userId, watchId) {
    const { favorites } = readFavorites();
    return favorites.some(f => f.userId === userId && f.watchId === watchId);
  },

  /** Ajoute un favori. Retourne false si déjà présent. */
  add(userId, watchId) {
    if (this.isFavorite(userId, watchId)) return false;

    const db = readFavorites();
    db.favorites.push({ userId, watchId, created_at: new Date().toISOString() });
    writeFavorites(db);
    return true;
  },

  /** Retire un favori. Retourne false si absent. */
  remove(userId, watchId) {
    const db  = readFavorites();
    const len = db.favorites.length;
    db.favorites = db.favorites.filter(
      f => !(f.userId === userId && f.watchId === watchId)
    );
    if (db.favorites.length === len) return false;
    writeFavorites(db);
    return true;
  },

  /** Toggle : ajoute ou retire. Retourne { added: bool }. */
  toggle(userId, watchId) {
    if (this.isFavorite(userId, watchId)) {
      this.remove(userId, watchId);
      return { added: false };
    }
    this.add(userId, watchId);
    return { added: true };
  }
};

module.exports = FavoriteModel;
