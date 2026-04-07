/**
 * backend/controllers/ventesController.js
 * ─────────────────────────────────────────────────────────────
 * CRUD + stats + CSV pour l'historique des ventes.
 * Protégé par requireAuth (middleware admin).
 */

const VenteModel = require('../models/venteModel');

const VentesController = {

  getAll(req, res) {
    try {
      const ventes = VenteModel.getAll(req.query);
      res.json({ success: true, data: ventes, count: ventes.length });
    } catch (err) {
      console.error('[Ventes] getAll:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  getOne(req, res) {
    try {
      const id    = parseInt(req.params.id, 10);
      const vente = VenteModel.getById(id);
      if (!vente) return res.status(404).json({ success: false, error: 'Vente introuvable.' });
      res.json({ success: true, data: vente });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  create(req, res) {
    try {
      if (!req.body.brand || !req.body.model || !req.body.price || !req.body.soldAt) {
        return res.status(400).json({ success: false, error: 'Marque, modèle, prix et date sont requis.' });
      }
      const vente = VenteModel.create(req.body);
      console.log(`[Ventes] Créée : ${vente.brand} ${vente.model} — ${vente.price} €`);
      res.status(201).json({ success: true, data: vente });
    } catch (err) {
      console.error('[Ventes] create:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  update(req, res) {
    try {
      const id    = parseInt(req.params.id, 10);
      const vente = VenteModel.update(id, req.body);
      if (!vente) return res.status(404).json({ success: false, error: 'Vente introuvable.' });
      res.json({ success: true, data: vente });
    } catch (err) {
      console.error('[Ventes] update:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  delete(req, res) {
    try {
      const id      = parseInt(req.params.id, 10);
      const deleted = VenteModel.delete(id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Vente introuvable.' });
      res.json({ success: true, message: `Vente #${id} supprimée.` });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  getStats(req, res) {
    try {
      const stats = VenteModel.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  exportCSV(req, res) {
    try {
      const csv  = VenteModel.generateCSV(req.query);
      const date = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="ventes-maison-xciv-${date}.csv"`);
      res.send('\uFEFF' + csv); // BOM pour Excel
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  }
};

module.exports = VentesController;
