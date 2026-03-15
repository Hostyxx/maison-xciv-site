'use strict';

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

// Si déjà connecté → espace client
(async function checkAlreadyLogged() {
  try {
    const res  = await fetch('/api/user/session', { credentials: 'same-origin' });
    const json = await res.json();
    if (json.user) window.location.href = '/mon-espace';
  } catch { /* pas de blocage */ }
})();

async function handleRegister(event) {
  event.preventDefault();
  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;

  clearMessage();

  // Validation côté client (confort utilisateur)
  if (!name) return showMessage('Veuillez entrer votre nom.', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showMessage('Adresse email invalide.', 'error');
  if (password.length < 8)
    return showMessage('Mot de passe trop court (8 caractères minimum).', 'error');
  if (password !== confirm)
    return showMessage('Les mots de passe ne correspondent pas.', 'error');

  setLoading(true);

  try {
    const res  = await fetch('/api/user/register', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const json = await res.json();

    if (!json.success) return showMessage(json.error || 'Une erreur est survenue.', 'error');

    // Succès
    showMessage('Compte créé avec succès. Redirection…', 'success');
    setTimeout(() => { window.location.href = '/mon-espace'; }, 1200);

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
  const el       = document.getElementById('authMsg');
  el.textContent = msg;
  el.className   = `auth-message ${type}`;
}

function clearMessage() {
  document.getElementById('authMsg').className = 'auth-message';
}

// togglePw est appelé via onclick dans le HTML
window.togglePw = togglePw;
