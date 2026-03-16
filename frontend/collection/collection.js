/**
 * frontend/collection/collection.js
 * ─────────────────────────────────────────────────────────────
 * Page Collection — Maison XCIV
 *
 *  1. Données & état
 *  2. Filtres + tri
 *  3. Switch vue grille / liste
 *  4. Fetch montres + rendu grid
 *  5. Authentification + favoris
 *  6. Modal auth + toast
 *
 *  Cursor, mobile nav, auth nav → shared/nav.js
 */

'use strict';

// ═══════════════════════════════════════════
//  1. DONNÉES & ÉTAT
// ═══════════════════════════════════════════

let allWatches   = [];   // cache complet
let currentUser  = null;
let favoriteIds  = new Set();

const activeFilters = {
  brand: 'all',       // 'all' | 'rolex' | 'patek' | 'ap' | 'autres'
  sort:  'default',   // 'default' | 'price-asc' | 'price-desc' | 'year-asc' | 'year-desc'
};

// SVG placeholder
const watchSVG = `<svg viewBox="0 0 120 152" xmlns="http://www.w3.org/2000/svg">
  <rect x="40" y="120" width="40" height="22" rx="3" fill="rgba(196,170,140,0.05)" stroke="rgba(196,170,140,0.12)" stroke-width="0.8"/>
  <rect x="40" y="18"  width="40" height="16" rx="3" fill="rgba(196,170,140,0.05)" stroke="rgba(196,170,140,0.12)" stroke-width="0.8"/>
  <circle cx="60" cy="76" r="34" fill="none" stroke="rgba(196,170,140,0.15)" stroke-width="1.5"/>
  <circle cx="60" cy="76" r="28" fill="none" stroke="rgba(196,170,140,0.1)"  stroke-width="1"/>
  <line x1="60" y1="37" x2="60" y2="44" stroke="rgba(196,170,140,0.4)" stroke-width="1.5"/>
  <line x1="60" y1="76" x2="60" y2="52" stroke="rgba(196,170,140,0.6)" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="60" y1="76" x2="78" y2="82" stroke="rgba(196,170,140,0.5)" stroke-width="1"   stroke-linecap="round"/>
  <circle cx="60" cy="76" r="2.5" fill="rgba(196,170,140,0.7)"/>
</svg>`;

// ═══════════════════════════════════════════
//  4. FILTRES & TRI
// ═══════════════════════════════════════════

/** Convertit un string prix en nombre (Infinity si "sur demande"). */
function parsePrice(str) {
  if (!str || /demande|sur/i.test(str)) return Infinity;
  const n = parseFloat(str.replace(/[^\d,.]/g, '').replace(',', '.'));
  return isNaN(n) ? Infinity : n;
}

/** Retourne true si la marque correspond au filtre actif. */
function matchBrand(watch) {
  const b = (watch.brand || '').toLowerCase();
  switch (activeFilters.brand) {
    case 'all':    return true;
    case 'rolex':  return b.includes('rolex');
    case 'patek':  return b.includes('patek');
    case 'ap':     return b.includes('audemars') || b.includes('piguet');
    case 'autres':
      return !b.includes('rolex') && !b.includes('patek')
          && !b.includes('audemars') && !b.includes('piguet');
    default: return true;
  }
}

/** Applique les filtres + le tri et re-rend la grille. */
function applyFilters() {
  let result = allWatches.filter(matchBrand);

  switch (activeFilters.sort) {
    case 'price-asc':  result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break;
    case 'price-desc': result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break;
    case 'year-asc':   result.sort((a, b) => (a.year  || 0) - (b.year  || 0)); break;
    case 'year-desc':  result.sort((a, b) => (b.year  || 0) - (a.year  || 0)); break;
    default:           result.sort((a, b) => b.id - a.id); // plus récent en premier
  }

  renderGrid(result);
  updateResultsBar(result.length);
  toggleResetBtn();
}

function setBrand(brand, btn) {
  activeFilters.brand = brand;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyFilters();
}

function setSort(value) {
  activeFilters.sort = value;
  applyFilters();
}

function resetFilters() {
  activeFilters.brand = 'all';
  activeFilters.sort  = 'default';

  document.querySelectorAll('.filter-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.brand === 'all');
  });
  const sel = document.getElementById('sortSelect');
  if (sel) sel.value = 'default';

  applyFilters();
}

function toggleResetBtn() {
  const btn = document.getElementById('resetBtn');
  if (!btn) return;
  const isDefault = activeFilters.brand === 'all' && activeFilters.sort === 'default';
  btn.style.display = isDefault ? 'none' : 'inline-block';
}

function updateResultsBar(count) {
  const el = document.getElementById('resultsCount');
  if (!el) return;
  if (count === 0) {
    el.textContent = 'Aucune montre trouvée';
  } else {
    el.textContent = `${count} montre${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''}`;
  }
}

window.resetFilters  = resetFilters; // used in dynamically generated HTML (renderGrid)


// ═══════════════════════════════════════════
//  5. CHARGEMENT API & RENDU
// ═══════════════════════════════════════════

function buildSkeleton() {
  return `<div class="wc-skeleton">
    <div class="wc-skeleton-img"></div>
    <div class="wc-skeleton-body">
      <div class="wc-skeleton-line wc-skeleton-line-sm"></div>
      <div class="wc-skeleton-line wc-skeleton-line-xl"></div>
      <div class="wc-skeleton-line wc-skeleton-line-md" style="margin-top:2px"></div>
      <div class="wc-skeleton-line wc-skeleton-line-lg" style="margin-top:10px"></div>
      <div class="wc-skeleton-line wc-skeleton-line-md"></div>
      <div class="wc-skeleton-line wc-skeleton-line-price" style="margin-top:16px"></div>
    </div>
  </div>`;
}

async function loadWatches() {
  const grid = document.getElementById('collGrid');

  // Skeletons pendant le chargement
  if (grid) {
    grid.innerHTML = Array.from({ length: 8 }, buildSkeleton).join('');
  }

  try {
    const res  = await fetch('/api/watches');
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    allWatches = json.data;

    // Compteurs dans le hero
    const total  = allWatches.length;
    const disponibles = allWatches.filter(w => w.status === 'Disponible').length;
    const heroTotal = document.getElementById('heroTotalCount');
    const heroDispo = document.getElementById('heroDispoCount');
    if (heroTotal) heroTotal.textContent = total;
    if (heroDispo) heroDispo.textContent = disponibles;

    // Lire le paramètre ?brand= dans l'URL pour pré-filtrer
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand');
    if (brandParam) {
      const tabBtn = document.querySelector(`.filter-tab[data-brand="${brandParam}"]`);
      if (tabBtn) setBrand(brandParam, tabBtn);
    } else {
      applyFilters();
    }

  } catch (err) {
    console.error('[Collection] Erreur chargement :', err);
    if (grid) grid.innerHTML = `
      <div class="coll-empty">
        <p>Impossible de charger la collection.</p>
        <p style="font-size:12px;color:var(--c-grey-lt);margin-top:8px;">Vérifiez que le serveur est démarré.</p>
      </div>`;
  }
}

/** Intersection Observer pour les animations d'entrée des cartes. */
const cardObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); cardObserver.unobserve(e.target); }
  });
}, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

/** Construit le HTML d'une carte montre. */
function buildCard(watch, index) {
  const statusMap = { 'Disponible': 'disponible', 'Réservé': 'reserve', 'Vendu': 'vendu' };
  const statusClass = statusMap[watch.status] || 'disponible';
  const isVendu     = watch.status === 'Vendu';


  const img = watch.image
    ? `<img src="${escHtml(watch.image)}" alt="${escHtml(watch.brand)} ${escHtml(watch.name)}" loading="lazy" decoding="async">`
    : `<div class="wc-img-placeholder">${watchSVG}</div>`;

  const wa = buildWAUrl(watch);
  const isFav = favoriteIds.has(watch.id);

  const btn = isVendu
    ? `<span class="wc-btn" aria-disabled="true" style="cursor:default"><span>Vendu</span></span>`
    : `<a href="${wa}" class="wc-btn" target="_blank" rel="noopener noreferrer"
          aria-label="Contacter via WhatsApp pour ${escHtml(watch.brand)} ${escHtml(watch.name)}">
         <svg viewBox="0 0 24 24" aria-hidden="true">
           <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
         </svg>
         <span>Nous contacter</span>
       </a>`;

  return `
  <article class="wc-item ${isVendu ? 'is-vendu' : ''}"
           data-id="${watch.id}"
           aria-label="${escHtml(watch.brand)} ${escHtml(watch.name)} — ${escHtml(watch.status)}">
    <div class="wc-img">
      ${img}
      <div class="wc-img-overlay" aria-hidden="true"></div>
      <span class="wc-badge ${statusClass}">${escHtml(watch.status)}</span>
      <button class="wc-fav-btn ${isFav ? 'is-fav' : ''}"
              data-watch-id="${watch.id}"
              aria-label="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
        <svg class="heart-empty"  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        <svg class="heart-filled" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </button>
    </div>
    <div class="wc-body">
      <div class="wc-brand">${escHtml(watch.brand)}</div>
      <h2 class="wc-name">${escHtml(watch.name)}</h2>
      ${watch.year ? `<div class="wc-year">${watch.year}</div>` : ''}
      <div class="wc-sep"></div>
      <p class="wc-desc">${escHtml(watch.description || '')}</p>
      <div class="wc-footer">
        <div>
          <span class="wc-price-label">Prix</span>
          <span class="wc-price">${escHtml(watch.price)}</span>
        </div>
        ${btn}
      </div>
    </div>
  </article>`;
}

/** Injecte les cartes dans la grille et active les animations. */
function renderGrid(watches) {
  const grid = document.getElementById('collGrid');
  if (!grid) return;

  if (watches.length === 0) {
    grid.innerHTML = `
      <div class="coll-empty">
        <svg class="coll-empty-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
          <circle cx="24" cy="24" r="20"/>
          <circle cx="24" cy="24" r="13"/>
          <line x1="24" y1="4"  x2="24" y2="11"/>
          <line x1="24" y1="24" x2="24" y2="15"/>
          <line x1="24" y1="24" x2="31" y2="26"/>
          <circle cx="24" cy="24" r="2" fill="currentColor" stroke="none"/>
        </svg>
        <p>Aucune montre pour cette sélection.</p>
        <p class="coll-empty-hint">Essayez un autre filtre</p>
        <button class="coll-empty-reset" data-action="reset-filters">Voir toute la collection</button>
      </div>`;
    return;
  }

  grid.innerHTML = watches.map((w, i) => buildCard(w, i)).join('');
  grid.querySelectorAll('.wc-item').forEach(el => cardObserver.observe(el));
}


// ═══════════════════════════════════════════
//  5b. INIT AUTH (délègue à shared/nav.js)
// ═══════════════════════════════════════════

/**
 * Attend que shared/nav.js ait vérifié la session,
 * puis synchronise currentUser et charge les favoris.
 */
async function initAuth() {
  currentUser = await (window.xcivAuthReady || Promise.resolve(null));
  if (currentUser) await loadFavoriteIds();
}

async function loadFavoriteIds() {
  if (!currentUser) return;
  try {
    const res  = await fetch('/api/favorites/ids', { credentials: 'same-origin' });
    const json = await res.json();
    if (json.success) {
      favoriteIds = new Set(json.ids);
      refreshFavButtons();
    }
  } catch { /* silencieux */ }
}

function refreshFavButtons() {
  document.querySelectorAll('.wc-fav-btn').forEach(btn => {
    const id = parseInt(btn.dataset.watchId, 10);
    btn.classList.toggle('is-fav', favoriteIds.has(id));
  });
}

async function toggleFavorite(watchId, btn) {
  if (!currentUser) { openAuthModal(); return; }

  btn.classList.add('pulse');
  btn.disabled = true;

  try {
    const res  = await fetch(`/api/favorites/${watchId}`, {
      method: 'POST', credentials: 'same-origin'
    });
    const json = await res.json();
    if (!json.success) throw new Error();

    if (json.added) {
      favoriteIds.add(watchId);
      btn.classList.add('is-fav');
      showToast('Ajouté à vos favoris');
    } else {
      favoriteIds.delete(watchId);
      btn.classList.remove('is-fav');
      showToast('Retiré des favoris');
    }
    btn.setAttribute('aria-label', json.added ? 'Retirer des favoris' : 'Ajouter aux favoris');
  } catch {
    showToast('Une erreur est survenue');
  } finally {
    btn.disabled = false;
    setTimeout(() => btn.classList.remove('pulse'), 500);
  }
}

window.toggleFavorite = toggleFavorite; // used in dynamically generated HTML (buildCard)


// ─── Modal auth ──────────────────────────────────────────────
function openAuthModal() {
  const overlay = document.getElementById('authModal');
  if (overlay) { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeAuthModal(event) {
  if (event && event.target !== event.currentTarget &&
      !event.target.closest('.auth-modal-close')) return;
  const overlay = document.getElementById('authModal');
  if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAuthModal({ target: document.getElementById('authModal') });
});



// ─── Toast ───────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('pubToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}


// ═══════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildWAUrl(watch) {
  const num = watch.whatsapp || '33601918798';
  const msg = encodeURIComponent(
    watch.message || `Bonjour, je suis intéressé(e) par la ${watch.brand} ${watch.name}.`
  );
  return `https://wa.me/${num}?text=${msg}`;
}


// ═══════════════════════════════════════════
//  3. SWITCH VUE GRILLE / LISTE
// ═══════════════════════════════════════════

function setView(view) {
  const grid = document.getElementById('collGrid');
  if (!grid) return;
  grid.classList.toggle('view-list', view === 'list');

  document.querySelectorAll('.view-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  try { localStorage.setItem('xciv_coll_view', view); } catch {}
}

function restoreView() {
  try {
    const saved = localStorage.getItem('xciv_coll_view') || 'grid';
    setView(saved);
  } catch { setView('grid'); }
}


// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Vue grille / liste
  restoreView();
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', function () { setBrand(this.dataset.brand, this); });
  });
  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.addEventListener('change', () => setSort(sortSelect.value));
  // Reset filters
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetFilters);
  // Auth modal
  const authModal = document.getElementById('authModal');
  if (authModal) authModal.addEventListener('click', closeAuthModal);
  const authClose = document.querySelector('.auth-modal-close');
  if (authClose) authClose.addEventListener('click', () => closeAuthModal({ target: authModal, currentTarget: authModal }));

  // Délégation : boutons favoris + reset-filters dans la grille
  const collGrid = document.getElementById('collGrid');
  if (collGrid) {
    collGrid.addEventListener('click', e => {
      const favBtn   = e.target.closest('.wc-fav-btn');
      const resetBtn = e.target.closest('[data-action="reset-filters"]');
      if (favBtn)   toggleFavorite(parseInt(favBtn.dataset.watchId, 10), favBtn);
      if (resetBtn) resetFilters();
    });
  }

  await initAuth();    // attend shared/nav.js → session + favoris
  await loadWatches(); // catalogue
});
