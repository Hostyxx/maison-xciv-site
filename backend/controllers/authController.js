/**
 * backend/controllers/authController.js
 * ─────────────────────────────────────────────────────────────
 * Gère la connexion, la déconnexion et la vérification de session.
 */

const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const config  = require('../config/admin');

const AuthController = {

  /**
   * POST /api/auth/login
   * Cherche l'admin dans la liste, vérifie le mot de passe, émet un JWT httpOnly.
   */
  login(req, res) {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
    }

    // Recherche de l'admin par email (insensible à la casse)
    const admin = config.admins.find(
      a => a.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!admin) {
      // Délai artificiel pour ralentir les attaques par force brute
      return setTimeout(() =>
        res.status(401).json({ success: false, error: 'Identifiants incorrects.' }),
      400);
    }

    // Vérification du mot de passe via bcrypt
    const passwordValid = bcrypt.compareSync(password, admin.passwordHash);
    if (!passwordValid) {
      return setTimeout(() =>
        res.status(401).json({ success: false, error: 'Identifiants incorrects.' }),
      400);
    }

    // Génération du token JWT (inclut le nom pour l'afficher dans le dashboard)
    const token = jwt.sign(
      { email: admin.email, name: admin.name, role: 'admin' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Envoi dans un cookie httpOnly (non accessible depuis JS)
    res.cookie(config.cookieName, token, {
      httpOnly: true,       // inaccessible au JavaScript client
      secure:   false,      // passer à true en HTTPS/production
      sameSite: 'strict',   // protection CSRF
      maxAge:   config.cookieMaxAge
    });

    console.log(`[Auth] Connexion admin "${admin.name}" — ${new Date().toLocaleString('fr-FR')}`);

    res.json({ success: true, message: 'Connexion réussie.' });
  },

  /**
   * POST /api/auth/logout
   * Supprime le cookie JWT.
   */
  logout(req, res) {
    res.clearCookie(config.cookieName);
    res.json({ success: true, message: 'Déconnexion réussie.' });
  },

  /**
   * GET /api/auth/verify
   * Vérifie si le token courant est valide.
   * Retourne les infos de l'admin (email, name) pour l'affichage dans le dashboard.
   */
  verify(req, res) {
    // req.admin est déjà peuplé par le middleware requireAuth (jwt.verify)
    res.json({ success: true, admin: req.admin });
  }

};

module.exports = AuthController;
