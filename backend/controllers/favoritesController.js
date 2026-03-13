/**
 * backend/controllers/favoritesController.js
 * ─────────────────────────────────────────────────────────────
 * Gestion des favoris : liste, ajout, suppression, toggle.
 * Toutes ces routes nécessitent requireUserAuth.
 */

const FavoriteModel = require('../models/favoriteModel');

const FavoritesController = {

  /**
   * GET /api/favorites
   * Retourne les montres en favori de l'utilisateur connecté.
   */
  getAll(req, res) {
    try {
      const watches = FavoriteModel.getWatchesByUser(req.user.id);
      const ids     = FavoriteModel.getWatchIdsByUser(req.user.id);
      res.json({ success: true, data: watches, ids, count: watches.length });
    } catch (err) {
      console.error('[Favorites] getAll:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  /**
   * GET /api/favorites/ids
   * Retourne seulement les IDs en favori (léger, pour le frontend).
   */
  getIds(req, res) {
    try {
      const ids = FavoriteModel.getWatchIdsByUser(req.user.id);
      res.json({ success: true, ids });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  /**
   * POST /api/favorites/:watchId
   * Toggle favori (ajoute ou retire).
   */
  toggle(req, res) {
    try {
      const watchId = parseInt(req.params.watchId, 10);
      if (isNaN(watchId)) {
        return res.status(400).json({ success: false, error: 'ID de montre invalide.' });
      }

      const result = FavoriteModel.toggle(req.user.id, watchId);
      res.json({ success: true, ...result });

    } catch (err) {
      console.error('[Favorites] toggle:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  }
};

module.exports = FavoritesController;
