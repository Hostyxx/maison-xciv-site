/**
 * backend/routes/auth.js
 * ─────────────────────────────────────────────────────────────
 * Routes d'authentification.
 *
 * POST /api/auth/login    → connexion
 * POST /api/auth/logout   → déconnexion
 * GET  /api/auth/verify   → vérifie le token actuel
 */

const express        = require('express');
const router         = express.Router();
const controller     = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login',  controller.login);
router.post('/logout', controller.logout);
router.get('/verify',  requireAuth, controller.verify);

module.exports = router;
