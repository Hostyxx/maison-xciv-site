/**
 * backend/controllers/invoicesController.js
 * ─────────────────────────────────────────────────────────────
 * Gestion complète des factures (CRUD + stats + clients + CSV).
 * Protégé par requireAuth (middleware admin).
 */

const InvoiceModel = require('../models/invoiceModel');

const InvoicesController = {

  getAll(req, res) {
    try {
      const invoices = InvoiceModel.getAll(req.query);
      res.json({ success: true, data: invoices, count: invoices.length });
    } catch (err) {
      console.error('[Invoices] getAll:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  getOne(req, res) {
    try {
      const id      = parseInt(req.params.id, 10);
      const invoice = InvoiceModel.getById(id);
      if (!invoice) return res.status(404).json({ success: false, error: 'Facture introuvable.' });
      res.json({ success: true, data: invoice });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  create(req, res) {
    try {
      const invoice = InvoiceModel.create(req.body);
      console.log(`[Invoices] Créée : ${invoice.number}`);
      res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      console.error('[Invoices] create:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  update(req, res) {
    try {
      const id      = parseInt(req.params.id, 10);
      const invoice = InvoiceModel.update(id, req.body);
      if (!invoice) return res.status(404).json({ success: false, error: 'Facture introuvable.' });
      res.json({ success: true, data: invoice });
    } catch (err) {
      console.error('[Invoices] update:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  delete(req, res) {
    try {
      const id      = parseInt(req.params.id, 10);
      const deleted = InvoiceModel.delete(id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Facture introuvable.' });
      res.json({ success: true, message: `Facture #${id} supprimée.` });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  duplicate(req, res) {
    try {
      const id      = parseInt(req.params.id, 10);
      const invoice = InvoiceModel.duplicate(id);
      if (!invoice) return res.status(404).json({ success: false, error: 'Facture introuvable.' });
      res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  getStats(req, res) {
    try {
      const stats = InvoiceModel.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  getNextNumber(req, res) {
    try {
      const number = InvoiceModel.getNextNumber();
      res.json({ success: true, number });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  getClientsSummary(req, res) {
    try {
      const clients = InvoiceModel.getClientsSummary();
      res.json({ success: true, data: clients, count: clients.length });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  exportCSV(req, res) {
    try {
      const csv  = InvoiceModel.generateCSV(req.query);
      const date = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="factures-maison-xciv-${date}.csv"`);
      res.send('\uFEFF' + csv); // BOM pour Excel
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  }
};

module.exports = InvoicesController;
