/**
 * frontend/admin/login.js
 * ─────────────────────────────────────────────────────────────
 * Gère le formulaire de connexion admin.
 * Envoie les identifiants à POST /api/auth/login.
 * En cas de succès, redirige vers /admin/dashboard.
 */

'use strict';

/**
 * Soumission du formulaire de login.
 */
async function handleLogin(event) {
  event.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('loginBtn');
  const btnText  = document.getElementById('loginBtnText');
  const spinner  = document.getElementById('loginSpinner');
  const errorEl  = document.getElementById('loginError');

  // Masque l'erreur précédente
  errorEl.style.display = 'none';

  // Affiche le spinner
  btn.disabled       = true;
  btnText.style.display  = 'none';
  spinner.style.display  = 'block';

  try {
    const res  = await fetch('/api/auth/login', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'same-origin', // envoie + reçoit le cookie
      body:        JSON.stringify({ email, password })
    });

    const json = await res.json();

    if (!json.success) {
      showError(json.error || 'Identifiants incorrects.');
      return;
    }

    // Connexion réussie → redirect
    window.location.href = '/admin/dashboard';

  } catch (err) {
    showError('Impossible de contacter le serveur. Vérifiez votre connexion.');
  } finally {
    btn.disabled          = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

/**
 * Affiche un message d'erreur sous le formulaire.
 */
function showError(message) {
  const errorEl        = document.getElementById('loginError');
  errorEl.textContent  = message;
  errorEl.style.display = 'block';
  // Shake animation
  errorEl.style.animation = 'none';
  requestAnimationFrame(() => {
    errorEl.style.animation = 'shake 0.4s ease';
  });
}

/**
 * Affiche / masque le mot de passe.
 */
function togglePassword() {
  const input = document.getElementById('password');
  input.type  = input.type === 'password' ? 'text' : 'password';
}

// Expose aux handlers onclick du HTML
window.handleLogin    = handleLogin;
window.togglePassword = togglePassword;

// Ajout d'une animation shake dans la page
const style       = document.createElement('style');
style.textContent = `@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-6px); }
  40%,80% { transform: translateX(6px); }
}`;
document.head.appendChild(style);
