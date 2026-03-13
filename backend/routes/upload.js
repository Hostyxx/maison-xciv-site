/**
 * backend/routes/upload.js
 * ─────────────────────────────────────────────────────────────
 * Route d'upload d'images pour les montres.
 *
 * POST /api/upload
 *   → multipart/form-data avec le champ "image"
 *   → retourne { success: true, url: "/assets/images/uploads/xxx.jpg" }
 *
 * Protégée par requireAuth : seul l'admin peut uploader.
 */

const express        = require('express');
const router         = express.Router();
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const { requireAuth } = require('../middleware/auth');

// ─── Dossier de destination ──────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../frontend/assets/images/uploads');

// Crée le dossier si inexistant
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Configuration Multer ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),

  filename: (req, file, cb) => {
    // Nom unique : timestamp + extension originale
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `watch_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Accepte uniquement les images
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  const ext     = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté. Utiliser : JPG, PNG, WEBP, AVIF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB max
});

// ─── Route ───────────────────────────────────────────────────

/**
 * POST /api/upload
 * Upload une image et retourne son URL publique.
 */
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Aucun fichier reçu.' });
  }

  const publicUrl = `/assets/images/uploads/${req.file.filename}`;
  res.json({ success: true, url: publicUrl, filename: req.file.filename });
});

// Gestion des erreurs Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'Fichier trop lourd (max 8 MB).' });
    }
  }
  res.status(400).json({ success: false, error: err.message });
});

module.exports = router;
