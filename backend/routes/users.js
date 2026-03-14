/**
 * backend/routes/users.js
 * ─────────────────────────────────────────────────────────────
 * Routes comptes utilisateurs.
 *
 * POST /api/user/register  → inscription       (public)
 * POST /api/user/login     → connexion         (public)
 * POST /api/user/logout    → déconnexion       (public)
 * GET  /api/user/session   → état de session   (public — jamais d'erreur)
 * GET  /api/user/me        → profil complet    (🔒 requireUserAuth)
 */

const express               = require('express');
const router                = express.Router();
const ctrl                  = require('../controllers/userController');
const { requireUserAuth, optionalUserAuth } = require('../middleware/auth');
const { authLimiter, registerLimiter }     = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, ctrl.register);
router.post('/login',    authLimiter,     ctrl.login);
router.post('/logout',   ctrl.logout);

// session = jamais d'erreur — lit le token si présent, null sinon
router.get('/session', optionalUserAuth, ctrl.session);

// me = requiert connexion
router.get('/me', requireUserAuth, ctrl.me);

module.exports = router;
