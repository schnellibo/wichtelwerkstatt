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
// API-Antworten nie zwischenspeichern – die Teilnehmerliste soll immer aktuell sein
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use(express.static(path.join(__dirname, 'public')));

const token = () => crypto.randomBytes(18).toString('base64url');
const id = () => crypto.randomBytes(6).toString('hex');
const baseUrl = (req) => process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
const clean = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// ---------- Sprache der Antworten (Deutsch / Englisch) ----------
const MSG = {
  de: {
    nameRequired: 'Bitte gib der Aktion einen Namen.',
    organizerEmailInvalid: 'Bitte prüfe deine E-Mail-Adresse – oder lass das Feld leer.',
    eventNotFound: 'Diese Wichtelaktion gibt es nicht.',
    alreadyDrawn: 'Die Ziehung hat bereits stattgefunden.',
    tooFew: 'Für die Ziehung braucht ihr mindestens 3 Wichtel.',
    impossible: 'Mit diesen Ausschlüssen ist keine gültige Ziehung möglich. Bitte entferne einen Ausschluss.',
    pickTwo: 'Bitte wähle zwei verschiedene Wichtel aus.',
    pairExists: 'Dieses Paar ist bereits ausgeschlossen.',
    notDrawnYet: 'Es wurde noch nicht gezogen.',
    inviteNotFound: 'Diese Einladung gibt es nicht (mehr).',
    joinClosed: 'Schade – die Ziehung hat schon stattgefunden.',
    nameMissing: 'Bitte gib deinen Namen an.',
    emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse an.',
  },
  en: {
    nameRequired: 'Please give your Secret Santa a name.',
    organizerEmailInvalid: 'Please check your email address – or leave the field empty.',
    eventNotFound: "This Secret Santa doesn't exist.",
    alreadyDrawn: 'The names have already been drawn.',
    tooFew: 'You need at least 3 elves for the draw.',
    impossible: 'No valid draw is possible with these exclusions. Please remove one.',
    pickTwo: 'Please pick two different elves.',
    pairExists: 'This pair is already excluded.',
    notDrawnYet: "The names haven't been drawn yet.",
    inviteNotFound: "This invitation doesn't exist (anymore).",
    joinClosed: 'Too bad – the names have already been drawn.',
    nameMissing: 'Please enter your name.',
    emailInvalid: 'Please enter a valid email address.',
  },
};
const langOf = (req) => (req.get('X-Lang') === 'en' ? 'en' : 'de');
// Schlüssel → Text; unbekannte Werte (z. B. alte, schon fertige Texte) bleiben, wie sie sind
const msg = (lang, key) => MSG[lang][key] || key;
const fail = (req, res, status, key) => res.status(status).json({ error: msg(langOf(req), key) });

// ---------- Ansichten für Oberwichtel & Eingeladene ----------
function adminView(e, lang) {
  return {
    name: e.name, maxAmount: e.maxAmount, giftDate: e.giftDate, inviteText: e.inviteText,
    drawAt: e.drawAt, drawnAt: e.drawnAt, drawError: e.drawError && msg(lang, e.drawError),
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
  if (e.drawnAt) throw new Error('alreadyDrawn');
  if (e.participants.length < 3) throw new Error('tooFew');
  const result = drawAssignments(e.participants.map((p) => p.id), e.exclusions);
  if (!result) throw new Error('impossible');

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
  if (!name) return fail(req, res, 400, 'nameRequired');
  const organizerEmail = clean(req.body.organizerEmail, 200);
  if (organizerEmail && !isEmail(organizerEmail))
    return fail(req, res, 400, 'organizerEmailInvalid');
  const e = {
    id: id(), adminToken: token(), inviteToken: token(), name,
    maxAmount: '', giftDate: '', inviteText: '', drawAt: null,
    participants: [], exclusions: [], assignments: null, drawnAt: null, drawError: null,
    lang: langOf(req), // Sprache des Oberwichtels, z. B. für seine E-Mails
    createdAt: new Date().toISOString(),
  };
  applyDetails(e, req.body);
  store.add(e);

  // Auf den Versand warten, damit der Oberwichtel erfährt, ob die Mail rausging
  let adminMail = null;
  if (organizerEmail) {
    const b = baseUrl(req);
    try {
      await mailer.sendAdminLink(e, organizerEmail, `${b}/admin/${e.adminToken}`, `${b}/einladung/${e.inviteToken}`, e.lang);
      adminMail = { status: 'sent', to: organizerEmail };
    } catch (err) {
      console.error(`[mail] Admin-Link an ${organizerEmail} fehlgeschlagen:`, err.message);
      adminMail = { status: 'error', to: organizerEmail, error: err.message };
    }
  }
  res.json({ adminToken: e.adminToken, adminMail });
});

const withAdmin = (req, res, next) => {
  req.event = store.byAdminToken(req.params.token);
  if (!req.event) return fail(req, res, 404, 'eventNotFound');
  next();
};
const notDrawn = (req, res, next) =>
  req.event.drawnAt ? fail(req, res, 409, 'alreadyDrawn') : next();

app.get('/api/admin/:token', withAdmin, (req, res) => res.json(adminView(req.event, langOf(req))));

// Aktion endgültig löschen – samt Anmeldungen, Wunschzetteln und Losen
app.delete('/api/admin/:token', withAdmin, (req, res) => {
  store.remove(req.event);
  res.json({ ok: true });
});

app.put('/api/admin/:token', withAdmin, (req, res) => {
  const e = req.event;
  if (req.body.drawAt !== undefined && e.drawError) e.drawError = null; // neuer Versuch
  applyDetails(e, req.body);
  store.save();
  res.json(adminView(e, langOf(req)));
});

app.delete('/api/admin/:token/participants/:pid', withAdmin, notDrawn, (req, res) => {
  const e = req.event;
  e.participants = e.participants.filter((p) => p.id !== req.params.pid);
  e.exclusions = e.exclusions.filter(([a, b]) => a !== req.params.pid && b !== req.params.pid);
  store.save();
  res.json(adminView(e, langOf(req)));
});

app.post('/api/admin/:token/exclusions', withAdmin, notDrawn, (req, res) => {
  const e = req.event;
  const { a, b } = req.body;
  const ids = new Set(e.participants.map((p) => p.id));
  if (!ids.has(a) || !ids.has(b) || a === b) return fail(req, res, 400, 'pickTwo');
  if (e.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a)))
    return fail(req, res, 400, 'pairExists');
  e.exclusions.push([a, b]);
  store.save();
  res.json(adminView(e, langOf(req)));
});

app.delete('/api/admin/:token/exclusions/:idx', withAdmin, notDrawn, (req, res) => {
  req.event.exclusions.splice(Number(req.params.idx), 1);
  store.save();
  res.json(adminView(req.event, langOf(req)));
});

app.post('/api/admin/:token/draw', withAdmin, async (req, res) => {
  try {
    await runDraw(req.event);
    res.json(adminView(req.event, langOf(req)));
  } catch (err) {
    res.status(400).json({ error: msg(langOf(req), err.message) });
  }
});

app.post('/api/admin/:token/resend', withAdmin, async (req, res) => {
  if (!req.event.drawnAt) return fail(req, res, 400, 'notDrawnYet');
  await sendMails(req.event, true);
  res.json(adminView(req.event, langOf(req)));
});

app.get('/api/invite/:token', (req, res) => {
  const e = store.byInviteToken(req.params.token);
  if (!e) return fail(req, res, 404, 'inviteNotFound');
  res.json(publicView(e));
});

app.post('/api/invite/:token/join', (req, res) => {
  const e = store.byInviteToken(req.params.token);
  if (!e) return fail(req, res, 404, 'inviteNotFound');
  if (e.drawnAt) return fail(req, res, 409, 'joinClosed');

  const name = clean(req.body.name, 80);
  const email = clean(req.body.email, 200).toLowerCase();
  const wishlist = clean(req.body.wishlist, 3000);
  if (!name) return fail(req, res, 400, 'nameMissing');
  if (!isEmail(email)) return fail(req, res, 400, 'emailInvalid');

  const existing = e.participants.find((p) => p.email === email);
  if (existing) {
    // gleiche E-Mail = Angaben aktualisieren (z. B. Wunschzettel ergänzen)
    Object.assign(existing, { name, wishlist, lang: langOf(req) });
  } else {
    // lang: Sprache, in der die Person ihr Los per E-Mail bekommt
    e.participants.push({ id: id(), name, email, wishlist, lang: langOf(req), joinedAt: new Date().toISOString() });
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
