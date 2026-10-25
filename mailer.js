// E-Mail-Versand. Ohne SMTP-Konfiguration landen die Mails als HTML-Dateien im Ordner ./outbox
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, MAIL_FROM } = process.env;
const OUTBOX = path.join(__dirname, 'outbox');

const transport = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: SMTP_SECURE === 'true',
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

function layout(title, body) {
  return `<!doctype html><html><body style="margin:0;background:#f6efdc;font-family:Georgia,serif;color:#2a2420">
  <div style="max-width:560px;margin:24px auto;background:#fffaf0;border:2px solid #2a2420;border-radius:18px 6px 22px 8px;padding:28px">
    <div style="font-size:30px;text-align:center">🎄 ⭐ 🎁</div>
    <h1 style="color:#b3261e;text-align:center;font-size:26px;margin:8px 0 18px">${esc(title)}</h1>
    ${body}
    <p style="text-align:center;color:#1e5b3a;margin-top:28px">Frohes Wichteln! ❄️</p>
  </div></body></html>`;
}

async function send({ to, subject, html }) {
  if (transport) {
    await transport.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, html });
    return;
  }
  fs.mkdirSync(OUTBOX, { recursive: true });
  const file = path.join(OUTBOX, `${Date.now()}-${to.replace(/[^a-z0-9@.]/gi, '_')}.html`);
  fs.writeFileSync(file, `<!-- An: ${esc(to)} | Betreff: ${esc(subject)} -->\n${html}`);
  console.log(`[mail] (kein SMTP konfiguriert) → ${to}: "${subject}" gespeichert in ${file}`);
}

function sendAssignment(event, giver, receiver) {
  const details = [
    event.maxAmount ? `<li>Maximaler Geschenkbetrag: <b>${esc(event.maxAmount)} €</b></li>` : '',
    event.giftDate ? `<li>Bescherung: <b>${esc(formatDate(event.giftDate))}</b></li>` : '',
  ].join('');
  const html = layout(event.name, `
    <p>Hallo ${esc(giver.name)},</p>
    <p>die Wichtel-Ziehung hat stattgefunden! Du darfst beschenken:</p>
    <div style="text-align:center;font-size:28px;font-weight:bold;color:#1e5b3a;border:2px dashed #c9a227;border-radius:12px;padding:14px;margin:16px 0">${esc(receiver.name)}</div>
    <p><b>Wunschzettel von ${esc(receiver.name)}:</b></p>
    <div style="background:#f6efdc;border-left:4px solid #b3261e;padding:12px 16px;border-radius:4px">${receiver.wishlist ? nl2br(receiver.wishlist) : '<i>Kein Wunschzettel – lass dich überraschen!</i>'}</div>
    ${details ? `<ul>${details}</ul>` : ''}
    <p style="font-size:14px;color:#6b5f55">Psst – nicht verraten! 🤫</p>`);
  return send({ to: giver.email, subject: `🎁 ${event.name}: Dein Wichtel-Los`, html });
}

function sendAdminLink(event, to, adminUrl, inviteUrl) {
  const html = layout(event.name, `
    <p>Deine Wichtelaktion ist angelegt! Hier sind deine Links:</p>
    <p><b>Oberwichtel-Link</b> (geheim halten – damit verwaltest du die Aktion):<br><a href="${esc(adminUrl)}">${esc(adminUrl)}</a></p>
    <p><b>Einladungslink</b> (für Freunde &amp; Familie):<br><a href="${esc(inviteUrl)}">${esc(inviteUrl)}</a></p>`);
  return send({ to, subject: `⭐ Deine Wichtelaktion „${event.name}“`, html });
}

function formatDate(iso) {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T12:00' : iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

module.exports = { sendAssignment, sendAdminLink, smtpConfigured: !!transport };
