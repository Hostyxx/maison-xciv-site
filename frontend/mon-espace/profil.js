'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  // Vérifie la session — si non connecté, redirige vers /connexion?from=/mon-espace
  let user;
  try {
    const res  = await fetch('/api/user/session', { credentials: 'same-origin' });
    const json = await res.json();
    if (!json.user) return redirect();
    user = json.user;
  } catch {
    return redirect();
  }

  // Affiche le contenu
  document.getElementById('loadingState').style.display  = 'none';
  document.getElementById('espacContent').style.display  = 'block';
  document.getElementById('userName').textContent        = user.name;

  // Date d'inscription
  const year = new Date(user.created_at).getFullYear();
  document.getElementById('statMemberSince').textContent = year;

  // Charge les favoris
  await loadFavorites(user);
});

async function loadFavorites(user) {
  const grid = document.getElementById('favGrid');

  try {
    const res  = await fetch('/api/favorites', { credentials: 'same-origin' });
    const json = await res.json();

    if (!json.success) throw new Error(json.error);

    const watches = json.data;
    document.getElementById('statFavCount').textContent =
      watches.length;
    document.getElementById('statDispoCount').textContent =
      watches.filter(w => w.status === 'Disponible').length;

    if (watches.length === 0) {
      grid.innerHTML = buildEmptyState();
      return;
    }

    grid.innerHTML = watches.map(w => buildFavCard(w)).join('');

  } catch {
    grid.innerHTML = buildEmptyState();
  }
}

function buildFavCard(watch) {
  const img = watch.image
    ? `<img src="${watch.image}" alt="${watch.brand} ${watch.name}">`
    : `⌚`;

  return `
  <div class="fav-card">
    <div class="fav-card-img">${img}</div>
    <div class="fav-card-body">
      <div class="fav-card-brand">${escHtml(watch.brand)}</div>
      <div class="fav-card-name">${escHtml(watch.name)}</div>
      <div class="fav-card-footer">
        <span class="fav-card-price">${escHtml(watch.price)}</span>
        <button class="fav-remove-btn" onclick="removeFav(${watch.id}, this)">
          Retirer
        </button>
      </div>
    </div>
  </div>`;
}

function buildEmptyState() {
  return `
  <div class="fav-empty">
    <div class="fav-empty-icon">♡</div>
    <h3 class="fav-empty-title">Aucune pièce sauvegardée</h3>
    <p class="fav-empty-desc">
      Explorez notre collection et sauvegardez les montres qui vous inspirent.
    </p>
    <a href="/#nouveautes" class="fav-empty-btn">Découvrir la collection →</a>
  </div>`;
}

async function removeFav(watchId, btn) {
  btn.disabled    = true;
  btn.textContent = '…';

  try {
    const res  = await fetch(`/api/favorites/${watchId}`, {
      method: 'POST', credentials: 'same-origin'
    });
    const json = await res.json();
    if (!json.success) throw new Error();

    // Retire la carte du DOM avec animation
    const card = btn.closest('.fav-card');
    card.style.transition = 'opacity 0.4s, transform 0.4s';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.95)';
    setTimeout(() => {
      card.remove();
      // Met à jour le compteur
      const count = document.querySelectorAll('.fav-card').length;
      document.getElementById('statFavCount').textContent = count;
      if (count === 0) document.getElementById('favGrid').innerHTML = buildEmptyState();
    }, 400);

  } catch {
    btn.disabled    = false;
    btn.textContent = 'Retirer';
  }
}

async function logout(event) {
  event.preventDefault();
  await fetch('/api/user/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/';
}

function redirect() {
  window.location.href = '/connexion?from=/mon-espace';
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.removeFav = removeFav;
window.logout    = logout;
