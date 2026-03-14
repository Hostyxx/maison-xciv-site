/**
 * ecosystem.config.js
 * Configuration PM2 pour Maison XCIV en production.
 * Usage : pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'maison-xciv',
      script: 'backend/server.js',

      // Instances : 'max' utilise tous les CPU disponibles
      // Mettre 1 si JSON DB (pas de concurrence multi-process sur les fichiers)
      instances: 1,
      exec_mode: 'fork',

      // Variables d'environnement par défaut
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      // Variables d'environnement production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logs
      out_file: '/var/log/pm2/maison-xciv-out.log',
      error_file: '/var/log/pm2/maison-xciv-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // Auto-restart en cas de crash
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',

      // Redémarrage gracieux
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
    }
  ]
};
