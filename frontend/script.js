/**
 * frontend/script.js
 * ─────────────────────────────────────────────────────────────
 * Script principal — Maison XCIV
 *
 * Sections :
 *  1. Loader
 *  2. Cursor custom
 *  3. Navbar (scroll + mobile)
 *  4. Scroll Reveal (IntersectionObserver)
 *  5. Watches Slider (hero section)
 *  6. Smooth anchors
 *  7. Parallax hero
 *  8. API Catalogue — fetch + render cards
 *  9. Admin Panel — CRUD complet
 */

'use strict';

// ─── Sécurité : échappement HTML anti-XSS ────────────────────
// À utiliser systématiquement avant d'injecter des données
// d'API dans le DOM via innerHTML ou les templates literals.
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// ═══════════════════════════════════════════
//  1. LOADER
// ═══════════════════════════════════════════
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 2200);
});


// ═══════════════════════════════════════════
//  2. CURSOR CUSTOM (desktop uniquement)
// ═══════════════════════════════════════════
const dot  = document.getElementById('cur-dot');
const ring = document.getElementById('cur-ring');

const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

if (!isTouch) {
  let mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function moveCursorRing() {
    rx += (mx - rx) * 0.09;
    ry += (my - ry) * 0.09;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(moveCursorRing);
  })();

  // Agrandir le curseur sur les éléments interactifs
  document.querySelectorAll(
    'a, button, .service-row, .watch-slide, .proj, .p-step, .hamburger, .watch-dot, .admin-fab'
  ).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });
}


// ═══════════════════════════════════════════
//  3. NAVBAR
// ═══════════════════════════════════════════
const nav = document.getElementById('nav');
nav.classList.add('dark');

window.addEventListener('scroll', () => {
  const heroH = document.getElementById('hero').offsetHeight;
  if (window.scrollY > heroH * 0.8) {
    nav.classList.add('solid');
    nav.classList.remove('dark');
  } else {
    nav.classList.remove('solid');
    nav.classList.add('dark');
  }
}, { passive: true });

// ── Mobile nav ──────────────────────────────
let mobileOpen = false;

function toggleMobile() {
  mobileOpen = !mobileOpen;
  document.getElementById('mobileNav').classList.toggle('open', mobileOpen);
  const hbtn = document.getElementById('hamburger');
  hbtn.classList.toggle('open', mobileOpen);
  hbtn.setAttribute('aria-expanded', mobileOpen);
  document.body.style.overflow = mobileOpen ? 'hidden' : '';
  document.body.classList.toggle('menu-open', mobileOpen);
}

function closeMobile() {
  mobileOpen = false;
  document.getElementById('mobileNav').classList.remove('open');
  const hbtn = document.getElementById('hamburger');
  hbtn.classList.remove('open');
  hbtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  document.body.classList.remove('menu-open');
}

// Fermer le menu mobile avec Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileOpen) closeMobile();
});


// ═══════════════════════════════════════════
//  4. SCROLL REVEAL
// ═══════════════════════════════════════════
const srObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in');
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.sr, .sr-d1, .sr-d2, .sr-d3, .sr-d4, .sr-fade, .sr-left, .sr-right')
  .forEach(el => srObserver.observe(el));

// ── Stats counter animation ──
function animateCounter(el) {
  const target = +el.dataset.target;
  const duration = 1600;
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  (function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(ease(progress) * target);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  })(start);
}
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.stat-num').forEach(animateCounter);
    statsObserver.unobserve(e.target);
  });
}, { threshold: 0.3 });
const statsBar = document.querySelector('.services-stats');
if (statsBar) statsObserver.observe(statsBar);

// ── Service row keyboard nav ──
document.querySelectorAll('.service-row[role="link"]').forEach(row => {
  row.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── Process timeline: draw line on scroll ──
const processTimeline = document.getElementById('processTimeline');
if (processTimeline) {
  const ptObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        processTimeline.classList.add('pt-animated');
        ptObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  ptObserver.observe(processTimeline);
}

// ═══════════════════════════════════════════
//  5. WATCHES HERO SLIDER
// ═══════════════════════════════════════════
let currentWatch = 0;
const track = document.getElementById('watchesTrack');
const dots   = document.querySelectorAll('.watch-dot');

function goToWatch(index) {
  currentWatch = index;
  const slides     = track.querySelectorAll('.watch-slide');
  const slideWidth = slides[0].offsetWidth + 2;
  track.style.transform = `translateX(-${index * slideWidth}px)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
}

// Swipe tactile
let startX = 0, isDragging = false;
track.addEventListener('touchstart', e => {
  startX    = e.touches[0].clientX;
  isDragging = true;
}, { passive: true });

track.addEventListener('touchend', e => {
  if (!isDragging) return;
  const diff   = startX - e.changedTouches[0].clientX;
  const slides = track.querySelectorAll('.watch-slide');
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentWatch < slides.length - 1) goToWatch(currentWatch + 1);
    else if (diff < 0 && currentWatch > 0)            goToWatch(currentWatch - 1);
  }
  isDragging = false;
});


// ═══════════════════════════════════════════
//  6. SMOOTH ANCHORS
// ═══════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


// ═══════════════════════════════════════════
//  7. PARALLAX HERO (desktop seulement)
// ═══════════════════════════════════════════
const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
if (!isTouchDevice) {
  window.addEventListener('scroll', () => {
    const word = document.querySelector('.hero-bg-word');
    if (word) word.style.transform = `translateY(${window.scrollY * 0.2}px)`;
  }, { passive: true });
}


// ═══════════════════════════════════════════
//  8. API CATALOGUE — Watches
// ═══════════════════════════════════════════

/** URL de base de l'API */
const API_BASE = '/api/watches';

/** Cache local pour les montres (évite des requêtes inutiles) */
let watchesCache = [];

/** Filtre actif */
let currentFilter = 'all';

// ── SVG placeholder (affiché si pas d'image) ────────────────
const watchSVGPlaceholder = `<svg viewBox="0 0 120 152" xmlns="http://www.w3.org/2000/svg">
  <rect x="40" y="120" width="40" height="22" rx="3" fill="rgba(196,170,140,0.05)" stroke="rgba(196,170,140,0.12)" stroke-width="0.8"/>
  <rect x="40" y="18"  width="40" height="16" rx="3" fill="rgba(196,170,140,0.05)" stroke="rgba(196,170,140,0.12)" stroke-width="0.8"/>
  <circle cx="60" cy="76" r="34" fill="none" stroke="rgba(196,170,140,0.15)" stroke-width="1.5"/>
  <circle cx="60" cy="76" r="28" fill="none" stroke="rgba(196,170,140,0.1)"  stroke-width="1"/>
  <line x1="60" y1="37" x2="60" y2="44" stroke="rgba(196,170,140,0.4)" stroke-width="1.5"/>
  <line x1="60" y1="76" x2="60" y2="52" stroke="rgba(196,170,140,0.6)" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="60" y1="76" x2="78" y2="82" stroke="rgba(196,170,140,0.5)" stroke-width="1"   stroke-linecap="round"/>
  <circle cx="60" cy="76" r="2.5" fill="rgba(196,170,140,0.7)"/>
</svg>`;

// ── Helpers ──────────────────────────────────────────────────

function getStatusClass(status) {
  const map = { 'Disponible': 'disponible', 'Réservé': 'reserve', 'Vendu': 'vendu' };
  return map[status] || 'disponible';
}

function buildWhatsAppURL(watch) {
  const num = watch.whatsapp || '33601918798';
  const msg = encodeURIComponent(
    watch.message || `Bonjour, je suis intéressé(e) par la ${watch.brand} ${watch.name}.`
  );
  return `https://wa.me/${num}?text=${msg}`;
}

function buildCard(watch, index) {
  const statusClass = getStatusClass(watch.status);
  const isVendu     = watch.status === 'Vendu';
  const delay       = (index % 4) * 80;

  const safeImage = watch.image && watch.image.startsWith('/assets/')
    ? watch.image : '';
  const imgContent = safeImage
    ? `<img src="${escapeHtml(safeImage)}" alt="${escapeHtml(watch.brand)} ${escapeHtml(watch.name)}" loading="lazy" decoding="async">`
    : `<div class="wc-img-placeholder">${watchSVGPlaceholder}</div>`;

  const btnContent = isVendu
    ? `<span>Vendu</span>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true">
         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
       </svg>
       <span>Nous contacter</span>`;

  const isFav = favoriteIds.has(watch.id);

  const safeId     = parseInt(watch.id, 10);
  const safeStatus = escapeHtml(watch.status);
  const safeBrand  = escapeHtml(watch.brand);
  const safeName   = escapeHtml(watch.name);
  const safeDesc   = escapeHtml(watch.description);
  const safePrice  = escapeHtml(watch.price);
  const favLabel   = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';

  return `
  <article class="watch-card-item ${isVendu ? 'is-vendu' : ''} wc-sr"
           style="transition-delay:${delay}ms"
           data-id="${safeId}"
           data-status="${safeStatus}"
           aria-label="${safeBrand} ${safeName} — ${safeStatus}">
    <div class="wc-img-wrap">
      ${imgContent}
      <span class="wc-badge ${statusClass}" aria-label="Statut: ${safeStatus}">${safeStatus}</span>
      ${watch.promo ? `<span class="wc-promo-badge">${escapeHtml(watch.promo)}</span>` : ''}
      <!-- Bouton favori : visible pour tous, action réservée aux connectés -->
      <button class="wc-fav-btn ${isFav ? 'is-fav' : ''}"
              data-watch-id="${safeId}"
              aria-label="${escapeHtml(favLabel)}">
        <svg class="heart-empty"  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        <svg class="heart-filled" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      </button>
    </div>
    <div class="wc-body">
      <div class="wc-brand">${safeBrand}</div>
      <h3 class="wc-name">${safeName}</h3>
      <div class="wc-sep" aria-hidden="true"></div>
      <p class="wc-desc">${safeDesc}</p>
      <div class="wc-footer">
        <span class="wc-price">${safePrice}</span>
        ${isVendu
          ? `<span class="wc-btn" aria-disabled="true" style="cursor:default"><span>Vendu</span></span>`
          : `<a href="${escapeHtml(buildWhatsAppURL(watch))}"
               class="wc-btn"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Contacter via WhatsApp pour ${safeBrand} ${safeName}">
               ${btnContent}
             </a>`
        }
      </div>
    </div>
  </article>`;
}

// Observer pour les révélations des cartes au scroll
const wcObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      wcObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

function renderWatches(filter) {
  const grid    = document.getElementById('nouv-grid');
  const countEl = document.getElementById('nouv-count');
  if (!grid) return;

  let filtered = filter === 'all'
    ? watchesCache
    : watchesCache.filter(w => w.status === filter);

  // Tri par displayOrder (ordre défini dans l'admin)
  filtered = [...filtered].sort((a, b) => {
    const aO = a.displayOrder ?? Infinity;
    const bO = b.displayOrder ?? Infinity;
    if (aO !== bO) return aO - bO;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Page d'accueil : affichage limité à 6 montres
  filtered = filtered.slice(0, 6);

  // Compteur disponibles (sur l'ensemble du catalogue)
  const disponibles = watchesCache.filter(w => w.status === 'Disponible').length;
  if (countEl) countEl.textContent = `${disponibles} disponible${disponibles > 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="nouv-empty"><p>Aucune montre dans cette catégorie pour le moment.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map((w, i) => buildCard(w, i)).join('');
  grid.querySelectorAll('.wc-sr').forEach(el => wcObserver.observe(el));
}

function filterWatches(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.nouv-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderWatches(filter);
}

/**
 * Bascule entre vue 1 colonne et vue 2 colonnes.
 * Persiste le choix dans localStorage.
 */
function setNouveautesView(view, btn) {
  const grid = document.getElementById('nouv-grid');
  if (!grid) return;

  grid.classList.remove('view-1', 'view-2');
  grid.classList.add(view);

  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  try { localStorage.setItem('xciv_view', view); } catch {}
}

/** Restaure la vue enregistrée au chargement. */
function restoreNouveautesView() {
  try {
    const saved = localStorage.getItem('xciv_view') || 'view-2';
    const grid  = document.getElementById('nouv-grid');
    const btn   = document.querySelector(`.view-btn[data-view="${saved}"]`);
    if (grid) { grid.classList.remove('view-1', 'view-2'); grid.classList.add(saved); }
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  } catch {}
}

/**
 * Charge toutes les montres depuis l'API et déclenche le rendu.
 */
async function loadWatches() {
  const grid = document.getElementById('nouv-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="nouv-empty"><p>Chargement du catalogue…</p></div>`;

  try {
    const res  = await fetch(API_BASE);
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Erreur API');

    watchesCache = json.data;
    renderWatches(currentFilter);

  } catch (err) {
    console.error('[API] Impossible de charger les montres :', err);
    grid.innerHTML = `<div class="nouv-empty"><p>Impossible de charger le catalogue. Vérifiez que le serveur est démarré.</p></div>`;
  }
}


// ═══════════════════════════════════════════
//  9. ADMIN PANEL — CRUD
// ═══════════════════════════════════════════

let adminPanelOpen = false;
let editingId      = null; // null = ajout, number = modification

// ── Ouverture / fermeture du panneau ────────────────────────

function toggleAdminPanel() {
  adminPanelOpen ? closeAdminPanel() : openAdminPanel();
}

function openAdminPanel() {
  adminPanelOpen = true;
  document.getElementById('adminPanel').classList.add('open');
  document.getElementById('adminOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderAdminList();
}

function closeAdminPanel() {
  adminPanelOpen = false;
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('adminOverlay').classList.remove('open');
  document.body.style.overflow = '';
  resetAdminForm();
}

// ── Formulaire ───────────────────────────────────────────────

function resetAdminForm() {
  editingId = null;
  document.getElementById('editId').value      = '';
  document.getElementById('fName').value        = '';
  document.getElementById('fBrand').value       = '';
  document.getElementById('fPrice').value       = '';
  document.getElementById('fYear').value        = '';
  document.getElementById('fStatus').value      = 'Disponible';
  document.getElementById('fDescription').value = '';
  document.getElementById('fImage').value       = '';
  document.getElementById('fWhatsapp').value    = '';
  document.getElementById('formTitle').textContent      = 'Ajouter une montre';
  document.getElementById('formSubmitBtn').textContent  = 'Ajouter';
}

function populateEditForm(watch) {
  editingId = watch.id;
  document.getElementById('editId').value       = watch.id;
  document.getElementById('fName').value         = watch.name        || '';
  document.getElementById('fBrand').value        = watch.brand       || '';
  document.getElementById('fPrice').value        = watch.price       || '';
  document.getElementById('fYear').value         = watch.year        || '';
  document.getElementById('fStatus').value       = watch.status      || 'Disponible';
  document.getElementById('fDescription').value  = watch.description || '';
  document.getElementById('fImage').value        = watch.image       || '';
  document.getElementById('fWhatsapp').value     = watch.whatsapp    || '';
  document.getElementById('formTitle').textContent     = 'Modifier la montre';
  document.getElementById('formSubmitBtn').textContent = 'Enregistrer';

  // Scroll vers le formulaire
  document.getElementById('adminForm').scrollIntoView({ behavior: 'smooth' });
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const btn = document.getElementById('formSubmitBtn');
  btn.disabled    = true;
  btn.textContent = 'En cours…';

  const payload = {
    name:        document.getElementById('fName').value.trim(),
    brand:       document.getElementById('fBrand').value.trim(),
    price:       document.getElementById('fPrice').value.trim()       || 'Sur demande',
    year:        document.getElementById('fYear').value               || null,
    status:      document.getElementById('fStatus').value,
    description: document.getElementById('fDescription').value.trim(),
    image:       document.getElementById('fImage').value.trim(),
    whatsapp:    document.getElementById('fWhatsapp').value.trim()    || '33601918798',
    message:     `Bonjour, je suis intéressé(e) par la ${document.getElementById('fBrand').value.trim()} ${document.getElementById('fName').value.trim()}.`
  };

  try {
    const isEdit = editingId !== null;
    const url    = isEdit ? `${API_BASE}/${editingId}` : API_BASE;
    const method = isEdit ? 'PUT' : 'POST';

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    // Rechargement du catalogue
    await loadWatches();
    renderAdminList();
    resetAdminForm();

    showAdminToast(isEdit ? 'Montre modifiée ✓' : 'Montre ajoutée ✓');

  } catch (err) {
    console.error('[Admin] Erreur sauvegarde :', err);
    showAdminToast('Erreur : ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = editingId !== null ? 'Enregistrer' : 'Ajouter';
  }
}

// ── Liste admin ──────────────────────────────────────────────

function renderAdminList() {
  const list    = document.getElementById('adminList');
  const countEl = document.getElementById('adminListCount');
  if (!list) return;

  if (countEl) countEl.textContent = `${watchesCache.length} montre${watchesCache.length > 1 ? 's' : ''}`;

  if (watchesCache.length === 0) {
    list.innerHTML = `<div class="admin-loading">Aucune montre dans le catalogue.</div>`;
    return;
  }

  list.innerHTML = watchesCache.map(w => {
    const sid = parseInt(w.id, 10);
    return `
    <div class="admin-item" data-id="${sid}">
      <div class="admin-item-info">
        <div class="admin-item-name">${escapeHtml(w.brand)} ${escapeHtml(w.name)}</div>
        <div class="admin-item-status admin-status-${escapeHtml(getStatusClass(w.status))}">${escapeHtml(w.status)}</div>
      </div>
      <div class="admin-item-actions">
        <button class="admin-edit-btn"   data-action="edit"   data-id="${sid}" title="Modifier">✎</button>
        <button class="admin-delete-btn" data-action="delete" data-id="${sid}" title="Supprimer">✕</button>
      </div>
    </div>`;
  }).join('');
}

async function editWatch(id) {
  const watch = watchesCache.find(w => w.id === id);
  if (watch) populateEditForm(watch);
}

async function deleteWatch(id) {
  const watch = watchesCache.find(w => w.id === id);
  if (!watch) return;

  if (!confirm(`Supprimer "${watch.brand} ${watch.name}" ?\nCette action est irréversible.`)) return;

  try {
    const res  = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    const json = await res.json();

    if (!json.success) throw new Error(json.error);

    await loadWatches();
    renderAdminList();
    showAdminToast('Montre supprimée ✓');

  } catch (err) {
    console.error('[Admin] Erreur suppression :', err);
    showAdminToast('Erreur : ' + err.message, true);
  }
}

// editWatch and deleteWatch are called from dynamically generated HTML (renderAdminList)
window.editWatch   = editWatch;
window.deleteWatch = deleteWatch;

// ── Toast notification ───────────────────────────────────────

function showAdminToast(message, isError = false) {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `admin-toast ${isError ? 'admin-toast-error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Affiche avec animation
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}


// ═══════════════════════════════════════════
//  AUTH — État de session & favoris
// ═══════════════════════════════════════════

let currentUser  = null;   // utilisateur connecté (ou null)
let favoriteIds  = new Set(); // IDs des montres en favori

/**
 * Charge la session depuis l'API.
 * N'affiche JAMAIS d'erreur technique — silencieux en cas d'échec.
 */
async function initAuth() {
  try {
    const res  = await fetch('/api/user/session', { credentials: 'same-origin' });
    const json = await res.json();
    currentUser = json.user || null;
  } catch {
    currentUser = null; // réseau ou serveur KO → site reste fonctionnel
  }
  updateNavAuth();

  // Si connecté → charge les favoris
  if (currentUser) {
    await loadFavoriteIds();
  }
}

/** Met à jour la navbar et le menu mobile selon l'état de connexion. */
function updateNavAuth() {
  const navLogin      = document.getElementById('navLogin');
  const navUserMenu   = document.getElementById('navUserMenu');
  const navUserName   = document.getElementById('navUserName');
  const navAdminBadge = document.getElementById('navAdminBadge');
  const mobileAuth    = document.getElementById('mobileNavAuth');
  const adminFab      = document.getElementById('adminFab');

  if (!currentUser) {
    // Visiteur non connecté — FAB invisible
    if (navLogin)      navLogin.style.display      = '';
    if (navUserMenu)   navUserMenu.style.display    = 'none';
    if (navAdminBadge) navAdminBadge.style.display  = 'none';
    if (adminFab)      adminFab.style.display       = 'none';
    if (mobileAuth) {
      mobileAuth.innerHTML = `<a href="/connexion">Mon compte</a>`;
    }
    return;
  }

  if (currentUser.role === 'admin') {
    // Admin connecté — FAB visible
    if (navLogin)      navLogin.style.display      = 'none';
    if (navUserMenu)   navUserMenu.style.display    = 'none';
    if (navAdminBadge) navAdminBadge.style.display  = '';
    if (adminFab)      adminFab.style.display       = '';
    document.body.classList.add('has-admin-fab');
    if (mobileAuth) {
      mobileAuth.innerHTML = `<a href="/admin/dashboard">Dashboard</a>`;
    }
  } else {
    // Utilisateur standard — FAB invisible
    const prenom = currentUser.name.split(' ')[0];
    if (navLogin)      navLogin.style.display      = 'none';
    if (navAdminBadge) navAdminBadge.style.display  = 'none';
    if (adminFab)      adminFab.style.display       = 'none';
    if (navUserMenu)   navUserMenu.style.display    = 'flex';
    if (navUserName)   navUserName.textContent      = prenom;
    if (mobileAuth) {
      mobileAuth.innerHTML =
        `<a href="/mon-espace">Mon espace</a>
         <button class="mobile-nav-logout">Déconnexion</button>`;
      mobileAuth.querySelector('.mobile-nav-logout').addEventListener('click', () => {
        logoutUser();
        closeMobile();
      });
    }
  }

  // ── Mobile (≤ 900px) : icône compte toujours visible, destination correcte ──
  // Le CSS force display:flex sur #navLogin via !important — ici on met à jour
  // le href pour qu'il pointe vers la bonne page selon le rôle.
  if (currentUser && window.matchMedia('(max-width: 900px)').matches && navLogin) {
    const dest  = currentUser.role === 'admin' ? '/admin/dashboard' : '/mon-espace';
    const label = currentUser.role === 'admin' ? 'Dashboard admin'  : 'Mon espace';
    navLogin.setAttribute('href', dest);
    navLogin.setAttribute('aria-label', label);
  }
}

/** Charge les IDs des favoris (léger). */
async function loadFavoriteIds() {
  if (!currentUser) return;
  try {
    const res  = await fetch('/api/favorites/ids', { credentials: 'same-origin' });
    const json = await res.json();
    if (json.success) {
      favoriteIds = new Set(json.ids);
      // Met à jour les boutons déjà affichés
      refreshFavButtons();
    }
  } catch { /* silencieux */ }
}

/** Met à jour l'état visuel de tous les boutons favoris affichés. */
function refreshFavButtons() {
  document.querySelectorAll('.wc-fav-btn').forEach(btn => {
    const id = parseInt(btn.dataset.watchId, 10);
    btn.classList.toggle('is-fav', favoriteIds.has(id));
  });
}

/**
 * Toggle favori.
 * Si non connecté → ouvre la modal d'invitation.
 */
async function toggleFavorite(watchId, btn) {
  if (!currentUser) {
    openAuthModal();
    return;
  }

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
      showPubToast('Ajouté à vos favoris');
    } else {
      favoriteIds.delete(watchId);
      btn.classList.remove('is-fav');
      showPubToast('Retiré des favoris');
    }
  } catch {
    showPubToast('Une erreur est survenue');
  } finally {
    btn.disabled = false;
    setTimeout(() => btn.classList.remove('pulse'), 500);
  }
}
window.toggleFavorite = toggleFavorite;

/** Déconnexion utilisateur. */
async function logoutUser() {
  try {
    await fetch('/api/user/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    currentUser = null;
    favoriteIds.clear();
    updateNavAuth();
    renderWatches(currentFilter); // redessine les cartes (retire les cœurs remplis)
    showPubToast('Vous êtes déconnecté(e)');
  }
}

// ─── Modal auth ──────────────────────────────────────────────

function openAuthModal() {
  const overlay = document.getElementById('authModal');
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal(event) {
  // Ferme si clic sur l'overlay ou le bouton close
  if (event && event.target !== event.currentTarget &&
      !event.target.closest('.auth-modal-close')) return;
  const overlay = document.getElementById('authModal');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Ferme la modal avec Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAuthModal({ target: document.getElementById('authModal') });
});

// ─── Toast public ─────────────────────────────────────────────

function showPubToast(message) {
  let toast = document.getElementById('pubToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id        = 'pubToast';
    toast.className = 'pub-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}


// ─── Formulaire de contact ────────────────────────────────────

function sendContactWhatsApp(e) {
  e.preventDefault();
  const nom     = (document.getElementById('cfNom').value     || '').trim();
  const email   = (document.getElementById('cfEmail').value   || '').trim();
  const message = (document.getElementById('cfMessage').value || '').trim();
  if (!nom || !email || !message) return;
  const text = encodeURIComponent(
    `Bonjour Maison XCIV,\n\nNom : ${nom}\nEmail : ${email}\n\nMessage :\n${message}`
  );
  window.open(`https://wa.me/33601918798?text=${text}`, '_blank');
}

function sendContactInstagram() {
  const nom     = (document.getElementById('cfNom').value     || '').trim();
  const email   = (document.getElementById('cfEmail').value   || '').trim();
  const message = (document.getElementById('cfMessage').value || '').trim();
  if (!nom || !email || !message) {
    document.getElementById('cfNom').reportValidity?.();
    return;
  }
  window.open('https://instagram.com/maisonxciv', '_blank');
}

// ═══════════════════════════════════════════
//  INIT — Lancement au chargement de la page
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // ── Mobile nav — fermeture au clic sur un lien ──────────────
  document.getElementById('mobileNav').addEventListener('click', e => {
    if (e.target.tagName === 'A') closeMobile();
  });

  // ── Délégation : boutons favoris dans la grille Nouveautés ───
  document.getElementById('nouv-grid').addEventListener('click', e => {
    const btn = e.target.closest('.wc-fav-btn');
    if (btn) toggleFavorite(parseInt(btn.dataset.watchId, 10), btn);
  });

  // ── Délégation : boutons Modifier / Supprimer dans l'admin panel ─
  const adminList = document.getElementById('adminList');
  if (adminList) {
    adminList.addEventListener('click', e => {
      const editBtn = e.target.closest('[data-action="edit"]');
      const delBtn  = e.target.closest('[data-action="delete"]');
      if (editBtn) editWatch(Number(editBtn.dataset.id));
      if (delBtn)  deleteWatch(Number(delBtn.dataset.id));
    });
  }

  // ── Nav logout ───────────────────────────────────────────────
  const navLogoutBtn = document.querySelector('.nav-logout-btn');
  if (navLogoutBtn) navLogoutBtn.addEventListener('click', logoutUser);

  // ── Hamburger ────────────────────────────────────────────────
  document.getElementById('hamburger').addEventListener('click', () => {
    console.log('[XCIV] hamburger tap → toggleMobile()');
    toggleMobile();
  });

  // ── Auth modal ───────────────────────────────────────────────
  document.getElementById('authModal').addEventListener('click', closeAuthModal);
  document.querySelector('.auth-modal-close').addEventListener('click', () => closeAuthModal({ target: document.getElementById('authModal'), currentTarget: document.getElementById('authModal') }));

  // ── Watch dots ───────────────────────────────────────────────
  document.querySelectorAll('.watch-dot').forEach(dot => {
    dot.addEventListener('click', () => goToWatch(parseInt(dot.dataset.index, 10)));
  });

  // ── Filtre montres ───────────────────────────────────────────
  document.querySelectorAll('.nouv-filter-btn').forEach(btn => {
    btn.addEventListener('click', function () { filterWatches(this.dataset.filter, this); });
  });

  // ── Sélecteur de vue ─────────────────────────────────────────
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      console.log('[XCIV] view-btn tap →', this.dataset.view);
      setNouveautesView(this.dataset.view, this);
    });
  });

  // ── Formulaire contact WhatsApp ──────────────────────────────
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) contactForm.addEventListener('submit', sendContactWhatsApp);

  // ── Formulaire contact Instagram ─────────────────────────────
  const igBtn = document.querySelector('.contact-form-btn--ig');
  if (igBtn) igBtn.addEventListener('click', sendContactInstagram);

  // ── Admin FAB ────────────────────────────────────────────────
  const adminFab = document.getElementById('adminFab');
  if (adminFab) adminFab.addEventListener('click', toggleAdminPanel);

  // ── Admin overlay + close ────────────────────────────────────
  const adminOverlay = document.getElementById('adminOverlay');
  if (adminOverlay) adminOverlay.addEventListener('click', closeAdminPanel);
  const adminClose = document.querySelector('.admin-close');
  if (adminClose) adminClose.addEventListener('click', closeAdminPanel);
  const adminCancel = document.querySelector('.admin-btn-cancel');
  if (adminCancel) adminCancel.addEventListener('click', resetAdminForm);

  // ── Admin form ───────────────────────────────────────────────
  const adminForm = document.getElementById('adminForm');
  if (adminForm) adminForm.addEventListener('submit', handleFormSubmit);

  console.log('[XCIV] script.js v3 chargé — DOMContentLoaded OK');
  restoreNouveautesView(); // restaure la vue choisie par l'utilisateur
  await initAuth();        // charge session + favoris en premier
  loadWatches();           // puis le catalogue (buildCard utilisera favoriteIds)

  // ── WhatsApp FAB — apparaît après le hero ─────────────────────
  const waFab = document.getElementById('waFab');
  if (waFab) {
    const heroH = document.getElementById('hero')?.offsetHeight || 400;
    const onScroll = () => {
      waFab.classList.toggle('visible', window.scrollY > heroH * 0.6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});
