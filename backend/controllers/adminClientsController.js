/**
 * backend/controllers/adminClientsController.js
 * ─────────────────────────────────────────────────────────────
 * Gestion des clients depuis le panel admin.
 * Protégé par requireAuth (token JWT admin).
 *
 * GET /api/admin/clients      → liste tous les clients + nb favoris
 * GET /api/admin/clients/:id  → détail client + favoris avec montres
 */

const { readUsers }     = require('../../database/usersDB');
const { readFavorites } = require('../../database/favoritesDB');
const { readDB }        = require('../../database/database');

const AdminClientsController = {

  /**
   * GET /api/admin/clients
   * Retourne tous les comptes utilisateurs (hors admins)
   * avec leur nombre de favoris, triés du plus récent au plus ancien.
   */
  getClients(req, res) {
    try {
      const { users }     = readUsers();
      const { favorites } = readFavorites();

      const clients = users
        .filter(u => u.role !== 'admin')
        .map(u => ({
          id:             u.id,
          name:           u.name,
          email:          u.email,
          created_at:     u.created_at,
          updated_at:     u.updated_at || null,
          favoritesCount: favorites.filter(f => f.userId === u.id).length
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json({ success: true, clients, total: clients.length });

    } catch (err) {
      console.error('[AdminClients] getClients:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  },

  /**
   * GET /api/admin/clients/:id
   * Retourne le profil complet d'un client et ses favoris
   * avec les informations des montres correspondantes.
   */
  getClientDetail(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID invalide.' });
      }

      const { users }     = readUsers();
      const { favorites } = readFavorites();
      const { watches }   = readDB();

      const user = users.find(u => u.id === id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Client introuvable.' });
      }

      // Favoris du client — les plus récents en premier
      const userFavorites = favorites
        .filter(f => f.userId === id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(f => {
          const watch = watches.find(w => w.id === f.watchId) || null;
          return {
            watchId:    f.watchId,
            created_at: f.created_at,
            watch: watch ? {
              id:     watch.id,
              brand:  watch.brand,
              name:   watch.name,
              price:  watch.price,
              image:  watch.image  || '',
              status: watch.status,
              year:   watch.year   || null
            } : null
          };
        });

      res.json({
        success:        true,
        client: {
          id:         user.id,
          name:       user.name,
          email:      user.email,
          created_at: user.created_at,
          updated_at: user.updated_at || null
        },
        favorites:      userFavorites,
        favoritesCount: userFavorites.length
      });

    } catch (err) {
      console.error('[AdminClients] getClientDetail:', err.message);
      res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
  }

};

module.exports = AdminClientsController;
