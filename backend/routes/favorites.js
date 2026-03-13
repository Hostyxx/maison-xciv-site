/**
 * backend/routes/favorites.js
 * ─────────────────────────────────────────────────────────────
 * Routes favoris — toutes protégées par requireUserAuth.
 *
 * GET    /api/favorites       → liste des montres en favori
 * GET    /api/favorites/ids   → seulement les IDs (léger)
 * POST   /api/favorites/:id   → toggle (ajoute ou retire)
 */

const express              = require('express');
const router               = express.Router();
const ctrl                 = require('../controllers/favoritesController');
const { requireUserAuth }  = require('../middleware/auth');

router.get('/',        requireUserAuth, ctrl.getAll);
router.get('/ids',     requireUserAuth, ctrl.getIds);
router.post('/:watchId', requireUserAuth, ctrl.toggle);

module.exports = router;
