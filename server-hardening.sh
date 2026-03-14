#!/bin/bash
# ─────────────────────────────────────────────────────────────────
#  server-hardening.sh — Durcissement sécurité VPS Ubuntu
#  Maison XCIV — À exécuter en root UNE SEULE FOIS après installation
#
#  Usage : bash server-hardening.sh
#
#  Ce script :
#  1. Configure UFW (pare-feu)
#  2. Installe et configure fail2ban
#  3. Durcit SSH
#  4. Active les mises à jour automatiques de sécurité
#  5. Configure les rate limits Nginx
#  6. Sécurise les permissions fichiers
#  7. Désactive les services inutiles
# ─────────────────────────────────────────────────────────────────

set -e

# Vérification root
if [ "$(id -u)" -ne 0 ]; then
  echo "[ERREUR] Ce script doit être exécuté en root."
  exit 1
fi

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║   MAISON XCIV — Durcissement sécurité VPS               ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 0. Mise à jour système ────────────────────────────────────
log "Mise à jour du système..."
apt-get update -qq
apt-get upgrade -y -qq
ok "Système à jour."

# ════════════════════════════════════════════════════════════
#  1. PARE-FEU UFW
# ════════════════════════════════════════════════════════════
log "Configuration UFW..."

apt-get install -y ufw

# Réinitialiser les règles
ufw --force reset

# Politique par défaut : tout refuser en entrée
ufw default deny incoming
ufw default allow outgoing

# Ports autorisés
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP (redirection vers HTTPS)'
ufw allow 443/tcp  comment 'HTTPS'

# Bloquer le port Node.js depuis l'extérieur (seul Nginx y accède)
ufw deny 3000/tcp  comment 'Node.js (interne uniquement)'

# Activer le pare-feu
ufw --force enable

ok "UFW configuré."
ufw status verbose

# ════════════════════════════════════════════════════════════
#  2. FAIL2BAN
# ════════════════════════════════════════════════════════════
log "Installation et configuration fail2ban..."

apt-get install -y fail2ban

# Configuration principale
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Bannir 1 heure après 5 échecs en 10 minutes
bantime  = 3600
findtime = 600
maxretry = 5

# Backend auto-détection
backend = auto

# Ignorer localhost
ignoreip = 127.0.0.1/8 ::1

# Email (optionnel — commenter si pas de serveur mail)
# destemail = admin@maisonxciv.com
# action = %(action_mwl)s

# ── SSH ──────────────────────────────────────────────────────
[sshd]
enabled  = true
port     = 22
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 86400   ; 24h après 3 échecs SSH

# ── Nginx : trop de requêtes ──────────────────────────────────
[nginx-req-limit]
enabled  = true
filter   = nginx-req-limit
logpath  = /var/log/nginx/maisonxciv-error.log
maxretry = 10
bantime  = 3600

# ── Nginx : mauvaise URL (scan de vulnérabilités) ────────────
[nginx-http-auth]
enabled  = true
port     = http,https
filter   = nginx-http-auth
logpath  = /var/log/nginx/maisonxciv-error.log
maxretry = 5
EOF

# Filtre pour les requêtes limitées
cat > /etc/fail2ban/filter.d/nginx-req-limit.conf << 'EOF'
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
ignoreregex =
EOF

systemctl enable fail2ban
systemctl restart fail2ban

ok "fail2ban configuré."

# ════════════════════════════════════════════════════════════
#  3. DURCISSEMENT SSH
# ════════════════════════════════════════════════════════════
log "Durcissement de la configuration SSH..."

# Sauvegarde de la config originale
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

# Configuration SSH sécurisée
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
# ── Maison XCIV — SSH Hardening ────────────────────────────
# Désactiver l'authentification par mot de passe
# (ATTENTION : s'assurer d'avoir une clé SSH configurée avant !)
PasswordAuthentication no
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no

# Désactiver le login root
PermitRootLogin no

# Protocole SSH 2 uniquement
Protocol 2

# Timeout de connexion
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2

# Limiter les tentatives
MaxAuthTries 3
MaxSessions 5

# Désactiver X11 Forwarding (inutile pour un serveur web)
X11Forwarding no

# Désactiver les forwarding inutiles
AllowTcpForwarding no
AllowStreamLocalForwarding no
GatewayPorts no
PermitTunnel no

# Algorithmes d'échange de clés modernes uniquement
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Ciphers modernes
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr

# MACs sécurisés
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,umac-128-etm@openssh.com
EOF

# IMPORTANT : Vérifier la config avant de recharger
sshd -t && systemctl reload ssh
ok "SSH durci."

echo ""
warn "IMPORTANT : Vérifiez que vous avez une clé SSH configurée AVANT de tester la déconnexion."
warn "  Vérification : ssh-copy-id user@maisonxciv.com"
warn "  Test dans un nouveau terminal avant de fermer celui-ci !"
echo ""

# ════════════════════════════════════════════════════════════
#  4. MISES À JOUR AUTOMATIQUES DE SÉCURITÉ
# ════════════════════════════════════════════════════════════
log "Configuration des mises à jour automatiques..."

apt-get install -y unattended-upgrades apt-listchanges

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

// Ne pas redémarrer automatiquement (Node.js/Nginx doivent être redémarrés manuellement)
Unattended-Upgrade::Automatic-Reboot "false";

// Supprimer les paquets inutiles
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";

// Log
Unattended-Upgrade::SyslogEnable "true";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

systemctl enable unattended-upgrades
ok "Mises à jour automatiques de sécurité activées."

# ════════════════════════════════════════════════════════════
#  5. RATE LIMITING NGINX (zones partagées)
# ════════════════════════════════════════════════════════════
log "Configuration des zones de rate limiting Nginx..."

cat > /etc/nginx/conf.d/rate-limit.conf << 'EOF'
# ── Zones de rate limiting pour Maison XCIV ──────────────────
# auth    : endpoints login/register (10 req/min max)
# api     : API générale (60 req/min max)
# global  : toutes les pages (200 req/min max)
# conn    : connexions simultanées par IP (max 20)

limit_req_zone  $binary_remote_addr zone=auth:10m   rate=10r/m;
limit_req_zone  $binary_remote_addr zone=api:10m    rate=60r/m;
limit_req_zone  $binary_remote_addr zone=global:10m rate=200r/m;
limit_conn_zone $binary_remote_addr zone=conn:10m;

# Retourner 429 (Too Many Requests) au lieu de 503
limit_req_status  429;
limit_conn_status 429;
EOF

nginx -t && systemctl reload nginx
ok "Rate limiting Nginx configuré."

# ════════════════════════════════════════════════════════════
#  6. PERMISSIONS FICHIERS
# ════════════════════════════════════════════════════════════
log "Sécurisation des permissions..."

APP_DIR="/var/www/maison-xciv"

if [ -d "$APP_DIR" ]; then
  # Propriétaire : www-data
  chown -R www-data:www-data "$APP_DIR"

  # Dossiers : 755 (lecture + exécution pour tous, écriture owner)
  find "$APP_DIR" -type d -exec chmod 755 {} \;

  # Fichiers : 644 (lecture pour tous, écriture owner)
  find "$APP_DIR" -type f -exec chmod 644 {} \;

  # .env : uniquement lisible par www-data
  [ -f "$APP_DIR/.env" ] && chmod 600 "$APP_DIR/.env"

  # DB JSON : écriture nécessaire pour le serveur
  [ -d "$APP_DIR/database" ] && chmod 755 "$APP_DIR/database"
  find "$APP_DIR/database" -name "*.json" -exec chmod 644 {} \;

  # Uploads : écriture nécessaire
  [ -d "$APP_DIR/frontend/assets/images/uploads" ] && \
    chmod 755 "$APP_DIR/frontend/assets/images/uploads"

  ok "Permissions sécurisées."
else
  warn "Dossier $APP_DIR introuvable — permissions à configurer manuellement."
fi

# ════════════════════════════════════════════════════════════
#  7. PARAMÈTRES KERNEL (protection réseau)
# ════════════════════════════════════════════════════════════
log "Durcissement des paramètres réseau kernel..."

cat >> /etc/sysctl.conf << 'EOF'

# ── Maison XCIV — Paramètres sécurité réseau ─────────────────

# Protéger contre le SYN flood
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Ignorer les pings ICMP (empêche le ping flooding)
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Désactiver le source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# Protection contre le spoofing IP
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignorer les redirections ICMP
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0

# Logs des paquets suspects
net.ipv4.conf.all.log_martians = 1
EOF

sysctl -p
ok "Paramètres kernel appliqués."

# ════════════════════════════════════════════════════════════
#  8. DÉSACTIVER LES SERVICES INUTILES
# ════════════════════════════════════════════════════════════
log "Désactivation des services inutiles..."

SERVICES_TO_DISABLE="avahi-daemon cups bluetooth"
for svc in $SERVICES_TO_DISABLE; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    systemctl stop "$svc"
    systemctl disable "$svc"
    log "  → $svc désactivé"
  fi
done
ok "Services inutiles désactivés."

# ════════════════════════════════════════════════════════════
#  9. RENOUVELLEMENT CERTBOT
# ════════════════════════════════════════════════════════════
log "Vérification du renouvellement automatique Certbot..."

# Certbot installe automatiquement un timer systemd ou un cron
if systemctl is-active --quiet certbot.timer 2>/dev/null; then
  ok "Timer Certbot actif (renouvellement automatique)."
elif crontab -l 2>/dev/null | grep -q certbot; then
  ok "Cron Certbot actif (renouvellement automatique)."
else
  warn "Configurer le renouvellement automatique Certbot :"
  echo "    echo '0 3 * * * certbot renew --quiet --post-hook \"systemctl reload nginx\"' | crontab -"
fi

# Test du renouvellement
certbot renew --dry-run 2>/dev/null && ok "Test renouvellement Certbot OK." || \
  warn "Vérifier la config Certbot manuellement."

# ════════════════════════════════════════════════════════════
#  RÉSUMÉ
# ════════════════════════════════════════════════════════════
echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║   DURCISSEMENT TERMINÉ                                   ║"
echo "  ╠══════════════════════════════════════════════════════════╣"
echo "  ║  ✓ UFW pare-feu (22, 80, 443 autorisés)                  ║"
echo "  ║  ✓ fail2ban (SSH + Nginx)                                ║"
echo "  ║  ✓ SSH durci (pas de root, pas de mot de passe)          ║"
echo "  ║  ✓ Mises à jour sécurité automatiques                    ║"
echo "  ║  ✓ Rate limiting Nginx                                   ║"
echo "  ║  ✓ Permissions fichiers                                  ║"
echo "  ║  ✓ Paramètres kernel réseau                              ║"
echo "  ╠══════════════════════════════════════════════════════════╣"
echo "  ║  ACTION REQUISE : Configurer une clé SSH AVANT           ║"
echo "  ║  de tester la connexion sans mot de passe !              ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Commandes utiles :"
echo "    ufw status              → état du pare-feu"
echo "    fail2ban-client status  → état fail2ban"
echo "    fail2ban-client status sshd  → tentatives SSH bloquées"
echo "    journalctl -u fail2ban  → logs fail2ban"
echo ""
