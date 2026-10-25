// Gemeinsame Helfer + gezeichnete Schleife

const SVG_DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <!-- leicht ausgefranste Ränder wie bei Stoff -->
    <filter id="franse" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="7"/>
      <feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <symbol id="schleife" viewBox="0 0 200 210">
    <g filter="url(#franse)">
      <path d="M95 92 C84 124 66 162 52 202 L72 192 L84 206 C96 168 104 128 106 96 Z"/>
      <path d="M105 92 C116 124 134 158 152 194 L131 190 L124 206 C112 168 100 128 96 96 Z" opacity=".92"/>
      <path d="M100 86 C80 62 44 26 22 34 C4 42 6 86 16 102 C28 120 70 104 100 90 Z"/>
      <path d="M100 86 C120 62 156 26 178 34 C196 42 194 86 184 102 C172 120 130 104 100 90 Z"/>
      <path d="M98 84 C78 72 52 56 36 58 C52 72 70 82 96 90Z M102 84 C122 72 148 56 164 58 C148 72 130 82 104 90Z" opacity=".25" fill="#000"/>
      <rect x="88" y="74" width="24" height="26" rx="8"/>
    </g>
  </symbol>
</svg>`;

function decorate() {
  document.body.insertAdjacentHTML('afterbegin', SVG_DEFS);
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
  const items = ['🎁', '🎀', '❄️', '✨', '⭐'];
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

const AVATAR_COLORS = ['#a3312c', '#3b4130', '#6d745f', '#7e2420', '#535a45'];
const avatarColor = (name) => AVATAR_COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

document.addEventListener('DOMContentLoaded', decorate);
