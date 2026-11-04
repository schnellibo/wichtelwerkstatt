// Sprache: Deutsch oder Englisch
//
// Feste Texte stehen auf Deutsch im HTML und tragen data-i18n="schlüssel"
// (bzw. data-i18n-placeholder / data-i18n-title). Bei Englisch werden sie hier
// ersetzt. Texte, die per JavaScript entstehen, holt man mit t('schlüssel', { … }).

const LANGS = ['de', 'en'];

const LANG = (() => {
  try {
    const saved = localStorage.getItem('lang');
    if (LANGS.includes(saved)) return saved;
  } catch {}
  return /^en\b/i.test(navigator.language || '') ? 'en' : 'de';
})();

const LOCALE = LANG === 'en' ? 'en-GB' : 'de-DE';

const TEXTS = {
  // Nur Texte, die per JavaScript entstehen – die festen deutschen Texte stehen im HTML
  de: {
    'error.generic': 'Da ist etwas schiefgelaufen.',
    'date.timeSuffix': ' Uhr',

    'create.creating': 'Wird angelegt…',
    'create.submit': 'Aktion erstellen',

    'join.docTitle': 'Einladung: {name}',
    'join.already': 'Schon dabei:',
    'join.first': 'Sei die erste Person, die mitmacht!',
    'join.budget': 'max. Geschenkwert',
    'join.exchange': 'Bescherung',
    'join.updated': 'Wunschzettel aktualisiert!',
    'join.welcome': 'Juhu, du bist dabei, {name}!',

    'admin.docTitle': '{name} – Oberwichtel-Zentrale',
    'admin.statusOpen': 'Anmeldung offen',
    'admin.statusDrawn': 'Gezogen ✓',
    'admin.shareMsg': '{name} 🎁\nMachst du mit beim Wichteln? Hier anmelden: {url}',
    'admin.shareSubject': 'Einladung: {name}',
    'admin.mailSent': '✉️ Los verschickt',
    'admin.mailFailed': '⚠️ Mail fehlgeschlagen',
    'admin.viewWish': 'Wunschzettel ansehen',
    'admin.noWish': '(kein Wunschzettel)',
    'admin.remove': 'Entfernen',
    'admin.noExcl': 'Keine Ausschlüsse.',
    'admin.min3': 'Mindestens 3 Wichtel nötig',
    'admin.drawError': '⚠️ Die geplante Ziehung hat nicht geklappt: {error}',
    'admin.scheduled': '⏰ Geplant: {date}',
    'admin.drawnAt': 'Gezogen am {date}',
    'admin.mailStatus': '✉️ {sent} von {total} Losen verschickt',
    'admin.mailStatusFailed': ' · ⚠️ {n} fehlgeschlagen',
    'admin.saved': 'Gespeichert ✓',
    'admin.confirmRemove': '{name} wirklich von der Wichtelaktion entfernen?',
    'admin.removed': '{name} wurde entfernt',
    'admin.exclSaved': 'Ausschluss gespeichert',
    'admin.pickTime': 'Bitte wähle Datum und Uhrzeit.',
    'admin.pastTime': 'Der Zeitpunkt liegt in der Vergangenheit.',
    'admin.planned': 'Ziehung geplant ⏰',
    'admin.unplanned': 'Planung entfernt',
    'admin.confirmDraw': 'Jetzt die Lose für {n} Wichtel ziehen und per E-Mail verschicken?\n\nDanach kann sich niemand mehr anmelden.',
    'admin.drawBtn': 'Jetzt ziehen',
    'admin.drawing': 'Wird gezogen…',
    'admin.drawn': 'Die Lose sind verschickt! 🎉',
    'admin.retried': 'Erneut versucht',
    'admin.confirmDelete': '„{name}“ wirklich endgültig löschen?\n\nAlle Anmeldungen und Wunschzettel gehen verloren. Das lässt sich nicht rückgängig machen.',
    'admin.deletedTitle': 'Aktion gelöscht',
    'admin.copied': 'Link kopiert 📋',
    'admin.mailNoteSent': '📬 Wir haben dir den Link an <b>{to}</b> geschickt. Nichts angekommen? Schau im Spam-Ordner nach.',
    'admin.mailNoteError': '⚠️ Die E-Mail an <b>{to}</b> konnte nicht verschickt werden ({error}). Speichere dir diese Seite unbedingt als Lesezeichen.',
  },

  en: {
    'error.generic': 'Something went wrong.',
    'date.timeSuffix': '',

    // Startseite
    'title.start': 'Wichtelwerkstatt – Secret Santa',
    'hero.welcome': 'Welcome<br>to the',
    'hero.tagline': 'Secret Santa for family &amp; friends',
    'create.heading': 'New Secret Santa',
    'create.name': 'Name of your Secret Santa',
    'create.namePh': 'e.g. Family Secret Santa 2026',
    'create.maxAmount': 'Gift budget <small>(€)</small>',
    'create.giftDate': 'Gift exchange date',
    'create.inviteText': 'Invitation text',
    'create.inviteDefault': "Ho ho ho! 🎅\nWe're doing Secret Santa again this year! Sign up with your name, email address and wish list – after the draw you'll get an email telling you who you're buying a present for.",
    'create.email': "Your email <small>(optional – we'll send you your Head Elf link)</small>",
    'create.emailPh': 'head.elf@example.com',
    'create.creating': 'Creating…',
    'create.submit': 'Create Secret Santa',
    'how.heading': 'How it works',
    'how.1': 'You create the Secret Santa and become the <b>Head Elf</b>.',
    'how.2': 'You send the invitation link to friends &amp; family.',
    'how.3': 'Everyone adds their name, email and wish list.',
    'how.4': 'One click starts the draw – everyone gets their match by email.',
    'footer.new': 'Create a new Secret Santa',
    'notfound.heading': 'Oops!',

    // Einladung
    'title.join': 'Secret Santa invitation',
    'join.caps': 'You are<br>invited',
    'join.tagline': 'to Secret Santa',
    'join.docTitle': 'Invitation: {name}',
    'join.already': 'Already in:',
    'join.first': 'Be the first to join!',
    'join.budget': 'gift budget',
    'join.exchange': 'gift exchange',
    'join.heading': "I'm in!",
    'join.name': 'Your name',
    'join.email': 'Your email address <small>– your Secret Santa match will be sent here</small>',
    'join.wishlist': 'Your wish list',
    'join.wishlistPh': 'What would you like? Ideas, favourite colours, no-gos, sizes …',
    'join.submit': 'Accept invitation',
    'join.doneTitle': "You're in!",
    'join.updated': 'Wish list updated!',
    'join.welcome': "Yay, you're in, {name}!",
    'join.doneText': "As soon as the Head Elf starts the draw, you'll get an email with the name and wish list of the person you're buying for.",
    'join.doneHint': 'Forgot something? Just sign up again with the same email address – your wish list will be updated.',
    'join.again': 'Edit wish list',
    'join.closedHeading': 'The names have already been drawn',
    'join.closedText': "Sign-ups for this Secret Santa are closed. Ask the Head Elf – maybe there'll be another round next year! 🎄",

    // Oberwichtel-Zentrale
    'title.admin': 'Head Elf HQ',
    'admin.caps': 'Head Elf<br>HQ',
    'admin.docTitle': '{name} – Head Elf HQ',
    'admin.statusOpen': 'Sign-ups open',
    'admin.statusDrawn': 'Drawn ✓',
    'admin.notfound': "This Secret Santa doesn't exist. Check your Head Elf link.",
    'admin.links': 'Your links',
    'admin.newNote': "🎉 Your Secret Santa is ready! <b>Bookmark this page</b> – it's the only way to manage your Secret Santa.",
    'admin.inviteLink': 'Invitation link <small>– send to friends &amp; family</small>',
    'admin.copy': 'Copy',
    'admin.shareEmail': '✉️ Email',
    'admin.preview': '👀 Preview',
    'admin.adminLink': 'Head Elf link <small>– keep it secret!</small>',
    'admin.details': 'Your Secret Santa',
    'admin.save': 'Save',
    'admin.elves': 'Elves',
    'admin.empty': 'Nobody has signed up yet. Send out the invitation link! 📨',
    'admin.exclHeading': "Who shouldn't draw each other?",
    'admin.exclText': "E.g. couples or siblings – they won't draw each other. (Nobody draws themselves anyway.)",
    'admin.elf1': 'Elf 1',
    'admin.elf2': 'Elf 2',
    'admin.exclAdd': 'Add exclusion',
    'admin.drawHeading': 'The big <span class="script-accent">Draw</span>',
    'admin.drawText': "Once everyone has joined, start the draw. Everyone gets an email with the name and wish list of the person they're buying for.",
    'admin.smtpNote': "ℹ️ Email sending isn't set up on this server yet – emails are saved in the <code>outbox</code> folder (see README).",
    'admin.drawBtn': 'Draw names',
    'admin.scheduleSummary': '…or draw automatically at a set time',
    'admin.drawAt': 'Draw on',
    'admin.plan': 'Schedule',
    'admin.unplan': 'Remove',
    'admin.drawnHeading': 'The names have been drawn!',
    'admin.resend': 'Resend failed emails',
    'admin.secret': 'Who drew whom stays secret – even from you. 🤫',
    'admin.deleteHeading': 'Delete Secret Santa',
    'admin.deleteText': 'Permanently deletes this Secret Santa with all sign-ups and wish lists. The invitation link and your Head Elf link will stop working.',
    'admin.deleteBtn': 'Delete permanently',
    'admin.deletedHeading': 'Secret Santa deleted',
    'admin.deletedText': 'The Secret Santa and all sign-ups have been deleted.',
    'admin.shareMsg': '{name} 🎁\nWant to join our Secret Santa? Sign up here: {url}',
    'admin.shareSubject': 'Invitation: {name}',
    'admin.mailSent': '✉️ Match sent',
    'admin.mailFailed': '⚠️ Email failed',
    'admin.viewWish': 'View wish list',
    'admin.noWish': '(no wish list)',
    'admin.remove': 'Remove',
    'admin.noExcl': 'No exclusions.',
    'admin.min3': 'At least 3 elves needed',
    'admin.drawError': '⚠️ The scheduled draw failed: {error}',
    'admin.scheduled': '⏰ Scheduled: {date}',
    'admin.drawnAt': 'Drawn on {date}',
    'admin.mailStatus': '✉️ {sent} of {total} matches sent',
    'admin.mailStatusFailed': ' · ⚠️ {n} failed',
    'admin.saved': 'Saved ✓',
    'admin.confirmRemove': 'Really remove {name} from this Secret Santa?',
    'admin.removed': '{name} was removed',
    'admin.exclSaved': 'Exclusion saved',
    'admin.pickTime': 'Please pick a date and time.',
    'admin.pastTime': 'That time is in the past.',
    'admin.planned': 'Draw scheduled ⏰',
    'admin.unplanned': 'Schedule removed',
    'admin.confirmDraw': 'Draw names for {n} elves now and send them by email?\n\nNobody can sign up after that.',
    'admin.drawing': 'Drawing…',
    'admin.drawn': 'The matches have been sent! 🎉',
    'admin.retried': 'Retried',
    'admin.confirmDelete': 'Really delete “{name}” permanently?\n\nAll sign-ups and wish lists will be lost. This can’t be undone.',
    'admin.deletedTitle': 'Secret Santa deleted',
    'admin.copied': 'Link copied 📋',
    'admin.mailNoteSent': "📬 We've sent the link to <b>{to}</b>. Nothing there? Check your spam folder.",
    'admin.mailNoteError': "⚠️ The email to <b>{to}</b> couldn't be sent ({error}). Make sure to bookmark this page.",
  },
};

// Text holen; {platzhalter} werden ersetzt (nicht escaped – für HTML vorher esc() verwenden)
function t(key, vars = {}) {
  const text = TEXTS[LANG][key] ?? TEXTS.de[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// Feste Texte im HTML übersetzen
function applyI18n() {
  document.documentElement.lang = LANG;
  if (LANG === 'de') return; // die deutschen Texte stehen schon im HTML
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const text = TEXTS[LANG][el.dataset.i18n];
    if (text === undefined) continue;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'TITLE') el.textContent = text;
    else el.innerHTML = text;
  }
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
    const text = TEXTS[LANG][el.dataset.i18nPlaceholder];
    if (text !== undefined) el.placeholder = text;
  }
}

// Umschalter „DE | EN“ oben rechts
function addLangSwitch() {
  const nav = document.createElement('nav');
  nav.className = 'lang-switch';
  nav.setAttribute('aria-label', 'Sprache / Language');
  nav.innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === LANG}">${l.toUpperCase()}</button>`).join('');
  nav.addEventListener('click', (e) => {
    const lang = e.target.dataset.lang;
    if (!lang || lang === LANG) return;
    try { localStorage.setItem('lang', lang); } catch {}
    location.reload();
  });
  document.querySelector('main').prepend(nav);
}

applyI18n();
