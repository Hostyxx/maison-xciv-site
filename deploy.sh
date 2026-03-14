#!/bin/bash
# ─────────────────────────────────────────────────────────────────
#  deploy.sh — Script de déploiement Maison XCIV sur VPS OVH
#  Usage : bash deploy.sh
#  À exécuter UNE SEULE FOIS pour la mise en place initiale,
#  puis utiliser "bash deploy.sh update" pour les mises à jour.
# ─────────────────────────────────────────────────────────────────

set -e  # Arrête en cas d'erreur

# ── Configuration ─────────────────────────────────────────────
APP_DIR="/var/www/maison-xciv"
APP_USER="www-data"
LOG_DIR="/var/log/pm2"
NGINX_CONF="/etc/nginx/sites-available/maisonxciv.com"
NGINX_LINK="/etc/nginx/sites-enabled/maisonxciv.com"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

# ── Mode mise à jour (update) ─────────────────────────────────
if [ "$1" = "update" ]; then
  log "Mise à jour du site..."
  cd "$APP_DIR"

  log "Récupération du code..."
  git pull origin main

  log "Installation des dépendances..."
  npm install --production

  log "Redémarrage PM2..."
  pm2 reload maison-xciv --update-env

  ok "Mise à jour terminée !"
  pm2 status
  exit 0
fi

# ══════════════════════════════════════════════════════════════
#  INSTALLATION INITIALE
# ══════════════════════════════════════════════════════════════

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   MAISON XCIV — Déploiement VPS      ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── 1. Node.js ────────────────────────────────────────────────
log "Vérification Node.js..."
if ! command -v node &> /dev/null; then
  log "Installation Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
ok "Node.js $(node --version)"

# ── 2. PM2 ────────────────────────────────────────────────────
log "Vérification PM2..."
if ! command -v pm2 &> /dev/null; then
  log "Installation PM2..."
  npm install -g pm2
fi
ok "PM2 $(pm2 --version)"

# ── 3. Dossier application ────────────────────────────────────
log "Préparation du dossier $APP_DIR..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"

# ── 4. Copie du projet ────────────────────────────────────────
# OPTION A : Si vous utilisez Git (recommandé)
# git clone https://github.com/votre-user/maison-xciv.git "$APP_DIR"
# cd "$APP_DIR"

# OPTION B : Si vous avez déjà copié les fichiers via rsync/scp
# (dans ce cas, ce script doit être lancé depuis $APP_DIR)
cd "$APP_DIR" || err "Dossier $APP_DIR introuvable. Copiez d'abord le projet."

# ── 5. Dépendances production ─────────────────────────────────
log "Installation des dépendances Node.js..."
npm install --production
ok "Dépendances installées."

# ── 6. Fichier .env ───────────────────────────────────────────
if [ ! -f ".env" ]; then
  warn ".env manquant ! Création depuis .env.example..."
  cp .env.example .env
  echo ""
  echo "  ┌─────────────────────────────────────────────────────────┐"
  echo "  │  IMPORTANT : Éditez .env avant de continuer !           │"
  echo "  │  nano $APP_DIR/.env                                      │"
  echo "  │                                                          │"
  echo "  │  Variables requises :                                    │"
  echo "  │    NODE_ENV=production                                   │"
  echo "  │    ADMIN_JWT_SECRET=<clé aléatoire 64 chars>            │"
  echo "  │    USER_JWT_SECRET=<autre clé aléatoire 64 chars>       │"
  echo "  │    ADMINS_CONFIG=[{\"name\":\"...\",\"email\":\"...\",\"passwordHash\":\"...\"}]"
  echo "  │    ALLOWED_ORIGINS=https://maisonxciv.com               │"
  echo "  └─────────────────────────────────────────────────────────┘"
  echo ""
  read -p "  Appuyez sur Entrée une fois .env configuré..."
fi

# ── 7. Bases de données JSON ──────────────────────────────────
log "Initialisation des bases de données..."
[ ! -f "database/users.json" ]     && echo '{"nextId":1,"users":[]}' > database/users.json
[ ! -f "database/favorites.json" ] && echo '{"favorites":[]}' > database/favorites.json
[ ! -f "database/invoices.json" ]  && echo '{"invoices":[],"lastId":0,"lastNumber":0}' > database/invoices.json
ok "Bases de données prêtes."

# ── 8. Dossier uploads ────────────────────────────────────────
log "Création du dossier uploads..."
mkdir -p frontend/assets/images/uploads
ok "Uploads prêt."

# ── 9. Permissions ────────────────────────────────────────────
log "Application des permissions..."
chown -R "$APP_USER:$APP_USER" "$APP_DIR" 2>/dev/null || \
  warn "Impossible de changer le propriétaire (pas root ?). Continuer manuellement si besoin."

# ── 10. PM2 — Lancement ──────────────────────────────────────
log "Démarrage avec PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
ok "PM2 actif."

# ── 11. PM2 — Auto-démarrage au boot ─────────────────────────
log "Configuration PM2 au démarrage système..."
pm2 startup systemd -u root --hp /root 2>/dev/null || \
  warn "Lancez manuellement : pm2 startup"

# ── 12. Nginx ─────────────────────────────────────────────────
log "Configuration Nginx..."
if [ -f "nginx-maisonxciv.conf" ]; then
  cp nginx-maisonxciv.conf "$NGINX_CONF"
  [ ! -L "$NGINX_LINK" ] && ln -s "$NGINX_CONF" "$NGINX_LINK"
  rm -f /etc/nginx/sites-enabled/default

  nginx -t && systemctl reload nginx
  ok "Nginx configuré et rechargé."
else
  warn "nginx-maisonxciv.conf introuvable. Copiez-le manuellement dans $NGINX_CONF"
fi

# ── Résumé ────────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║  DÉPLOIEMENT TERMINÉ                                     ║"
echo "  ╠══════════════════════════════════════════════════════════╣"
echo "  ║  Site    → https://maisonxciv.com                        ║"
echo "  ║  Admin   → https://maisonxciv.com/admin/login            ║"
echo "  ║  Health  → https://maisonxciv.com/api/health             ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo ""

pm2 status
