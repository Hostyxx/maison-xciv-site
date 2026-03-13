/**
 * backend/config/admin.js
 * ─────────────────────────────────────────────────────────────
 * Configuration admin — lit les secrets depuis les variables d'environnement.
 *
 * Variables requises sur Render / en production :
 *   ADMINS_CONFIG   → JSON array : [{"name":"...","email":"...","passwordHash":"..."}]
 *   ADMIN_JWT_SECRET → chaîne aléatoire longue (ex: openssl rand -hex 64)
 *
 * En local, copier .env.example en .env et remplir les valeurs.
 * ─────────────────────────────────────────────────────────────
 */

let admins = [];
if (process.env.ADMINS_CONFIG) {
  try {
    admins = JSON.parse(process.env.ADMINS_CONFIG);
  } catch (e) {
    console.error('[Config] ADMINS_CONFIG invalide (JSON malformé) :', e.message);
  }
}

module.exports = {
  admins,
  jwtSecret:    process.env.ADMIN_JWT_SECRET  || 'change-me-in-production',
  jwtExpiresIn: '8h',
  cookieName:   'xciv_admin_token',
  cookieMaxAge: 8 * 60 * 60 * 1000
};
