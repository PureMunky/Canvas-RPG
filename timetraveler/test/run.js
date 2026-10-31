#!/usr/bin/env node
// Determinism & time-travel tests. Run: node test/run.js
'use strict';
var Sim = require('../js/sim.js');
var TL = require('../js/timeline.js');

var failures = 0, passes = 0;
function check(name, cond, detail) {
  if (cond) { passes++; console.log('  ok   ' + name); }
  else { failures++; console.log('  FAIL ' + name + (detail ? ' -- ' + detail : '')); }
}
function run(seed, years, ivs) {
  var s = Sim.create(seed);
  var byT = {};
  (ivs || []).forEach(function (iv) { (byT[iv.t] = byT[iv.t] || []).push(iv); });
  for (var t = 0; t < years; t++) {
    (byT[t] || []).forEach(function (iv) { Sim.applyIntervention(s, iv); });
    Sim.step(s, null);
  }
  (byT[years] || []).forEach(function (iv) { Sim.applyIntervention(s, iv); });
  return s;
}

console.log('Simulation determinism');
var a = run(7, 700), b = run(7, 700);
check('same seed -> identical world after 700 years', Sim.stateHash(a) === Sim.stateHash(b));
check('different seed -> different world', Sim.stateHash(run(8, 50)) !== Sim.stateHash(run(7, 50)));

var s = Sim.create(7);
for (var t = 0; t < 350; t++) Sim.step(s, null);
var snap = Sim.snapshot(s);
for (; t < 700; t++) Sim.step(s, null);
var r = Sim.restore(snap);
for (t = 350; t < 700; t++) Sim.step(r, null);
check('snapshot at 350 + resimulate == straight run', Sim.stateHash(r) === Sim.stateHash(a));
check('original run unaffected by snapshotting', Sim.stateHash(s) === Sim.stateHash(a));

var ev1 = [], ev2 = [];
var e1 = Sim.create(3), e2 = Sim.create(3);
for (t = 0; t < 1200; t++) { Sim.step(e1, function (e) { ev1.push(e.t + e.text); }); Sim.step(e2, function (e) { ev2.push(e.t + e.text); }); }
check('chronicle is identical across runs (' + ev1.length + ' events)', ev1.join() === ev2.join() && ev1.length > 0);

console.log('Time travel');
var w = new TL.World(7, { horizon: 700, kfEvery: 50 });
while (w.compute(w.root, 1000)) {}
var v = new TL.View(w);
check('view.seek(437) == direct run to 437', Sim.stateHash(v.seek(w.root, 437)) === Sim.stateHash(run(7, 437)));
check('seek backwards to 120', Sim.stateHash(v.seek(w.root, 120)) === Sim.stateHash(run(7, 120)));
check('seek forward incrementally to 150', Sim.stateHash(v.seek(w.root, 150)) === Sim.stateHash(run(7, 150)));
check('seek to horizon', Sim.stateHash(v.seek(w.root, 700)) === Sim.stateHash(a));

var iv = { type: 'tribe', x: 0, y: 0 };
// pick an empty fertile tile at year 200 for a visible effect
var s200 = v.seek(w.root, 200);
for (var i = 0; i < Sim.N; i++) if (Sim.isLand(s200.terrain[i]) && s200.owner[i] < 0 && s200.base[i] > 6000) { iv.x = i % Sim.W; iv.y = (i / Sim.W) | 0; break; }
var br = w.intervene(w.root, 200, iv);
check('intervention forks a new branch', br !== w.root && w.branches.length === 2);
check('branch shares history before the fork', br.keyframes[3] === w.root.keyframes[3] && br.computedTo === 200);
while (w.compute(br, 1000)) {}
var expected = run(7, 700, [{ t: 200, type: 'tribe', x: iv.x, y: iv.y }]);
check('branch == fresh run with same intervention', Sim.stateHash(v.seek(br, 700)) === Sim.stateHash(expected));
check('branch identical to prime before year 200', Sim.stateHash(v.seek(br, 199)) === Sim.stateHash(run(7, 199)));

var vRoot = new TL.View(w);
var d400 = TL.divergence(v.seek(br, 400), vRoot.seek(w.root, 400));
var d700 = TL.divergence(v.seek(br, 700), vRoot.seek(w.root, 700));
console.log('       butterfly: one tribe seeded in year 200 changes ' + (d400 * 100).toFixed(1) + '% of the world by 400, ' + (d700 * 100).toFixed(1) + '% by 700');
check('a small change ripples outward over time', d700 > 0 && d700 >= d400 * 0.5);

var br2 = w.intervene(br, 200, { type: 'smite', x: 10, y: 10 });
check('second edit in the same year extends the branch', br2 === br && br.interventions.length === 2);
check('undo removes the edit', w.undo(br) && br.interventions.length === 1);
while (w.compute(br, 1000)) {}
check('after undo the branch recomputes identically', Sim.stateHash(v.seek(br, 700)) === Sim.stateHash(expected));

console.log('A single person');
var w2 = new TL.World(11, { horizon: 500, kfEvery: 50 });
while (w2.compute(w2.root, 1000)) {}
var v2 = new TL.View(w2), sp = v2.seek(w2.root, 150), home = -1, empty = -1;
for (i = 0; i < Sim.N; i++) {
  if (home < 0 && sp.owner[i] >= 0 && sp.cCap[sp.owner[i]] === i) home = i;
}
for (i = 0; i < Sim.N && empty < 0; i++) {
  if (sp.owner[i] >= 0) for (var d = 0; d < 4; d++) { var nb = Sim.NB[i * 4 + d]; if (nb >= 0 && Sim.isLand(sp.terrain[nb]) && sp.owner[nb] < 0 && sp.pop[nb] === 0) { empty = nb; break; } }
}
var hx = home % Sim.W, hy = (home / Sim.W) | 0, ex = empty % Sim.W, ey = (empty / Sim.W) | 0;
check('deed blockers: assassinate allowed only at a capital', Sim.deedBlocker(sp, 'assassinate', hx, hy, null) === '' && Sim.deedBlocker(sp, 'assassinate', ex, ey, null) !== '');
check('deed blockers: settle allowed only on empty land', Sim.deedBlocker(sp, 'settle', ex, ey, null) === '' && Sim.deedBlocker(sp, 'settle', hx, hy, null) !== '');
var life = w2.intervene(w2.root, 150, { type: 'irrigate', x: hx, y: hy });
var life2 = w2.intervene(life, 151, { type: 'rally', x: hx, y: hy });
var life3 = w2.intervene(life, 160, { type: 'settle', x: ex, y: ey });
check('deeds later in your life continue the same timeline', life2 === life && life3 === life && life.interventions.length === 3);
var life4 = w2.intervene(life, 170, { type: 'teach', x: hx, y: hy, v: 5000 });
var life5 = w2.intervene(life, 165, { type: 'assassinate', x: hx, y: hy });
check('going back before your last deed forks a new timeline', life4 === life && life5 !== life && life5.interventions.length === 4);
while (w2.compute(life, 1000)) {}
var deeds = [{ t: 150, type: 'irrigate', x: hx, y: hy }, { t: 151, type: 'rally', x: hx, y: hy }, { t: 160, type: 'settle', x: ex, y: ey }, { t: 170, type: 'teach', x: hx, y: hy, v: 5000 }];
function runSeed(seed, years, ivs) { var r = Sim.create(seed), by = {}; ivs.forEach(function (q) { (by[q.t] = by[q.t] || []).push(q); });
  for (var tt = 0; tt < years; tt++) { (by[tt] || []).forEach(function (q) { Sim.applyIntervention(r, q); }); Sim.step(r, null); } return r; }
check('a life of deeds replays identically', Sim.stateHash(v2.seek(life, 500)) === Sim.stateHash(runSeed(11, 500, deeds)));
check('settling claims the empty land', v2.seek(life, 160).owner[empty] >= 0);
var vv = new TL.View(w2);
console.log('       one life of 4 deeds changes ' + (TL.divergence(v2.seek(life, 500), vv.seek(w2.root, 500)) * 100).toFixed(1) + '% of the world by year 500');
var code = TL.decode(TL.encode(11, life.interventions));
check('teach carries its knowledge in the timeline code', code.interventions[3].v === 5000);

console.log('Story');
var St = require('../js/story.js');
var w3 = new TL.World(1, { horizon: 1600 });
while (w3.compute(w3.root, 1000)) {}
var s3 = new TL.View(w3).seek(w3.root, 1000), seq = 0.5, rnd = function () { seq = (seq * 7 + 0.31) % 1; return seq; };
var home3 = St.pickHome(w3.root, s3, rnd);
check('a home realm alive in year 1000 is chosen', home3 && s3.sTiles[home3.c] >= 15);
var f3 = St.fate(w3.root, home3.sig, 1000);
check('its fall is foretold within a few centuries', f3.end > 1060 && f3.end < 1450, 'end ' + f3.end);
var tale = St.homeStory(s3, home3.c, w3.root, 1000, St.pickBirthplace(s3, home3.c, rnd));
check('the prologue names the realm and its ruler', tale.html.indexOf(tale.name) >= 0 && /(King|Queen|Chief|Prince)/.test(tale.ruler));
var pr = St.prophecy(w3.root, home3.sig, 1002);
check('the prophecy gives a year and a goal 50 years later', pr && pr.target === pr.end + 50 && pr.vision.length > 10);
var quiet = St.healthYear(s3, s3.cCap[home3.c], 30, false), old = St.healthYear(s3, s3.cCap[home3.c], 80, false);
check('a year in the capital heals the young, old age wears you down', quiet.delta > 0 && old.delta < quiet.delta && St.maxHealth(80) < 100);
var seaTile = -1; for (i = 0; i < Sim.N && seaTile < 0; i++) if (!Sim.isLand(s3.terrain[i])) seaTile = i;
check('a year at sea hurts', St.healthYear(s3, seaTile, 30, false).delta < 0);

console.log('Sharing');
var enc = TL.encode(7, br.interventions), dec = TL.decode('#' + enc);
check('timeline encodes to a link and back', dec.seed === 7 && dec.interventions.length === 1 && dec.interventions[0].x === iv.x && dec.interventions[0].type === 'tribe');

console.log('\n' + passes + ' passed, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
