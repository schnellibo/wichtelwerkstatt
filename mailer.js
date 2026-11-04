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
      // nicht minutenlang hängen, wenn der Mailserver nicht antwortet
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  : null;

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

// Texte der E-Mails – die Sprache richtet sich nach der Person, die die Mail bekommt
const T = {
  de: {
    closing: 'Frohes Wichteln! ❄️',
    hello: (name) => `Hallo ${name},`,
    drawn: 'die Wichtel-Ziehung hat stattgefunden! Du darfst beschenken:',
    wishlistOf: (name) => `Wunschzettel von ${name}:`,
    noWishlist: 'Kein Wunschzettel – lass dich überraschen!',
    budget: 'Maximaler Geschenkbetrag',
    exchange: 'Bescherung',
    secret: 'Psst – nicht verraten! 🤫',
    assignmentSubject: (event) => `🎁 ${event}: Dein Wichtel-Los`,
    created: 'Deine Wichtelaktion ist angelegt! Hier sind deine Links:',
    adminLink: '<b>Oberwichtel-Link</b> (geheim halten – damit verwaltest du die Aktion):',
    inviteLink: '<b>Einladungslink</b> (für Freunde &amp; Familie):',
    adminSubject: (event) => `⭐ Deine Wichtelaktion „${event}“`,
    locale: 'de-DE',
  },
  en: {
    closing: 'Happy Secret Santa! ❄️',
    hello: (name) => `Hi ${name},`,
    drawn: "the names have been drawn! You're buying a present for:",
    wishlistOf: (name) => `${name}'s wish list:`,
    noWishlist: 'No wish list – surprise them!',
    budget: 'Gift budget',
    exchange: 'Gift exchange',
    secret: "Psst – don't tell! 🤫",
    assignmentSubject: (event) => `🎁 ${event}: Your Secret Santa match`,
    created: 'Your Secret Santa is ready! Here are your links:',
    adminLink: '<b>Head Elf link</b> (keep it secret – use it to manage your Secret Santa):',
    inviteLink: '<b>Invitation link</b> (for friends &amp; family):',
    adminSubject: (event) => `⭐ Your Secret Santa “${event}”`,
    locale: 'en-GB',
  },
};
const texts = (lang) => T[lang] || T.de;

function layout(title, body, lang) {
  return `<!doctype html><html lang="${lang === 'en' ? 'en' : 'de'}"><body style="margin:0;padding:24px 12px;background:#3b4130;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#2f3326">
  <div style="max-width:560px;margin:0 auto;background:#faf7f0;border-radius:18px;padding:30px 28px">
    <div style="font-size:34px;text-align:center">🎀</div>
    <p style="text-align:center;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#535a45;margin:6px 0 0">Wichtelwerkstatt</p>
    <h1 style="color:#a3312c;text-align:center;font-family:Georgia,serif;font-style:italic;font-weight:normal;font-size:30px;margin:6px 0 20px">${esc(title)}</h1>
    ${body}
    <p style="text-align:center;color:#3b4130;margin-top:28px">${texts(lang).closing}</p>
  </div>
  <p style="text-align:center;color:#f4efe4;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:18px 0 0">Vibe-coded by Nelli <span style="color:#e58a80">♥</span></p>
</body></html>`;
}

async function send({ to, subject, html }) {
  if (transport) {
    await transport.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, html });
    console.log(`[mail] gesendet → ${to}: "${subject}"`);
    return;
  }
  fs.mkdirSync(OUTBOX, { recursive: true });
  const file = path.join(OUTBOX, `${Date.now()}-${to.replace(/[^a-z0-9@.]/gi, '_')}.html`);
  fs.writeFileSync(file, `<!-- An: ${esc(to)} | Betreff: ${esc(subject)} -->\n${html}`);
  console.log(`[mail] (kein SMTP konfiguriert) → ${to}: "${subject}" gespeichert in ${file}`);
}

function sendAssignment(event, giver, receiver) {
  const lang = giver.lang || event.lang || 'de';
  const x = texts(lang);
  const details = [
    event.maxAmount ? `<li>${x.budget}: <b>${esc(event.maxAmount)} €</b></li>` : '',
    event.giftDate ? `<li>${x.exchange}: <b>${esc(formatDate(event.giftDate, x.locale))}</b></li>` : '',
  ].join('');
  const html = layout(event.name, `
    <p>${x.hello(esc(giver.name))}</p>
    <p>${x.drawn}</p>
    <div style="text-align:center;font-family:Georgia,serif;font-size:30px;color:#a3312c;background:#fffdf8;border:1px solid #ddd5c4;border-radius:12px;padding:14px;margin:16px 0">${esc(receiver.name)}</div>
    <p><b>${x.wishlistOf(esc(receiver.name))}</b></p>
    <div style="background:#f4efe4;border-left:3px solid #a3312c;padding:12px 16px;border-radius:6px">${receiver.wishlist ? nl2br(receiver.wishlist) : `<i>${x.noWishlist}</i>`}</div>
    ${details ? `<ul>${details}</ul>` : ''}
    <p style="font-size:14px;color:#6e705f">${x.secret}</p>`, lang);
  return send({ to: giver.email, subject: x.assignmentSubject(event.name), html });
}

function sendAdminLink(event, to, adminUrl, inviteUrl, lang = 'de') {
  const x = texts(lang);
  const html = layout(event.name, `
    <p>${x.created}</p>
    <p>${x.adminLink}<br><a href="${esc(adminUrl)}" style="color:#a3312c">${esc(adminUrl)}</a></p>
    <p>${x.inviteLink}<br><a href="${esc(inviteUrl)}" style="color:#a3312c">${esc(inviteUrl)}</a></p>`, lang);
  return send({ to, subject: x.adminSubject(event.name), html });
}

function formatDate(iso, locale) {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T12:00' : iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

module.exports = { sendAssignment, sendAdminLink, smtpConfigured: !!transport };
