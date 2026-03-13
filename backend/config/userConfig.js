/**
 * backend/config/userConfig.js
 * ─────────────────────────────────────────────────────────────
 * Configuration utilisateurs — lit les secrets depuis les variables d'environnement.
 *
 * Variables requises sur Render / en production :
 *   USER_JWT_SECRET → chaîne aléatoire longue (différente de ADMIN_JWT_SECRET)
 * ─────────────────────────────────────────────────────────────
 */

module.exports = {
  cookieName:   'xciv_user_token',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000,
  jwtSecret:    process.env.USER_JWT_SECRET   || 'change-me-in-production',
  jwtExpiresIn: '7d',
  passwordMinLength: 8,
  nameMinLength:     2
};
