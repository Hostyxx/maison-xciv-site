'use strict';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('contactWaBtn').addEventListener('click', sendContactWA);
  document.getElementById('contactIgBtn').addEventListener('click', sendContactIG);
});

function sendContactWA(event) {
  event.preventDefault();
  const nom     = document.getElementById('cpNom').value.trim();
  const email   = document.getElementById('cpEmail').value.trim();
  const sujet   = document.getElementById('cpSujet').value;
  const message = document.getElementById('cpMessage').value.trim();
  if (!message) { alert('Veuillez écrire un message.'); return; }
  let text = `Bonjour Maison XCIV,\n\n`;
  if (nom)   text += `Nom : ${nom}\n`;
  if (email) text += `Email : ${email}\n`;
  text += `Sujet : ${sujet}\n\n${message}`;
  window.open(`https://wa.me/33601918798?text=${encodeURIComponent(text)}`, '_blank');
}

function sendContactIG() {
  const nom     = document.getElementById('cpNom').value.trim();
  const sujet   = document.getElementById('cpSujet').value;
  const message = document.getElementById('cpMessage').value.trim();
  let text = `Bonjour ! `;
  if (nom)   text += `Je m'appelle ${nom}. `;
  text += `Sujet : ${sujet}. `;
  if (message) text += message;
  navigator.clipboard.writeText(text).then(() => {
    alert('Message copié dans le presse-papier !\nCollez-le dans un DM Instagram @maisonxciv.');
    window.open('https://instagram.com/maisonxciv', '_blank');
  }).catch(() => {
    window.open('https://instagram.com/maisonxciv', '_blank');
  });
}
