/**
 * backend/config/admin.js
 * ─────────────────────────────────────────────────────────────
 * Configuration admin — lit les secrets depuis les variables d'environnement.
 *
 * Variables requises en production :
 *   ADMINS_CONFIG    → JSON array : [{"name":"...","email":"...","passwordHash":"..."}]
 *   ADMIN_JWT_SECRET → chaîne aléatoire longue (ex: openssl rand -hex 64)
 *
 * En local, copier .env.example en .env et remplir les valeurs.
 * ─────────────────────────────────────────────────────────────
 */

const isProduction = process.env.NODE_ENV === 'production';

// ── Secret JWT ────────────────────────────────────────────────
const jwtSecret = process.env.ADMIN_JWT_SECRET;

if (!jwtSecret) {
  if (isProduction) {
    console.error('[FATAL] ADMIN_JWT_SECRET is not set. Refusing to start in production.');
    process.exit(1);
  } else {
    console.warn('[Config] ADMIN_JWT_SECRET non défini — valeur de développement utilisée.');
  }
}

// ── Admins ────────────────────────────────────────────────────
let admins = [];

if (!process.env.ADMINS_CONFIG) {
  if (isProduction) {
    console.error('[FATAL] ADMINS_CONFIG is not set. Refusing to start in production.');
    process.exit(1);
  } else {
    console.warn('[Config] ADMINS_CONFIG non défini — aucun admin disponible.');
  }
} else {
  try {
    admins = JSON.parse(process.env.ADMINS_CONFIG);
    if (!Array.isArray(admins) || admins.length === 0) {
      throw new Error('ADMINS_CONFIG doit être un tableau JSON non vide.');
    }
  } catch (e) {
    console.error('[FATAL] ADMINS_CONFIG invalide :', e.message);
    process.exit(1);
  }
}

module.exports = {
  admins,
  jwtSecret:    jwtSecret || 'dev-secret-change-in-production',
  jwtExpiresIn: '8h',
  cookieName:   'xciv_admin_token',
  cookieMaxAge: 8 * 60 * 60 * 1000
};
