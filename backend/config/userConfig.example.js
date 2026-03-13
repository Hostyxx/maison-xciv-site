/**
 * backend/config/userConfig.js  ←  Copier ce fichier en userConfig.js et compléter
 * ─────────────────────────────────────────────────────────────
 * IMPORTANT : userConfig.js est dans .gitignore — ne jamais le versionner.
 */

module.exports = {
  cookieName:   'xciv_user_token',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000,

  // Générer avec : node -e "require('crypto').randomBytes(64).toString('hex')|console.log"
  jwtSecret:    'REMPLACER_PAR_UNE_CLE_ALEATOIRE_LONGUE',
  jwtExpiresIn: '7d',

  passwordMinLength: 8,
  nameMinLength:     2
};
