/**
 * backend/models/invoiceModel.js
 * ─────────────────────────────────────────────────────────────
 * CRUD complet pour les factures.
 */

const { readInvoices, writeInvoices } = require('../../database/invoicesDB');

const PAYMENT_LABELS  = { unpaid: 'Non payé', partial: 'Partiellement payé', paid: 'Payé' };
const STATUS_LABELS   = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée', pending: 'En attente' };

const InvoiceModel = {

  /* ── Lecture avec filtres ──────────────────────────────────── */
  getAll(filters = {}) {
    const { invoices } = readInvoices();
    let result = [...invoices];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(inv =>
        inv.number.toLowerCase().includes(s) ||
        `${inv.client.firstName} ${inv.client.lastName}`.toLowerCase().includes(s) ||
        (inv.client.email || '').toLowerCase().includes(s) ||
        (inv.product.brand || '').toLowerCase().includes(s) ||
        (inv.product.model || '').toLowerCase().includes(s)
      );
    }
    if (filters.status)        result = result.filter(inv => inv.status === filters.status);
    if (filters.paymentMethod) result = result.filter(inv => inv.financial.paymentMethod === filters.paymentMethod);
    if (filters.paymentStatus) result = result.filter(inv => inv.financial.paymentStatus === filters.paymentStatus);
    if (filters.dateFrom)      result = result.filter(inv => inv.created_at >= filters.dateFrom);
    if (filters.dateTo)        result = result.filter(inv => inv.created_at <= filters.dateTo + 'T23:59:59');
    if (filters.amountMin)     result = result.filter(inv => inv.financial.totalTTC >= parseFloat(filters.amountMin));
    if (filters.amountMax)     result = result.filter(inv => inv.financial.totalTTC <= parseFloat(filters.amountMax));

    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return result;
  },

  getById(id) {
    const { invoices } = readInvoices();
    return invoices.find(inv => inv.id === id) || null;
  },

  /* ── Prochain numéro disponible ────────────────────────────── */
  getNextNumber() {
    const db   = readInvoices();
    const year = new Date().getFullYear();
    return `XCIV-${year}-${String(db.lastNumber + 1).padStart(3, '0')}`;
  },

  /* ── Création ──────────────────────────────────────────────── */
  create(data) {
    const db = readInvoices();
    db.lastId++;
    db.lastNumber++;
    const year   = new Date().getFullYear();
    const number = (data.number || '').trim() || `XCIV-${year}-${String(db.lastNumber).padStart(3, '0')}`;

    const invoice = {
      id:         db.lastId,
      number,
      status:     data.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      client: {
        firstName:             (data.client?.firstName             || '').trim(),
        lastName:              (data.client?.lastName              || '').trim(),
        email:                 (data.client?.email                 || '').trim(),
        phone:                 (data.client?.phone                 || '').trim(),
        billingAddress:        (data.client?.billingAddress        || '').trim(),
        shippingAddress:       (data.client?.shippingAddress       || '').trim(),
        shippingSameAsBilling: data.client?.shippingSameAsBilling !== false
      },

      product: {
        description:  (data.product?.description  || '').trim(),
        brand:        (data.product?.brand        || '').trim(),
        model:        (data.product?.model        || '').trim(),
        reference:    (data.product?.reference    || '').trim(),
        year:         (data.product?.year         || '').trim(),
        serialNumber: (data.product?.serialNumber || '').trim(),
        quantity:     parseFloat(data.product?.quantity)  || 1,
        unitPrice:    parseFloat(data.product?.unitPrice) || 0
      },

      financial: {
        totalHT:       parseFloat(data.financial?.totalHT)       || 0,
        tvaRate:       parseFloat(data.financial?.tvaRate)       ?? 20,
        tva:           parseFloat(data.financial?.tva)           || 0,
        totalTTC:      parseFloat(data.financial?.totalTTC)      || 0,
        deposit:       parseFloat(data.financial?.deposit)       || 0,
        remaining:     parseFloat(data.financial?.remaining)     || 0,
        paymentMethod: data.financial?.paymentMethod || 'Virement bancaire',
        paymentStatus: data.financial?.paymentStatus || 'unpaid',
        paymentDate:   data.financial?.paymentDate   || ''
      },

      notes: {
        internal: (data.notes?.internal || '').trim(),
        client:   (data.notes?.client   || '').trim()
      },

      history: [{ date: new Date().toISOString(), action: 'Facture créée', by: 'admin' }]
    };

    db.invoices.push(invoice);
    writeInvoices(db);
    return invoice;
  },

  /* ── Mise à jour ───────────────────────────────────────────── */
  update(id, data) {
    const db  = readInvoices();
    const idx = db.invoices.findIndex(inv => inv.id === id);
    if (idx === -1) return null;

    const old     = db.invoices[idx];
    const changes = [];

    if (data.status && data.status !== old.status)
      changes.push(`Statut → ${STATUS_LABELS[data.status] || data.status}`);
    if (data.financial?.paymentStatus && data.financial.paymentStatus !== old.financial.paymentStatus)
      changes.push(`Paiement → ${PAYMENT_LABELS[data.financial.paymentStatus] || data.financial.paymentStatus}`);

    const f = (key, src, fallback) => src?.[key] !== undefined ? src[key] : fallback;

    const updated = {
      ...old,
      number:     (data.number     || old.number).trim(),
      status:     data.status      || old.status,
      updated_at: new Date().toISOString(),

      client: {
        firstName:             f('firstName',             data.client, old.client.firstName),
        lastName:              f('lastName',              data.client, old.client.lastName),
        email:                 f('email',                 data.client, old.client.email),
        phone:                 f('phone',                 data.client, old.client.phone),
        billingAddress:        f('billingAddress',        data.client, old.client.billingAddress),
        shippingAddress:       f('shippingAddress',       data.client, old.client.shippingAddress),
        shippingSameAsBilling: f('shippingSameAsBilling', data.client, old.client.shippingSameAsBilling)
      },

      product: {
        description:  f('description',  data.product, old.product.description),
        brand:        f('brand',        data.product, old.product.brand),
        model:        f('model',        data.product, old.product.model),
        reference:    f('reference',    data.product, old.product.reference),
        year:         f('year',         data.product, old.product.year),
        serialNumber: f('serialNumber', data.product, old.product.serialNumber),
        quantity:     data.product?.quantity  !== undefined ? parseFloat(data.product.quantity)  : old.product.quantity,
        unitPrice:    data.product?.unitPrice !== undefined ? parseFloat(data.product.unitPrice) : old.product.unitPrice
      },

      financial: {
        totalHT:       data.financial?.totalHT       !== undefined ? parseFloat(data.financial.totalHT)   : old.financial.totalHT,
        tvaRate:       data.financial?.tvaRate        !== undefined ? parseFloat(data.financial.tvaRate)   : old.financial.tvaRate,
        tva:           data.financial?.tva            !== undefined ? parseFloat(data.financial.tva)        : old.financial.tva,
        totalTTC:      data.financial?.totalTTC       !== undefined ? parseFloat(data.financial.totalTTC)  : old.financial.totalTTC,
        deposit:       data.financial?.deposit        !== undefined ? parseFloat(data.financial.deposit)   : old.financial.deposit,
        remaining:     data.financial?.remaining      !== undefined ? parseFloat(data.financial.remaining) : old.financial.remaining,
        paymentMethod: f('paymentMethod', data.financial, old.financial.paymentMethod),
        paymentStatus: f('paymentStatus', data.financial, old.financial.paymentStatus),
        paymentDate:   f('paymentDate',   data.financial, old.financial.paymentDate)
      },

      notes: {
        internal: f('internal', data.notes, old.notes.internal),
        client:   f('client',   data.notes, old.notes.client)
      },

      history: [
        ...old.history,
        ...(changes.length > 0
          ? changes.map(action => ({ date: new Date().toISOString(), action, by: 'admin' }))
          : [{ date: new Date().toISOString(), action: 'Facture modifiée', by: 'admin' }])
      ]
    };

    db.invoices[idx] = updated;
    writeInvoices(db);
    return updated;
  },

  /* ── Suppression ───────────────────────────────────────────── */
  delete(id) {
    const db  = readInvoices();
    const idx = db.invoices.findIndex(inv => inv.id === id);
    if (idx === -1) return false;
    db.invoices.splice(idx, 1);
    writeInvoices(db);
    return true;
  },

  /* ── Duplication ───────────────────────────────────────────── */
  duplicate(id) {
    const db       = readInvoices();
    const original = db.invoices.find(inv => inv.id === id);
    if (!original) return null;

    db.lastId++;
    db.lastNumber++;
    const year = new Date().getFullYear();

    const copy = {
      ...JSON.parse(JSON.stringify(original)),
      id:         db.lastId,
      number:     `XCIV-${year}-${String(db.lastNumber).padStart(3, '0')}`,
      status:     'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      financial:  {
        ...original.financial,
        paymentStatus: 'unpaid',
        paymentDate:   '',
        deposit:       0,
        remaining:     original.financial.totalTTC
      },
      history: [{ date: new Date().toISOString(), action: `Dupliquée depuis ${original.number}`, by: 'admin' }]
    };

    db.invoices.push(copy);
    writeInvoices(db);
    return copy;
  },

  /* ── Statistiques globales ─────────────────────────────────── */
  getStats() {
    const { invoices } = readInvoices();
    const total      = invoices.length;
    const totalTTC   = invoices.reduce((s, inv) => s + (inv.financial.totalTTC || 0), 0);
    const totalPaid  = invoices
      .filter(inv => inv.financial.paymentStatus === 'paid')
      .reduce((s, inv) => s + (inv.financial.totalTTC || 0), 0);
    const totalPartial = invoices
      .filter(inv => inv.financial.paymentStatus === 'partial')
      .reduce((s, inv) => s + (inv.financial.deposit || 0), 0);
    const totalReceived = totalPaid + totalPartial;
    const totalPending  = totalTTC - totalReceived;

    const byStatus = {};
    ['draft', 'sent', 'paid', 'cancelled', 'pending'].forEach(s => {
      byStatus[s] = invoices.filter(inv => inv.status === s).length;
    });

    return { total, totalTTC, totalPaid: totalReceived, totalPending, byStatus };
  },

  /* ── Résumé clients ────────────────────────────────────────── */
  getClientsSummary() {
    const { invoices } = readInvoices();
    const map = new Map();

    invoices.forEach(inv => {
      const key = inv.client.email || `${inv.client.firstName}_${inv.client.lastName}`;
      if (!map.has(key)) {
        map.set(key, {
          name:         `${inv.client.firstName} ${inv.client.lastName}`.trim() || '—',
          email:        inv.client.email,
          phone:        inv.client.phone,
          invoiceCount: 0,
          totalTTC:     0,
          totalPaid:    0,
          lastDate:     '',
          invoices:     []
        });
      }
      const c = map.get(key);
      c.invoiceCount++;
      c.totalTTC += inv.financial.totalTTC || 0;
      if (inv.financial.paymentStatus === 'paid')    c.totalPaid += inv.financial.totalTTC || 0;
      if (inv.financial.paymentStatus === 'partial') c.totalPaid += inv.financial.deposit  || 0;
      if (!c.lastDate || inv.created_at > c.lastDate) c.lastDate = inv.created_at;
      c.invoices.push({
        id:            inv.id,
        number:        inv.number,
        date:          inv.created_at,
        status:        inv.status,
        totalTTC:      inv.financial.totalTTC,
        paymentStatus: inv.financial.paymentStatus,
        product:       `${inv.product.brand} ${inv.product.model}`.trim() || inv.product.description
      });
    });

    return Array.from(map.values())
      .map(c => ({ ...c, totalRemaining: c.totalTTC - c.totalPaid }))
      .sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
  },

  /* ── Export CSV ────────────────────────────────────────────── */
  generateCSV(filters = {}) {
    const invoices = this.getAll(filters);
    const headers = [
      'N° Facture','Date','Statut','Prénom','Nom','Email','Téléphone',
      'Adresse facturation','Produit','Marque','Modèle','Référence',
      'Année','N° Série','Qté','Prix unitaire','Total HT','TVA %',
      'TVA','Total TTC','Acompte','Reste à payer','Mode de paiement',
      'Statut paiement','Date paiement','Note interne','Note client'
    ];
    const rows = invoices.map(inv => [
      inv.number,
      inv.created_at.split('T')[0],
      STATUS_LABELS[inv.status] || inv.status,
      inv.client.firstName,
      inv.client.lastName,
      inv.client.email,
      inv.client.phone,
      inv.client.billingAddress.replace(/\n/g, ' '),
      inv.product.description,
      inv.product.brand,
      inv.product.model,
      inv.product.reference,
      inv.product.year,
      inv.product.serialNumber,
      inv.product.quantity,
      inv.product.unitPrice,
      inv.financial.totalHT,
      inv.financial.tvaRate,
      inv.financial.tva,
      inv.financial.totalTTC,
      inv.financial.deposit,
      inv.financial.remaining,
      inv.financial.paymentMethod,
      PAYMENT_LABELS[inv.financial.paymentStatus] || inv.financial.paymentStatus,
      inv.financial.paymentDate,
      inv.notes.internal.replace(/\n/g, ' '),
      inv.notes.client.replace(/\n/g, ' ')
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`));

    return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  }
};

module.exports = InvoiceModel;
