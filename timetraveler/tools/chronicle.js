#!/usr/bin/env node
// Headless run: prints the chronicle and a census every N years.
// Usage: node tools/chronicle.js [seed] [years] [censusEvery]
'use strict';
var Sim = require('../js/sim.js');
var seed = parseInt(process.argv[2] || '1', 10);
var years = parseInt(process.argv[3] || '3000', 10);
var every = parseInt(process.argv[4] || '250', 10);
var quiet = process.argv.indexOf('--quiet') >= 0;

var s = Sim.create(seed);
var counts = {};
var t0 = Date.now();
function census() {
  Sim.computeStats(s);
  var alive = 0, big = 0, total = 0, top = [];
  for (var c = 0; c < s.g[1]; c++) {
    if (!s.cAlive[c] || !s.sTiles[c]) continue;
    alive++; total += s.sPop[c];
    if (s.sTiles[c] >= 25) big++;
    top.push(c);
  }
  top.sort(function (a, b) { return s.sTiles[b] - s.sTiles[a]; });
  var desc = top.slice(0, 4).map(function (c) {
    return Sim.civName(s.cSig[c]) + '(' + s.sTiles[c] + 't,' + Math.round(s.sPop[c] / 1000) + 'k,A' + Sim.meanAsab(s, c) + ',T' + s.cTech[c] + ')';
  }).join(' ');
  console.log('-- Y' + Sim.tick(s) + ' pop ' + Math.round(total / 1000) + 'k, states ' + alive + ', large ' + big + ' | ' + desc);
}
for (var y = 0; y < years; y++) {
  if (y % every === 0) census();
  Sim.step(s, function (e) {
    counts[e.type] = (counts[e.type] || 0) + 1;
    if (!quiet) console.log('Y' + e.t + ' [' + e.type + '] ' + e.text);
  });
}
census();
console.log('events:', JSON.stringify(counts), 'ms/yr:', ((Date.now() - t0) / years).toFixed(2));
