/**
 * backend/middleware/rateLimiter.js
 * ─────────────────────────────────────────────────────────────
 * Limiteurs de débit (rate limiting) pour protéger les routes sensibles.
 * Utilise express-rate-limit.
 */

const rateLimit = require('express-rate-limit');

// ── Limiteur Auth — /api/auth/login et /api/user/login ───────
// 10 tentatives max par IP toutes les 15 minutes
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minutes
  max:              10,
  message:          { success: false, error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders:  true,            // Envoie les headers RateLimit-*
  legacyHeaders:    false,
  skipSuccessfulRequests: true,      // Ne compte pas les connexions réussies
  handler(req, res, next, options) {
    console.warn(`[Security] Rate limit auth atteint — IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// ── Limiteur Inscription — /api/user/register ─────────────────
// 5 créations de compte max par IP par heure
const registerLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,  // 1 heure
  max:             5,
  message:         { success: false, error: 'Trop de créations de compte. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders:   false,
  handler(req, res, next, options) {
    console.warn(`[Security] Rate limit register atteint — IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// ── Limiteur API général — protection brute force globale ──────
// 100 requêtes max par IP toutes les 15 minutes
const apiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  message:         { success: false, error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
  handler(req, res, next, options) {
    console.warn(`[Security] Rate limit API atteint — IP: ${req.ip} — ${req.method} ${req.path}`);
    res.status(429).json(options.message);
  }
});

// ── Limiteur Upload ───────────────────────────────────────────
// 20 uploads max par IP par heure
const uploadLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             20,
  message:         { success: false, error: 'Trop d\'uploads. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { authLimiter, registerLimiter, apiLimiter, uploadLimiter };
