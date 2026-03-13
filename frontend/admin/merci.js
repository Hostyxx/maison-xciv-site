/**
 * merci.js — Maison XCIV Admin
 * ─────────────────────────────────────────────────────────────
 * Gestion de la carte de remerciement :
 *  - Sélection du ton (4 messages prédéfinis + personnalisé)
 *  - Sélection du format (carte postale / téléphone)
 *  - Mise à jour live de l'aperçu
 *  - Génération PDF via html2canvas + jsPDF
 */

/* ─── Messages par ton ─────────────────────────────────────── */
const MESSAGES = {
  elegant: (prenom, ref) => ({
    salut: `Cher${prenom ? ' ' + prenom : ''}`,
    body: `Nous vous remercions pour votre confiance et votre choix de la Maison XCIV. Chaque pièce que nous vous confions est le fruit d'une sélection méticuleuse — l'excellence ne souffre d'aucun compromis.`,
    ref: ref ? `— ${ref}` : ''
  }),
  chaleureux: (prenom, ref) => ({
    salut: `Cher${prenom ? ' ' + prenom : ''}`,
    body: `C'est avec une grande joie que nous vous avons accompagné dans cette acquisition. Chez Maison XCIV, chaque client est unique et chaque montre raconte une histoire. Merci de faire partie de la nôtre.`,
    ref: ref ? `Votre ${ref} vous attend.` : ''
  }),
  poetique: (prenom, ref) => ({
    salut: `À ${prenom || 'vous'}`,
    body: `Le temps ne s'achète pas — il se choisit. En faisant confiance à la Maison XCIV, vous avez choisi une pièce qui traverse les années avec grâce. Que ce garde-temps soit le témoin de vos plus beaux moments.`,
    ref: ref ? `— ${ref}` : ''
  }),
  custom: () => ({
    salut: document.getElementById('mcSalut')?.textContent || '',
    body: document.getElementById('mCustomMessage')?.value || '',
    ref: ''
  })
};

/* ─── État ──────────────────────────────────────────────────── */
let currentTone   = 'elegant';
let currentFormat = 'postcard';

/* ─── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  verifyAdminSession();
  bindInputs();
  updatePreview();
});

/* ─── Vérification session ──────────────────────────────────── */
async function verifyAdminSession() {
  try {
    const res = await fetch('/api/auth/verify', { credentials: 'include' });
    if (!res.ok) window.location.href = '/admin/login';
  } catch {
    window.location.href = '/admin/login';
  }
}

/* ─── Liaison inputs → aperçu ───────────────────────────────── */
function bindInputs() {
  ['mClientName', 'mWatchRef', 'mSignature'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePreview);
  });
}

/* ─── Mise à jour aperçu ────────────────────────────────────── */
function updatePreview() {
  const prenom = document.getElementById('mClientName').value.trim();
  const ref    = document.getElementById('mWatchRef').value.trim();
  const sign   = document.getElementById('mSignature').value.trim() || 'L\'équipe Maison XCIV';

  const tpl = MESSAGES[currentTone](prenom, ref);

  document.getElementById('mcSalut').textContent    = tpl.salut + (tpl.salut ? ',' : '');
  document.getElementById('mcMessage').textContent  = tpl.body;
  document.getElementById('mcRef').textContent      = tpl.ref;
  document.getElementById('mcSignature').textContent = sign;
}

/* ─── Mise à jour message personnalisé ─────────────────────── */
function updateCustomMessage() {
  if (currentTone !== 'custom') return;
  const val  = document.getElementById('mCustomMessage').value.trim();
  const prenom = document.getElementById('mClientName').value.trim();
  document.getElementById('mcSalut').textContent   = `Cher${prenom ? ' ' + prenom : ''},`;
  document.getElementById('mcMessage').textContent = val;
  document.getElementById('mcRef').textContent     = '';
}
window.updateCustomMessage = updateCustomMessage;

/* ─── Sélection du ton ──────────────────────────────────────── */
function setTone(tone, btn) {
  currentTone = tone;
  document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Champ message personnalisé
  const customField = document.getElementById('customMessageField');
  customField.style.display = tone === 'custom' ? 'block' : 'none';

  updatePreview();
}
window.setTone = setTone;

/* ─── Sélection du format ───────────────────────────────────── */
function setFormat(format, btn) {
  currentFormat = format;

  document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('merciCard').setAttribute('data-format', format);
}
window.setFormat = setFormat;

/* ─── Génération PDF ─────────────────────────────────────────── */
async function generatePDF() {
  const prenom = document.getElementById('mClientName').value.trim();
  if (!prenom) {
    document.getElementById('mClientName').focus();
    showToast('Entrez le prénom du client', 'error');
    return;
  }

  const btn = document.querySelector('.dash-add-btn');
  const originalHTML = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon" style="width:16px;height:16px">
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
      <path d="M21 12a9 9 0 01-9-9"/>
    </svg>
    Génération…
  `;

  try {
    const card = document.getElementById('merciCard');

    const canvas = await html2canvas(card, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#0D0C0B',
      logging: false,
      windowWidth:  card.offsetWidth,
      windowHeight: card.offsetHeight
    });

    const { jsPDF } = window.jspdf;
    const isPhone = currentFormat === 'phone';

    // Dimensions PDF
    // Postcard : A6 paysage (148 x 105 mm)
    // Phone    : format portrait personnalisé (105 x 187 mm ≈ 9:16)
    const pdfW = isPhone ? 105 : 148;
    const pdfH = isPhone ? 187 : 105;

    const pdf = new jsPDF({
      orientation: isPhone ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfW, pdfH],
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

    const cleanName = prenom.replace(/\s+/g, '-');
    const formatLabel = isPhone ? 'telephone' : 'carte-postale';
    pdf.save(`Remerciement_${cleanName}_${formatLabel}.pdf`);

    showToast(`Carte téléchargée pour ${prenom} !`, 'success');

  } catch (err) {
    console.error('Erreur PDF :', err);
    showToast('Erreur lors de la génération.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}
window.generatePDF = generatePDF;

/* ─── Réinitialisation ──────────────────────────────────────── */
function resetMerci() {
  document.getElementById('mClientName').value    = '';
  document.getElementById('mWatchRef').value      = '';
  document.getElementById('mSignature').value     = 'L\'équipe Maison XCIV';
  document.getElementById('mCustomMessage').value = '';
  document.getElementById('customMessageField').style.display = 'none';

  // Remet le ton "élégant"
  currentTone = 'elegant';
  document.querySelectorAll('.tone-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tone === 'elegant');
  });

  updatePreview();
  showToast('Réinitialisé', 'success');
}
window.resetMerci = resetMerci;

/* ─── Déconnexion ───────────────────────────────────────────── */
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } finally {
    window.location.href = '/admin/login';
  }
}
window.logout = logout;

/* ─── Toast ─────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const wrap  = document.getElementById('toastWrap');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  wrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
