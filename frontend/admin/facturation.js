/**
 * facturation.js — Maison XCIV Admin
 * ────────────────────────────────────────────────────────────────
 * Module de gestion des factures complet :
 *  - Tableau de bord (stats, liste, filtres)
 *  - Création / édition / suppression / duplication
 *  - Aperçu PDF live + génération PDF
 *  - Vue clients avec synthèse financière
 */

/* ─── SVG Logo Maison XCIV (inliné pour le PDF) ──────────────── */
const XCIV_SVG = `<svg class="inv-logo-svg" version="1.0" xmlns="http://www.w3.org/2000/svg"
  viewBox="0 390 1107 450" preserveAspectRatio="xMinYMid meet" aria-label="Maison XCIV">
  <g transform="translate(0.000000,1212.000000) scale(0.100000,-0.100000)" fill="#0D0C0B" stroke="none">
    <path d="M5465 8181 c-79 -10 -131 -28 -182 -63 -51 -34 -70 -60 -84 -112 -18 -65 -3 -122 41 -165 53 -52 98 -62 295 -71 195 -8 229 -19 243 -73 16 -58 -11 -112 -73 -145 -45 -25 -261 -24 -333 2 -62 21 -122 69 -122 97 0 46 -28 3 -77 -117 -2 -7 11 -14 34 -17 21 -2 67 -17 103 -33 63 -28 70 -29 226 -29 l161 0 69 35 c89 46 127 102 127 188 0 68 -20 111 -68 148 -51 38 -130 54 -280 54 -71 0 -146 5 -166 10 -117 33 -100 142 29 190 48 18 73 21 157 18 119 -4 185 -30 212 -82 l16 -31 33 70 c18 39 33 75 33 80 1 6 -16 11 -36 11 -21 0 -65 7 -98 16 -75 21 -182 28 -260 19z"/>
    <path d="M6400 8179 c-121 -20 -228 -96 -277 -198 -25 -51 -28 -66 -28 -166 0 -102 2 -114 29 -168 58 -114 164 -182 307 -196 243 -25 412 57 475 231 21 58 20 199 -1 263 -41 121 -144 206 -282 230 -88 16 -143 17 -223 4z m263 -113 c68 -33 112 -84 132 -150 46 -153 -18 -315 -143 -363 -58 -22 -218 -25 -276 -4 -62 22 -133 94 -151 154 -42 142 6 301 109 354 100 52 234 56 329 9z"/>
    <path d="M2643 8162 c15 -17 17 -56 17 -353 0 -247 -3 -338 -12 -347 -9 -9 4 -12 62 -12 58 0 71 3 62 12 -9 9 -12 88 -12 297 1 260 2 284 16 266 9 -11 74 -137 146 -280 71 -143 133 -263 137 -268 4 -4 72 121 150 278 79 157 147 285 152 285 5 0 9 -125 9 -277 0 -243 -2 -279 -17 -295 -15 -17 -13 -18 72 -18 85 0 87 1 72 18 -15 17 -17 55 -17 345 0 276 2 328 15 341 8 8 15 17 15 20 0 3 -52 6 -117 6 -111 0 -115 -1 -100 -18 16 -17 14 -24 -27 -103 -128 -243 -195 -364 -202 -363 -11 2 -26 28 -140 255 -70 139 -93 194 -85 202 23 23 8 27 -101 27 -107 0 -110 -1 -95 -18z"/>
    <path d="M4021 8162 c14 -22 15 -19 -223 -537 -33 -71 -66 -137 -74 -146 -8 -8 -14 -19 -14 -22 0 -4 33 -7 74 -7 69 0 74 1 69 20 -6 24 42 150 65 168 11 8 67 12 197 12 209 0 196 5 241 -99 23 -52 25 -66 16 -82 -12 -18 -8 -19 79 -19 88 0 91 1 70 18 -31 25 -324 640 -325 680 l0 32 -93 0 c-87 0 -92 -1 -82 -18z m109 -148 c51 -100 127 -270 123 -276 -6 -11 -281 -10 -287 0 -8 13 127 313 139 309 5 -2 17 -17 25 -33z"/>
    <path d="M4756 8153 c11 -23 14 -90 14 -350 0 -204 -4 -324 -10 -328 -24 -15 -5 -23 63 -28 83 -6 95 -2 72 23 -14 15 -15 57 -13 346 2 181 7 337 12 347 7 15 1 17 -72 17 l-81 0 15 -27z"/>
    <path d="M7180 8171 c0 -5 6 -11 13 -13 18 -7 18 -668 -1 -691 -12 -13 -5 -16 55 -19 74 -4 92 2 68 22 -13 11 -15 53 -15 296 0 232 2 284 13 284 8 0 88 -84 178 -186 360 -410 341 -386 319 -399 -23 -14 2 -20 75 -17 57 3 74 7 66 15 -15 15 -16 683 -1 692 26 16 4 25 -61 25 -64 0 -70 -2 -63 -17 5 -10 10 -132 12 -270 3 -279 2 -284 -53 -214 -16 21 -109 127 -205 236 -213 240 -206 231 -190 250 11 13 -1 15 -99 15 -61 0 -111 -4 -111 -9z"/>
    <path d="M4485 7095 c-434 -65 -764 -300 -896 -639 -82 -212 -77 -528 12 -736 153 -358 502 -571 1005 -612 127 -11 163 -10 277 5 214 27 413 92 666 216 68 34 134 61 147 61 28 0 54 10 54 20 0 5 -52 93 -115 197 -94 153 -120 188 -138 188 -19 0 -23 -6 -27 -53 -4 -41 -12 -59 -35 -82 -89 -88 -310 -176 -526 -210 -103 -17 -354 -8 -439 15 -210 56 -387 190 -470 355 -50 100 -64 163 -64 295 1 102 5 132 27 200 71 214 263 381 512 446 126 33 302 37 445 10 196 -38 378 -109 437 -173 11 -12 26 -42 32 -65 19 -72 37 -59 141 105 51 81 113 177 137 213 25 39 41 73 37 82 -9 23 -35 29 -54 12 -25 -22 -56 -19 -150 18 -149 59 -376 115 -550 136 -113 15 -354 12 -465 -4z"/>
    <path d="M981 7072 c-14 -27 -1 -40 55 -57 100 -29 92 -21 465 -495 288 -366 319 -406 319 -419 0 -5 -109 -149 -242 -318 -134 -170 -288 -366 -343 -436 -106 -136 -147 -167 -217 -167 -37 0 -53 -17 -42 -44 4 -11 64 -14 322 -18 174 -2 327 -2 340 0 34 6 30 48 -7 67 -53 27 -49 71 11 149 97 125 381 477 390 482 5 4 18 -2 28 -12 38 -38 382 -490 401 -526 22 -44 13 -79 -28 -97 -17 -8 -23 -18 -21 -34 l3 -22 345 -5 c190 -3 356 -2 370 1 18 4 25 12 25 29 0 19 -9 26 -42 37 -50 17 -122 78 -165 142 -18 25 -82 109 -142 186 -369 468 -491 627 -494 638 -3 13 79 117 431 552 185 228 231 281 262 298 11 6 49 15 85 21 60 10 65 13 65 36 l0 25 -375 0 -375 0 0 -25 c0 -20 8 -27 45 -40 41 -14 45 -19 45 -47 0 -27 -35 -76 -199 -283 -109 -138 -203 -249 -210 -247 -19 6 -344 417 -367 464 -26 53 -17 83 29 107 32 17 45 38 36 61 -5 13 -59 15 -400 15 -369 0 -394 -1 -403 -18z"/>
    <path d="M6357 7083 c-18 -17 -4 -44 33 -63 21 -11 44 -29 50 -39 16 -31 14 -1728 -3 -1761 -7 -14 -28 -30 -47 -36 -39 -13 -60 -38 -45 -53 8 -7 541 -18 603 -12 6 0 12 12 12 26 0 19 -9 28 -45 44 l-45 20 2 893 3 893 43 20 c36 17 42 24 40 45 l-3 25 -296 3 c-162 1 -298 -1 -302 -5z"/>
    <path d="M7377 7083 c-4 -3 -7 -17 -7 -30 0 -19 10 -28 48 -44 26 -11 58 -30 71 -42 25 -24 70 -109 130 -246 21 -47 137 -300 258 -561 121 -261 266 -576 323 -699 l103 -224 -23 -42 c-42 -77 -47 -75 270 -75 l280 0 0 28 c0 15 -7 36 -15 46 -8 11 -15 30 -15 43 0 12 47 125 104 250 57 125 146 323 199 438 287 633 458 1001 480 1034 16 23 43 47 72 60 37 17 46 26 43 44 l-3 22 -322 3 -323 2 0 -29 c0 -23 5 -30 28 -36 46 -11 72 -33 72 -61 0 -14 -91 -222 -202 -462 -111 -241 -231 -502 -268 -582 -79 -170 -118 -250 -125 -250 -3 0 -26 44 -51 98 -144 302 -231 489 -274 582 -26 58 -94 202 -150 320 -56 118 -106 230 -112 249 -13 46 -3 78 31 95 31 17 43 38 35 61 -5 13 -51 15 -328 15 -178 0 -326 -3 -329 -7z"/>
  </g>
</svg>`;

/* ─── État global ─────────────────────────────────────────────── */
let currentView       = 'list';
let editingInvoiceId  = null;
let pendingDeleteId   = null;
let currentPDFInvoice = null;
let filterDebounce    = null;

/* ─── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await verifyAdminSession();
  buildAndInjectTemplate('invoiceTemplate',    'prev');
  buildAndInjectTemplate('pdfInvoiceTemplate', 'pdf');
  bindFormPreview();

  // ── Header dynamique — délégation pour boutons injectés par updateHeader()
  document.getElementById('pageHeader').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'export-csv')   exportCSV();
    else if (action === 'create-invoice')               openCreateForm();
    else if (action === 'back-to-list' || action === 'cancel-form') showView('list');
    else if (action === 'save-form')                    handleFormSubmit();
  });

  // ── Sidebar nav ────────────────────────────────────────────
  document.getElementById('nav-factures')?.addEventListener('click', e => { e.preventDefault(); showView('list'); });
  document.getElementById('nav-clients')?.addEventListener('click', e => { e.preventDefault(); showView('clients'); });
  document.querySelector('.sidebar-logout')?.addEventListener('click', logout);

  // ── Mobile sidebar ─────────────────────────────────────────
  document.querySelector('.sidebar-toggle-btn')?.addEventListener('click', toggleMobileSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobileSidebar);
  // Fermeture automatique sur clic d'un lien sidebar (navigation externe)
  document.querySelectorAll('.sidebar-link[href]:not([href="#"])').forEach(link => {
    link.addEventListener('click', () => { if (window.innerWidth <= 600) closeMobileSidebar(); });
  });

  // ── Filtres ────────────────────────────────────────────────
  document.getElementById('filterSearch')?.addEventListener('input', debounceFilters);
  document.getElementById('filterStatus')?.addEventListener('change', applyFilters);
  document.getElementById('filterPayStatus')?.addEventListener('change', applyFilters);
  document.getElementById('filterDateFrom')?.addEventListener('change', applyFilters);
  document.getElementById('filterDateTo')?.addEventListener('change', applyFilters);
  document.getElementById('resetFiltersBtn')?.addEventListener('click', resetFilters);

  // ── Empty state ────────────────────────────────────────────
  document.getElementById('createFirstInvoiceBtn')?.addEventListener('click', openCreateForm);

  // ── Tableau des factures — délégation pour boutons d'action
  document.getElementById('invoicesTableBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id     = Number(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'preview-pdf')       openPDFModal(id);
    else if (action === 'edit-invoice')       openEditForm(id);
    else if (action === 'duplicate-invoice')  duplicateInvoice(id);
    else if (action === 'delete-invoice')     openDeleteModal(id, btn.dataset.number);
  });

  // ── Tableau des clients — délégation (lignes + bouton nouvelle facture)
  document.getElementById('clientsTableBody').addEventListener('click', e => {
    const prefillBtn = e.target.closest('[data-action="prefill-client"]');
    if (prefillBtn) { e.stopPropagation(); prefillClient(Number(prefillBtn.dataset.idx)); return; }
    const row = e.target.closest('[data-action="open-client-modal"]');
    if (row) openClientModal(Number(row.dataset.idx));
  });

  // ── Modal client — délégation pour bouton Modifier dans la liste des factures
  document.getElementById('clientModalInvoices').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="close-edit-invoice"]');
    if (btn) { closeClientModal(); openEditForm(Number(btn.dataset.id)); }
  });

  // ── Formulaire facture ─────────────────────────────────────
  document.getElementById('invoiceForm')?.addEventListener('submit', e => { e.preventDefault(); handleFormSubmit(); });
  document.getElementById('cancelFormBtn')?.addEventListener('click', () => showView('list'));
  document.getElementById('saveInvoiceBtn')?.addEventListener('click', handleFormSubmit);
  document.getElementById('generatePDFBtn')?.addEventListener('click', generatePDFFromForm);

  // ── Shipping toggle ────────────────────────────────────────
  document.getElementById('f_shippingSame')?.addEventListener('change', toggleShipping);

  // ── Recalcul montants ──────────────────────────────────────
  ['f_qty', 'f_unitPrice', 'f_tvaRate', 'f_deposit'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', recalculate);
  });

  // ── Modal suppression ──────────────────────────────────────
  document.getElementById('deleteModalCancelBtn')?.addEventListener('click', closeDeleteModal);
  document.getElementById('deleteModalConfirmBtn')?.addEventListener('click', confirmDelete);

  // ── Modal PDF ──────────────────────────────────────────────
  document.getElementById('pdfModalCloseBtn')?.addEventListener('click', closePDFModal);
  document.getElementById('pdfModalFooterCloseBtn')?.addEventListener('click', closePDFModal);
  document.getElementById('pdfDownloadBtn')?.addEventListener('click', downloadPDFFromModal);

  // ── Modal client ───────────────────────────────────────────
  document.getElementById('clientModalCloseBtn')?.addEventListener('click', closeClientModal);
  document.getElementById('clientModalFooterCloseBtn')?.addEventListener('click', closeClientModal);
  document.getElementById('clientModalNewInvoiceBtn')?.addEventListener('click', () => { closeClientModal(); openCreateForm(); });

  showView('list');
});

/* ─── Session admin ───────────────────────────────────────────── */
async function verifyAdminSession() {
  const check = async () => {
    const res = await fetch('/api/auth/verify', { credentials: 'include' });
    if (!res.ok) { window.location.href = '/admin/login'; return false; }
    return true;
  };
  try {
    await check();
  } catch {
    // Erreur réseau transitoire (iOS Safari, connexion instable) — réessai unique
    await new Promise(r => setTimeout(r, 800));
    try { await check(); } catch { window.location.href = '/admin/login'; }
  }
}

/* ─── Mobile sidebar ──────────────────────────────────────────── */
function toggleMobileSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const isOpen   = sidebar?.classList.toggle('mobile-open');
  overlay?.classList.toggle('show', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMobileSidebar() {
  document.querySelector('.sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════════════════════════
   GESTION DES VUES
═══════════════════════════════════════════════════════════════ */
async function showView(view) {
  currentView = view;

  // Cacher toutes les vues
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');

  // Mise à jour sidebar
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (view === 'list' || view === 'form') document.getElementById('nav-factures')?.classList.add('active');
  if (view === 'clients')                 document.getElementById('nav-clients')?.classList.add('active');

  // Mise à jour header + chargement données
  if (view === 'list') {
    updateHeader('list');
    await Promise.all([loadStats(), loadInvoices()]);
  } else if (view === 'form') {
    updateHeader('form');
  } else if (view === 'clients') {
    updateHeader('clients');
    await loadClientsSummary();
  }
}

function updateHeader(view, extra) {
  const h = document.getElementById('pageHeader');
  if (view === 'list') {
    h.innerHTML = `
      <div class="dash-header-left">
        <h1 class="dash-title">Facturation</h1>
        <p class="dash-subtitle">Gérez vos factures Maison XCIV</p>
      </div>
      <div class="dash-header-right">
        <button class="btn-secondary btn-sm" data-action="export-csv">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:6px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exporter CSV
        </button>
        <button class="dash-add-btn" data-action="create-invoice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle facture
        </button>
      </div>`;
  } else if (view === 'form') {
    const title = editingInvoiceId ? `Modifier la facture` : 'Nouvelle facture';
    h.innerHTML = `
      <div class="dash-header-left">
        <button class="btn-back" data-action="back-to-list">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="15 18 9 12 15 6"/></svg>
          Retour
        </button>
        <h1 class="dash-title" id="formTitle">${title}</h1>
      </div>
      <div class="dash-header-right">
        <button class="btn-secondary" data-action="cancel-form">Annuler</button>
        <button class="dash-add-btn" data-action="save-form">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
          Enregistrer
        </button>
      </div>`;
  } else if (view === 'clients') {
    h.innerHTML = `
      <div class="dash-header-left">
        <button class="btn-back" data-action="back-to-list">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="15 18 9 12 15 6"/></svg>
          Factures
        </button>
        <h1 class="dash-title">Clients</h1>
        <p class="dash-subtitle">Synthèse financière par client</p>
      </div>`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════════════ */
async function api(method, path, body) {
  const opts = { method, credentials: 'include', headers: {} };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch('/api/admin/invoices' + path, opts);
  return res.json();
}

async function loadStats() {
  try {
    const r = await api('GET', '/stats');
    if (r.success) renderStats(r.data);
  } catch (err) { console.error('stats:', err); }
}

async function loadInvoices(params) {
  try {
    const qs  = params ? '?' + new URLSearchParams(params).toString() : '';
    const r   = await api('GET', qs);
    if (r.success) renderInvoiceTable(r.data);
  } catch (err) {
    console.error('invoices:', err);
    document.getElementById('invoicesTableBody').innerHTML =
      `<tr><td colspan="8" class="table-error">Erreur de chargement.</td></tr>`;
  }
}

async function loadClientsSummary() {
  try {
    const r = await api('GET', '/clients-summary');
    if (r.success) renderClientsView(r.data);
  } catch (err) { console.error('clients:', err); }
}

async function getNextNumber() {
  try {
    const r = await api('GET', '/next-number');
    return r.success ? r.number : `XCIV-${new Date().getFullYear()}-001`;
  } catch { return `XCIV-${new Date().getFullYear()}-001`; }
}

/* ═══════════════════════════════════════════════════════════════
   RENDU — LISTE DES FACTURES
═══════════════════════════════════════════════════════════════ */
function renderStats(s) {
  setText('stat-total',   s.total);
  setText('stat-volume',  formatCurrency(s.totalTTC));
  setText('stat-paid',    formatCurrency(s.totalPaid));
  setText('stat-pending', formatCurrency(s.totalPending));
}

function renderInvoiceTable(invoices) {
  const tbody  = document.getElementById('invoicesTableBody');
  const empty  = document.getElementById('emptyState');

  if (!invoices.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = invoices.map(inv => {
    const client = `${inv.client.firstName} ${inv.client.lastName}`.trim() || '—';
    const product = inv.product.brand
      ? `${inv.product.brand} ${inv.product.model}`.trim()
      : inv.product.description || '—';
    return `<tr class="invoice-row">
      <td class="td-number" data-label="N°"><strong>${esc(inv.number)}</strong></td>
      <td class="td-date" data-label="Date">${formatDate(inv.created_at)}</td>
      <td class="td-client" data-label="Client">${esc(client)}</td>
      <td class="td-product" data-label="Montre">${esc(product)}</td>
      <td class="td-amount" data-label="Montant">${formatCurrency(inv.financial.totalTTC)}</td>
      <td data-label="Statut">${statusBadge(inv.status)}</td>
      <td data-label="Paiement">${payBadge(inv.financial.paymentStatus)}</td>
      <td class="td-actions">
        <button class="btn-icon" title="Aperçu PDF" data-action="preview-pdf" data-id="${inv.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="btn-icon" title="Modifier" data-action="edit-invoice" data-id="${inv.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon" title="Dupliquer" data-action="duplicate-invoice" data-id="${inv.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="btn-icon btn-icon-danger" title="Supprimer" data-action="delete-invoice" data-id="${inv.id}" data-number="${esc(inv.number)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   RENDU — CLIENTS
═══════════════════════════════════════════════════════════════ */
function renderClientsView(clients) {
  const totalVolume    = clients.reduce((s, c) => s + c.totalTTC, 0);
  const totalPaid      = clients.reduce((s, c) => s + c.totalPaid, 0);
  const totalRemaining = clients.reduce((s, c) => s + c.totalRemaining, 0);

  setText('cstat-total',     clients.length);
  setText('cstat-volume',    formatCurrency(totalVolume));
  setText('cstat-paid',      formatCurrency(totalPaid));
  setText('cstat-remaining', formatCurrency(totalRemaining));

  const tbody = document.getElementById('clientsTableBody');
  const empty = document.getElementById('clientEmptyState');

  if (!clients.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = clients.map((c, i) => `
    <tr class="invoice-row" data-action="open-client-modal" data-idx="${i}" data-client-idx="${i}" style="cursor:pointer">
      <td><strong>${esc(c.name)}</strong></td>
      <td class="td-muted">${esc(c.email || '—')}</td>
      <td class="td-center"><span class="count-badge">${c.invoiceCount}</span></td>
      <td class="td-amount">${formatCurrency(c.totalTTC)}</td>
      <td class="td-amount td-green">${formatCurrency(c.totalPaid)}</td>
      <td class="td-amount ${c.totalRemaining > 0 ? 'td-orange' : ''}">${formatCurrency(c.totalRemaining)}</td>
      <td class="td-date">${formatDate(c.lastDate)}</td>
      <td class="td-actions">
        <button class="btn-icon" title="Nouvelle facture pour ce client" data-action="prefill-client" data-idx="${i}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </td>
    </tr>`).join('');

  // Stocker pour openClientModal
  window._clientsSummary = clients;
}

/* ─── Modal détail client ─────────────────────────────────────── */
function openClientModal(idx) {
  const c = window._clientsSummary?.[idx];
  if (!c) return;

  setText('clientModalName',  c.name);
  setText('clientModalEmail', c.email || c.phone || '');

  document.getElementById('clientModalStats').innerHTML = `
    <div class="client-modal-stat"><span>${c.invoiceCount}</span> factures</div>
    <div class="client-modal-stat client-stat-volume"><span>${formatCurrency(c.totalTTC)}</span> volume TTC</div>
    <div class="client-modal-stat client-stat-paid"><span>${formatCurrency(c.totalPaid)}</span> encaissé</div>
    <div class="client-modal-stat ${c.totalRemaining > 0 ? 'client-stat-pending' : ''}">
      <span>${formatCurrency(c.totalRemaining)}</span> reste
    </div>`;

  const tbody = document.getElementById('clientModalInvoices');
  tbody.innerHTML = c.invoices.map(inv => `
    <tr>
      <td><strong>${esc(inv.number)}</strong></td>
      <td class="td-date">${formatDate(inv.date)}</td>
      <td>${esc(inv.product || '—')}</td>
      <td class="td-amount">${formatCurrency(inv.totalTTC)}</td>
      <td>${statusBadge(inv.status)}</td>
      <td>${payBadge(inv.paymentStatus)}</td>
      <td class="td-actions">
        <button class="btn-icon" data-action="close-edit-invoice" data-id="${inv.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </td>
    </tr>`).join('');

  openModal('clientModal');
}
function closeClientModal() { closeModal('clientModal'); }

function prefillClient(idx) {
  const c = window._clientsSummary?.[idx];
  if (!c) return;
  // Ouvre formulaire avec client pré-rempli
  openCreateForm();
  setTimeout(() => {
    const parts = c.name.split(' ');
    setVal('f_firstName', parts[0] || '');
    setVal('f_lastName',  parts.slice(1).join(' ') || '');
    setVal('f_email', c.email || '');
    setVal('f_phone', c.phone || '');
    updatePreviewFromForm();
  }, 100);
}

/* ═══════════════════════════════════════════════════════════════
   FORMULAIRE
═══════════════════════════════════════════════════════════════ */
async function openCreateForm() {
  editingInvoiceId = null;
  resetForm();
  const nextNum = await getNextNumber();
  setVal('f_number', nextNum);
  setVal('f_date', today());
  setVal('f_tvaRate', '20');
  setVal('f_qty', '1');
  updatePreviewFromForm();
  showView('form');
}

async function openEditForm(id) {
  try {
    const r = await api('GET', `/${id}`);
    if (!r.success) { showToast('Facture introuvable.', 'error'); return; }
    editingInvoiceId = id;
    populateForm(r.data);
    showView('form');
    setTimeout(updatePreviewFromForm, 50);
  } catch { showToast('Erreur de chargement.', 'error'); }
}

function populateForm(inv) {
  setVal('f_number',        inv.number);
  setVal('f_date',          inv.created_at?.split('T')[0] || '');
  setVal('f_status',        inv.status);
  setVal('f_firstName',     inv.client.firstName);
  setVal('f_lastName',      inv.client.lastName);
  setVal('f_email',         inv.client.email);
  setVal('f_phone',         inv.client.phone);
  setVal('f_billingAddress',inv.client.billingAddress);
  document.getElementById('f_shippingSame').checked = inv.client.shippingSameAsBilling !== false;
  toggleShipping();
  setVal('f_shippingAddress', inv.client.shippingAddress);
  setVal('f_productDesc',   inv.product.description);
  setVal('f_brand',         inv.product.brand);
  setVal('f_model',         inv.product.model);
  setVal('f_reference',     inv.product.reference);
  setVal('f_year',          inv.product.year);
  setVal('f_serial',        inv.product.serialNumber);
  setVal('f_qty',           inv.product.quantity);
  setVal('f_unitPrice',     inv.product.unitPrice);
  setVal('f_tvaRate',       inv.financial.tvaRate);
  setVal('f_ht',            inv.financial.totalHT);
  setVal('f_tva',           inv.financial.tva);
  setVal('f_ttc',           inv.financial.totalTTC);
  setVal('f_deposit',       inv.financial.deposit || '');
  setVal('f_remaining',     inv.financial.remaining);
  setVal('f_paymentMethod', inv.financial.paymentMethod);
  setVal('f_paymentStatus', inv.financial.paymentStatus);
  setVal('f_paymentDate',   inv.financial.paymentDate || '');
  setVal('f_noteInternal',  inv.notes.internal);
  setVal('f_noteClient',    inv.notes.client);
}

function resetForm() {
  document.getElementById('invoiceForm').reset();
  setVal('f_date',     today());
  setVal('f_tvaRate',  '20');
  setVal('f_qty',      '1');
  setVal('f_ht',       '');
  setVal('f_tva',      '');
  setVal('f_ttc',      '');
  setVal('f_remaining','');
  document.getElementById('f_shippingSame').checked = true;
  toggleShipping();
}

function collectFormData() {
  const qty   = parseFloat(getVal('f_qty'))       || 1;
  const price = parseFloat(getVal('f_unitPrice'))  || 0;
  const tva   = parseFloat(getVal('f_tvaRate'))    || 20;
  const ht    = qty * price;
  const tvaAmt = ht * (tva / 100);
  const ttc   = ht + tvaAmt;
  const dep   = parseFloat(getVal('f_deposit'))    || 0;
  return {
    number: getVal('f_number'),
    date:   getVal('f_date'),
    status: getVal('f_status'),
    client: {
      firstName:             getVal('f_firstName'),
      lastName:              getVal('f_lastName'),
      email:                 getVal('f_email'),
      phone:                 getVal('f_phone'),
      billingAddress:        getVal('f_billingAddress'),
      shippingSameAsBilling: document.getElementById('f_shippingSame').checked,
      shippingAddress:       getVal('f_shippingAddress')
    },
    product: {
      description:  getVal('f_productDesc'),
      brand:        getVal('f_brand'),
      model:        getVal('f_model'),
      reference:    getVal('f_reference'),
      year:         getVal('f_year'),
      serialNumber: getVal('f_serial'),
      quantity:     qty,
      unitPrice:    price
    },
    financial: {
      totalHT:       round2(ht),
      tvaRate:       tva,
      tva:           round2(tvaAmt),
      totalTTC:      round2(ttc),
      deposit:       dep,
      remaining:     round2(ttc - dep),
      paymentMethod: getVal('f_paymentMethod'),
      paymentStatus: getVal('f_paymentStatus'),
      paymentDate:   getVal('f_paymentDate')
    },
    notes: {
      internal: getVal('f_noteInternal'),
      client:   getVal('f_noteClient')
    }
  };
}

function validateFormData(data) {
  const errs = [];
  if (!data.number) errs.push('Numéro de facture requis');
  if (!data.date)   errs.push('Date requise');
  if (!data.client.lastName && !data.client.firstName) errs.push('Nom du client requis');
  if (!data.product.description && !data.product.brand) errs.push('Description du produit requise');
  return errs;
}

async function handleFormSubmit() {
  const data = collectFormData();
  const errs = validateFormData(data);
  if (errs.length) { showToast(errs[0], 'error'); return; }

  try {
    const r = editingInvoiceId
      ? await api('PUT',  `/${editingInvoiceId}`, data)
      : await api('POST', '',                      data);

    if (!r.success) { showToast(r.error || 'Erreur.', 'error'); return; }

    showToast(editingInvoiceId ? 'Facture mise à jour.' : 'Facture créée.', 'success');
    editingInvoiceId = null;
    showView('list');
  } catch { showToast('Erreur réseau.', 'error'); }
}

/* ─── Calcul automatique des montants ─────────────────────────── */
function recalculate() {
  const qty   = parseFloat(getVal('f_qty'))      || 0;
  const price = parseFloat(getVal('f_unitPrice')) || 0;
  const tva   = parseFloat(getVal('f_tvaRate'))   || 0;
  const dep   = parseFloat(getVal('f_deposit'))   || 0;

  const ht     = round2(qty * price);
  const tvaAmt = round2(ht * (tva / 100));
  const ttc    = round2(ht + tvaAmt);
  const rem    = round2(ttc - dep);

  setVal('f_ht',        ht    || '');
  setVal('f_tva',       tvaAmt || '');
  setVal('f_ttc',       ttc   || '');
  setVal('f_remaining', rem   || '');
  updatePreviewFromForm();
}

/* ─── Adresse de livraison ────────────────────────────────────── */
function toggleShipping() {
  const same = document.getElementById('f_shippingSame').checked;
  document.getElementById('f_shippingAddressWrap').classList.toggle('hidden', same);
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE FACTURE (construction + mise à jour)
═══════════════════════════════════════════════════════════════ */
function buildInvoiceHTML(prefix) {
  return `
    <header class="inv-header">
      <div class="inv-logo-block">${XCIV_SVG}</div>
      <div class="inv-meta-block">
        <div class="inv-badge">FACTURE</div>
        <div class="inv-meta-row"><span class="inv-meta-label">N°</span><span class="inv-meta-val" id="${prefix}_number">—</span></div>
        <div class="inv-meta-row"><span class="inv-meta-label">Date</span><span class="inv-meta-val" id="${prefix}_date">—</span></div>
      </div>
    </header>
    <div class="inv-rule"></div>
    <div class="inv-parties">
      <div class="inv-party inv-seller">
        <div class="inv-party-label">DE</div>
        <div class="inv-party-name">Maison XCIV</div>
        <div class="inv-party-detail">Horlogerie de Prestige</div>
        <div class="inv-party-detail">contact@maisonxciv.com</div>
        <div class="inv-party-detail">maisonxciv.com</div>
      </div>
      <div class="inv-party inv-buyer">
        <div class="inv-party-label">À</div>
        <div class="inv-party-name" id="${prefix}_clientName">Nom du client</div>
        <div class="inv-party-detail" id="${prefix}_clientEmail">—</div>
        <div class="inv-party-detail" id="${prefix}_clientPhone"></div>
        <div class="inv-party-detail inv-address" id="${prefix}_billingAddress">—</div>
      </div>
    </div>
    <div id="${prefix}_shippingWrap" style="display:none" class="inv-shipping-block">
      <div class="inv-party-label">ADRESSE DE LIVRAISON</div>
      <div class="inv-party-detail inv-address" id="${prefix}_shippingAddress">—</div>
    </div>
    <div class="inv-table-wrap">
      <table class="inv-table">
        <thead>
          <tr>
            <th class="inv-th-product">Description</th>
            <th class="inv-th-ref">Référence</th>
            <th class="inv-th-qty">Qté</th>
            <th class="inv-th-unit">Prix unit. HT</th>
            <th class="inv-th-total">Total HT</th>
          </tr>
        </thead>
        <tbody>
          <tr class="inv-row-product">
            <td>
              <div class="inv-product-name" id="${prefix}_productDesc">—</div>
              <div class="inv-product-sub" id="${prefix}_productSub"></div>
            </td>
            <td class="inv-td-ref" id="${prefix}_reference">—</td>
            <td class="inv-td-qty" id="${prefix}_qty">1</td>
            <td class="inv-td-unit" id="${prefix}_unitPrice">—</td>
            <td class="inv-td-total" id="${prefix}_lineTotal">—</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="inv-financial-block">
      <div class="inv-financial-row">
        <span class="inv-fin-label">Total HT</span>
        <span class="inv-fin-val" id="${prefix}_ht">—</span>
      </div>
      <div class="inv-financial-row">
        <span class="inv-fin-label" id="${prefix}_tvaLabel">TVA (20 %)</span>
        <span class="inv-fin-val" id="${prefix}_tva">—</span>
      </div>
      <div class="inv-financial-row inv-total-row">
        <span class="inv-fin-label inv-ttc-label">Total TTC</span>
        <span class="inv-fin-val inv-ttc-val" id="${prefix}_ttc">—</span>
      </div>
      <div class="inv-financial-row inv-deposit-row" id="${prefix}_depositRow" style="display:none">
        <span class="inv-fin-label">Acompte versé</span>
        <span class="inv-fin-val" id="${prefix}_deposit">—</span>
      </div>
      <div class="inv-financial-row inv-remaining-row" id="${prefix}_remainingRow" style="display:none">
        <span class="inv-fin-label inv-remaining-label">Reste à payer</span>
        <span class="inv-fin-val inv-remaining-val" id="${prefix}_remaining">—</span>
      </div>
    </div>
    <div class="inv-payment">
      <span class="inv-payment-label">Mode de règlement :</span>
      <span id="${prefix}_paymentMethod">Virement bancaire</span>
      <span id="${prefix}_paymentDateStr" class="inv-payment-date"></span>
    </div>
    <div id="${prefix}_notesWrap" class="inv-notes-wrap" style="display:none">
      <div class="inv-notes-label">Notes</div>
      <div class="inv-notes-text" id="${prefix}_clientNotes"></div>
    </div>
    <footer class="inv-footer">
      <div class="inv-footer-line"></div>
      <div class="inv-footer-text">Maison XCIV — Horlogerie de Prestige &nbsp;|&nbsp; maisonxciv.com &nbsp;|&nbsp; contact@maisonxciv.com</div>
      <div class="inv-footer-sub">Ce document constitue une facture officielle. Conservez-le pour vos archives.</div>
    </footer>`;
}

function buildAndInjectTemplate(containerId, prefix) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = buildInvoiceHTML(prefix);
}

/* ─── Mise à jour du template à partir d'un objet data ──────── */
function updateTemplate(prefix, data) {
  const set = (id, val) => {
    const el = document.getElementById(`${prefix}_${id}`);
    if (el) el.textContent = (val !== null && val !== undefined && val !== '') ? val : '—';
  };
  const show = (id, visible) => {
    const el = document.getElementById(`${prefix}_${id}`);
    if (el) el.style.display = visible ? '' : 'none';
  };

  set('number', data.number);
  set('date',   formatDate(data.date || data.created_at));

  const clientName = `${data.client?.firstName || ''} ${data.client?.lastName || ''}`.trim();
  set('clientName',      clientName || '—');
  set('clientEmail',     data.client?.email  || '');
  set('clientPhone',     data.client?.phone  || '');
  set('billingAddress',  data.client?.billingAddress || '');

  const hasDiffShip = !data.client?.shippingSameAsBilling && data.client?.shippingAddress;
  show('shippingWrap', !!hasDiffShip);
  if (hasDiffShip) set('shippingAddress', data.client.shippingAddress);

  // Produit
  const brand = data.product?.brand || '';
  const model = data.product?.model || '';
  const ref   = data.product?.reference || '';
  const year  = data.product?.year || '';
  const sn    = data.product?.serialNumber || '';
  const qty   = data.product?.quantity || 1;
  const price = data.product?.unitPrice || 0;

  set('productDesc', data.product?.description || `${brand} ${model}`.trim() || '—');
  let sub = '';
  if (brand || model) sub += `${brand} ${model}`.trim();
  if (ref)  sub += (sub ? ' · ' : '') + `Réf. ${ref}`;
  if (year) sub += (sub ? ' · ' : '') + year;
  if (sn)   sub += (sub ? ' · ' : '') + `S/N ${sn}`;
  set('productSub', sub);
  set('reference',  ref || '—');
  set('qty',        qty);
  set('unitPrice',  formatCurrency(price));
  set('lineTotal',  formatCurrency(qty * price));

  // Financier
  const ht    = data.financial?.totalHT  || 0;
  const tvaR  = data.financial?.tvaRate  ?? 20;
  const tvaA  = data.financial?.tva      || 0;
  const ttc   = data.financial?.totalTTC || 0;
  const dep   = data.financial?.deposit  || 0;
  const rem   = data.financial?.remaining || (ttc - dep);

  set('ht',  formatCurrency(ht));
  set('tvaLabel', `TVA (${tvaR} %)`);
  set('tva', formatCurrency(tvaA));
  set('ttc', formatCurrency(ttc));

  const showDep = dep > 0;
  show('depositRow',   showDep);
  show('remainingRow', showDep);
  if (showDep) {
    set('deposit',   formatCurrency(dep));
    set('remaining', formatCurrency(rem));
  }

  // Paiement
  set('paymentMethod', data.financial?.paymentMethod || '—');
  const payDate = data.financial?.paymentDate;
  const pdEl = document.getElementById(`${prefix}_paymentDateStr`);
  if (pdEl) pdEl.textContent = payDate ? ` — réglé le ${formatDate(payDate)}` : '';

  // Notes client
  const hasNotes = !!(data.notes?.client);
  show('notesWrap', hasNotes);
  if (hasNotes) set('clientNotes', data.notes.client);
}

/* ─── Liaison live formulaire → aperçu ───────────────────────── */
function bindFormPreview() {
  const ids = [
    'f_number','f_date','f_firstName','f_lastName','f_email','f_phone',
    'f_billingAddress','f_shippingAddress','f_productDesc','f_brand','f_model',
    'f_reference','f_year','f_serial','f_qty','f_unitPrice','f_tvaRate',
    'f_deposit','f_paymentMethod','f_paymentStatus','f_paymentDate',
    'f_noteClient','f_shippingSame'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input',  updatePreviewFromForm);
      el.addEventListener('change', updatePreviewFromForm);
    }
  });
}

function updatePreviewFromForm() {
  const data = collectFormData();
  updateTemplate('prev', data);
}

/* ═══════════════════════════════════════════════════════════════
   FILTRES
═══════════════════════════════════════════════════════════════ */
function applyFilters() {
  const params = {};
  const search  = getVal('filterSearch');
  const status  = getVal('filterStatus');
  const payS    = getVal('filterPayStatus');
  const from    = getVal('filterDateFrom');
  const to      = getVal('filterDateTo');
  if (search)  params.search        = search;
  if (status)  params.status        = status;
  if (payS)    params.paymentStatus = payS;
  if (from)    params.dateFrom      = from;
  if (to)      params.dateTo        = to;
  loadInvoices(Object.keys(params).length ? params : undefined);
}

function debounceFilters() {
  clearTimeout(filterDebounce);
  filterDebounce = setTimeout(applyFilters, 350);
}

function resetFilters() {
  setVal('filterSearch', '');
  setVal('filterStatus', '');
  setVal('filterPayStatus', '');
  setVal('filterDateFrom', '');
  setVal('filterDateTo', '');
  loadInvoices();
}

/* ═══════════════════════════════════════════════════════════════
   SUPPRESSION
═══════════════════════════════════════════════════════════════ */
function openDeleteModal(id, number) {
  pendingDeleteId = id;
  setText('deleteModalText', `Supprimer la facture ${number} ? Cette action est irréversible.`);
  openModal('deleteModal');
}
function closeDeleteModal() { closeModal('deleteModal'); pendingDeleteId = null; }

async function confirmDelete() {
  if (!pendingDeleteId) return;
  try {
    const r = await api('DELETE', `/${pendingDeleteId}`);
    if (r.success) {
      showToast('Facture supprimée.', 'success');
      closeDeleteModal();
      await Promise.all([loadStats(), loadInvoices()]);
    } else {
      showToast(r.error || 'Erreur.', 'error');
    }
  } catch { showToast('Erreur réseau.', 'error'); }
}

/* ═══════════════════════════════════════════════════════════════
   DUPLICATION
═══════════════════════════════════════════════════════════════ */
async function duplicateInvoice(id) {
  try {
    const r = await api('POST', `/${id}/duplicate`);
    if (r.success) {
      showToast(`Facture dupliquée → ${r.data.number}`, 'success');
      await Promise.all([loadStats(), loadInvoices()]);
    } else {
      showToast(r.error || 'Erreur.', 'error');
    }
  } catch { showToast('Erreur réseau.', 'error'); }
}

/* ═══════════════════════════════════════════════════════════════
   PDF
═══════════════════════════════════════════════════════════════ */
async function openPDFModal(id) {
  try {
    const r = await api('GET', `/${id}`);
    if (!r.success) { showToast('Facture introuvable.', 'error'); return; }
    currentPDFInvoice = r.data;
    updateTemplate('pdf', r.data);
    openModal('pdfModal');
  } catch { showToast('Erreur de chargement.', 'error'); }
}
function closePDFModal() { closeModal('pdfModal'); currentPDFInvoice = null; }

async function downloadPDFFromModal() {
  if (!currentPDFInvoice) return;
  const name = `${currentPDFInvoice.client.firstName} ${currentPDFInvoice.client.lastName}`.trim().replace(/\s+/g, '-') || 'client';
  await generatePDF('pdfInvoiceTemplate', `Facture_${currentPDFInvoice.number}_${name}.pdf`, 'pdfDownloadBtn');
}

async function generatePDFFromForm() {
  const data = collectFormData();
  const errs = validateFormData(data);
  if (errs.length) { showToast(errs[0], 'error'); return; }
  const name = `${data.client.firstName} ${data.client.lastName}`.trim().replace(/\s+/g, '-') || 'client';
  await generatePDF('invoiceTemplate', `Facture_${data.number}_${name}.pdf`);
}

async function generatePDF(templateId, filename, btnId) {
  const template = document.getElementById(templateId);
  if (!template) return;

  const btn = btnId ? document.getElementById(btnId) : document.getElementById('generatePDFBtn');
  const origHTML = btn?.innerHTML;
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin-icon">⟳</span> Génération…`; }

  try {
    const canvas = await html2canvas(template, {
      scale:        3,
      useCORS:      true,
      backgroundColor: '#FEFDFB',
      logging:      false,
      windowWidth:  template.scrollWidth,
      windowHeight: template.scrollHeight
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const printW = pageW - margin * 2;
    const printH = (canvas.height / canvas.width) * printW;
    const offsetY = printH < (pageH - margin * 2)
      ? margin + (pageH - margin * 2 - printH) / 2
      : margin;

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, offsetY, printW, printH);
    pdf.save(filename.replace(/[^a-z0-9\-_.]/gi, '_'));
    showToast(`PDF téléchargé : ${filename}`, 'success');
  } catch (err) {
    console.error('PDF error:', err);
    showToast('Erreur lors de la génération du PDF.', 'error');
  } finally {
    if (btn) { btn.disabled = false; if (origHTML) btn.innerHTML = origHTML; }
  }
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT CSV
═══════════════════════════════════════════════════════════════ */
async function exportCSV() {
  try {
    const params = {};
    const search  = getVal('filterSearch');
    const status  = getVal('filterStatus');
    const payS    = getVal('filterPayStatus');
    const from    = getVal('filterDateFrom');
    const to      = getVal('filterDateTo');
    if (search) params.search        = search;
    if (status) params.status        = status;
    if (payS)   params.paymentStatus = payS;
    if (from)   params.dateFrom      = from;
    if (to)     params.dateTo        = to;
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`/api/admin/invoices/export/csv${qs}`, { credentials: 'include' });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `factures-maison-xciv-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export CSV téléchargé.', 'success');
  } catch { showToast('Erreur lors de l\'export.', 'error'); }
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS UTILITAIRES
═══════════════════════════════════════════════════════════════ */
function formatCurrency(n) {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    draft:     ['Brouillon',   'badge-draft'],
    sent:      ['Envoyée',     'badge-sent'],
    paid:      ['Payée',       'badge-paid'],
    cancelled: ['Annulée',     'badge-cancelled'],
    pending:   ['En attente',  'badge-pending']
  };
  const [label, cls] = map[status] || ['—', 'badge-draft'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function payBadge(status) {
  const map = {
    unpaid:  ['Non payé',      'pay-unpaid'],
    partial: ['Partiel',       'pay-partial'],
    paid:    ['Payé',          'pay-paid']
  };
  const [label, cls] = map[status] || ['—', 'pay-unpaid'];
  return `<span class="pay-badge ${cls}">${label}</span>`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getVal(id) { return (document.getElementById(id)?.value || '').trim(); }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val ?? ''; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val ?? ''; }

function openModal(id)  { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

/* ─── Fermeture modaux au clic sur l'overlay ──────────────────── */
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal('deleteModal');
    closePDFModal();
    closeClientModal();
  }
});

/* ─── Toast ───────────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const wrap  = document.getElementById('toastWrap');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  wrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ─── Déconnexion ─────────────────────────────────────────────── */
async function logout() {
  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); }
  finally { window.location.href = '/admin/login'; }
}
