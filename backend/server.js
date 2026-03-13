/**
 * backend/server.js
 * ─────────────────────────────────────────────────────────────
 * Point d'entrée du serveur Express.
 */

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');

// Init bases de données au démarrage
require('../database/database');
require('../database/usersDB');
require('../database/favoritesDB');
require('../database/invoicesDB');

const watchesRouter       = require('./routes/watches');
const authRouter          = require('./routes/auth');          // admin auth
const usersRouter         = require('./routes/users');         // user auth
const favoritesRouter     = require('./routes/favorites');     // favoris
const uploadRouter        = require('./routes/upload');
const adminClientsRouter  = require('./routes/adminClients');  // gestion clients (admin)
const invoicesRouter      = require('./routes/invoices');       // facturation (🔒 admin)

const { requireAuthPage } = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ─── Middlewares ─────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin:         allowedOrigins,
  methods:        ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Token'],
  credentials:    true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Fichiers statiques ──────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Routes API ──────────────────────────────────────────────
app.use('/api/auth',           authRouter);          // admin : /api/auth/login|logout|verify
app.use('/api/user',           usersRouter);         // users : /api/user/register|login|logout|me|session
app.use('/api/favorites',      favoritesRouter);     // favoris (protégés)
app.use('/api/watches',        watchesRouter);       // catalogue (GET public, écriture admin)
app.use('/api/upload',         uploadRouter);        // upload images (admin)
app.use('/api/admin/clients',   adminClientsRouter);  // gestion clients (🔒 admin)
app.use('/api/admin/invoices', invoicesRouter);      // facturation     (🔒 admin)

// ─── Pages admin (protégées côté serveur) ────────────────────
app.get('/admin',           requireAuthPage, (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/dashboard',    requireAuthPage, (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin/dashboard.html')));
app.get('/admin/facturation', requireAuthPage, (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin/facturation.html')));
app.get('/admin/merci',       requireAuthPage, (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin/merci.html')));
app.get('/admin/login',       (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin/login.html')));

// ─── Page Collection ─────────────────────────────────────────
app.get('/collection', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/collection/index.html')));

// ─── Pages utilisateur (servies telles quelles — auth côté client) ──
app.get('/connexion',   (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/connexion/index.html')));
app.get('/inscription', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/connexion/inscription.html')));
app.get('/mon-espace',  (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/mon-espace/index.html')));

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', project: 'Maison XCIV', version: '1.1.0' }));

// ─── Pages annexes ───────────────────────────────────────────
const annexePages = [
  { url: '/mentions-legales',          file: 'mentions-legales.html' },
  { url: '/politique-confidentialite', file: 'politique-confidentialite.html' },
  { url: '/cgu',                       file: 'cgu.html' },
  { url: '/cgv',                       file: 'cgv.html' },
  { url: '/cookies',                   file: 'cookies.html' },
  { url: '/contact',                   file: 'contact.html' },
  { url: '/faq',                       file: 'faq.html' },
  { url: '/a-propos',                  file: 'a-propos.html' },
  { url: '/livraison-retours',         file: 'livraison-retours.html' },
  { url: '/authenticite-garantie',     file: 'authenticite-garantie.html' },
];
annexePages.forEach(({ url, file }) => {
  app.get(url, (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/pages', file)));
});

// ─── Fallback SPA ────────────────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/index.html')));

// ─── Démarrage ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════════╗');
  console.log('  ║        MAISON XCIV — Serveur actif         ║');
  console.log(`  ║    http://localhost:${PORT}                 ║`);
  console.log('  ╠════════════════════════════════════════════╣');
  console.log('  ║    Admin  → /admin/login                   ║');
  console.log('  ║    Client → /connexion                     ║');
  console.log('  ╚════════════════════════════════════════════╝');
  console.log('');
  console.log('  Admin : admin@maisonxciv.com / Xciv2025!');
  console.log('');
});

module.exports = app;
