/**
 * frontend/admin/dashboard.js
 * ─────────────────────────────────────────────────────────────
 * Logique complète du dashboard admin Maison XCIV.
 *
 * Sections :
 *  1. Vérification de session au chargement
 *  2. Chargement et affichage des montres
 *  3. Formulaire ajouter / modifier
 *  4. Suppression avec confirmation
 *  5. Upload d'image
 *  6. Filtres et recherche
 *  7. Notifications toast
 *  8. Déconnexion
 */

'use strict';

// ─── Config ──────────────────────────────────────────────────
const API         = '/api/watches';
const API_AUTH    = '/api/auth';
const API_UPLOAD  = '/api/upload';
const API_CLIENTS = '/api/admin/clients';

// ─── État local ───────────────────────────────────────────────
let allWatches    = [];    // cache complet
let currentFilter = 'all';
let searchQuery   = '';
let deleteTarget  = null;  // id de la montre à supprimer

// ═══════════════════════════════════════════════════════════
//  1. INIT — Vérification de session
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  // Sidebar toggle
  const sidebarToggle = document.querySelector('.sidebar-toggle-btn');
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleMobileSidebar);
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleMobileSidebar);
  // Sidebar nav links
  document.querySelector('[data-section="catalogue"]')?.addEventListener('click', e => { e.preventDefault(); cancelForm(); });
  document.querySelector('[data-section="add"]')?.addEventListener('click', e => { e.preventDefault(); showAddForm(); });
  document.querySelector('[data-section="clients"]')?.addEventListener('click', e => { e.preventDefault(); showClients(); });
  // Logout
  document.querySelector('.sidebar-logout')?.addEventListener('click', logout);
  // Image upload zone
  document.getElementById('imgUploadZone')?.addEventListener('click', () => document.getElementById('fImageFile').click());
  document.getElementById('fImageFile')?.addEventListener('change', handleImageUpload);
  // Image clear
  document.querySelector('.img-clear-btn')?.addEventListener('click', clearImage);
  // Add/cancel form buttons
  document.querySelector('.dash-add-btn')?.addEventListener('click', showAddForm);
  document.querySelector('.form-cancel')?.addEventListener('click', cancelForm);
  document.querySelector('.btn-secondary[data-action="cancel"]')?.addEventListener('click', cancelForm);
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', function () { setFilter(this.dataset.filter, this); });
  });
  // Search
  document.getElementById('searchInput')?.addEventListener('input', filterList);
  // Watch form
  document.getElementById('watchForm')?.addEventListener('submit', submitWatch);
  // Back to clients
  document.querySelector('.btn-back')?.addEventListener('click', showClients);
  // Delete modal buttons (use event delegation for dynamically inserted content)
  document.addEventListener('click', e => {
    if (e.target.matches('[data-action="close-delete"]') || e.target.closest('[data-action="close-delete"]')) closeDeleteModal();
    if (e.target.matches('[data-action="confirm-delete"]') || e.target.closest('[data-action="confirm-delete"]')) confirmDelete();
  });

  // Watches table — délégation pour boutons Modifier / Supprimer
  document.getElementById('watchesTbody').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const delBtn  = e.target.closest('[data-action="delete"]');
    if (editBtn) editWatch(Number(editBtn.dataset.id));
    if (delBtn)  openDeleteModal(Number(delBtn.dataset.id));
  });

  // Clients table — délégation pour lignes et bouton voir profil
  document.getElementById('clientsTbody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="show-client"]');
    if (btn) showClientDetail(Number(btn.dataset.id));
  });

  // Détail client — délégation pour les favoris cliquables
  document.getElementById('clientDetailContent').addEventListener('click', e => {
    const row = e.target.closest('[data-action="open-watch"]');
    if (row) openWatchFromClient(Number(row.dataset.id));
  });

  await checkSession();
  await loadWatches();
});

/**
 * Vérifie que le token JWT est encore valide.
 * Si valide, affiche le nom de l'admin connecté dans la sidebar.
 * Si non, redirige vers le login.
 */
async function checkSession() {
  try {
    const res  = await fetch(`${API_AUTH}/verify`, { credentials: 'same-origin' });
    if (!res.ok) { window.location.href = '/admin/login'; return; }

    const json = await res.json();
    if (json.success && json.admin) {
      const name   = json.admin.name || json.admin.email || 'Admin';
      const initial = name.charAt(0).toUpperCase();
      document.getElementById('sidebarAdminName').textContent   = name;
      document.getElementById('sidebarAdminAvatar').textContent = initial;
    }
  } catch {
    window.location.href = '/admin/login';
  }
}


// ═══════════════════════════════════════════════════════════
//  2. CHARGEMENT ET AFFICHAGE DES MONTRES
// ═══════════════════════════════════════════════════════════

async function loadWatches() {
  const tbody = document.getElementById('watchesTbody');
  tbody.innerHTML = `<tr><td colspan="6" class="table-loading">Chargement du catalogue…</td></tr>`;

  try {
    const res  = await fetch(API, { credentials: 'same-origin' });
    const json = await res.json();

    if (!json.success) throw new Error(json.error);

    allWatches = json.data;
    updateStats();
    renderTable();

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-loading" style="color:#ef4444">
      Erreur : ${err.message}
    </td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('watchesTbody');
  let filtered = allWatches;

  // Filtre par statut
  if (currentFilter !== 'all') {
    filtered = filtered.filter(w => w.status === currentFilter);
  }

  // Filtre par recherche
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(w =>
      w.name.toLowerCase().includes(q)  ||
      w.brand.toLowerCase().includes(q) ||
      (w.description && w.description.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-loading">Aucune montre trouvée.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(w => buildRow(w)).join('');
}

function buildRow(watch) {
  const statusClass = {
    'Disponible': 'status-disponible',
    'Réservé':    'status-reserve',
    'Vendu':      'status-vendu'
  }[watch.status] || 'status-disponible';

  const imgCell = watch.image
    ? `<img src="${watch.image}" alt="${watch.brand}" class="table-img">`
    : `<div class="table-img-placeholder">⌚</div>`;

  return `
  <tr data-id="${watch.id}">
    <td>${imgCell}</td>
    <td>
      <div class="table-brand">${escHtml(watch.brand)}</div>
      <div class="table-name">${escHtml(watch.name)}</div>
    </td>
    <td>${watch.year || '—'}</td>
    <td>${escHtml(watch.price)}</td>
    <td><span class="status-badge ${statusClass}">${escHtml(watch.status)}</span></td>
    <td>
      <div class="table-actions">
        <button class="tbl-btn tbl-btn-edit" data-action="edit" data-id="${watch.id}" title="Modifier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="tbl-btn tbl-btn-del" data-action="delete" data-id="${watch.id}" title="Supprimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>
    </td>
  </tr>`;
}

function updateStats() {
  const dispo  = allWatches.filter(w => w.status === 'Disponible').length;
  const reserv = allWatches.filter(w => w.status === 'Réservé').length;
  const vendu  = allWatches.filter(w => w.status === 'Vendu').length;

  document.getElementById('dashStats').innerHTML = `
    <div class="stat-pill"><span class="stat-pill-dot dot-dispo"></span>${dispo} dispo</div>
    <div class="stat-pill"><span class="stat-pill-dot dot-reserv"></span>${reserv} réservé</div>
    <div class="stat-pill"><span class="stat-pill-dot dot-vendu"></span>${vendu} vendu</div>
  `;
}


// ═══════════════════════════════════════════════════════════
//  3. FORMULAIRE AJOUTER / MODIFIER
// ═══════════════════════════════════════════════════════════

function showAddForm() {
  resetForm();
  document.getElementById('formTitle').textContent = 'Nouvelle montre';
  document.getElementById('formSubmitText').textContent = 'Ajouter la montre';
  showSection('sectionForm');

  // Mise à jour sidebar
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-section="add"]').classList.add('active');

  document.getElementById('dashTitle').textContent    = 'Nouvelle montre';
  document.getElementById('dashSubtitle').textContent = 'Remplissez les informations';
}

function editWatch(id) {
  const watch = allWatches.find(w => w.id === id);
  if (!watch) return;

  // Remplit le formulaire
  document.getElementById('fId').value          = watch.id;
  document.getElementById('fBrand').value       = watch.brand;
  document.getElementById('fName').value        = watch.name;
  document.getElementById('fPrice').value       = watch.price;
  document.getElementById('fYear').value        = watch.year || '';
  document.getElementById('fStatus').value      = watch.status;
  document.getElementById('fDescription').value = watch.description;
  document.getElementById('fImage').value       = watch.image || '';
  document.getElementById('fWhatsapp').value    = watch.whatsapp || '';

  // Aperçu image si présente
  if (watch.image) {
    showImagePreview(watch.image);
  } else {
    clearImagePreview();
  }

  document.getElementById('formTitle').textContent     = 'Modifier la montre';
  document.getElementById('formSubmitText').textContent = 'Enregistrer les modifications';
  showSection('sectionForm');

  document.getElementById('dashTitle').textContent    = `Modifier — ${watch.brand} ${watch.name}`;
  document.getElementById('dashSubtitle').textContent = 'Mettez à jour les informations';
}
window.editWatch = editWatch;

async function submitWatch(event) {
  event.preventDefault();

  const btn        = document.getElementById('formSubmitBtn');
  const btnText    = document.getElementById('formSubmitText');
  const spinner    = document.getElementById('formSpinner');
  const id         = document.getElementById('fId').value;
  const isEdit     = !!id;

  btn.disabled          = true;
  btnText.style.display  = 'none';
  spinner.style.display  = 'block';

  const brand = document.getElementById('fBrand').value.trim();
  const name  = document.getElementById('fName').value.trim();

  const payload = {
    brand,
    name,
    price:       document.getElementById('fPrice').value.trim()       || 'Sur demande',
    year:        document.getElementById('fYear').value               || null,
    status:      document.getElementById('fStatus').value,
    description: document.getElementById('fDescription').value.trim(),
    image:       document.getElementById('fImage').value.trim(),
    whatsapp:    document.getElementById('fWhatsapp').value.trim()    || '33601918798',
    message:     `Bonjour, je suis intéressé(e) par la ${brand} ${name}.`
  };

  try {
    const url    = isEdit ? `${API}/${id}` : API;
    const method = isEdit ? 'PUT' : 'POST';

    const res  = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    showToast(isEdit ? `Montre modifiée avec succès.` : `Montre ajoutée au catalogue.`, 'success');
    await loadWatches();
    cancelForm();

  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
  } finally {
    btn.disabled          = false;
    btnText.style.display  = 'inline';
    spinner.style.display  = 'none';
  }
}
window.submitWatch = submitWatch;

function cancelForm() {
  resetForm();
  showSection('sectionCatalogue');

  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-section="catalogue"]').classList.add('active');

  document.getElementById('dashTitle').textContent    = 'Catalogue de montres';
  document.getElementById('dashSubtitle').textContent = 'Gérez votre collection';

  // Réafficher le bouton d'ajout
  const addBtn = document.querySelector('.dash-add-btn');
  if (addBtn) addBtn.style.display = '';
}
window.cancelForm = cancelForm;

function resetForm() {
  document.getElementById('fId').value          = '';
  document.getElementById('fBrand').value       = '';
  document.getElementById('fName').value        = '';
  document.getElementById('fPrice').value       = '';
  document.getElementById('fYear').value        = '';
  document.getElementById('fStatus').value      = 'Disponible';
  document.getElementById('fDescription').value = '';
  document.getElementById('fImage').value       = '';
  document.getElementById('fWhatsapp').value    = '';
  clearImagePreview();
}


// ═══════════════════════════════════════════════════════════
//  4. SUPPRESSION AVEC CONFIRMATION
// ═══════════════════════════════════════════════════════════

function openDeleteModal(id) {
  const watch = allWatches.find(w => w.id === id);
  if (!watch) return;

  deleteTarget = id;
  document.getElementById('deleteModalDesc').textContent =
    `"${watch.brand} ${watch.name}" sera définitivement supprimée du catalogue.`;

  const modal = document.getElementById('deleteModal');
  modal.style.display = 'flex';
}
window.openDeleteModal = openDeleteModal;

function closeDeleteModal() {
  deleteTarget = null;
  document.getElementById('deleteModal').style.display = 'none';
}
window.closeDeleteModal = closeDeleteModal;

async function confirmDelete() {
  if (!deleteTarget) return;

  try {
    const res  = await fetch(`${API}/${deleteTarget}`, {
      method:      'DELETE',
      credentials: 'same-origin'
    });
    const json = await res.json();

    if (!json.success) throw new Error(json.error);

    showToast('Montre supprimée.', 'success');
    closeDeleteModal();
    await loadWatches();

  } catch (err) {
    showToast('Erreur suppression : ' + err.message, 'error');
    closeDeleteModal();
  }
}
window.confirmDelete = confirmDelete;

// Fermer la modal en cliquant sur l'overlay
document.getElementById('deleteModal')
  .addEventListener('click', e => { if (e.target === e.currentTarget) closeDeleteModal(); });


// ═══════════════════════════════════════════════════════════
//  5. UPLOAD D'IMAGE
// ═══════════════════════════════════════════════════════════

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Affiche l'état loading
  document.getElementById('imgPlaceholder').style.display = 'none';
  document.getElementById('imgPreview').style.display     = 'none';
  document.getElementById('imgLoading').style.display     = 'flex';

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res  = await fetch(API_UPLOAD, {
      method:      'POST',
      credentials: 'same-origin',
      body:        formData
      // Ne pas mettre Content-Type ici (multer le gère avec boundary)
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    // Remplit le champ URL et affiche l'aperçu
    document.getElementById('fImage').value = json.url;
    showImagePreview(json.url);
    showToast('Image uploadée avec succès.', 'success');

  } catch (err) {
    clearImagePreview();
    showToast('Erreur upload : ' + err.message, 'error');
  }
}
window.handleImageUpload = handleImageUpload;

function showImagePreview(url) {
  document.getElementById('imgLoading').style.display     = 'none';
  document.getElementById('imgPlaceholder').style.display = 'none';
  document.getElementById('imgPreviewEl').src             = url;
  document.getElementById('imgPreview').style.display     = 'block';
}

function clearImage(event) {
  if (event) event.stopPropagation();
  clearImagePreview();
  document.getElementById('fImage').value            = '';
  document.getElementById('fImageFile').value        = '';
}
window.clearImage = clearImage;

function clearImagePreview() {
  document.getElementById('imgLoading').style.display     = 'none';
  document.getElementById('imgPreview').style.display     = 'none';
  document.getElementById('imgPreviewEl').src             = '';
  document.getElementById('imgPlaceholder').style.display = 'flex';
}

// Mise à jour de l'aperçu si l'URL est saisie manuellement
document.getElementById('fImage').addEventListener('input', function() {
  if (this.value.startsWith('http') || this.value.startsWith('/')) {
    showImagePreview(this.value);
  } else if (!this.value) {
    clearImagePreview();
  }
});


// ═══════════════════════════════════════════════════════════
//  6. FILTRES ET RECHERCHE
// ═══════════════════════════════════════════════════════════

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTable();
}
window.setFilter = setFilter;

function filterList() {
  searchQuery = document.getElementById('searchInput').value.trim();
  renderTable();
}
window.filterList = filterList;


// ═══════════════════════════════════════════════════════════
//  7. TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

function showToast(message, type = 'success') {
  const wrap  = document.getElementById('toastWrap');
  const toast = document.createElement('div');

  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  wrap.appendChild(toast);

  // Affiche
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  // Supprime après 4s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}


// ═══════════════════════════════════════════════════════════
//  8. DÉCONNEXION
// ═══════════════════════════════════════════════════════════

async function logout() {
  try {
    await fetch(`${API_AUTH}/logout`, {
      method:      'POST',
      credentials: 'same-origin'
    });
  } finally {
    window.location.href = '/admin/login';
  }
}
window.logout = logout;


// ═══════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════

/** Affiche une section, masque les autres */
function showSection(id) {
  document.querySelectorAll('.dash-section').forEach(s => {
    s.style.display = s.id === id ? 'block' : 'none';
  });
}

/** Échappe le HTML pour éviter les injections XSS */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Expose showAddForm pour le bouton header */
window.showAddForm = showAddForm;


// ═══════════════════════════════════════════════════════════
//  CLIENTS — Gestion des utilisateurs inscrits
// ═══════════════════════════════════════════════════════════

/**
 * Affiche la section clients.
 * Met à jour la sidebar, le titre et charge la liste.
 */
async function showClients() {
  showSection('sectionClients');

  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const clientsLink = document.querySelector('[data-section="clients"]');
  if (clientsLink) clientsLink.classList.add('active');

  document.getElementById('dashTitle').textContent    = 'Clients';
  document.getElementById('dashSubtitle').textContent = 'Utilisateurs inscrits sur le site';
  document.getElementById('dashStats').innerHTML      = '';

  const addBtn = document.querySelector('.dash-add-btn');
  if (addBtn) addBtn.style.display = 'none';

  await loadClients();
}
window.showClients = showClients;

/**
 * Charge et affiche la liste de tous les clients.
 */
async function loadClients() {
  const tbody = document.getElementById('clientsTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" class="table-loading">Chargement des clients…</td></tr>`;

  try {
    const res  = await fetch(API_CLIENTS, { credentials: 'same-origin' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const clients = json.clients;

    // Résumé
    const summaryEl = document.getElementById('clientsSummary');
    if (summaryEl) {
      const totalFavs = clients.reduce((acc, c) => acc + c.favoritesCount, 0);
      summaryEl.innerHTML = `
        <div class="clients-stat-row">
          <div class="clients-stat-card">
            <div class="clients-stat-num">${clients.length}</div>
            <div class="clients-stat-label">Client${clients.length !== 1 ? 's' : ''} inscrit${clients.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="clients-stat-card">
            <div class="clients-stat-num" style="color:var(--beige)">${totalFavs}</div>
            <div class="clients-stat-label">Favoris au total</div>
          </div>
          <div class="clients-stat-card">
            <div class="clients-stat-num">${clients.filter(c => c.favoritesCount > 0).length}</div>
            <div class="clients-stat-label">Clients avec favoris</div>
          </div>
        </div>`;
    }

    if (clients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="table-loading">Aucun client inscrit pour le moment.</td></tr>`;
      return;
    }

    tbody.innerHTML = clients.map(c => buildClientRow(c)).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-loading" style="color:#ef4444">Erreur : ${escHtml(err.message)}</td></tr>`;
  }
}

/**
 * Construit une ligne de tableau pour un client.
 */
function buildClientRow(client) {
  const date     = formatDate(client.created_at);
  const initials = getInitials(client.name);
  const hasFavs  = client.favoritesCount > 0;

  return `
  <tr class="client-row" data-action="show-client" data-id="${client.id}" title="Voir le profil de ${escHtml(client.name)}">
    <td>
      <div class="client-identity">
        <div class="client-avatar">${initials}</div>
        <div class="client-info">
          <div class="client-name">${escHtml(client.name)}</div>
          <div class="client-email">${escHtml(client.email)}</div>
        </div>
      </div>
    </td>
    <td class="client-date-cell">
      <span class="client-date-label">Inscrit le</span>
      <span class="client-date-val">${date}</span>
    </td>
    <td>
      <div class="client-fav-pill ${hasFavs ? 'has-favs' : ''}">
        <svg viewBox="0 0 24 24" ${hasFavs ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.5"'}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        ${client.favoritesCount} favori${client.favoritesCount !== 1 ? 's' : ''}
      </div>
    </td>
    <td style="text-align:right">
      <button class="tbl-btn tbl-btn-edit" data-action="show-client" data-id="${client.id}" title="Voir le profil">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </td>
  </tr>`;
}

/**
 * Charge et affiche le détail d'un client.
 */
async function showClientDetail(id) {
  showSection('sectionClientDetail');

  document.getElementById('dashTitle').textContent    = 'Profil client';
  document.getElementById('dashSubtitle').textContent = 'Informations et activité';
  document.getElementById('dashStats').innerHTML      = '';

  const addBtn = document.querySelector('.dash-add-btn');
  if (addBtn) addBtn.style.display = 'none';

  const content = document.getElementById('clientDetailContent');
  content.innerHTML = `
    <div class="client-detail-loading">
      <div class="spinner"></div>
      <span>Chargement du profil…</span>
    </div>`;

  try {
    const res  = await fetch(`${API_CLIENTS}/${id}`, { credentials: 'same-origin' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    renderClientDetail(json);
  } catch (err) {
    content.innerHTML = `<p style="color:#ef4444; padding:24px; font-size:13px">Erreur : ${escHtml(err.message)}</p>`;
  }
}
window.showClientDetail = showClientDetail;

/**
 * Rend le détail d'un client dans la section dédiée.
 */
function renderClientDetail({ client, favorites, favoritesCount }) {
  const content     = document.getElementById('clientDetailContent');
  const initials    = getInitials(client.name);
  const createdDate = formatDate(client.created_at);
  const updatedDate = client.updated_at ? formatDate(client.updated_at) : '—';

  const favsHtml = favorites.length === 0
    ? `<div class="client-no-favs">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
           <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
         </svg>
         <p>Aucune montre en favoris pour le moment.</p>
       </div>`
    : favorites.map(f => buildFavRow(f)).join('');

  content.innerHTML = `
    <div class="client-detail-grid">

      <!-- Carte profil -->
      <div class="dash-card client-profile-card">
        <div class="client-profile-top">
          <div class="client-avatar-lg">${initials}</div>
          <div class="client-profile-identity">
            <h2 class="client-profile-name">${escHtml(client.name)}</h2>
            <div class="client-profile-email">${escHtml(client.email)}</div>
          </div>
        </div>
        <div class="client-profile-meta">
          <div class="client-meta-item">
            <span class="client-meta-label">Inscription</span>
            <span class="client-meta-val">${createdDate}</span>
          </div>
          <div class="client-meta-item">
            <span class="client-meta-label">Dernière activité</span>
            <span class="client-meta-val">${updatedDate}</span>
          </div>
          <div class="client-meta-item">
            <span class="client-meta-label">Montres favorites</span>
            <span class="client-meta-val client-meta-accent">${favoritesCount} montre${favoritesCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <!-- Carte favoris -->
      <div class="dash-card client-favs-card">
        <div class="client-favs-header">
          <div class="client-favs-title">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            Montres en favoris
          </div>
          <span class="client-favs-badge">${favoritesCount}</span>
        </div>
        <div class="client-favs-list">
          ${favsHtml}
        </div>
      </div>

    </div>`;
}

/**
 * Construit une ligne de favori dans le détail client.
 */
function buildFavRow(fav) {
  const date = formatDate(fav.created_at, true);

  if (!fav.watch) {
    return `
    <div class="fav-row fav-row-deleted">
      <div class="fav-row-img fav-row-img-empty">⌚</div>
      <div class="fav-row-body">
        <div class="fav-row-name">Montre supprimée</div>
        <div class="fav-row-meta">ID : ${fav.watchId} · Ajouté le ${date}</div>
      </div>
    </div>`;
  }

  const statusClass = {
    'Disponible': 'status-disponible',
    'Réservé':    'status-reserve',
    'Vendu':      'status-vendu'
  }[fav.watch.status] || '';

  return `
  <div class="fav-row" data-action="open-watch" data-id="${fav.watch.id}" title="Ouvrir la fiche de cette montre">
    <div class="fav-row-img">
      ${fav.watch.image
        ? `<img src="${escHtml(fav.watch.image)}" alt="${escHtml(fav.watch.brand)}">`
        : `<span class="fav-row-img-empty">⌚</span>`}
    </div>
    <div class="fav-row-body">
      <div class="fav-row-brand">${escHtml(fav.watch.brand)}</div>
      <div class="fav-row-name">${escHtml(fav.watch.name)}${fav.watch.year ? ` · ${fav.watch.year}` : ''}</div>
      <div class="fav-row-meta">Ajouté le ${date}</div>
    </div>
    <div class="fav-row-right">
      <span class="status-badge ${statusClass}">${escHtml(fav.watch.status)}</span>
      <span class="fav-row-price">${escHtml(fav.watch.price)}</span>
    </div>
  </div>`;
}

/**
 * Navigue vers la fiche d'une montre depuis le détail client.
 */
function openWatchFromClient(watchId) {
  cancelForm();
  editWatch(watchId);
}
window.openWatchFromClient = openWatchFromClient;


// ─── Helpers Clients ─────────────────────────────────────────

function getInitials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(isoString, withTime = false) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const dateStr = d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  if (!withTime) return dateStr;
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} à ${timeStr}`;
}


// ═══════════════════════════════════════════════════════════
//  MOBILE SIDEBAR TOGGLE
// ═══════════════════════════════════════════════════════════

/** Ouvre / ferme la sidebar en mode overlay sur mobile (≤ 600px) */
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  const isOpen = sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('show', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/** Ferme la sidebar mobile après un clic sur un lien de navigation */
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 600) toggleMobileSidebar();
  });
});
