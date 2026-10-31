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

console.log('Sharing');
var enc = TL.encode(7, br.interventions), dec = TL.decode('#' + enc);
check('timeline encodes to a link and back', dec.seed === 7 && dec.interventions.length === 1 && dec.interventions[0].x === iv.x && dec.interventions[0].type === 'tribe');

console.log('\n' + passes + ' passed, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
