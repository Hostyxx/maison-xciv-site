/**
 * backend/models/userModel.js
 * ─────────────────────────────────────────────────────────────
 * CRUD pour les comptes utilisateurs.
 */

const bcrypt              = require('bcryptjs');
const { readUsers, writeUsers } = require('../../database/usersDB');

const UserModel = {

  /** Trouve un utilisateur par email (insensible à la casse). */
  findByEmail(email) {
    const { users } = readUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  /** Trouve un utilisateur par ID. */
  findById(id) {
    const { users } = readUsers();
    return users.find(u => u.id === id) || null;
  },

  /**
   * Crée un nouveau compte.
   * Retourne l'utilisateur sans le hash du mot de passe.
   */
  create({ name, email, password }) {
    const db           = readUsers();
    const passwordHash = bcrypt.hashSync(password, 12);

    const user = {
      id:           db.nextId,
      name:         name.trim(),
      email:        email.trim().toLowerCase(),
      passwordHash,
      role:         'user',
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString()
    };

    db.users.push(user);
    db.nextId++;
    writeUsers(db);

    return safeUser(user);
  },

  /**
   * Vérifie le mot de passe.
   * Retourne l'utilisateur safe ou null si invalide.
   */
  verify(email, password) {
    const user = this.findByEmail(email);
    if (!user) return null;
    if (!bcrypt.compareSync(password, user.passwordHash)) return null;
    return safeUser(user);
  },

  /** Retourne l'utilisateur sans son hash de mot de passe. */
  getSafe(id) {
    const user = this.findById(id);
    return user ? safeUser(user) : null;
  }
};

/** Retire le hash du mot de passe avant d'envoyer au client. */
function safeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = UserModel;
