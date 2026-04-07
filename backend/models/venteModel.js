/**
 * backend/models/venteModel.js
 * ─────────────────────────────────────────────────────────────
 * CRUD + stats + CSV pour l'historique des ventes.
 */

const { readVentes, writeVentes } = require('../../database/ventesDB');

const VenteModel = {

  /* ── Lecture avec filtres ──────────────────────────────────── */
  getAll(filters = {}) {
    const { ventes } = readVentes();
    let result = [...ventes];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(v =>
        (v.brand       || '').toLowerCase().includes(s) ||
        (v.model       || '').toLowerCase().includes(s) ||
        (v.reference   || '').toLowerCase().includes(s) ||
        (v.buyerName   || '').toLowerCase().includes(s) ||
        String(v.year  || '').includes(s)
      );
    }
    if (filters.brand)    result = result.filter(v => (v.brand || '').toLowerCase() === filters.brand.toLowerCase());
    if (filters.year)     result = result.filter(v => new Date(v.soldAt).getFullYear() === parseInt(filters.year, 10));
    if (filters.dateFrom) result = result.filter(v => v.soldAt >= filters.dateFrom);
    if (filters.dateTo)   result = result.filter(v => v.soldAt <= filters.dateTo);

    result.sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt));
    return result;
  },

  getById(id) {
    const { ventes } = readVentes();
    return ventes.find(v => v.id === id) || null;
  },

  /* ── Création ──────────────────────────────────────────────── */
  create(data) {
    const db = readVentes();
    db.lastId++;

    const vente = {
      id:            db.lastId,
      watchId:       data.watchId       || null,
      brand:         (data.brand        || '').trim(),
      model:         (data.model        || '').trim(),
      reference:     (data.reference    || '').trim(),
      year:          parseInt(data.year) || null,
      serialNumber:  (data.serialNumber || '').trim(),
      buyerName:     (data.buyerName    || '').trim(),
      buyerPhone:    (data.buyerPhone   || '').trim(),
      price:         parseFloat(data.price) || 0,
      soldAt:        data.soldAt || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'Virement bancaire',
      note:          (data.note         || '').trim(),
      createdAt:     new Date().toISOString()
    };

    db.ventes.push(vente);
    writeVentes(db);
    return vente;
  },

  /* ── Mise à jour ───────────────────────────────────────────── */
  update(id, data) {
    const db  = readVentes();
    const idx = db.ventes.findIndex(v => v.id === id);
    if (idx === -1) return null;

    const old     = db.ventes[idx];
    const f = (key, fallback) => data[key] !== undefined ? data[key] : fallback;

    const updated = {
      ...old,
      watchId:       f('watchId',       old.watchId),
      brand:         (f('brand',        old.brand)  || '').trim(),
      model:         (f('model',        old.model)  || '').trim(),
      reference:     (f('reference',    old.reference) || '').trim(),
      year:          data.year !== undefined ? (parseInt(data.year) || null) : old.year,
      serialNumber:  (f('serialNumber', old.serialNumber) || '').trim(),
      buyerName:     (f('buyerName',    old.buyerName) || '').trim(),
      buyerPhone:    (f('buyerPhone',   old.buyerPhone) || '').trim(),
      price:         data.price !== undefined ? (parseFloat(data.price) || 0) : old.price,
      soldAt:        f('soldAt',        old.soldAt),
      paymentMethod: f('paymentMethod', old.paymentMethod),
      note:          (f('note',         old.note)   || '').trim(),
      updatedAt:     new Date().toISOString()
    };

    db.ventes[idx] = updated;
    writeVentes(db);
    return updated;
  },

  /* ── Suppression ───────────────────────────────────────────── */
  delete(id) {
    const db  = readVentes();
    const idx = db.ventes.findIndex(v => v.id === id);
    if (idx === -1) return false;
    db.ventes.splice(idx, 1);
    writeVentes(db);
    return true;
  },

  /* ── Statistiques globales ─────────────────────────────────── */
  getStats() {
    const { ventes } = readVentes();

    const totalRevenue = ventes.reduce((s, v) => s + (v.price || 0), 0);
    const totalVentes  = ventes.length;
    const avgPrice     = totalVentes > 0 ? totalRevenue / totalVentes : 0;

    // Top marque
    const brandCount = {};
    ventes.forEach(v => {
      if (!v.brand) return;
      brandCount[v.brand] = (brandCount[v.brand] || 0) + 1;
    });
    const topBrand = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0] || null;

    // Par marque
    const byBrand = {};
    ventes.forEach(v => {
      if (!v.brand) return;
      if (!byBrand[v.brand]) byBrand[v.brand] = { count: 0, revenue: 0 };
      byBrand[v.brand].count++;
      byBrand[v.brand].revenue += v.price || 0;
    });

    // Par année de vente
    const byYear = {};
    ventes.forEach(v => {
      if (!v.soldAt) return;
      const yr = new Date(v.soldAt).getFullYear();
      if (!byYear[yr]) byYear[yr] = { count: 0, revenue: 0 };
      byYear[yr].count++;
      byYear[yr].revenue += v.price || 0;
    });

    return {
      totalRevenue,
      totalVentes,
      avgPrice,
      topBrand:      topBrand ? topBrand[0] : '—',
      topBrandCount: topBrand ? topBrand[1] : 0,
      byBrand,
      byYear
    };
  },

  /* ── Export CSV ────────────────────────────────────────────── */
  generateCSV(filters = {}) {
    const ventes = this.getAll(filters);
    const headers = [
      'Date vente','Marque','Modèle','Référence','Millésime',
      'N° Série','Prix (€)','Acheteur','Téléphone','Mode paiement','Note'
    ];
    const rows = ventes.map(v => [
      v.soldAt,
      v.brand,
      v.model,
      v.reference,
      v.year || '',
      v.serialNumber,
      v.price,
      v.buyerName,
      v.buyerPhone,
      v.paymentMethod,
      (v.note || '').replace(/\n/g, ' ')
    ].map(val => `"${String(val ?? '').replace(/"/g, '""')}"`));

    return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  }
};

module.exports = VenteModel;
