/**
 * shared/nav.js — Navigation unifiée — Maison XCIV
 *
 * Gère pour toutes les pages publiques (collection, pages/*) :
 *  1. Cursor custom (desktop)
 *  2. Mobile nav toggle + fermeture
 *  3. Lien actif (détecté par pathname)
 *  4. Auth state (session → mise à jour nav → déconnexion)
 *
 * Expose :
 *  window.toggleMobile()        — ouvrir/fermer le menu
 *  window.closeMobile()         — fermer le menu
 *  window.xcivAuthReady         — Promise<user|null>
 *  window.xcivUser              — utilisateur courant (null si non connecté)
 */

'use strict';

/* ═══════════════════════════════════════════
   1. CURSOR CUSTOM (desktop uniquement)
═══════════════════════════════════════════ */
(function initCursor() {
  const dot  = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  if (!dot || !ring) return;

  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) return;

  let mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function moveRing() {
    rx += (mx - rx) * 0.09;
    ry += (my - ry) * 0.09;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(moveRing);
  })();

  document.addEventListener('mouseover', e => {
    if (e.target.closest('a, button, select, .wc-item')) {
      document.body.classList.add('hovering');
    } else {
      document.body.classList.remove('hovering');
    }
  });
})();


/* ═══════════════════════════════════════════
   2. MOBILE NAV
═══════════════════════════════════════════ */
let _mobileOpen = false;

function toggleMobile() {
  _mobileOpen ? closeMobile() : openMobile();
}

function openMobile() {
  _mobileOpen = true;
  const nav  = document.getElementById('mobileNav');
  const hbtn = document.getElementById('hamburger');
  if (nav)  nav.classList.add('open');
  if (hbtn) { hbtn.classList.add('open'); hbtn.setAttribute('aria-expanded', 'true'); }
  document.body.style.overflow = 'hidden';
  document.body.classList.add('menu-open');
}

function closeMobile() {
  _mobileOpen = false;
  const nav  = document.getElementById('mobileNav');
  const hbtn = document.getElementById('hamburger');
  if (nav)  nav.classList.remove('open');
  if (hbtn) { hbtn.classList.remove('open'); hbtn.setAttribute('aria-expanded', 'false'); }
  document.body.style.overflow = '';
  document.body.classList.remove('menu-open');
}

window.toggleMobile = toggleMobile;
window.closeMobile  = closeMobile;

/* Fermer en cliquant sur un lien du menu mobile */
const _mobileNav = document.getElementById('mobileNav');
if (_mobileNav) {
  _mobileNav.addEventListener('click', e => {
    if (e.target.tagName === 'A') closeMobile();
  });
}

/* Hamburger */
const _hamburger = document.getElementById('hamburger');
if (_hamburger) _hamburger.addEventListener('click', toggleMobile);

/* Fermer avec Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && _mobileOpen) closeMobile();
});


/* ═══════════════════════════════════════════
   3. LIEN ACTIF
═══════════════════════════════════════════ */
(function setActiveLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-center a, .mobile-nav > a').forEach(a => {
    const href = a.getAttribute('href') || '';
    /* Lien collection : correspondance exacte */
    if (href === '/collection' && path === '/collection') {
      a.classList.add('active');
    /* Lien page statique (pages/*, connexion, etc.) */
    } else if (href !== '/' && href !== '/#services' && !href.startsWith('/#')
               && href.length > 1 && path.startsWith(href)) {
      a.classList.add('active');
    }
  });
})();


/* ═══════════════════════════════════════════
   4. AUTH STATE
═══════════════════════════════════════════ */
window.xcivUser = null;

let _authResolve;
window.xcivAuthReady = new Promise(resolve => { _authResolve = resolve; });

async function _initAuth() {
  try {
    const res  = await fetch('/api/user/session', { credentials: 'same-origin' });
    const json = await res.json();
    window.xcivUser = json.user || null;
  } catch {
    window.xcivUser = null;
  }
  _updateNavAuth();
  _authResolve(window.xcivUser);
}

function _updateNavAuth() {
  const user          = window.xcivUser;
  const navLogin      = document.getElementById('navLogin');
  const navUserMenu   = document.getElementById('navUserMenu');
  const navUserName   = document.getElementById('navUserName');
  const navAdminBadge = document.getElementById('navAdminBadge');
  const mobileAuth    = document.getElementById('mobileNavAuth');

  if (!user) {
    if (navLogin)      navLogin.style.display     = '';
    if (navUserMenu)   navUserMenu.style.display   = 'none';
    if (navAdminBadge) navAdminBadge.style.display = 'none';
    if (mobileAuth)    mobileAuth.innerHTML        = `<a href="/connexion">Mon compte</a>`;
    return;
  }

  if (user.role === 'admin') {
    if (navLogin)      navLogin.style.display     = 'none';
    if (navUserMenu)   navUserMenu.style.display   = 'none';
    if (navAdminBadge) navAdminBadge.style.display = '';
    if (mobileAuth)    mobileAuth.innerHTML        = `<a href="/admin/dashboard">Dashboard</a>`;
  } else {
    const prenom = (user.name || '').split(' ')[0];
    if (navLogin)      navLogin.style.display     = 'none';
    if (navAdminBadge) navAdminBadge.style.display = 'none';
    if (navUserMenu)   navUserMenu.style.display   = 'flex';
    if (navUserName)   navUserName.textContent     = prenom;
    if (mobileAuth) {
      mobileAuth.innerHTML =
        `<a href="/mon-espace">Mon espace</a>
         <button class="mobile-nav-logout">Déconnexion</button>`;
      mobileAuth.querySelector('.mobile-nav-logout').addEventListener('click', () => {
        _logoutUser();
        closeMobile();
      });
    }
  }
}

async function _logoutUser() {
  try {
    await fetch('/api/user/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    window.xcivUser = null;
    _updateNavAuth();
    /* Si la page courante requiert une connexion, rediriger */
    if (window.location.pathname.startsWith('/mon-espace')) {
      window.location.href = '/connexion';
    }
  }
}

/* Bouton déconnexion desktop */
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.querySelector('.nav-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', _logoutUser);
});

/* Lancer l'auth */
_initAuth();
