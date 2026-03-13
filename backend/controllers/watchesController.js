/**
 * backend/controllers/watchesController.js
 * ─────────────────────────────────────────────────────────────
 * Logique métier pour chaque endpoint de l'API.
 * Le controller reçoit req/res, appelle le modèle, renvoie du JSON.
 */

const WatchModel = require('../models/watchModel');

const WatchesController = {

  /**
   * GET /api/watches
   * Retourne toutes les montres du catalogue.
   */
  getAll(req, res) {
    try {
      const watches = WatchModel.getAll();
      res.json({ success: true, data: watches, count: watches.length });
    } catch (err) {
      console.error('[Controller] getAll :', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  /**
   * GET /api/watches/:id
   * Retourne une montre spécifique.
   */
  getOne(req, res) {
    try {
      const id    = parseInt(req.params.id, 10);
      const watch = WatchModel.getById(id);

      if (!watch) {
        return res.status(404).json({ success: false, error: 'Montre introuvable.' });
      }

      res.json({ success: true, data: watch });
    } catch (err) {
      console.error('[Controller] getOne :', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  /**
   * POST /api/watches
   * Crée une nouvelle montre.
   * Body attendu : { name, brand, price?, description?, image?, year?, status?, whatsapp?, message? }
   */
  create(req, res) {
    try {
      const { name, brand } = req.body;

      // Validation des champs obligatoires
      if (!name || !brand) {
        return res.status(400).json({
          success: false,
          error: 'Les champs "name" et "brand" sont obligatoires.'
        });
      }

      const watch = WatchModel.create(req.body);
      res.status(201).json({ success: true, data: watch });
    } catch (err) {
      console.error('[Controller] create :', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  /**
   * PUT /api/watches/:id
   * Met à jour une montre existante.
   */
  update(req, res) {
    try {
      const id    = parseInt(req.params.id, 10);
      const watch = WatchModel.update(id, req.body);

      if (!watch) {
        return res.status(404).json({ success: false, error: 'Montre introuvable.' });
      }

      res.json({ success: true, data: watch });
    } catch (err) {
      console.error('[Controller] update :', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  /**
   * DELETE /api/watches/:id
   * Supprime une montre.
   */
  delete(req, res) {
    try {
      const id      = parseInt(req.params.id, 10);
      const deleted = WatchModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Montre introuvable.' });
      }

      res.json({ success: true, message: `Montre #${id} supprimée.` });
    } catch (err) {
      console.error('[Controller] delete :', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  }

};

module.exports = WatchesController;
