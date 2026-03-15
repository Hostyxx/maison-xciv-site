/**
 * backend/server.js
 * ─────────────────────────────────────────────────────────────
 * Point d'entrée du serveur Express.
 */

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const helmet       = require('helmet');

// Init bases de données au démarrage
require('../database/database');
require('../database/usersDB');
require('../database/favoritesDB');
require('../database/invoicesDB');

const watchesRouter      = require('./routes/watches');
const authRouter         = require('./routes/auth');         // admin auth
const usersRouter        = require('./routes/users');        // user auth
const favoritesRouter    = require('./routes/favorites');    // favoris
const uploadRouter       = require('./routes/upload');
const adminClientsRouter = require('./routes/adminClients'); // gestion clients (admin)
const invoicesRouter     = require('./routes/invoices');     // facturation (🔒 admin)
const sitemapRouter      = require('./routes/sitemap');      // sitemap.xml dynamique

const { requireAuthPage }                   = require('./middleware/auth');
const { authLimiter, registerLimiter,
        apiLimiter, uploadLimiter }         = require('./middleware/rateLimiter');

const app  = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ─── Trust proxy (Nginx/Render → X-Forwarded-For + cookies HTTPS) ─
// Activé inconditionnellement : le serveur est toujours derrière
// un reverse proxy (Render, Nginx) même en dehors de NODE_ENV=production.
app.set('trust proxy', 1);

// ─── Helmet — headers de sécurité HTTP ───────────────────────
app.use(helmet({
  // Content-Security-Policy adapté au projet (Google Fonts + inline styles)
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'"],   // inline JS dans les HTML
      styleSrc:       ["'self'", "'unsafe-inline'",
                       'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:', 'blob:'],
      connectSrc:     ["'self'"],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    }
  },
  // HSTS — force HTTPS pendant 1 an (prod uniquement)
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  // Cache le header X-Powered-By: Express
  hidePoweredBy: true,
  // Protège contre le clickjacking
  frameguard: { action: 'sameorigin' },
  // Empêche le MIME-sniffing
  noSniff: true,
  // Active le filtre XSS du navigateur
  xssFilter: true,
}));

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin:         allowedOrigins,
  methods:        ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,
  maxAge:         86400  // Cache les réponses preflight 24h
}));

// ─── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));      // réduit de 10mb → 1mb
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─── Rate limiting global sur l'API ──────────────────────────
app.use('/api/', apiLimiter);

// ─── SEO — Sitemap dynamique (avant express.static) ─────────
// Prioritaire sur frontend/sitemap.xml — reflète le catalogue live
app.get('/sitemap.xml', sitemapRouter);

// ─── Fichiers statiques ──────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend'), {
  dotfiles: 'deny',
  // Images et fonts : cache 1h en prod
  // HTML, JS, CSS : jamais mis en cache (no-cache) — évite les versions
  // obsolètes sur iPhone/Safari après un déploiement
  maxAge: 0,
  setHeaders(res, filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    if (['html', 'js', 'css'].includes(ext)) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'ico', 'svg', 'woff', 'woff2'].includes(ext)) {
      res.setHeader('Cache-Control', isProduction ? 'public, max-age=3600' : 'no-cache');
    }
  }
}));

// ─── Routes API ──────────────────────────────────────────────
// Auth admin (rate limited)
app.use('/api/auth',          authLimiter,    authRouter);
// Utilisateurs (login rate limited, register rate limited)
app.use('/api/user',          usersRouter);
// Favoris (protégés)
app.use('/api/favorites',     favoritesRouter);
// Catalogue (GET public, écriture admin)
app.use('/api/watches',       watchesRouter);
// Upload images admin (rate limited)
app.use('/api/upload',        uploadLimiter,  uploadRouter);
// Gestion clients admin
app.use('/api/admin/clients', adminClientsRouter);
// Facturation admin
app.use('/api/admin/invoices', invoicesRouter);

// ─── Pages admin (protégées côté serveur) ────────────────────
app.get('/admin',            requireAuthPage, (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/dashboard',  requireAuthPage, (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin/dashboard.html')));
app.get('/admin/facturation', requireAuthPage, (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin/facturation.html')));
app.get('/admin/merci',      requireAuthPage, (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin/merci.html')));
app.get('/admin/login',      (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin/login.html')));

// ─── Page Collection ─────────────────────────────────────────
app.get('/collection', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/collection/index.html')));

// ─── Pages utilisateur ────────────────────────────────────────
app.get('/connexion',   (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/connexion/index.html')));
app.get('/inscription', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/connexion/inscription.html')));
app.get('/mon-espace',  (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/mon-espace/index.html')));

// ─── Health check (ne révèle pas la version) ─────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok' }));

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

// ─── Gestionnaire d'erreurs global ───────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Server] Erreur non gérée :', err.message);
  // Ne jamais exposer les détails de l'erreur en prod
  res.status(500).json({
    success: false,
    error: isProduction ? 'Erreur interne du serveur.' : err.message
  });
});

// ─── Démarrage ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════════╗');
  console.log('  ║        MAISON XCIV — Serveur actif         ║');
  console.log(`  ║    http://localhost:${PORT}                 ║`);
  console.log('  ╠════════════════════════════════════════════╣');
  console.log('  ║    Admin  → /admin/login                   ║');
  console.log('  ║    Client → /connexion                     ║');
  console.log(`  ║    Env    → ${(process.env.NODE_ENV || 'development').padEnd(29)}║`);
  console.log('  ╚════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
