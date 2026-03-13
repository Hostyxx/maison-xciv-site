/**
 * backend/routes/adminClients.js
 * ─────────────────────────────────────────────────────────────
 * Routes admin pour la gestion des clients.
 * Toutes les routes sont protégées par requireAuth (JWT admin).
 *
 * GET /api/admin/clients      → liste des clients
 * GET /api/admin/clients/:id  → détail d'un client
 */

const express             = require('express');
const router              = express.Router();
const ctrl                = require('../controllers/adminClientsController');
const { requireAuth }     = require('../middleware/auth');

router.get('/',    requireAuth, ctrl.getClients);
router.get('/:id', requireAuth, ctrl.getClientDetail);

module.exports = router;
