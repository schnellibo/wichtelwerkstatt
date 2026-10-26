// Minimaler JSON-Dateispeicher – für eine private Wichtel-App völlig ausreichend.
const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'wichtel.json');

let data = { events: [] };
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function save() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

module.exports = {
  all: () => data.events,
  add(event) { data.events.push(event); save(); return event; },
  remove(event) { data.events = data.events.filter((e) => e !== event); save(); },
  byAdminToken: (t) => data.events.find((e) => e.adminToken === t),
  byInviteToken: (t) => data.events.find((e) => e.inviteToken === t),
  save,
};
