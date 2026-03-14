/**
 * backend/config/userConfig.js
 * ─────────────────────────────────────────────────────────────
 * Configuration utilisateurs — lit les secrets depuis les variables d'environnement.
 *
 * Variables requises en production :
 *   USER_JWT_SECRET → chaîne aléatoire longue (différente de ADMIN_JWT_SECRET)
 * ─────────────────────────────────────────────────────────────
 */

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.USER_JWT_SECRET;

if (!jwtSecret) {
  if (isProduction) {
    console.error('[FATAL] USER_JWT_SECRET is not set. Refusing to start in production.');
    process.exit(1);
  } else {
    console.warn('[Config] USER_JWT_SECRET non défini — valeur de développement utilisée.');
  }
}

module.exports = {
  cookieName:        'xciv_user_token',
  cookieMaxAge:      7 * 24 * 60 * 60 * 1000,
  jwtSecret:         jwtSecret || 'dev-user-secret-change-in-production',
  jwtExpiresIn:      '7d',
  passwordMinLength: 8,
  nameMinLength:     2,
  nameMaxLength:     100,
  emailMaxLength:    254,
  passwordMaxLength: 128
};
