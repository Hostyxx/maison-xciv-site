/**
 * backend/routes/watches.js
 * ─────────────────────────────────────────────────────────────
 * Routes REST pour le catalogue de montres.
 *
 * Publiques (frontend) :
 *   GET  /api/watches        → liste complète
 *   GET  /api/watches/:id    → une montre
 *
 * Protégées (admin uniquement) :
 *   POST   /api/watches        → créer
 *   PUT    /api/watches/:id    → modifier
 *   DELETE /api/watches/:id    → supprimer
 */

const express          = require('express');
const router           = express.Router();
const controller       = require('../controllers/watchesController');
const { requireAuth }  = require('../middleware/auth');

// ── Routes publiques ─────────────────────────────────────────
router.get('/',    controller.getAll);
router.get('/:id', controller.getOne);

// ── Routes protégées (token JWT requis) ──────────────────────
router.post('/',      requireAuth, controller.create);
router.put('/:id',    requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.delete);

module.exports = router;
