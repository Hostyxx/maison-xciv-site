/**
 * backend/routes/invoices.js
 * ─────────────────────────────────────────────────────────────
 * Toutes les routes de facturation — protégées par requireAuth.
 */

const express         = require('express');
const router          = express.Router();
const ctrl            = require('../controllers/invoicesController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Routes spéciales avant /:id
router.get('/stats',           ctrl.getStats);
router.get('/next-number',     ctrl.getNextNumber);
router.get('/clients-summary', ctrl.getClientsSummary);
router.get('/export/csv',      ctrl.exportCSV);

// CRUD standard
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id',           ctrl.delete);
router.post('/:id/duplicate',   ctrl.duplicate);

module.exports = router;
