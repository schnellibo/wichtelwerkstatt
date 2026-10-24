const express = require('express');
const crypto = require('crypto');
const path = require('path');
const store = require('./store');
const { drawAssignments } = require('./draw');
const mailer = require('./mailer');

const PORT = process.env.PORT || 3000;
const app = express();
app.set('trust proxy', true); // hinter Fly.io-Proxy: echtes https/Host für Links
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const token = () => crypto.randomBytes(18).toString('base64url');
const id = () => crypto.randomBytes(6).toString('hex');
const baseUrl = (req) => process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
const clean = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// ---------- Ansichten für Oberwichtel & Eingeladene ----------
function adminView(e) {
  return {
    name: e.name, maxAmount: e.maxAmount, giftDate: e.giftDate, inviteText: e.inviteText,
    drawAt: e.drawAt, drawnAt: e.drawnAt, drawError: e.drawError,
    inviteToken: e.inviteToken,
    participants: e.participants.map(({ id, name, email, wishlist, joinedAt, mail }) => ({ id, name, email, wishlist, joinedAt, mail })),
    exclusions: e.exclusions,
    smtpConfigured: mailer.smtpConfigured,
  };
}
function publicView(e) {
  return {
    name: e.name, maxAmount: e.maxAmount, giftDate: e.giftDate, inviteText: e.inviteText,
    drawn: !!e.drawnAt, participants: e.participants.map((p) => p.name),
  };
}

function applyDetails(e, body) {
  if (body.name !== undefined) e.name = clean(body.name, 120) || e.name;
  if (body.maxAmount !== undefined) e.maxAmount = clean(String(body.maxAmount), 20);
  if (body.giftDate !== undefined) e.giftDate = clean(body.giftDate, 40);
  if (body.inviteText !== undefined) e.inviteText = clean(body.inviteText, 3000);
  if (body.drawAt !== undefined) e.drawAt = clean(body.drawAt, 40) || null;
}

// ---------- Ziehung ----------
async function runDraw(e) {
  if (e.drawnAt) throw new Error('Die Ziehung hat bereits stattgefunden.');
  if (e.participants.length < 3) throw new Error('Für die Ziehung braucht ihr mindestens 3 Wichtel.');
  const result = drawAssignments(e.participants.map((p) => p.id), e.exclusions);
  if (!result) throw new Error('Mit diesen Ausschlüssen ist keine gültige Ziehung möglich. Bitte entferne einen Ausschluss.');

  e.assignments = result;
  e.drawnAt = new Date().toISOString();
  e.drawError = null;
  store.save();
  await sendMails(e);
}

async function sendMails(e, onlyFailed = false) {
  const byId = Object.fromEntries(e.participants.map((p) => [p.id, p]));
  for (const giver of e.participants) {
    if (onlyFailed && giver.mail === 'sent') continue;
    try {
      await mailer.sendAssignment(e, giver, byId[e.assignments[giver.id]]);
      giver.mail = 'sent';
    } catch (err) {
      console.error(`[mail] Fehler an ${giver.email}:`, err.message);
      giver.mail = 'error';
    }
  }
  store.save();
}

// Geplante Ziehungen jede Minute prüfen
setInterval(() => {
  const now = Date.now();
  for (const e of store.all()) {
    if (!e.drawnAt && !e.drawError && e.drawAt && new Date(e.drawAt).getTime() <= now) {
      runDraw(e).catch((err) => { e.drawError = err.message; store.save(); });
    }
  }
}, 60 * 1000);

// ---------- API ----------
app.post('/api/events', async (req, res) => {
  const name = clean(req.body.name, 120);
  if (!name) return res.status(400).json({ error: 'Bitte gib der Aktion einen Namen.' });
  const e = {
    id: id(), adminToken: token(), inviteToken: token(), name,
    maxAmount: '', giftDate: '', inviteText: '', drawAt: null,
    participants: [], exclusions: [], assignments: null, drawnAt: null, drawError: null,
    createdAt: new Date().toISOString(),
  };
  applyDetails(e, req.body);
  store.add(e);

  const organizerEmail = clean(req.body.organizerEmail, 200);
  if (organizerEmail && isEmail(organizerEmail)) {
    const b = baseUrl(req);
    mailer.sendAdminLink(e, organizerEmail, `${b}/admin/${e.adminToken}`, `${b}/einladung/${e.inviteToken}`)
      .catch((err) => console.error('[mail] Admin-Link:', err.message));
  }
  res.json({ adminToken: e.adminToken });
});

const withAdmin = (req, res, next) => {
  req.event = store.byAdminToken(req.params.token);
  if (!req.event) return res.status(404).json({ error: 'Diese Wichtelaktion gibt es nicht.' });
  next();
};
const notDrawn = (req, res, next) =>
  req.event.drawnAt ? res.status(409).json({ error: 'Die Ziehung hat bereits stattgefunden.' }) : next();

app.get('/api/admin/:token', withAdmin, (req, res) => res.json(adminView(req.event)));

app.put('/api/admin/:token', withAdmin, (req, res) => {
  const e = req.event;
  if (req.body.drawAt !== undefined && e.drawError) e.drawError = null; // neuer Versuch
  applyDetails(e, req.body);
  store.save();
  res.json(adminView(e));
});

app.delete('/api/admin/:token/participants/:pid', withAdmin, notDrawn, (req, res) => {
  const e = req.event;
  e.participants = e.participants.filter((p) => p.id !== req.params.pid);
  e.exclusions = e.exclusions.filter(([a, b]) => a !== req.params.pid && b !== req.params.pid);
  store.save();
  res.json(adminView(e));
});

app.post('/api/admin/:token/exclusions', withAdmin, notDrawn, (req, res) => {
  const e = req.event;
  const { a, b } = req.body;
  const ids = new Set(e.participants.map((p) => p.id));
  if (!ids.has(a) || !ids.has(b) || a === b) return res.status(400).json({ error: 'Bitte wähle zwei verschiedene Wichtel aus.' });
  if (e.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a)))
    return res.status(400).json({ error: 'Dieses Paar ist bereits ausgeschlossen.' });
  e.exclusions.push([a, b]);
  store.save();
  res.json(adminView(e));
});

app.delete('/api/admin/:token/exclusions/:idx', withAdmin, notDrawn, (req, res) => {
  req.event.exclusions.splice(Number(req.params.idx), 1);
  store.save();
  res.json(adminView(req.event));
});

app.post('/api/admin/:token/draw', withAdmin, async (req, res) => {
  try {
    await runDraw(req.event);
    res.json(adminView(req.event));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/:token/resend', withAdmin, async (req, res) => {
  if (!req.event.drawnAt) return res.status(400).json({ error: 'Es wurde noch nicht gezogen.' });
  await sendMails(req.event, true);
  res.json(adminView(req.event));
});

app.get('/api/invite/:token', (req, res) => {
  const e = store.byInviteToken(req.params.token);
  if (!e) return res.status(404).json({ error: 'Diese Einladung gibt es nicht (mehr).' });
  res.json(publicView(e));
});

app.post('/api/invite/:token/join', (req, res) => {
  const e = store.byInviteToken(req.params.token);
  if (!e) return res.status(404).json({ error: 'Diese Einladung gibt es nicht (mehr).' });
  if (e.drawnAt) return res.status(409).json({ error: 'Schade – die Ziehung hat schon stattgefunden.' });

  const name = clean(req.body.name, 80);
  const email = clean(req.body.email, 200).toLowerCase();
  const wishlist = clean(req.body.wishlist, 3000);
  if (!name) return res.status(400).json({ error: 'Bitte gib deinen Namen an.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Bitte gib eine gültige E-Mail-Adresse an.' });

  const existing = e.participants.find((p) => p.email === email);
  if (existing) {
    // gleiche E-Mail = Angaben aktualisieren (z. B. Wunschzettel ergänzen)
    Object.assign(existing, { name, wishlist });
  } else {
    e.participants.push({ id: id(), name, email, wishlist, joinedAt: new Date().toISOString() });
  }
  store.save();
  res.json({ ok: true, updated: !!existing, ...publicView(e) });
});

// ---------- Seiten ----------
app.get('/admin/:token', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/einladung/:token', (req, res) => res.sendFile(path.join(__dirname, 'public', 'join.html')));

app.listen(PORT, () => {
  console.log(`🎄 Wichtel-App läuft auf http://localhost:${PORT}`);
  if (!mailer.smtpConfigured) console.log('ℹ️  Kein SMTP konfiguriert – E-Mails werden in ./outbox gespeichert.');
});
