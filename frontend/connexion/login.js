'use strict';

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.querySelector('.pw-toggle').addEventListener('click', () => togglePw('password'));
});

// Si déjà connecté → espace client
(async function checkAlreadyLogged() {
  try {
    const res  = await fetch('/api/user/session', { credentials: 'same-origin' });
    const json = await res.json();
    if (json.user) window.location.href = '/mon-espace';
  } catch { /* pas de blocage */ }
})();

async function handleLogin(event) {
  event.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  setLoading(true);
  clearMessage();

  try {
    const res  = await fetch('/api/user/login', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();

    if (!json.success) return showMessage(json.error || 'Identifiants incorrects.', 'error');

    // Redirige vers l'URL d'origine ou l'espace client
    const from = new URLSearchParams(window.location.search).get('from');
    window.location.href = from || '/mon-espace';

  } catch {
    showMessage('Impossible de contacter le serveur.', 'error');
  } finally {
    setLoading(false);
  }
}

function togglePw(id) {
  const el = document.getElementById(id);
  el.type  = el.type === 'password' ? 'text' : 'password';
}

function setLoading(on) {
  document.getElementById('submitBtn').disabled      = on;
  document.getElementById('btnText').style.display   = on ? 'none' : 'inline';
  document.getElementById('btnSpinner').style.display = on ? 'block' : 'none';
}

function showMessage(msg, type) {
  const el      = document.getElementById('authMsg');
  el.textContent = msg;
  el.className  = `auth-message ${type}`;
}

function clearMessage() {
  const el    = document.getElementById('authMsg');
  el.className = 'auth-message';
}

