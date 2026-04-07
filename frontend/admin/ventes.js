/**
 * frontend/admin/ventes.js
 * ─────────────────────────────────────────────────────────────
 * Module Ventes — Maison XCIV Admin
 *
 * 1. État & utilitaires
 * 2. Chargement (stats + liste)
 * 3. Rendu table
 * 4. Filtres
 * 5. Modal ajout / édition
 * 6. Catalogue picker
 * 7. Suppression
 * 8. Export CSV
 * 9. Toast
 * 10. Sidebar (mobile + logout)
 */

'use strict';

/* ═══════════════════════════════════════════
   1. ÉTAT & UTILITAIRES
═══════════════════════════════════════════ */

let _allVentes     = [];
let _filtered      = [];
let _watches       = [];
let _editingId     = null;
let _selectedWatch = null;

const fmt = {
  price(n) {
    if (typeof n !== 'number' || isNaN(n)) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  },
  date(s) {
    if (!s) return '—';
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  dateISO(d) {
    return d.toISOString().split('T')[0];
  }
};

async function api(method, url, body) {
  const opts = { method, credentials: 'same-origin', headers: {} };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res  = await fetch(url, opts);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erreur serveur');
  return json;
}

/* ═══════════════════════════════════════════
   2. CHARGEMENT
═══════════════════════════════════════════ */

async function loadStats() {
  try {
    const { data } = await api('GET', '/api/admin/ventes/stats');
    renderStats(data);
  } catch (e) {
    console.error('[Ventes] stats:', e.message);
  }
}

async function loadVentes() {
  try {
    const { data } = await api('GET', '/api/admin/ventes');
    _allVentes = data;
    _buildYearFilter();
    applyFilters();
  } catch (e) {
    showToast('Impossible de charger les ventes.', 'error');
    document.getElementById('resultsCount').textContent = 'Erreur de chargement.';
  }
}

async function loadWatches() {
  if (_watches.length > 0) return;
  try {
    const res  = await fetch('/api/watches', { credentials: 'same-origin' });
    const json = await res.json();
    _watches = Array.isArray(json) ? json : (json.data || []);
  } catch {
    _watches = [];
  }
}

/* ═══════════════════════════════════════════
   3. RENDU STATS
═══════════════════════════════════════════ */

function renderStats(s) {
  document.getElementById('kpiRevenue').textContent = fmt.price(s.totalRevenue);
  document.getElementById('kpiRevenueSub').textContent =
    s.totalVentes > 0 ? `sur ${s.totalVentes} transaction${s.totalVentes > 1 ? 's' : ''}` : 'aucune vente encore';

  document.getElementById('kpiCount').textContent    = s.totalVentes;
  document.getElementById('kpiCountSub').textContent = `montre${s.totalVentes > 1 ? 's' : ''} vendue${s.totalVentes > 1 ? 's' : ''}`;

  document.getElementById('kpiAvg').textContent      = fmt.price(Math.round(s.avgPrice));

  document.getElementById('kpiBrand').textContent    = s.topBrand || '—';
  document.getElementById('kpiBrandSub').textContent = s.topBrandCount > 0
    ? `${s.topBrandCount} vente${s.topBrandCount > 1 ? 's' : ''} enregistrée${s.topBrandCount > 1 ? 's' : ''}`
    : 'aucune vente encore';
}

/* ═══════════════════════════════════════════
   4. FILTRES & RENDU TABLE
═══════════════════════════════════════════ */

function _buildYearFilter() {
  const years = [...new Set(_allVentes
    .filter(v => v.soldAt)
    .map(v => new Date(v.soldAt).getFullYear())
  )].sort((a, b) => b - a);

  const sel  = document.getElementById('yearFilter');
  const curr = sel.value;
  // Garde l'option vide + reconstruit
  while (sel.options.length > 1) sel.remove(1);
  years.forEach(yr => {
    const opt = document.createElement('option');
    opt.value = yr; opt.textContent = yr;
    sel.appendChild(opt);
  });
  if (curr) sel.value = curr;
}

function applyFilters() {
  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const brand  = document.getElementById('brandFilter').value;
  const year   = document.getElementById('yearFilter').value;

  _filtered = _allVentes.filter(v => {
    if (search) {
      const hay = `${v.brand} ${v.model} ${v.reference} ${v.buyerName} ${v.year}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (brand && v.brand !== brand) return false;
    if (year  && new Date(v.soldAt).getFullYear() !== parseInt(year, 10)) return false;
    return true;
  });

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('ventesBody');
  const count = document.getElementById('resultsCount');

  count.textContent = _filtered.length === 0
    ? 'Aucune vente trouvée'
    : `${_filtered.length} vente${_filtered.length > 1 ? 's' : ''} affichée${_filtered.length > 1 ? 's' : ''}`;

  if (_filtered.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="vt-empty">
          <div class="vt-empty-icon">📋</div>
          <div class="vt-empty-title">Aucune vente enregistrée</div>
          <div class="vt-empty-sub">Cliquez sur "Nouvelle vente" pour commencer à répertorier vos transactions.</div>
          <button class="dash-add-btn" onclick="openModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
            </svg>
            Nouvelle vente
          </button>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = _filtered.map(v => `
    <tr>
      <td class="vt-td-date">${fmt.date(v.soldAt)}</td>
      <td class="vt-td-montre">
        <strong>${esc(v.brand)} ${esc(v.model)}</strong>
        <span>${v.reference ? esc(v.reference) : ''}${v.serialNumber ? ' · ' + esc(v.serialNumber) : ''}</span>
      </td>
      <td class="vt-td-year">${v.year || '—'}</td>
      <td class="vt-td-buyer">
        ${v.buyerName
          ? `<span>${esc(v.buyerName)}</span>${v.buyerPhone ? `<br><span style="font-size:11px;color:var(--grey)">${esc(v.buyerPhone)}</span>` : ''}`
          : `<span class="vt-td-buyer-empty">—</span>`}
      </td>
      <td class="vt-td-payment">${esc(v.paymentMethod || '—')}</td>
      <td class="vt-td-price" style="text-align:right">${fmt.price(v.price)}</td>
      <td>
        <div class="vt-td-actions">
          <button class="vt-btn-edit" onclick="openModal(${v.id})" aria-label="Modifier">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="vt-btn-del" onclick="deleteVente(${v.id}, '${esc(v.brand)} ${esc(v.model)}')" aria-label="Supprimer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ═══════════════════════════════════════════
   5. MODAL AJOUT / ÉDITION
═══════════════════════════════════════════ */

function openModal(id) {
  _editingId     = id || null;
  _selectedWatch = null;

  const overlay  = document.getElementById('modalOverlay');
  const title    = document.getElementById('modalTitle');
  const submitBtn = document.getElementById('modalSubmitBtn');
  const form     = document.getElementById('venteForm');

  title.textContent      = id ? 'Modifier la vente' : 'Nouvelle vente';
  submitBtn.textContent  = id ? 'Enregistrer' : 'Enregistrer la vente';

  form.reset();
  _resetCatalogueUI();

  // Pré-remplir date du jour pour une nouvelle vente
  if (!id) {
    document.getElementById('fSoldAt').value = fmt.dateISO(new Date());
  }

  // Si édition : charger les données
  if (id) {
    const v = _allVentes.find(x => x.id === id);
    if (v) _fillForm(v);
  }

  overlay.classList.add('open');
  document.getElementById('fBrand').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  _editingId = null;
  _selectedWatch = null;
}

function _fillForm(v) {
  document.getElementById('fBrand').value       = v.brand         || '';
  document.getElementById('fModel').value       = v.model         || '';
  document.getElementById('fReference').value   = v.reference     || '';
  document.getElementById('fYear').value        = v.year          || '';
  document.getElementById('fSerial').value      = v.serialNumber  || '';
  document.getElementById('fBuyerName').value   = v.buyerName     || '';
  document.getElementById('fBuyerPhone').value  = v.buyerPhone    || '';
  document.getElementById('fPrice').value       = v.price         || '';
  document.getElementById('fSoldAt').value      = v.soldAt        || '';
  document.getElementById('fPayment').value     = v.paymentMethod || 'Virement bancaire';
  document.getElementById('fNote').value        = v.note          || '';
  document.getElementById('fWatchId').value     = v.watchId       || '';

  if (v.watchId) {
    // Retrouver le nom de la montre dans le catalogue
    const w = _watches.find(x => x.id === v.watchId);
    const label = w ? `${w.brand} ${w.name}` : `${v.brand} ${v.model}`;
    _showCatalogueSelected(label, v.watchId);
  }
}

function _resetCatalogueUI() {
  document.getElementById('catalogueSection').style.display = '';
  document.getElementById('catalogueSelected').style.display = 'none';
  document.getElementById('catalogueSelected').innerHTML = '';
  document.getElementById('fWatchId').value = '';
}

function _showCatalogueSelected(label, watchId) {
  document.getElementById('catalogueSection').style.display = 'none';
  const div = document.getElementById('catalogueSelected');
  div.style.display = '';
  div.innerHTML = `
    <div class="vt-catalog-selected">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span class="vt-catalog-selected-name">${esc(label)}</span>
      <button type="button" class="vt-catalog-selected-clear" id="clearCatalogueBtn" aria-label="Retirer la sélection">✕</button>
    </div>`;
  document.getElementById('fWatchId').value = watchId;
  document.getElementById('clearCatalogueBtn').addEventListener('click', _resetCatalogueUI);
}

/* Soumission du formulaire */
document.getElementById('venteForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    watchId:       document.getElementById('fWatchId').value    || null,
    brand:         document.getElementById('fBrand').value.trim(),
    model:         document.getElementById('fModel').value.trim(),
    reference:     document.getElementById('fReference').value.trim(),
    year:          document.getElementById('fYear').value,
    serialNumber:  document.getElementById('fSerial').value.trim(),
    buyerName:     document.getElementById('fBuyerName').value.trim(),
    buyerPhone:    document.getElementById('fBuyerPhone').value.trim(),
    price:         parseFloat(document.getElementById('fPrice').value),
    soldAt:        document.getElementById('fSoldAt').value,
    paymentMethod: document.getElementById('fPayment').value,
    note:          document.getElementById('fNote').value.trim()
  };

  if (!data.brand || !data.model) return showToast('Marque et modèle sont requis.', 'error');
  if (!data.price || isNaN(data.price)) return showToast('Le prix est requis.', 'error');
  if (!data.soldAt) return showToast('La date de vente est requise.', 'error');

  const btn = document.getElementById('modalSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';

  try {
    if (_editingId) {
      await api('PUT', `/api/admin/ventes/${_editingId}`, data);
      showToast('Vente modifiée avec succès.', 'success');
    } else {
      await api('POST', '/api/admin/ventes', data);
      showToast('Vente enregistrée avec succès.', 'success');
    }
    closeModal();
    await loadStats();
    await loadVentes();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = _editingId ? 'Enregistrer' : 'Enregistrer la vente';
  }
});

// Expose pour les boutons inline du tableau
window.openModal    = openModal;
window.deleteVente  = deleteVente;

/* ═══════════════════════════════════════════
   6. CATALOGUE PICKER
═══════════════════════════════════════════ */

function openPicker() {
  document.getElementById('pickerOverlay').classList.add('open');
  document.getElementById('pickerSearch').value = '';
  document.getElementById('pickerSearch').focus();
  renderPickerList('');
}

function closePicker() {
  document.getElementById('pickerOverlay').classList.remove('open');
}

async function renderPickerList(query) {
  const list = document.getElementById('pickerList');

  // Charger les montres si nécessaire
  if (_watches.length === 0) {
    list.innerHTML = '<div class="vt-picker-empty">Chargement…</div>';
    await loadWatches();
  }

  const q = query.toLowerCase();
  const filtered = _watches.filter(w => {
    if (!q) return true;
    return `${w.brand} ${w.name} ${w.reference || ''}`.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="vt-picker-empty">Aucune montre trouvée dans le catalogue.</div>';
    return;
  }

  const priceNum = w => typeof w.price === 'number' ? w.price : parseFloat(w.price) || 0;
  const statusClass = s => s === 'Disponible' ? 'status-dispo' : s === 'Vendu' ? 'status-vendu' : 'status-reserve';

  list.innerHTML = filtered.map(w => `
    <div class="vt-picker-item" data-id="${w.id}" role="button" tabindex="0">
      <div class="vt-picker-item-left">
        <strong>${esc(w.brand)} ${esc(w.name)}</strong>
        <span>${w.year ? `Millésime ${w.year}` : ''}${w.reference ? ` · ${esc(w.reference)}` : ''}</span>
      </div>
      <div class="vt-picker-item-right">
        <span class="vt-picker-item-price">${fmt.price(priceNum(w))}</span>
        <span class="vt-picker-item-status ${statusClass(w.status)}">${esc(w.status || '')}</span>
      </div>
    </div>
  `).join('');

  // Bind clicks
  list.querySelectorAll('.vt-picker-item').forEach(item => {
    const handler = () => {
      const watchId = parseInt(item.dataset.id, 10);
      const watch   = _watches.find(w => w.id === watchId);
      if (!watch) return;
      selectWatch(watch);
    };
    item.addEventListener('click', handler);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

function selectWatch(watch) {
  _selectedWatch = watch;

  // Pré-remplir les champs
  document.getElementById('fBrand').value      = watch.brand   || '';
  document.getElementById('fModel').value      = watch.name    || '';
  document.getElementById('fReference').value  = watch.reference  || '';
  document.getElementById('fYear').value       = watch.year    || '';
  document.getElementById('fSerial').value     = watch.serialNumber || '';

  // Si la montre a un prix catalogue, proposer comme base
  if (watch.price && !document.getElementById('fPrice').value) {
    const p = typeof watch.price === 'number' ? watch.price : parseFloat(watch.price) || 0;
    document.getElementById('fPrice').value = p;
  }

  _showCatalogueSelected(`${watch.brand} ${watch.name}`, watch.id);
  closePicker();
}

/* ═══════════════════════════════════════════
   7. SUPPRESSION
═══════════════════════════════════════════ */

async function deleteVente(id, label) {
  if (!confirm(`Supprimer la vente "${label}" ?\n\nCette action est irréversible.`)) return;
  try {
    await api('DELETE', `/api/admin/ventes/${id}`);
    showToast('Vente supprimée.', 'success');
    await loadStats();
    await loadVentes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ═══════════════════════════════════════════
   8. EXPORT CSV
═══════════════════════════════════════════ */

function exportCSV() {
  const search = document.getElementById('searchInput').value.trim();
  const brand  = document.getElementById('brandFilter').value;
  const year   = document.getElementById('yearFilter').value;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (brand)  params.set('brand', brand);
  if (year)   params.set('year', year);

  const url = `/api/admin/ventes/export/csv${params.toString() ? '?' + params.toString() : ''}`;
  window.location.href = url;
}

/* ═══════════════════════════════════════════
   9. TOAST
═══════════════════════════════════════════ */

function showToast(msg, type = 'success') {
  const wrap  = document.getElementById('toastWrap');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  wrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3500);
}

/* ═══════════════════════════════════════════
   10. SIDEBAR & LISTENERS
═══════════════════════════════════════════ */

function initSidebar() {
  // Mobile toggle
  const toggleBtn  = document.querySelector('.sidebar-toggle-btn');
  const overlay    = document.getElementById('sidebarOverlay');
  const sidebar    = document.querySelector('.sidebar');

  function openSidebar()  { sidebar.classList.add('open'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow = ''; }

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (overlay)   overlay.addEventListener('click', closeSidebar);

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch {}
      window.location.href = '/admin/login';
    });
  }
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();

  // Charger montres en fond
  loadWatches();

  // Charger stats + ventes
  loadStats();
  loadVentes();

  // Filtres
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 250);
  });
  document.getElementById('brandFilter').addEventListener('change', applyFilters);
  document.getElementById('yearFilter').addEventListener('change', applyFilters);
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('brandFilter').value = '';
    document.getElementById('yearFilter').value  = '';
    applyFilters();
  });

  // Nouvelle vente
  document.getElementById('newVenteBtn').addEventListener('click', () => openModal());

  // Export CSV
  document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);

  // Fermeture modal vente
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Ouverture picker catalogue
  document.getElementById('openPickerBtn').addEventListener('click', openPicker);

  // Fermeture picker
  document.getElementById('pickerClose').addEventListener('click', closePicker);
  document.getElementById('pickerOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closePicker();
  });

  // Recherche dans le picker
  document.getElementById('pickerSearch').addEventListener('input', e => {
    renderPickerList(e.target.value.trim());
  });

  // Escape ferme tout
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.getElementById('pickerOverlay').classList.contains('open')) { closePicker(); return; }
      if (document.getElementById('modalOverlay').classList.contains('open')) closeModal();
    }
  });
});
