// Wichtel-Ziehung: jede Person beschenkt genau eine andere Person.
// Regeln: niemand zieht sich selbst, ausgeschlossene Paare ziehen sich nicht gegenseitig.

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {string[]} ids        Teilnehmer-IDs
 * @param {[string,string][]} exclusions  Paare, die sich nicht gegenseitig ziehen dürfen
 * @returns {Object<string,string>|null}  giverId -> receiverId, oder null wenn unmöglich
 */
function drawAssignments(ids, exclusions = []) {
  if (ids.length < 2) return null;

  const forbidden = new Set();
  for (const [a, b] of exclusions) {
    forbidden.add(`${a}|${b}`);
    forbidden.add(`${b}|${a}`);
  }
  const allowed = (giver, receiver) => giver !== receiver && !forbidden.has(`${giver}|${receiver}`);

  // Backtracking mit zufälliger Reihenfolge; die am stärksten eingeschränkten Personen zuerst.
  const options = Object.fromEntries(ids.map((g) => [g, ids.filter((r) => allowed(g, r))]));
  const givers = shuffle(ids).sort((a, b) => options[a].length - options[b].length);

  const result = {};
  const taken = new Set();
  let steps = 0;

  function solve(i) {
    if (i === givers.length) return true;
    if (++steps > 200000) return false;
    const giver = givers[i];
    for (const receiver of shuffle(options[giver])) {
      if (taken.has(receiver)) continue;
      result[giver] = receiver;
      taken.add(receiver);
      if (solve(i + 1)) return true;
      taken.delete(receiver);
      delete result[giver];
    }
    return false;
  }

  return solve(0) ? result : null;
}

module.exports = { drawAssignments };
