/**
 * backend/routes/ventes.js
 * ─────────────────────────────────────────────────────────────
 * Toutes les routes ventes — protégées par requireAuth (admin).
 */

const express         = require('express');
const router          = express.Router();
const ctrl            = require('../controllers/ventesController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Routes spéciales avant /:id
router.get('/stats',      ctrl.getStats);
router.get('/export/csv', ctrl.exportCSV);

// CRUD
router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getOne);
router.post('/',    ctrl.create);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
