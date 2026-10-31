/*
 * Story: your home realm, its customs and history, the prophecy of its fall,
 * and what your surroundings do to your health.
 *
 * Everything here reads the deterministic world; nothing writes to it.
 * Text is generated from real simulated history (the chronicle and census),
 * so every world tells a different, true-to-the-simulation story.
 */
(function (root) {
  'use strict';
  var Sim = (typeof module !== 'undefined' && module.exports) ? require('./sim.js') : root.Sim;
  var Timeline = (typeof module !== 'undefined' && module.exports) ? require('./timeline.js') : root.Timeline;
  var W = Sim.W, H = Sim.H, N = Sim.N, TER = Sim.TER, SAMPLE = Timeline.SAMPLE;

  var START_YEAR = 1000, MARGIN = 50;

  // ---------------------------------------------------------------------------
  // Fate of a realm in a timeline (from the census samples)
  // ---------------------------------------------------------------------------
  function present(branch, sig, t) {
    var arr = branch.samples[Math.floor(t / SAMPLE)];
    if (!arr) return false;
    for (var j = 0; j < arr.length; j += 3) if (arr[j] === sig) return true;
    return false;
  }

  /**
   * When does this realm leave the record after `from`? Returns
   * { end: year or null if still standing at the computed frontier, known: computedTo, event }.
   */
  function fate(branch, sig, from) {
    var lastK = Math.ceil(branch.computedTo / SAMPLE) - 1, last = -1;
    for (var k = Math.floor(from / SAMPLE); k <= lastK; k++) {
      if (present(branch, sig, k * SAMPLE)) last = k * SAMPLE;
      else if (last >= 0) break; // a realm never returns once gone
    }
    if (last < 0) return { end: from, known: branch.computedTo, event: null };
    if (last >= lastK * SAMPLE) return { end: null, known: branch.computedTo, event: null };
    var ev = null;
    for (var e = 0; e < branch.events.length; e++) {
      var x = branch.events[e];
      if (x.a === sig && x.t >= from && (x.type === 'collapse' || x.type === 'fall')) { ev = x; break; }
    }
    return { end: ev ? ev.t : last + SAMPLE, known: branch.computedTo, event: ev };
  }

  // ---------------------------------------------------------------------------
  // Choosing your home
  // ---------------------------------------------------------------------------
  /** A realm alive at START_YEAR whose fall is foretold within a few centuries. */
  function pickHome(branch, s, rnd) {
    var named = [], doomed = [], others = [];
    for (var c = 0; c < s.g[1]; c++) {
      if (!s.cAlive[c] || s.sTiles[c] < 15) continue;
      var f = fate(branch, s.cSig[c], START_YEAR);
      var item = { c: c, sig: s.cSig[c], end: f.end };
      if (f.end && f.end > START_YEAR + 60 && f.end < START_YEAR + 450) (f.event ? named : doomed).push(item); else others.push(item);
    }
    // prefer a fall the chronicle names (a conqueror or a collapse): it makes a better story
    var pool = named.length ? named : doomed.length ? doomed : others;
    if (!pool.length) return null;
    return pool[Math.floor(rnd() * pool.length)];
  }

  /** A populated province of the realm a short walk from its capital. */
  function pickBirthplace(s, c, rnd) {
    var cap = s.cCap[c], near = [], any = [];
    for (var i = 0; i < N; i++) {
      if (s.owner[i] !== c || s.pop[i] <= 0 || i === cap) continue;
      var d = Math.abs(i % W - cap % W) + Math.abs(((i / W) | 0) - ((cap / W) | 0));
      any.push(i);
      if (d >= 3 && d <= 9) near.push(i);
    }
    var pool = near.length ? near : any.length ? any : [cap];
    return pool[Math.floor(rnd() * pool.length)];
  }

  // ---------------------------------------------------------------------------
  // Describing your people
  // ---------------------------------------------------------------------------
  var CUSTOMS = [
    'count their years from the founding of the first hearth',
    'bury their dead beneath the floors of their homes',
    'crown their rulers only by the acclaim of the army',
    'keep a council of elders who may overrule the throne',
    'greet the midsummer sun with fires on every hill',
    'trade in salt and honour debts above blood',
    'mark their warriors with blue tattoos',
    'swear oaths on running water',
    'hold the harvest sacred and feast for nine days',
    'let no stranger leave hungry from their door',
    'read the future in the flight of birds',
    'raise their children in common halls',
    'keep long genealogies and sing them at weddings',
    'build their temples on the highest ground',
    'settle quarrels by contests of poetry',
    'forbid iron weapons inside their cities'
  ];
  var DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

  function hashPick(sig, salt, n) { return Sim.hash4(sig, salt, 77, 3) % n; }
  function personName(sig, salt) {
    var n = Sim.civName(Sim.hash4(sig, salt, 5, 9));
    return n.length > 9 ? n.slice(0, 7) : n;
  }
  function ageName(tech) { return Sim.AGES[Sim.ageOf(tech)].name; }
  function rulerTitle(s, c) {
    var age = Sim.ageOf(s.cTech[c]), female = hashPick(s.cSig[c], 2, 2) === 0;
    if (age <= 1) return female ? 'Chieftess' : 'Chieftain';
    if (age >= 5) return female ? 'Princess' : 'Prince';
    return female ? 'Queen' : 'King';
  }
  function direction(dx, dy) {
    var a = Math.atan2(dy, dx), k = Math.round(a / (Math.PI / 4));
    return DIRS[(k + 8) % 8];
  }

  /** The traits that make your people who they are, measured from the world. */
  function survey(s, c) {
    var tiles = 0, terr = [0, 0, 0, 0, 0, 0, 0], river = 0, coast = 0, border = {}, cx = 0, cy = 0, i, d;
    for (i = 0; i < N; i++) {
      if (s.owner[i] !== c) continue;
      tiles++; terr[s.terrain[i]]++; if (s.river[i]) river++;
      cx += i % W; cy += (i / W) | 0;
      for (d = 0; d < 4; d++) {
        var n = Sim.NB[i * 4 + d];
        if (n < 0) continue;
        if (!Sim.isLand(s.terrain[n])) coast++;
        else if (s.owner[n] >= 0 && s.owner[n] !== c) border[s.owner[n]] = (border[s.owner[n]] || 0) + 1;
      }
    }
    cx /= tiles || 1; cy /= tiles || 1;
    var neighbours = Object.keys(border).map(Number).sort(function (a, b) { return border[b] - border[a]; }).slice(0, 3).map(function (e) {
      var ex = 0, ey = 0, n = 0;
      for (var j = 0; j < N; j++) if (s.owner[j] === e) { ex += j % W; ey += (j / W) | 0; n++; }
      return { c: e, sig: s.cSig[e], dir: direction(ex / n - cx, ey / n - cy), bigger: s.sPop[e] > s.sPop[c] * 1.2, smaller: s.sPop[e] * 1.2 < s.sPop[c] };
    });
    var main = 2;
    for (var t = 2; t < 7; t++) if (terr[t] > terr[main]) main = t;
    return { tiles: tiles, terr: terr, main: main, river: river / (tiles || 1), coast: coast / (tiles || 1), neighbours: neighbours };
  }

  function folk(sv) {
    if (sv.river > 0.18) return 'a river people';
    if (sv.coast > 0.35) return 'a seafaring people';
    return { 2: 'farmers of the open plains', 3: 'a people of the deep forests', 4: 'hill clans', 5: 'mountain clans', 6: 'desert folk' }[sv.main] || 'a farming people';
  }

  function temperament(A) {
    if (A >= 6000) return 'fiercely united, quick to take up arms together';
    if (A >= 3500) return 'proud, though their nobles quarrel';
    if (A >= 2000) return 'weary of their rulers and slow to answer a call to arms';
    return 'divided and restless; many say the realm has lost its way';
  }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function fmtPop(p) { return p >= 1e6 ? (p / 1e6).toFixed(1) + ' million' : p >= 1000 ? Math.round(p / 1000) + ',000' : String(p); }

  /** A short sketch of a people, for a new bearer of the Chronoscope. */
  function peopleSketch(s, c) {
    var sig = s.cSig[c], sv = survey(s, c), name = Sim.civName(sig);
    var c1 = hashPick(sig, 11, CUSTOMS.length);
    return 'The ' + esc(name) + ' are ' + folk(sv) + ' of the ' + ageName(s.cTech[c]) + ', ' + fmtPop(s.sPop[c]) + ' souls in ' + sv.tiles + ' provinces. ' +
      'They ' + CUSTOMS[c1] + ', and today they are ' + temperament(Sim.meanAsab(s, c)) + '.';
  }

  /** The prologue: who you are, where you come from. Returns { title, html, ruler, capital }. */
  function homeStory(s, c, branch, tick, birth) {
    var sig = s.cSig[c], name = Sim.civName(sig), sv = survey(s, c), A = Sim.meanAsab(s, c);
    var title = rulerTitle(s, c), ruler = title + ' ' + personName(sig, Math.floor(tick / 30));
    var parent = s.cParent[c] ? Sim.civName(s.cParent[c]) : null;
    var c1 = hashPick(sig, 11, CUSTOMS.length), c2 = (c1 + 1 + hashPick(sig, 12, CUSTOMS.length - 1)) % CUSTOMS.length;
    var cap = s.cCap[c], capX = cap % W, capY = (cap / W) | 0;
    var bx = birth % W, by = (birth / W) | 0;
    var html = '';
    html += '<p>You were born in the year ' + (tick - 20) + ' in a village of <b>' + esc(name) + '</b>, at (' + bx + ', ' + by + '). Now it is the year ' + tick + ', and you are twenty.</p>';
    html += '<p>The ' + esc(name) + ' are ' + folk(sv) + ' of the ' + ageName(s.cTech[c]) + ', some ' + fmtPop(s.sPop[c]) + ' souls across ' + sv.tiles + ' provinces. ' +
      'They ' + CUSTOMS[c1] + ', and they ' + CUSTOMS[c2] + '. Today they are ' + temperament(A) + '.</p>';
    html += '<p>' + (s.cFounded[c] < 60 && !parent ? 'Theirs is one of the oldest realms in the world, grown from the first villages of the first settlers'
      : 'Their realm was founded in the year ' + s.cFounded[c] + (parent ? ' by rebels and heirs of the <b>' + esc(parent) + '</b>' : '')) +
      '. It is ruled from the capital at (' + capX + ', ' + capY + ') by <b>' + esc(ruler) + '</b>.</p>';
    if (sv.neighbours.length) {
      html += '<p>' + sv.neighbours.map(function (nb, k) {
        var rel = nb.bigger ? 'larger and hungrier than your own' : nb.smaller ? 'weaker than your own' : 'a match for your own';
        return (k === 0 ? 'To the ' : 'To the ') + nb.dir + ' lie the <b>' + esc(Sim.civName(nb.sig)) + '</b>, a realm ' + rel + '.';
      }).join(' ') + '</p>';
    }
    var hist = memories(branch, sig, tick);
    if (hist.length) {
      html += '<p class="lore-head">The elders remember:</p><ul class="lore">' + hist.map(function (m) {
        return '<li><span class="t">' + m.t + '</span> ' + m.html + '</li>';
      }).join('') + '</ul>';
    }
    return { name: name, ruler: ruler, capital: cap, html: html };
  }

  // ---------------------------------------------------------------------------
  // What a people remembers: ancestry, wars, census milestones, chronicle
  // ---------------------------------------------------------------------------
  function censusSeries(branch, sig, upTo) {
    var out = [];
    for (var k = 0; k * SAMPLE <= upTo && k < branch.samples.length; k++) {
      var arr = branch.samples[k], v = -1;
      if (arr) for (var j = 0; j < arr.length; j += 3) if (arr[j] === sig) { v = arr[j + 1]; break; }
      out.push(v);
    }
    return out;
  }

  /** Long wars between `sig` and others: consecutive decades of fighting with one foe. */
  function warsOf(branch, sig, upTo) {
    var byFoe = {};
    branch.warLog.forEach(function (w) {
      if (w.dec * 10 > upTo || (w.a !== sig && w.d !== sig)) return;
      var foe = w.a === sig ? w.d : w.a;
      (byFoe[foe] = byFoe[foe] || []).push({ dec: w.dec, won: w.a === sig ? w.n : 0, lost: w.d === sig ? w.n : 0 });
    });
    var wars = [];
    Object.keys(byFoe).forEach(function (foe) {
      var list = byFoe[foe].sort(function (x, y) { return x.dec - y.dec; }), cur = null;
      list.forEach(function (e) {
        if (cur && e.dec <= cur.end + 2) { cur.end = Math.max(cur.end, e.dec); cur.won += e.won; cur.lost += e.lost; }
        else { if (cur) wars.push(cur); cur = { foe: +foe, start: e.dec, end: e.dec, won: e.won, lost: e.lost }; }
      });
      if (cur) wars.push(cur);
    });
    return wars.filter(function (w) { return w.won + w.lost >= 5; })
      .sort(function (x, y) { return (y.won + y.lost) - (x.won + x.lost); });
  }

  function memories(branch, sig, tick) {
    var m = [], name = Sim.civName(sig);
    // ancestry
    var lin = branch.lineage[sig], chain = [];
    for (var g = lin; g && g.parent && chain.length < 3; g = branch.lineage[g.parent]) chain.push(g.parent);
    if (lin && chain.length) {
      var parentName = Sim.civName(chain[0]);
      var pFall = branch.events.filter(function (e) { return e.a === chain[0] && (e.type === 'collapse' || e.type === 'fall') && e.t <= tick; })[0];
      var seceded = branch.events.some(function (e) { return e.type === 'secede' && e.a === sig; });
      m.push({ t: lin.founded, html: 'The ' + esc(name) + (seceded ? ' broke away from the <b>' + esc(parentName) + '</b>' : ' rose from the ruins of the <b>' + esc(parentName) + '</b>') +
        (pFall && !seceded ? ', whose realm ' + (pFall.type === 'collapse' ? 'collapsed' : 'fell') + ' in ' + pFall.t : '') +
        (chain.length > 1 ? '; they in turn were heirs of the ' + chain.slice(1).map(function (x) { return esc(Sim.civName(x)); }).join(', then the ') : '') + '.' });
    }
    else if (lin) {
      m.push({ t: lin.founded, html: lin.founded < 60 ? 'The first villages of the ' + esc(name) + ' are raised by settlers from beyond memory.' : 'The ' + esc(name) + ' are founded.' });
    }
    // wars
    warsOf(branch, sig, tick).slice(0, 3).forEach(function (w) {
      var foe = esc(Sim.civName(w.foe)), total = w.won + w.lost, years = (w.end - w.start + 1) * 10;
      var verdict = w.won > w.lost * 2 ? 'most of them won by the ' + esc(name) : w.lost > w.won * 2 ? 'most of them lost to the ' + foe : 'neither side winning for long';
      m.push({ t: w.start * 10, html: (years >= 30 ? 'The long war with the <b>' + foe + '</b>' : 'War with the <b>' + foe + '</b>') + ' (' + w.start * 10 + '–' + Math.min(tick, w.end * 10 + 9) + '): ' + total + ' provinces changed hands, ' + verdict + '.' });
    });
    // census milestones
    var ser = censusSeries(branch, sig, tick), peak = -1, peakK = -1, k;
    for (k = 0; k < ser.length; k++) if (ser[k] > peak) { peak = ser[k]; peakK = k; }
    var gap = 20; // a century, in samples
    var bestGrow = null, bestDrop = null;
    for (k = gap; k < ser.length; k++) {
      var a0 = ser[k - gap], a1 = ser[k];
      if (a0 < 1500 || a1 <= 0) continue;
      if (a1 >= a0 * 2 && (!bestGrow || a1 / a0 > bestGrow.r)) bestGrow = { r: a1 / a0, t: k * SAMPLE };
      if (a1 <= a0 * 0.65 && (!bestDrop || a1 / a0 < bestDrop.r)) bestDrop = { r: a1 / a0, t: k * SAMPLE };
    }
    if (bestGrow) m.push({ t: bestGrow.t - 100, html: 'Within a century their numbers ' + (bestGrow.r >= 4 ? 'more than quadrupled' : bestGrow.r >= 3 ? 'tripled' : 'doubled') + '.' });
    if (bestDrop) m.push({ t: bestDrop.t - 100, html: 'Hard times: within a century they lost ' + Math.round((1 - bestDrop.r) * 100) + '% of their people to war, hunger or plague.' });
    if (peakK >= 0 && peakK * SAMPLE < tick - 40) m.push({ t: peakK * SAMPLE, html: 'Their golden age: ' + fmtPop(peak) + ' souls, more than they number today.' });
    // chronicle
    branch.events.forEach(function (e) {
      if (e.t <= tick && (e.a === sig || e.b === sig) && e.type !== 'rise') m.push({ t: e.t, html: esc(e.text) });
    });
    m.sort(function (x, y) { return x.t - y.t; });
    return m.slice(-6);
  }

  // ---------------------------------------------------------------------------
  // The prophecy
  // ---------------------------------------------------------------------------
  function prophecy(branch, sig, from) {
    var f = fate(branch, sig, from), name = Sim.civName(sig);
    if (f.end == null) return null;
    var ev = f.event, conqueror = ev && ev.type === 'fall' && ev.b ? Sim.civName(ev.b) : null;
    var vision = ev ? ev.text : 'The ' + name + ' dwindle, province by province, until no one remembers their name.';
    var hint;
    if (conqueror) {
      hint = 'The blow comes from outside: the <b>' + esc(conqueror) + '</b>. Weaken them with discord, kill their ruler while they are fragile, or make your own people stronger before the war: rally them, feed them, carry them knowledge.';
    } else if (ev && ev.type === 'collapse') {
      hint = 'The rot is inside. When a realm\'s solidarity stays too low for too long, it shatters. Rally its people, keep them fed and free of plague, and bring them knowledge from stronger peoples.';
    } else {
      hint = 'The causes are unclear. Watch the realm\'s solidarity, harvests and neighbours as its end draws near.';
    }
    return { end: f.end, target: f.end + MARGIN, vision: vision, hint: hint, conqueror: conqueror, foeSig: conqueror ? ev.b : 0 };
  }

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------
  /**
   * What a year at province i does to a person's health.
   * Returns { delta, reasons: [[label, amount]], exposed }.
   */
  function healthYear(s, i, age, immune) {
    var r = [], t = s.terrain[i], c = s.owner[i], exposed = false, d, n;
    if (!Sim.isLand(t)) r.push(['at sea', -5]);
    else {
      if (c >= 0) {
        r.push(['among people', 3]);
        if (s.cCap[c] === i) r.push(['comforts of the capital', 2]);
      } else r.push(['wilderness', -3]);
      if (s.starve[i]) r.push(['famine', -8]);
      var near = false;
      for (d = 0; d < 4; d++) { n = Sim.NB[i * 4 + d]; if (n >= 0 && s.plague[n]) near = true; }
      if (s.plague[i]) { exposed = true; if (!immune) r.push(['plague', -22]); }
      else if (near) { exposed = true; if (!immune) r.push(['plague nearby', -7]); }
      if (s.clim[i] < 90) r.push(['harsh climate', -3]);
      else if (s.clim[i] >= 104) r.push(['kind weather', 1]);
      if (t === TER.MOUNTAIN) r.push(['thin mountain air', -2]);
      if (t === TER.DESERT && !s.river[i]) r.push(['desert heat', -3]);
      if (c >= 0) {
        for (d = 0; d < 4; d++) {
          n = Sim.NB[i * 4 + d];
          if (n >= 0 && s.owner[n] >= 0 && s.owner[n] !== c) { r.push(['border strife', -2]); break; }
        }
      }
    }
    if (age > 45) r.push(['age', -Math.round((age - 45) * 0.25 * 10) / 10]);
    var delta = 0;
    r.forEach(function (x) { delta += x[1]; });
    return { delta: delta, reasons: r, exposed: exposed };
  }
  function maxHealth(age) { return Math.max(0, Math.min(100, 100 - Math.max(0, age - 50) * 2)); }
  function condition(h) { return h >= 80 ? 'hale' : h >= 55 ? 'well' : h >= 30 ? 'weary' : h >= 12 ? 'ill' : 'dying'; }

  var Story = { START_YEAR: START_YEAR, MARGIN: MARGIN, fate: fate, present: present, pickHome: pickHome, memories: memories, warsOf: warsOf, pickBirthplace: pickBirthplace,
    homeStory: homeStory, peopleSketch: peopleSketch, personName: personName, prophecy: prophecy, healthYear: healthYear, maxHealth: maxHealth, condition: condition, survey: survey };
  if (typeof module !== 'undefined' && module.exports) module.exports = Story;
  else root.Story = Story;
}(this));
