/**
 * backend/config/admin.js  ←  Copier ce fichier en admin.js et compléter
 * ─────────────────────────────────────────────────────────────
 * IMPORTANT : admin.js est dans .gitignore — ne jamais le versionner.
 *
 * ── CRÉER UN HASH BCRYPT ─────────────────────────────────────
 * node -e "const b=require('bcryptjs');console.log(b.hashSync('VotreMotDePasse',12))"
 * ─────────────────────────────────────────────────────────────
 */

module.exports = {

  admins: [
    {
      name:         'Votre Prénom',
      email:        'admin@votredomaine.com',
      passwordHash: '$2b$12$REMPLACER_PAR_UN_VRAI_HASH_BCRYPT',
    },
  ],

  // Générer avec : node -e "require('crypto').randomBytes(64).toString('hex')|console.log"
  jwtSecret:    'REMPLACER_PAR_UNE_CLE_ALEATOIRE_LONGUE',
  jwtExpiresIn: '8h',

  cookieName:   'xciv_admin_token',
  cookieMaxAge: 8 * 60 * 60 * 1000

};
