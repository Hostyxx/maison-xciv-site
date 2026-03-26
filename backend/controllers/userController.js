/**
 * backend/controllers/userController.js
 * ─────────────────────────────────────────────────────────────
 * Inscription, connexion, déconnexion et profil des utilisateurs.
 *
 * Note : jamais d'erreurs techniques exposées au client.
 * Les messages restent génériques et élégants.
 */

const jwt        = require('jsonwebtoken');
const UserModel  = require('../models/userModel');
const config     = require('../config/userConfig');

const UserController = {

  /**
   * POST /api/user/register
   * Crée un nouveau compte utilisateur.
   */
  register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Validations présence
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Tous les champs sont requis.' });
      }
      // Validations longueur (protection DoS)
      if (String(name).length > config.nameMaxLength) {
        return res.status(400).json({ success: false, error: 'Nom trop long.' });
      }
      if (String(email).length > config.emailMaxLength) {
        return res.status(400).json({ success: false, error: 'Email trop long.' });
      }
      if (String(password).length > config.passwordMaxLength) {
        return res.status(400).json({ success: false, error: 'Mot de passe trop long.' });
      }
      // Validations format
      if (name.trim().length < config.nameMinLength) {
        return res.status(400).json({ success: false, error: 'Nom trop court (2 caractères minimum).' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'Adresse email invalide.' });
      }
      if (password.length < config.passwordMinLength) {
        return res.status(400).json({ success: false, error: `Mot de passe trop court (${config.passwordMinLength} caractères minimum).` });
      }

      // Email déjà utilisé ?
      if (UserModel.findByEmail(email)) {
        return res.status(409).json({ success: false, error: 'Un compte existe déjà avec cette adresse.' });
      }

      const user  = UserModel.create({ name, email, password });
      const token = generateToken(user);
      setUserCookie(res, token);

      console.log(`[User] Inscription : user_${user.id}`);

      res.status(201).json({ success: true, user });

    } catch (err) {
      console.error('[UserController] register:', err.message);
      res.status(500).json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' });
    }
  },

  /**
   * POST /api/user/login
   * Connexion d'un utilisateur.
   */
  login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
      }

      const user = UserModel.verify(email, password);
      if (!user) {
        // Délai anti brute-force + message générique
        return setTimeout(() =>
          res.status(401).json({ success: false, error: 'Identifiants incorrects.' }),
        400);
      }

      const token = generateToken(user);
      setUserCookie(res, token);

      console.log(`[User] Connexion : user_${user.id}`);

      res.json({ success: true, user });

    } catch (err) {
      console.error('[UserController] login:', err.message);
      res.status(500).json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' });
    }
  },

  /**
   * POST /api/user/logout
   * Déconnexion (suppression du cookie).
   */
  logout(req, res) {
    res.clearCookie(config.cookieName);
    res.json({ success: true });
  },

  /**
   * GET /api/user/me
   * Retourne les infos de l'utilisateur connecté.
   * Protégé par requireUserAuth.
   */
  me(req, res) {
    try {
      const user = UserModel.getSafe(req.user.id);
      if (!user) return res.status(404).json({ success: false, error: 'Compte introuvable.' });
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  /**
   * GET /api/user/session
   * Route publique : retourne les infos si connecté, null sinon.
   * Ne renvoie JAMAIS d'erreur — utilisée par le frontend public.
   */
  session(req, res) {
    // req.user est défini par optionalUserAuth (peut être null)
    if (!req.user) {
      return res.json({ success: true, user: null, isAdmin: false });
    }
    res.json({ success: true, user: req.user, isAdmin: req.user.role === 'admin' });
  }

};

// ─── Helpers ─────────────────────────────────────────────────

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function setUserCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   config.cookieMaxAge
  });
}

module.exports = UserController;
