/**
 * backend/middleware/auth.js
 * ─────────────────────────────────────────────────────────────
 * Tous les middlewares d'authentification du projet.
 *
 * ┌─────────────────────┬──────────────────────┬─────────────────────────┐
 * │ Middleware          │ Token attendu         │ Comportement si absent  │
 * ├─────────────────────┼──────────────────────┼─────────────────────────┤
 * │ requireAuth         │ Admin JWT             │ 401 JSON                │
 * │ requireAuthPage     │ Admin JWT             │ redirect /admin/login   │
 * │ requireUserAuth     │ User JWT              │ 401 JSON                │
 * │ optionalUserAuth    │ User JWT (optionnel)  │ next() sans erreur      │
 * └─────────────────────┴──────────────────────┴─────────────────────────┘
 */

const jwt        = require('jsonwebtoken');
const adminCfg   = require('../config/admin');
const userCfg    = require('../config/userConfig');

// ═══════════════════════════════════════════════════════════
//  ADMIN — inchangé, rétro-compatible
// ═══════════════════════════════════════════════════════════

/** Protège une route API admin. → 401 si absent/invalide. */
function requireAuth(req, res, next) {
  const token = extractAdminToken(req);
  if (!token) return res.status(401).json({ success: false, error: 'Non authentifié.' });

  try {
    req.admin = jwt.verify(token, adminCfg.jwtSecret);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Session expirée. Reconnectez-vous.' });
  }
}

/** Protège une page HTML admin. → redirect si absent/invalide. */
function requireAuthPage(req, res, next) {
  const token = extractAdminToken(req);
  if (!token) return res.redirect('/admin/login');

  try {
    jwt.verify(token, adminCfg.jwtSecret);
    next();
  } catch {
    res.redirect('/admin/login');
  }
}

// ═══════════════════════════════════════════════════════════
//  USER
// ═══════════════════════════════════════════════════════════

/**
 * Protège une route utilisateur.
 * → 401 JSON si token absent ou invalide.
 * Le frontend gère cette erreur proprement (modal, redirect).
 */
function requireUserAuth(req, res, next) {
  const token = extractUserToken(req);
  if (!token) return res.status(401).json({ success: false, error: 'Connexion requise.' });

  try {
    req.user = jwt.verify(token, userCfg.jwtSecret);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Session expirée. Reconnectez-vous.' });
  }
}

/**
 * Lit le token utilisateur S'IL EST PRÉSENT, mais ne bloque jamais.
 * Utilisé sur les routes publiques qui s'enrichissent si connecté.
 * req.user sera null pour les visiteurs anonymes.
 */
function optionalUserAuth(req, res, next) {
  const token = extractUserToken(req);
  req.user    = null;

  if (token) {
    try {
      req.user = jwt.verify(token, userCfg.jwtSecret);
    } catch {
      // Token invalide/expiré → on ignore silencieusement
    }
  }
  next();
}

// ═══════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════

function extractAdminToken(req) {
  if (req.cookies?.[adminCfg.cookieName]) return req.cookies[adminCfg.cookieName];
  const h = req.headers['authorization'];
  if (h?.startsWith('Bearer ')) return h.slice(7);
  return null;
}

function extractUserToken(req) {
  if (req.cookies?.[userCfg.cookieName]) return req.cookies[userCfg.cookieName];
  const h = req.headers['x-user-token'];
  if (h) return h;
  return null;
}

module.exports = { requireAuth, requireAuthPage, requireUserAuth, optionalUserAuth };
