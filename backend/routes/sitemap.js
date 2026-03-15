/**
 * backend/routes/sitemap.js
 * ─────────────────────────────────────────────────────────────
 * Sitemap XML dynamique — généré à la volée.
 *
 * Enregistré AVANT express.static dans server.js pour avoir
 * la priorité sur le fichier frontend/sitemap.xml statique.
 *
 * Le /collection reflète la date de dernière modification
 * du catalogue de montres (updated_at de la montre la plus récente).
 *
 * Évolution future : quand des pages /collection/:id existeront
 * côté serveur, décommenter le bloc "Montres individuelles" ci-dessous.
 */

const express  = require('express');
const router   = express.Router();
const { readDB } = require('../../database/database');

const BASE_URL = 'https://maisonxciv.com';

/* ─── Pages statiques indexables ───────────────────────────── */
const STATIC_PAGES = [
  { loc: '/',                          changefreq: 'weekly',  priority: '1.0' },
  { loc: '/collection',                changefreq: 'daily',   priority: '0.9' }, // lastmod = watches
  { loc: '/a-propos',                  changefreq: 'monthly', priority: '0.7' },
  { loc: '/contact',                   changefreq: 'monthly', priority: '0.7' },
  { loc: '/faq',                       changefreq: 'monthly', priority: '0.6' },
  { loc: '/authenticite-garantie',     changefreq: 'monthly', priority: '0.6' },
  { loc: '/livraison-retours',         changefreq: 'monthly', priority: '0.5' },
  { loc: '/mentions-legales',          changefreq: 'yearly',  priority: '0.2' },
  { loc: '/politique-confidentialite', changefreq: 'yearly',  priority: '0.2' },
  { loc: '/cgu',                       changefreq: 'yearly',  priority: '0.2' },
  { loc: '/cgv',                       changefreq: 'yearly',  priority: '0.2' },
  { loc: '/cookies',                   changefreq: 'yearly',  priority: '0.2' },
];

/* ─── Helpers ───────────────────────────────────────────────── */
function toISODate(iso) {
  try { return new Date(iso).toISOString().split('T')[0]; } catch { return today(); }
}
function today() {
  return new Date().toISOString().split('T')[0];
}
function urlBlock({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${BASE_URL}${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

/* ─── Handler GET /sitemap.xml ──────────────────────────────── */
router.get('/', (req, res) => {
  try {
    const { watches } = readDB();

    /* Date de la montre la plus récemment mise à jour */
    const latestMod = watches.reduce((max, w) => {
      const d = new Date(w.updated_at || 0);
      return d > max ? d : max;
    }, new Date(0));
    const collectionLastMod = latestMod.getTime() > 0 ? toISODate(latestMod.toISOString()) : today();

    /* Génération des blocs URL */
    const staticBlocks = STATIC_PAGES.map(page => {
      const lastmod = page.loc === '/collection' ? collectionLastMod : today();
      return urlBlock({ ...page, lastmod });
    }).join('\n\n');

    /* ── Montres individuelles (future évolution) ──────────────
     * Décommenter quand les routes /collection/:id existeront :
     *
     * const watchBlocks = watches
     *   .filter(w => w.status !== 'Vendu')
     *   .map(w => urlBlock({
     *     loc:        `/collection/${w.id}`,
     *     lastmod:    toISODate(w.updated_at),
     *     changefreq: 'weekly',
     *     priority:   '0.8',
     *   })).join('\n\n');
     *
     * Ajouter `\n\n${watchBlocks}` dans le template ci-dessous.
     * ──────────────────────────────────────────────────────── */

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${staticBlocks}

</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);

  } catch (err) {
    console.error('[Sitemap] Erreur :', err.message);
    res.status(500).type('xml').send(
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    );
  }
});

module.exports = router;
