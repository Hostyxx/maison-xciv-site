/**
 * database/database.js
 * ─────────────────────────────────────────────────────────────
 * Base de données JSON — zéro dépendance, zéro compilation.
 *
 * Les données sont stockées dans /database/watches.json.
 * Les lectures sont synchrones (intégrées à Node.js core).
 * Suffisant pour un catalogue de montres de collection.
 */

const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'watches.json');

// ─── Données initiales (seed) ────────────────────────────────
const SEED_DATA = [
  {
    id:          1,
    name:        'Daytona',
    brand:       'Rolex',
    price:       'Sur demande',
    description: 'Le chronographe de référence. Boîtier Oystersteel, cadran noir, lunette Cerachrom noire. Précision chronométrique absolue.',
    image:       '',
    year:        2022,
    status:      'Disponible',
    whatsapp:    '33601918798',
    message:     'Bonjour, je suis intéressé(e) par la Rolex Daytona disponible sur votre site.',
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString()
  },
  {
    id:          2,
    name:        'Datejust 36',
    brand:       'Rolex',
    price:       'Sur demande',
    description: 'Icône intemporelle depuis 1945. Cadran olive, lunette cannelée, bracelet Jubilé. Élégance transcendant les modes.',
    image:       '',
    year:        2021,
    status:      'Disponible',
    whatsapp:    '33601918798',
    message:     'Bonjour, je suis intéressé(e) par la Rolex Datejust 36.',
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString()
  },
  {
    id:          3,
    name:        'GMT-Master II Pepsi',
    brand:       'Rolex',
    price:       'Sur demande',
    description: 'La montre des voyageurs d\'exception. Lunette bicolore Pepsi Cerachrom, deux fuseaux horaires. Présence universelle.',
    image:       '',
    year:        2023,
    status:      'Réservé',
    whatsapp:    '33601918798',
    message:     'Bonjour, je suis intéressé(e) par la Rolex GMT-Master II Pepsi.',
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString()
  },
  {
    id:          4,
    name:        'Submariner Date',
    brand:       'Rolex',
    price:       'Sur demande',
    description: 'L\'outil de plongée par excellence. Lunette Cerachrom noire, étanche à 300m. Une icône du design horloger moderne.',
    image:       '',
    year:        2022,
    status:      'Disponible',
    whatsapp:    '33601918798',
    message:     'Bonjour, je suis intéressé(e) par la Rolex Submariner Date.',
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString()
  },
  {
    id:          5,
    name:        'Royal Oak 37mm',
    brand:       'Audemars Piguet',
    price:       'Sur demande',
    description: 'Le luxe sportif réinventé par Gérald Genta. Boîtier octogonal signature, cadran tapisserie, bracelet intégré.',
    image:       '',
    year:        2020,
    status:      'Vendu',
    whatsapp:    '33601918798',
    message:     'Bonjour, je suis intéressé(e) par la Audemars Piguet Royal Oak.',
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString()
  },
  {
    id:          6,
    name:        'Nautilus 5711',
    brand:       'Patek Philippe',
    price:       'Sur demande',
    description: 'Le graal horloger. Réf. 5711/1A-010, acier, cadran vert olive. Pièce collector d\'exception, très rare sur le marché.',
    image:       '',
    year:        2019,
    status:      'Vendu',
    whatsapp:    '33601918798',
    message:     'Bonjour, je suis intéressé(e) par la Patek Philippe Nautilus 5711.',
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString()
  }
];

// ─── Initialisation ──────────────────────────────────────────
// Crée le fichier JSON avec les données de démonstration
// si il n'existe pas encore.
if (!fs.existsSync(DB_FILE)) {
  const initial = { nextId: SEED_DATA.length + 1, watches: SEED_DATA };
  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
  console.log(`[DB] Fichier créé : ${DB_FILE} (${SEED_DATA.length} montres)`);
}

// ─── API publique ─────────────────────────────────────────────

/**
 * Lit toute la base de données depuis le fichier JSON.
 * @returns {{ nextId: number, watches: Array }}
 */
function readDB() {
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(raw);
}

/**
 * Écrit la base de données dans le fichier JSON.
 * @param {{ nextId: number, watches: Array }} data
 */
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readDB, writeDB };
