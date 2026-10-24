// Gemeinsame Helfer + handgemalte SVG-Grafiken

const SVG_DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3.5"/></filter>
  </defs>
  <symbol id="g-tree" viewBox="0 0 100 120">
    <path d="M50 8 L22 50 L36 49 L14 80 L32 79 L8 108 L92 107 L69 79 L86 80 L64 49 L78 50 Z" fill="#1e5b3a" stroke="#2a2420" stroke-width="3" stroke-linejoin="round"/>
    <path d="M28 72 Q50 82 72 70 M22 98 Q52 108 80 96" fill="none" stroke="#c9a227" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 6"/>
    <circle cx="42" cy="60" r="4.5" fill="#b3261e" stroke="#2a2420" stroke-width="1.5"/>
    <circle cx="62" cy="88" r="4.5" fill="#c9a227" stroke="#2a2420" stroke-width="1.5"/>
    <circle cx="36" cy="92" r="4" fill="#b3261e" stroke="#2a2420" stroke-width="1.5"/>
    <circle cx="58" cy="40" r="3.5" fill="#c9a227" stroke="#2a2420" stroke-width="1.5"/>
    <rect x="42" y="107" width="16" height="11" fill="#7a4a2a" stroke="#2a2420" stroke-width="3"/>
  </symbol>
  <symbol id="g-star" viewBox="0 0 100 100">
    <path d="M50 6 L61 37 L94 38 L67 58 L77 91 L50 71 L22 92 L33 58 L6 39 L39 37 Z" fill="#f1d77a" stroke="#2a2420" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M46 30 L50 20" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  </symbol>
  <symbol id="g-gift" viewBox="0 0 100 100">
    <rect x="12" y="38" width="76" height="56" rx="3" fill="#b3261e" stroke="#2a2420" stroke-width="3.5"/>
    <rect x="6" y="26" width="88" height="16" rx="3" fill="#c22f26" stroke="#2a2420" stroke-width="3.5"/>
    <path d="M44 26 V94 M56 26 V94" stroke="#c9a227" stroke-width="5"/>
    <path d="M50 26 C34 4 18 14 30 24 C36 28 46 27 50 26 C54 27 64 28 70 24 C82 14 66 4 50 26 Z" fill="#f1d77a" stroke="#2a2420" stroke-width="3" stroke-linejoin="round"/>
  </symbol>
  <symbol id="g-gift-green" viewBox="0 0 100 100">
    <rect x="16" y="40" width="68" height="54" rx="3" fill="#1e5b3a" stroke="#2a2420" stroke-width="3.5"/>
    <rect x="10" y="28" width="80" height="15" rx="3" fill="#2f7a50" stroke="#2a2420" stroke-width="3.5"/>
    <path d="M50 28 V94" stroke="#b3261e" stroke-width="7"/>
    <path d="M50 28 C40 10 26 16 34 25 Z M50 28 C60 10 74 16 66 25 Z" fill="#b3261e" stroke="#2a2420" stroke-width="3" stroke-linejoin="round"/>
  </symbol>
  <symbol id="g-holly" viewBox="0 0 100 100">
    <path d="M50 52 C40 40 22 44 14 30 C26 34 22 24 30 20 C34 30 44 30 50 52 Z" fill="#1e5b3a" stroke="#2a2420" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 52 C60 40 78 44 86 30 C74 34 78 24 70 20 C66 30 56 30 50 52 Z" fill="#2f7a50" stroke="#2a2420" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="44" cy="58" r="8" fill="#b3261e" stroke="#2a2420" stroke-width="2.5"/>
    <circle cx="58" cy="60" r="8" fill="#b3261e" stroke="#2a2420" stroke-width="2.5"/>
    <circle cx="51" cy="70" r="8" fill="#c22f26" stroke="#2a2420" stroke-width="2.5"/>
  </symbol>
  <symbol id="g-candy" viewBox="0 0 60 120">
    <path d="M38 115 V40 C38 18 10 14 10 36" fill="none" stroke="#2a2420" stroke-width="16" stroke-linecap="round"/>
    <path d="M38 115 V40 C38 18 10 14 10 36" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <path d="M38 115 V40 C38 18 10 14 10 36" fill="none" stroke="#b3261e" stroke-width="10" stroke-dasharray="7 9" />
  </symbol>
</svg>`;

const icon = (name, size = 60, extra = '') =>
  `<svg width="${size}" height="${size}" ${extra} aria-hidden="true"><use href="#g-${name}"/></svg>`;

// Girlande mit Lichterkette – Birnchen sitzen exakt auf den zwei Bögen der Schnur
const GARLAND = (() => {
  const quad = (p0, c, p1, t) => (1 - t) ** 2 * p0 + 2 * (1 - t) * t * c + t * t * p1;
  const bulbs = [];
  [[0, 155, 310, 6, 44, 8], [310, 465, 620, 8, 44, 6]].forEach(([x0, cx, x1, y0, cy, y1], seg) => {
    [0.12, 0.32, 0.52, 0.72, 0.9].forEach((t, i) => {
      const c = ['#b3261e', '#c9a227', '#1e5b3a'][(seg * 5 + i) % 3];
      bulbs.push(`<ellipse cx="${quad(x0, cx, x1, t)}" cy="${quad(y0, cy, y1, t) + 9}" rx="6" ry="9" fill="${c}" stroke="#2a2420" stroke-width="2"/>`);
    });
  });
  return `<svg class="garland" viewBox="0 -4 620 52" preserveAspectRatio="none" aria-hidden="true" style="filter:url(#wobble)">
  <path d="M0 6 Q155 44 310 8 Q465 44 620 6" fill="none" stroke="#2a2420" stroke-width="2.5"/>${bulbs.join('')}</svg>`;
})();

function decorate() {
  document.body.insertAdjacentHTML('afterbegin', SVG_DEFS);
  const snow = document.createElement('div');
  snow.className = 'snow';
  for (let i = 0; i < 26; i++) {
    const f = document.createElement('i');
    f.textContent = Math.random() < 0.5 ? '❄' : '•';
    f.style.left = Math.random() * 100 + 'vw';
    f.style.fontSize = 8 + Math.random() * 14 + 'px';
    f.style.opacity = 0.5 + Math.random() * 0.5;
    f.style.animationDuration = 9 + Math.random() * 12 + 's';
    f.style.animationDelay = -Math.random() * 20 + 's';
    snow.appendChild(f);
  }
  document.body.prepend(snow);
  document.querySelectorAll('[data-garland]').forEach((el) => (el.innerHTML = GARLAND));
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon, Number(el.dataset.size || 60));
  });
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Da ist etwas schiefgelaufen.');
  return data;
}

function toast(msg, isError = false) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

function confetti() {
  const items = ['🎁', '⭐', '❄️', '🎄', '✨', '🍪'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.textContent = items[i % items.length];
    c.style.left = Math.random() * 100 + 'vw';
    c.style.animationDelay = Math.random() * 0.8 + 's';
    c.style.animationDuration = 2.2 + Math.random() * 1.5 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function formatDate(iso, withTime = false) {
  if (!iso) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T12:00' : iso);
  if (isNaN(d)) return iso;
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('de-DE', opts) + (withTime ? ' Uhr' : '');
}

// ISO (UTC) <-> Wert für <input type="datetime-local">
function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const localInputToIso = (v) => (v ? new Date(v).toISOString() : '');

const AVATAR_COLORS = ['#b3261e', '#1e5b3a', '#c9a227', '#2f7a50', '#8e1c16'];
const avatarColor = (name) => AVATAR_COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

document.addEventListener('DOMContentLoaded', decorate);
