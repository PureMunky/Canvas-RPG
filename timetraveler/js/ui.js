/*
 * Chronoscope UI: you are one person walking a deterministic world.
 *
 * Walking never touches the simulation; it only spends your time. Deeds (and
 * the god-like Powers) become timeline interventions, so every history you
 * make replays exactly. Everything else here is rendering and controls.
 */
(function () {
  'use strict';
  var W = Sim.W, H = Sim.H, N = Sim.N, S = 6;          // world view: 6px per province
  var TS = 30, VW = 32, VH = 20;                        // close view: 30px per province, 32x20 visible
  var HORIZON = 3000, KF = 50, SAMPLE = Timeline.SAMPLE;
  var TER = Sim.TER;
  var STEP_COST = 1 / 6, SEA_COST = 1 / 2, DEED_COST = 1;
  var $ = function (id) { return document.getElementById(id); };

  var MODES = [
    { id: 'realms', name: 'Realms' }, { id: 'terrain', name: 'Terrain' }, { id: 'people', name: 'People' },
    { id: 'solidarity', name: 'Solidarity' }, { id: 'climate', name: 'Climate' }, { id: 'divergence', name: 'Divergence' }
  ];
  var BASE_TOOLS = [
    { id: 'walk', name: 'Walk', icon: '⚲', short: 'Walk', desc: 'Click the map to walk there. Time passes as you travel.' },
    { id: 'inspect', name: 'Inspect', icon: '⌕', short: 'Inspect', desc: 'Click a realm to follow its history.' }
  ];
  var POWERS = Sim.TOOLS;
  var SHORT = { bless: 'Bless', blight: 'Salt', tribe: 'People', prophet: 'Prophet', knowledge: 'Ideas',
    plague: 'Plague', smite: 'Smite', mountain: 'Mount', sea: 'Flood', land: 'Land' };
  var DEEDS = Sim.DEEDS;
  var EVENT_ICON = { rise: '↑', collapse: '✕', fall: '†', sack: '⚔', secede: '⇋', age: '✦', plague: '☣', you: '◈', power: '✧' };

  var app = {
    world: null, view: null, cview: null, cur: null, cmp: null,
    tick: 0, playing: false, speed: 10, acc: 0, last: 0,
    tool: 'walk', mode: 'realms', camera: 'close', selected: 0, hover: -1,
    person: { x: 0, y: 0, knowledge: null, target: -1, timeAcc: 0, lastStep: 0, stalled: false,
      age: 20, health: 100, life: 1, immuneUntil: 0, reasons: [], dead: false },
    story: { mode: 'story', stage: 'loading', unlocked: false, home: null, journal: [], prophecy: null, quest: '' },
    needsRender: true, chartDirty: true, chartDrawn: 0, panelsAt: 0, chronKey: '', tlKey: '',
    flash: null, tab: 'journal', chartMax: 1, impact: null, oracle: null
  };

  // ---------------------------------------------------------------------------
  // Colours
  // ---------------------------------------------------------------------------
  var TERRAIN_RGB = [[28, 50, 82], [44, 80, 118], [128, 150, 86], [66, 100, 60], [134, 120, 84], [148, 144, 138], [204, 184, 132]];
  var colorCache = {};
  function hsl2rgb(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { return Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))); };
    return [f(0), f(8), f(4)];
  }
  function civRGB(sig) {
    var c = colorCache[sig];
    if (!c) { c = hsl2rgb(sig % 360, 55 + ((sig >>> 9) % 30), 46 + ((sig >>> 17) % 16)); colorCache[sig] = c; }
    return c;
  }
  function civCSS(sig, a) { var c = civRGB(sig); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  function rgb(r, g, b) { return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }

  // ---------------------------------------------------------------------------
  // World lifecycle
  // ---------------------------------------------------------------------------
  function newWorld(seed, interventions, mode, fixed) {
    seed = seed >>> 0;
    var st = app.story;
    st.fixed = fixed || null; // a challenge: { home: sig, born: {x, y} }
    st.mode = mode || 'story'; st.unlocked = st.mode === 'sandbox'; st.stage = st.mode === 'story' ? 'loading' : 'free';
    st.home = null; st.journal = []; st.prophecy = null; st.quest = ''; st.paths = {}; st.hints = st.hints !== false;
    app.oracle = null; app.person.name = '';
    var p0 = app.person; p0.age = 20; p0.health = 100; p0.life = 1; p0.immuneUntil = 0; p0.reasons = []; p0.dead = false;
    app.world = new Timeline.World(seed, { horizon: HORIZON, kfEvery: KF, maxCached: 4 });
    app.view = new Timeline.View(app.world);
    app.cview = new Timeline.View(app.world);
    app.cur = app.world.root;
    app.cmp = null;
    app.tick = 0; app.selected = 0; app.chartMax = 1; app.impact = null;
    colorCache = {};
    $('seed').value = seed;
    (interventions || []).forEach(function (iv) {
      var prev = app.cur;
      app.cur = app.world.intervene(app.cur, iv.t, iv);
      if (app.cur !== prev) app.cmp = prev;
    });
    if (app.cur !== app.world.root) app.cmp = app.world.root;
    if (st.mode === 'story') app.world.root.name = 'The world without you';
    placePerson();
    buildToolbar();
    invalidateAll();
    updateHash();
    if (st.mode === 'story') {
      app.playing = false; syncPlay();
      showStory({ kicker: 'World ' + seed, title: 'A world is being born', html: '<p>Peoples are settling the land, raising their first villages, and fighting their first wars. Your story begins in the year ' + Story.START_YEAR + '.</p><p class="muted" id="birth-progress">Year 0</p>', buttons: [] });
    }
  }

  function seededRandom(a) {
    return function () { // mulberry32
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function todaySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }

  function locked() { return app.story.mode === 'story' && !app.story.unlocked; }
  function lockedToast() { toast('You cannot travel in time. <i>Not yet.</i>'); }

  /** Start beside the first people of this world. */
  function placePerson() {
    var g = Sim.restore(app.world.genesis), p = app.person, home = g.cCap[0];
    p.x = home % W; p.y = (home / W) | 0;
    p.knowledge = null; p.target = -1; p.timeAcc = 0; p.stalled = false;
  }

  function invalidateAll() { app.needsRender = true; app.chartDirty = true; app.chronKey = ''; app.tlKey = ''; app.panelsAt = 0; }

  function updateHash() {
    try { history.replaceState(null, '', '#' + Timeline.encode(app.world.seed, app.cur.interventions)); } catch (e) { /* sandboxed */ }
  }

  function canSeek(b, t) { return t <= b.computedTo || !!b.keyframes[Math.floor(t / KF)]; }

  function setTick(t, force) {
    t = Math.max(0, Math.min(HORIZON, Math.round(t)));
    if (!force) t = Math.min(t, Math.max(app.cur.computedTo, app.tick));
    if (t !== app.tick) { app.tick = t; app.needsRender = true; }
  }

  /**
   * Spend some of your time. Time is owed and paid off by the main loop as
   * soon as the future has been written, so a deed that forks a new timeline
   * still costs its year. Returns false (and spends nothing) while you wait.
   */
  function spendTime(years) {
    var p = app.person;
    if (app.tick >= HORIZON) { toast('You have reached the end of recorded time. Drag the chart to travel back.'); return false; }
    if (p.dead || p.timeAcc >= 1) return false;
    p.timeAcc += years;
    payTime();
    return true;
  }
  function payTime() {
    var p = app.person, b = app.cur;
    while (p.timeAcc >= 1 && app.tick < b.computedTo && app.tick < HORIZON && !p.dead) { p.timeAcc -= 1; liveThroughYear(); }
    if (app.tick >= HORIZON) p.timeAcc = Math.min(p.timeAcc, 0.99);
    p.stalled = p.timeAcc >= 1;
  }

  // ---------------------------------------------------------------------------
  // Interventions: deeds and powers
  // ---------------------------------------------------------------------------
  function toolDef(id) {
    var all = BASE_TOOLS.concat(POWERS, DEEDS);
    for (var k = 0; k < all.length; k++) if (all[k].id === id) return all[k];
    return BASE_TOOLS[0];
  }
  function isDeed(type) { return DEEDS.some(function (d) { return d.id === type; }); }

  var ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  /** In story mode, timelines are named after your lives. */
  function nameBranch(b) {
    var st = app.story;
    if (st.mode !== 'story') return;
    var life = app.person.life, n = st.paths[life] = (st.paths[life] || 0) + 1;
    b.name = 'Your ' + (ORD[life - 1] || life + 'th') + ' life' + (n > 1 ? ', path ' + n : '');
    b.bearer = app.person.name;
  }

  function record(iv) {
    var prev = app.cur;
    var b = app.world.intervene(app.cur, app.tick, iv);
    app.cur = b;
    if (b !== prev) { app.cmp = prev; nameBranch(b); }
    app.flash = { x: iv.x, y: iv.y, until: performance.now() + 1500 };
    invalidateAll();
    updateHash();
    return b !== prev ? prev : null;
  }

  function usePower(x, y) {
    var def = toolDef(app.tool);
    var forkedFrom = record({ type: app.tool, x: x, y: y, note: 'A divine hand: ' + def.name.toLowerCase() + ' at (' + x + ', ' + y + ').' });
    toast(forkedFrom ? '<b>' + esc(app.cur.name) + '</b> branches from ' + esc(forkedFrom.name) + ' in year ' + app.tick + '. ' + esc(def.name) + '. The future is being rewritten…'
      : esc(def.name) + ' added to <b>' + esc(app.cur.name) + '</b> in year ' + app.tick + '.');
  }

  function localSnapshot(s, i) {
    var c = s.owner[i], sum = 0, asab = 0, n = 0;
    var tiles = [i];
    for (var d = 0; d < 4; d++) { var nb = Sim.NB[i * 4 + d]; if (nb >= 0) tiles.push(nb); }
    tiles.forEach(function (t) { sum += Sim.capacity(s, t, s.owner[t] >= 0 ? s.cTech[s.owner[t]] : 0); if (s.owner[t] >= 0) { asab += s.asab[t]; n++; } });
    return { cap: sum, asab: n ? asab / n : 0, sig: c >= 0 ? s.cSig[c] : 0, tech: c >= 0 ? s.cTech[c] : 0,
      realmAsab: c >= 0 ? Sim.meanAsab(s, c) : 0, plague: tiles.filter(function (t) { return s.plague[t]; }).length, owner: s.owner[i] };
  }

  function doDeed(id) {
    var s = app.view.s, p = app.person, def = toolDef(id);
    if (!s || app.view.tick !== app.tick) return;
    if (p.dead) return;
    if (p.stalled) { toast('Wait a moment: the future is still being written.'); return; }
    var why = Sim.deedBlocker(s, id, p.x, p.y, p.knowledge);
    if (why) { toast(esc(why)); return; }
    if (app.tick >= HORIZON) { toast('You have reached the end of recorded time.'); return; }
    var i = p.y * W + p.x, c = s.owner[i], name = c >= 0 ? Sim.civName(s.cSig[c]) : '';
    if (id === 'learn') {
      p.knowledge = { tech: s.cTech[c], sig: s.cSig[c], year: app.tick };
      toast('You spend a year among the ' + esc(name) + ' and learn the ways of the ' + Sim.AGES[Sim.ageOf(s.cTech[c])].name + '.');
      spendTime(DEED_COST);
      storyDeed(id, s.cSig[c]);
      return;
    }
    var before = localSnapshot(s, i);
    var where = name ? ' among the ' + name : ' at (' + p.x + ', ' + p.y + ')';
    var notes = {
      irrigate: 'You dig irrigation canals' + where + '.', rally: 'You rally the people' + where + '.',
      heal: 'You tend the sick' + where + '.', settle: 'You lead settlers into empty land at (' + p.x + ', ' + p.y + ').',
      teach: 'You teach the ' + name + ' the knowledge of ' + (p.knowledge ? Sim.civName(p.knowledge.sig) : 'distant lands') + '.',
      discord: 'You sow discord' + where + '.', assassinate: 'You assassinate the ruler of ' + name + '.'
    };
    var forkedFrom = record({ type: id, x: p.x, y: p.y, v: id === 'teach' ? p.knowledge.tech : 0, note: notes[id] });
    var after = localSnapshot(app.view.seek(app.cur, app.tick), i);
    var effect = describeEffect(id, before, after);
    toast(esc(notes[id]) + (effect ? ' ' + effect : '') +
      (forkedFrom && !locked() ? '<br><span class="muted">This begins a new timeline, <b>' + esc(app.cur.name) + '</b>, branching from ' + esc(forkedFrom.name) + '.</span>' : ''));
    spendTime(DEED_COST);
    storyDeed(id, before.sig);
  }

  function describeEffect(id, a, b) {
    var pct = function (v) { return Math.round(v / 100) + '%'; };
    switch (id) {
      case 'irrigate': return 'The land around you can now feed about ' + fmtPop(Math.max(0, Math.round(b.cap - a.cap))) + ' more people.';
      case 'rally': case 'discord': return 'Local solidarity ' + pct(a.asab) + ' → ' + pct(b.asab) + '.';
      case 'heal': return a.plague ? 'The plague is held back from ' + a.plague + ' province' + (a.plague > 1 ? 's' : '') + '.' : '';
      case 'settle': return b.owner >= 0 ? 'A new village of ' + Sim.civName(b.sig) + ' takes root.' : '';
      case 'teach': return 'Their knowledge rises from ' + Sim.AGES[Sim.ageOf(a.tech)].name + ' (' + a.tech + ') to ' + Sim.AGES[Sim.ageOf(b.tech)].name + ' (' + b.tech + ').';
      case 'assassinate': return 'A succession crisis grips the realm: its solidarity falls from ' + pct(a.realmAsab) + ' to ' + pct(b.realmAsab) +
        (b.realmAsab < Sim.CFG.collapseAsab ? '. It may not survive.' : '.');
    }
    return '';
  }

  function undo() {
    var b = app.cur;
    if (!app.world.undo(b)) { toast('Nothing to undo in ' + esc(b.name) + '.'); return; }
    if (app.world.ownInterventions(b).length === 0 && b.parent >= 0) {
      var hasChildren = app.world.branches.some(function (c) { return c.parent === b.id && !c.deleted; });
      if (!hasChildren) b.deleted = true;
      app.cur = app.world.branches[b.parent];
      if (app.cmp === app.cur) app.cmp = null;
      toast('Change undone. Returned to <b>' + esc(app.cur.name) + '</b>.');
    } else toast('Last change undone.');
    invalidateAll();
    updateHash();
  }

  function switchBranch(b) {
    if (b === app.cur) return;
    var prev = app.cur;
    app.cur = b;
    if (app.cmp === b) app.cmp = prev;
    invalidateAll();
    updateHash();
  }

  // ---------------------------------------------------------------------------
  // Story: prologue, the vision, the quest; aging and death
  // ---------------------------------------------------------------------------
  function showStory(o) {
    $('story-kicker').textContent = o.kicker || '';
    $('story-title').textContent = o.title;
    $('story-body').innerHTML = o.html;
    var acts = $('story-actions');
    acts.innerHTML = '';
    (o.buttons || []).forEach(function (b, k) {
      var el = document.createElement('button');
      el.className = 'btn' + (k === 0 ? ' primary' : '');
      el.textContent = b.label;
      el.onclick = function () { $('story').hidden = true; if (b.fn) b.fn(); };
      acts.appendChild(el);
    });
    $('story').hidden = false;
    var first = acts.querySelector('button');
    if (first) first.focus();
  }
  function journal(html) { app.story.journal.push({ t: app.tick, html: html, life: app.person.life }); app.panelsAt = 0; }
  function homeCiv(s) {
    var h = app.story.home;
    if (!h || !s) return -1;
    for (var c = 0; c < s.g[1]; c++) if (s.cSig[c] === h.sig && s.cAlive[c] && s.sTiles[c] > 0) return c;
    return -1;
  }

  function beginStory() {
    var st = app.story, root = app.world.root;
    setTick(Story.START_YEAR, true);
    var s = app.view.seek(root, app.tick);
    // The world number alone decides your story, so anyone entering it is born into the same life.
    var rnd = seededRandom(app.world.seed ^ 0x5eed), pick = null;
    if (st.fixed && st.fixed.home) {
      for (var fc = 0; fc < s.g[1]; fc++) if (s.cSig[fc] === st.fixed.home && s.cAlive[fc] && s.sTiles[fc] > 0) pick = { c: fc, sig: s.cSig[fc] };
    }
    if (!pick) pick = Story.pickHome(root, s, rnd);
    if (!pick) { st.mode = 'sandbox'; st.unlocked = true; st.stage = 'free'; $('story').hidden = true; buildToolbar(); return; }
    var birth = Story.pickBirthplace(s, pick.c, rnd);
    if (st.fixed && st.fixed.born) {
      var fb = st.fixed.born.y * W + st.fixed.born.x;
      if (fb >= 0 && fb < N && s.owner[fb] === pick.c) birth = fb;
    }
    st.birth = birth;
    var p = app.person;
    p.x = birth % W; p.y = (birth / W) | 0; p.target = -1; p.timeAcc = 0;
    p.name = Story.personName(pick.sig, app.world.seed);
    var tale = Story.homeStory(s, pick.c, root, app.tick, birth);
    st.home = { sig: pick.sig, name: tale.name, ruler: tale.ruler };
    st.stage = 'goCapital';
    app.selected = 0;
    setCamera('close');
    journal('You come of age in a village of the <b>' + esc(tale.name) + '</b>.');
    showStory({ kicker: 'Prologue · Year ' + app.tick, title: p.name + ', child of the ' + tale.name, html: '<p>Your name is <b>' + esc(p.name) + '</b>.</p>' + tale.html +
      '<p><b>Custom demands that every youth of age present themselves to the ruler.</b> Walk to the capital (marked with a gold star): click the map or use WASD.</p>',
      buttons: [{ label: 'Set out' }] });
    invalidateAll();
  }

  /** Called after any deed (or Learn) succeeds. */
  function storyDeed(id, sigHere) {
    var st = app.story;
    if (!st.home || sigHere !== st.home.sig) return;
    if (st.stage === 'learn' && id === 'learn') {
      st.stage = 'help';
      journal('You learn the customs and crafts of your people.');
      toast('Your people need hands. <b>Help them</b>: dig irrigation (1), rally them (2), or tend the sick (3).');
    } else if (st.stage === 'help' && (id === 'irrigate' || id === 'rally' || id === 'heal' || id === 'settle')) {
      st.stage = 'awaitVision';
      journal('You labour beside your people, and they come to know your name.');
    }
  }

  function storyFrame() {
    var st = app.story, s = app.view.s;
    if (st.stage === 'loading') {
      var el = document.getElementById('birth-progress');
      if (el) el.textContent = 'Year ' + app.world.root.computedTo + ' of ' + (Story.START_YEAR + 600) + '…';
      if (app.world.root.computedTo >= Story.START_YEAR + 600) beginStory();
      return;
    }
    if (!s || app.view.tick !== app.tick || app.person.dead) return;
    if (st.stage === 'goCapital') {
      var c = homeCiv(s);
      if (c >= 0 && s.cCap[c] === app.person.y * W + app.person.x) {
        st.stage = 'learn';
        journal('You kneel before ' + esc(st.home.ruler) + ' in the capital and swear the oath of your people.');
        showStory({ kicker: 'Prologue · Year ' + app.tick, title: 'The oath', html:
          '<p>The hall is smoky and loud. When your name is called you kneel before <b>' + esc(st.home.ruler) + '</b>, and you swear the oath your parents swore.</p>' +
          '<p>The ruler studies you. "Learn our ways before you serve them."</p>' +
          '<p><b>Spend a year learning among your people</b> (the Learn deed, key 5). Every deed takes a year of your life, and your health depends on where you spend it.</p>',
          buttons: [{ label: 'Continue' }] });
      }
    } else if (st.stage === 'awaitVision') {
      if (app.cur.computedTo >= HORIZON && app.person.timeAcc < 1) showVision();
    } else if (st.stage === 'quest') {
      checkQuest();
      tendOracle();
    }
  }

  function showVision() {
    var st = app.story, pr = Story.prophecy(app.cur, st.home.sig, app.tick);
    st.unlocked = true;
    buildToolbar();
    if (!pr) {
      st.stage = 'won';
      journal('A stranger shows you the Chronoscope. Your people\'s end is not written in it.');
      showStory({ kicker: 'Year ' + app.tick, title: 'The Chronoscope', html: '<p>A stranger in a grey cloak presses a brass instrument into your hands. In its glass you see centuries pass, and the banners of the <b>' + esc(st.home.name) + '</b> never fall.</p><p>History is yours to wander. Every power of the instrument is now open to you.</p>', buttons: [{ label: 'Wander' }] });
      return;
    }
    st.prophecy = pr; st.stage = 'quest';
    journal('A stranger gives you the Chronoscope and shows you the fall of your people in the year ' + pr.end + '.');
    var yearsAway = pr.end - app.tick;
    showStory({ kicker: 'Chapter one · Year ' + app.tick, title: 'The Chronoscope', html:
      '<p>That night a stranger in a grey cloak waits by your door. Without a word they press a brass instrument into your hands, cold and humming, and walk into the dark.</p>' +
      '<p>In its glass you see the years run like water. Villages grow and burn. Then, ' + yearsAway + ' years from now:</p>' +
      '<p class="vision">Year ' + pr.end + '. ' + esc(pr.vision) + '</p>' +
      '<p>' + pr.hint + '</p>' +
      '<p><b>Save the ' + esc(st.home.name) + ': they must still hold at least one province in the year ' + pr.target + '.</b></p>' +
      '<p>The Chronoscope lets you travel through time: drag the history chart, or use , and . to step. <b>Travelling does not age you; living does.</b> You have one life, perhaps fifty years. Spend them where they matter. If you act in the past, history rewrites itself, and the Journal tells you whether your people still fall.</p>' +
      '<p>Listen to the instrument. It hums in the years that matter, louder as you come near a place and moment where one deed would turn fate. When your strength fails, give it to someone young (P), as it was given to you.</p>',
      buttons: [{ label: 'Take up the Chronoscope' }] });
    invalidateAll();
  }

  /** Keep the Oracle reading the timeline you are in (restarting when it changes). */
  function tendOracle() {
    var st = app.story, pr = st.prophecy, b = app.cur;
    if (!pr || b.computedTo < pr.target) return;
    var key = b.id + ':' + b.version;
    if (!app.oracle || app.oracle.key !== key) {
      app.oracle = new Oracle({ world: app.world, branch: b, homeSig: st.home.sig, foeSig: pr.foeSig, end: pr.end, target: pr.target });
      app.oracle.key = key;
    }
  }

  function humHTML() {
    var o = app.oracle, p = app.person;
    if (!o || !app.story.hints || app.story.stage !== 'quest' || p.dead) return '';
    var h = o.hum(p.x, p.y, app.tick);
    if (!h) return o.done ? '' : '<div class="hum quiet">⧗ The Chronoscope is listening…</div>';
    if (h.level === 3) return '<div class="hum loud">⧗ The Chronoscope sings! A deed here, now, would turn fate: <b>' + esc(toolDef(h.deed).name) + '</b>.</div>';
    if (h.level === 2) return '<div class="hum">⧗ The Chronoscope hums: somewhere near, within a few years, a single deed would matter.</div>';
    return '<div class="hum faint">⧗ The Chronoscope hums faintly: these are years that matter.</div>';
  }

  function checkQuest() {
    var st = app.story, pr = st.prophecy, b = app.cur;
    if (!pr) return;
    if (b.computedTo <= pr.target) { st.quest = 'reading'; return; }
    if (Story.present(b, st.home.sig, pr.target)) {
      st.quest = 'saved'; st.stage = 'won';
      buildToolbar();
      var f = Story.fate(b, st.home.sig, Story.START_YEAR);
      journal('<b>The ' + esc(st.home.name) + ' endure past the year ' + pr.target + '.</b>');
      showStory({ kicker: 'Year ' + app.tick + ' · ' + esc(b.name), title: 'History rewritten', html:
        '<p>You look into the Chronoscope and the year ' + pr.end + ' passes like any other. The banners of the <b>' + esc(st.home.name) + '</b> still fly in ' + pr.target + '.</p>' +
        '<p>' + (f.end ? 'In this timeline they last until the year ' + f.end + ' (' + (f.end - pr.end) + ' years longer than foretold).' : 'In this timeline they are still standing in the year ' + HORIZON + '.') + '</p>' +
        (app.impact ? '<p>Your deeds changed ' + fmtPop(app.impact.lives) + ' lives compared with ' + esc(app.cmp ? app.cmp.name : 'the original history') + '.</p>' : '') +
        '<p>The Chronoscope\'s other powers are open to you now: plague, flood, mountains. History is yours to wander.</p>',
        buttons: [{ label: 'Wander through time' }] });
    } else {
      var f2 = Story.fate(b, st.home.sig, Story.START_YEAR);
      st.quest = 'fallen:' + (f2.end != null ? f2.end : '?');
    }
  }

  var LIVING_SPEED = 100; // years per second at most while you are alive in story mode
  function living() { return app.story.mode === 'story' && app.story.stage !== 'loading' && !app.person.dead; }

  /** Live through the current year where you stand, judged on that exact year's world, then move on. */
  function liveThroughYear() {
    if (living()) liveYear(app.view.seek(app.cur, app.tick));
    app.tick++;
    app.needsRender = true;
  }

  function liveYear(s) {
    var p = app.person;
    if (!living() || !s) return;
    p.reasonsYear = app.tick;
    var r = Story.healthYear(s, p.y * W + p.x, p.age, p.age < p.immuneUntil);
    p.age += 1;
    p.health = Math.min(Story.maxHealth(p.age), p.health + r.delta);
    p.reasons = r.reasons;
    if (r.exposed && p.age >= p.immuneUntil && p.health > 0) { p.immuneUntil = p.age + 25; toast('You survive the sickness. You will not catch it again for many years.'); }
    if (p.health <= 0) die(r.reasons);
  }

  // ---- passing on the Chronoscope ----
  function freshName(sig) { return Story.personName(sig, Math.floor(Math.random() * 1e6)); }

  /** A populated province at or near i (the nearest one), or anywhere among your people, or anywhere. */
  function successorTile(s, i) {
    var x0 = i % W, y0 = (i / W) | 0, best = -1, bestD = 1e9;
    for (var y = Math.max(0, y0 - 8); y <= Math.min(H - 1, y0 + 8); y++) for (var x = Math.max(0, x0 - 8); x <= Math.min(W - 1, x0 + 8); x++) {
      var j = y * W + x, d = Math.abs(x - x0) + Math.abs(y - y0);
      if (s.owner[j] >= 0 && s.pop[j] > 0 && d < bestD) { best = j; bestD = d; }
    }
    if (best >= 0) return best;
    var c = homeCiv(s);
    if (c >= 0) return Story.pickBirthplace(s, c, Math.random);
    for (var k = 0; k < 400; k++) { var r = Math.floor(Math.random() * N); if (s.pop[r] > 0 && s.owner[r] >= 0) return r; }
    return i;
  }

  function causeOfDeath(reasons) {
    var worst = reasons.filter(function (x) { return x[1] < 0; }).sort(function (a, b) { return a[1] - b[1]; })[0];
    return worst ? { plague: 'of plague', 'plague nearby': 'of the plague that swept your district', famine: 'of hunger', age: 'of old age', 'at sea': 'at sea', wilderness: 'alone in the wilderness', 'harsh climate': 'in a bitter season', 'desert heat': 'of thirst in the desert', 'border strife': 'in a border skirmish', 'thin mountain air': 'in the high passes' }[worst[0]] || 'of hardship' : 'of hardship';
  }

  function die(reasons) {
    var p = app.person, st = app.story, s = app.view.s;
    p.dead = true; p.health = 0; p.target = -1;
    app.playing = false; syncPlay();
    var cause = causeOfDeath(reasons), i = p.y * W + p.x, c = s ? s.owner[i] : -1;
    var heir = successorTile(s, i), hc = s.owner[heir], heirName = freshName(hc >= 0 ? s.cSig[hc] : 7);
    var heirPeople = hc >= 0 ? Sim.civName(s.cSig[hc]) : 'wanderers';
    journal('<b>' + esc(p.name) + '</b> dies ' + cause + ' at the age of ' + p.age + (c >= 0 ? ', among the ' + esc(Sim.civName(s.cSig[c])) : '') + '.');
    var holds = st.unlocked;
    showStory({ kicker: 'Year ' + app.tick, title: 'The end of ' + p.name, html:
      '<p>You die ' + cause + ' at the age of ' + p.age + ' in the year ' + app.tick + (c >= 0 ? ', among the <b>' + esc(Sim.civName(s.cSig[c])) + '</b>' : '') + '. Every deed of your life remains written into its timeline.</p>' +
      (holds ? '<p>With your last strength you press the Chronoscope into the hands of <b>' + esc(heirName) + '</b>, a young ' + esc(heirPeople) + ' who found you. You say nothing. You understand now why the stranger said nothing either.</p>'
        : '<p>Your story passes to another child of the <b>' + esc(st.home.name) + '</b>: <b>' + esc(heirName) + '</b>.</p>'),
      buttons: [{ label: 'Continue as ' + heirName, fn: function () { becomeBearer(heir, heirName, 'death'); } }, { label: 'New world', fn: function () { newWorld(Math.floor(Math.random() * 1e6)); } }] });
  }

  /** Hand the Chronoscope on while you still live: you choose the year and the place. */
  function offerPassOn() {
    var p = app.person, s = app.view.s, st = app.story;
    if (!st.unlocked || st.mode !== 'story') { toast('The Chronoscope is not yours to give. Not yet.'); return; }
    if (p.dead || !s || app.view.tick !== app.tick) return;
    var i = p.y * W + p.x, c = s.owner[i];
    if (c < 0 || s.pop[i] <= 0) { toast('There is no one here to take the Chronoscope. Walk to where people live.'); return; }
    var heirName = freshName(s.cSig[c]);
    showStory({ kicker: 'Year ' + app.tick, title: 'Pass on the Chronoscope?', html:
      '<p>A young ' + esc(Sim.civName(s.cSig[c])) + ' named <b>' + esc(heirName) + '</b> lives here, twenty years old. You could give them the Chronoscope now, in the year ' + app.tick + ', and walk into the dark as the stranger once did for you.</p>' +
      '<p>Your own life ends here. They begin theirs with full health and all of it ahead of them, in this year and this place. Choose the moment well: travel first to where and when your people will need a young bearer.</p>',
      buttons: [{ label: 'Give it to ' + heirName, fn: function () {
        journal('<b>' + esc(p.name) + '</b>, aged ' + p.age + ', gives the Chronoscope to ' + esc(heirName) + ' and walks into the dark.');
        becomeBearer(i, heirName, 'gift');
      } }, { label: 'Not yet' }] });
  }

  function becomeBearer(tile, name, how) {
    var p = app.person, st = app.story, s = app.view.seek(app.cur, app.tick);
    p.life++; p.name = name; p.age = 20; p.health = 100; p.dead = false; p.immuneUntil = 0; p.reasons = []; p.timeAcc = 0;
    p.knowledge = null; p.target = -1; p.x = tile % W; p.y = (tile / W) | 0;
    var c = s.owner[tile], people = c >= 0 ? Sim.civName(s.cSig[c]) : null, pr = st.prophecy;
    journal('<b>' + esc(name) + '</b> becomes bearer ' + p.life + ' of the Chronoscope' + (people ? ', among the ' + esc(people) : '') + '.');
    if (!st.unlocked) { app.needsRender = true; app.panelsAt = 0; return; }
    var how2 = how === 'gift'
      ? 'A stranger in a grey cloak, old and quiet, pressed a brass instrument into your hands and walked into the dark.'
      : 'You found a dying stranger by the road. With their last strength they pressed a brass instrument into your hands.';
    showStory({ kicker: 'Bearer ' + p.life + ' · Year ' + app.tick, title: name + (people ? ' of the ' + people : ''), html:
      '<p>You are <b>' + esc(name) + '</b>, twenty years old. ' + (c >= 0 ? Story.peopleSketch(s, c) : '') + '</p>' +
      '<p>' + how2 + ' In its glass you saw a people called the <b>' + esc(st.home.name) + '</b>' +
      (pr && st.stage === 'quest' ? ', and the year ' + pr.end + ', and a promise you did not make but now must keep: they must still hold a province in ' + pr.target + '.</p>'
        : '.</p>') +
      '<p class="muted">You carry no knowledge but your own. The deeds of those who held it before you still stand.</p>',
      buttons: [{ label: 'Take up the Chronoscope' }] });
    app.needsRender = true; app.panelsAt = 0;
  }

  function objectiveTile(s) {
    var st = app.story, c = homeCiv(s);
    if ((st.stage === 'goCapital' || st.stage === 'quest') && c >= 0) return s.cCap[c];
    return -1;
  }

  function objectiveHTML() {
    var st = app.story, pr = st.prophecy;
    if (st.mode !== 'story') return '';
    var t = '', status = '', cls = '';
    switch (st.stage) {
      case 'loading': return '';
      case 'goCapital': t = 'Walk to the capital of the ' + esc(st.home.name) + ' (the gold star) and present yourself to ' + esc(st.home.ruler) + '.'; break;
      case 'learn': t = 'Spend a year learning among your people: the Learn deed (5).'; break;
      case 'help': t = 'Help your people: dig irrigation (1), rally them (2) or tend the sick (3) in their lands.'; break;
      case 'awaitVision': t = 'Rest (R) or go about your life…'; break;
      case 'quest':
        t = 'Save the ' + esc(st.home.name) + ': they must still hold at least one province in the year ' + pr.target + '. Foretold fall: ' + pr.end + '.';
        if (st.quest === 'reading') status = 'The Chronoscope is reading this timeline… (year ' + app.cur.computedTo + ')';
        else if (st.quest.indexOf('fallen:') === 0) {
          var y = st.quest.slice(7); cls = 'bad';
          status = 'In this timeline (' + esc(app.cur.name) + ') they still fall in the year ' + y + (y !== '?' && +y !== pr.end ? ' (' + (+y > pr.end ? '+' : '') + (+y - pr.end) + ' years)' : '') + '.';
        }
        break;
      case 'won': t = 'You saved the ' + esc(st.home.name) + '. Wander through history as you please.'; cls = 'good'; break;
      default: return '';
    }
    return '<div class="objective"><span class="label">' + (st.stage === 'quest' ? 'Quest' : st.stage === 'won' ? 'Fulfilled' : 'Prologue') + '</span>' + t +
      (status ? '<span class="status ' + cls + '">' + status + '</span>' : '') + '</div>';
  }

  function renderJournal() {
    var st = app.story, html = objectiveHTML(), o = app.oracle;
    if (st.stage === 'quest') {
      var d = o && o.difficulty();
      html += '<div class="oracle">' + (!o ? 'The Chronoscope waits for this timeline to be written…'
        : !o.done ? 'The Chronoscope is reading the threads of this timeline… ' + Math.round(o.progress() * 100) + '%' + (d ? '<br>' + esc(d.label) + ' so far.' : '')
        : esc(d.label) + '. <span class="muted">(' + o.wins().length + ' of ' + o.total + ' single deeds it tested would save them.)</span>') +
        '<label class="hint-toggle"><input type="checkbox" id="hints"' + (st.hints ? ' checked' : '') + '> Listen to the Chronoscope (hints)</label></div>';
    }
    if (st.mode !== 'story') html += '<p class="muted">Sandbox: no story in this world. Choose a world number and press Create to start a new life with a story.</p>';
    html += '<ol class="journal">' + st.journal.slice().reverse().map(function (j) {
      return '<li><span class="t">Y' + j.t + '</span>' + j.html + '</li>';
    }).join('') + '</ol>';
    $('journal').innerHTML = html;
    var hb = document.getElementById('hints');
    if (hb) hb.onchange = function () { st.hints = hb.checked; app.panelsAt = 0; };
  }

  function drawObjective(ctx, s, ox, oy, ts, close) {
    var tile = objectiveTile(s);
    if (tile < 0) return;
    var x = (tile % W - ox) * ts + ts / 2, y = (((tile / W) | 0) - oy) * ts + ts / 2;
    var cw = mapCanvas.width, ch = mapCanvas.height, pulse = Math.sin(performance.now() / 250) * 2;
    if (close && (x < 0 || y < 0 || x > cw || y > ch)) {
      // arrow at the screen edge pointing toward the goal
      var px = (app.person.x - ox) * ts + ts / 2, py = (app.person.y - oy) * ts + ts / 2;
      var a = Math.atan2(y - py, x - px), ex = Math.max(24, Math.min(cw - 24, cw / 2 + Math.cos(a) * cw)), ey = Math.max(24, Math.min(ch - 24, ch / 2 + Math.sin(a) * ch));
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
      ctx.fillStyle = '#d8aa4e'; ctx.strokeStyle = '#1a1408'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-3, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      return;
    }
    var r = (close ? 11 : 7) + pulse;
    ctx.fillStyle = '#ffd36b'; ctx.strokeStyle = '#1a1408'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var k = 0; k < 10; k++) {
      var ang = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r;
      var sx = x + Math.cos(ang) * rr, sy = y - (close ? ts * 0.55 : 0) + Math.sin(ang) * rr;
      if (k) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // ---------------------------------------------------------------------------
  // Walking
  // ---------------------------------------------------------------------------
  function stepToward(now) {
    var p = app.person;
    if (p.dead) { p.target = -1; return; }
    if (p.target < 0 || now - p.lastStep < 60) return;
    var tx = p.target % W, ty = (p.target / W) | 0;
    if (tx === p.x && ty === p.y) { p.target = -1; return; }
    var dx = tx - p.x, dy = ty - p.y, nx = p.x, ny = p.y;
    if (Math.abs(dx) >= Math.abs(dy)) nx += dx > 0 ? 1 : -1; else ny += dy > 0 ? 1 : -1;
    if (moveTo(nx, ny)) p.lastStep = now;
  }

  function moveTo(nx, ny) {
    var p = app.person, s = app.view.s;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || !s || p.dead) return false;
    var cost = (Sim.isLand(s.terrain[ny * W + nx]) ? STEP_COST : SEA_COST) * (p.health < 30 ? 1.5 : 1);
    if (p.stalled || !spendTime(cost)) return false;
    p.x = nx; p.y = ny;
    app.needsRender = true;
    return true;
  }

  // ---------------------------------------------------------------------------
  // Map rendering
  // ---------------------------------------------------------------------------
  var mapCanvas = $('map'), mapCtx = mapCanvas.getContext('2d');
  var img = mapCtx.createImageData(W * S, H * S);
  var mini = document.createElement('canvas'); mini.width = W; mini.height = H;
  var miniCtx = mini.getContext('2d'), miniImg = miniCtx.createImageData(W, H);
  var tr = new Uint8ClampedArray(N), tg = new Uint8ClampedArray(N), tb = new Uint8ClampedArray(N);
  var edgeOwner = new Int32Array(N);
  var SERIF = 'Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif';

  function mix(a, b, t) { return a + (b - a) * t; }

  /** Per-province colour for the current map mode. */
  function colorPass(s, cs) {
    var mode = app.mode, sel = app.selected;
    for (var i = 0; i < N; i++) {
      var t = s.terrain[i], base = TERRAIN_RGB[t];
      var shade = t >= TER.PLAINS ? (s.elev[i] - 560) / 900 : (s.elev[i] - 420) / 1400;
      var r = base[0] * (1 + shade), g = base[1] * (1 + shade), b = base[2] * (1 + shade);
      var land = t >= TER.PLAINS, c = s.owner[i], sig = c >= 0 ? s.cSig[c] : 0;
      edgeOwner[i] = c;
      if (mode === 'realms') {
        if (land && c >= 0) {
          var cc = civRGB(sig), k = (sel && sig !== sel) ? 0.22 : (app.camera === 'close' ? 0.45 : 0.64);
          r = mix(r, cc[0], k); g = mix(g, cc[1], k); b = mix(b, cc[2], k);
        }
      } else if (mode === 'people') {
        if (land) {
          var p = s.pop[i];
          if (p > 0) {
            var v = Math.min(1, Math.log(p + 1) / Math.log(4000));
            r = 40 + 215 * Math.min(1, v * 1.6); g = 20 + 225 * Math.max(0, v - 0.4) / 0.6; b = 30 + 160 * Math.max(0, v - 0.8) / 0.2;
          } else { r *= 0.35; g *= 0.35; b *= 0.35; }
        } else { r *= 0.6; g *= 0.6; b *= 0.6; }
      } else if (mode === 'solidarity') {
        if (land && c >= 0) {
          var a = s.asab[i] / 10000;
          r = mix(60, 245, a); g = mix(40, 196, a); b = mix(110, 70, a);
          if (sel && sig !== sel) { r *= 0.5; g *= 0.5; b *= 0.5; }
        } else if (land) { r *= 0.4; g *= 0.4; b *= 0.4; }
      } else if (mode === 'climate') {
        if (land) {
          var cl = (s.clim[i] - 88) / 20;
          var tc = cl < 0 ? [176, 96, 48] : [56, 168, 92], kk = Math.min(1, Math.abs(cl)) * 0.75;
          r = mix(r, tc[0], kk); g = mix(g, tc[1], kk); b = mix(b, tc[2], kk);
        }
      } else if (mode === 'divergence') {
        var gray = (r + g + b) / 3 * 0.55;
        r = g = b = gray;
        if (cs && land) {
          var oc = cs.owner[i], osig = oc >= 0 ? cs.cSig[oc] : 0;
          if (osig !== sig) {
            if (c >= 0) { var dc = civRGB(sig); r = dc[0]; g = dc[1]; b = dc[2]; }
            else { r = 220; g = 70; b = 160; }
          } else if (cs.pop[i] !== s.pop[i]) { r = mix(r, 216, 0.35); g = mix(g, 170, 0.35); b = mix(b, 78, 0.35); }
        }
      }
      tr[i] = r; tg[i] = g; tb[i] = b;
    }
  }

  function renderMap() {
    var s = app.view.s, cs = (app.cmp && app.cview.s && app.cview.tick === app.tick) ? app.cview.s : null;
    if (!s) return;
    colorPass(s, cs);
    if (app.camera === 'close') renderClose(s); else renderWorld(s);
  }

  // ---- whole-world view ----
  function renderWorld(s) {
    var mode = app.mode, i, c;
    var showBorders = mode === 'realms' || mode === 'solidarity' || mode === 'divergence';
    var d = img.data, rowW = W * S;
    for (var ty = 0; ty < H; ty++) for (var tx = 0; tx < W; tx++) {
      i = ty * W + tx;
      c = edgeOwner[i];
      var R = tr[i], G = tg[i], B = tb[i];
      var bU = false, bD = false, bL = false, bR = false;
      if (showBorders && c >= 0) {
        bU = ty > 0 && edgeOwner[i - W] !== c; bD = ty < H - 1 && edgeOwner[i + W] !== c;
        bL = tx > 0 && edgeOwner[i - 1] !== c; bR = tx < W - 1 && edgeOwner[i + 1] !== c;
      }
      var river = s.river[i] && (mode === 'realms' || mode === 'terrain' || mode === 'climate');
      var rU = river && ty > 0 && (s.river[i - W] || s.terrain[i - W] < TER.PLAINS);
      var rD = river && ty < H - 1 && (s.river[i + W] || s.terrain[i + W] < TER.PLAINS);
      var rL = river && tx > 0 && (s.river[i - 1] || s.terrain[i - 1] < TER.PLAINS);
      var rR = river && tx < W - 1 && (s.river[i + 1] || s.terrain[i + 1] < TER.PLAINS);
      var plague = s.plague[i] > 0 && (mode === 'realms' || mode === 'people');
      for (var py = 0; py < S; py++) {
        var o = ((ty * S + py) * rowW + tx * S) * 4;
        for (var px = 0; px < S; px++, o += 4) {
          var pr = R, pg = G, pb = B;
          if (river) {
            var cy = py === 2 || py === 3, cx = px === 2 || px === 3;
            if ((cx && cy) || (cx && ((py < 2 && rU) || (py > 3 && rD))) || (cy && ((px < 2 && rL) || (px > 3 && rR)))) {
              pr = mix(pr, 52, 0.7); pg = mix(pg, 104, 0.7); pb = mix(pb, 160, 0.7);
            }
          }
          if (plague && (px + py) % 3 === 0) { pr = 120; pg = 10; pb = 20; }
          if ((bU && py === 0) || (bD && py === S - 1) || (bL && px === 0) || (bR && px === S - 1)) { pr *= 0.42; pg *= 0.42; pb *= 0.42; }
          d[o] = pr; d[o + 1] = pg; d[o + 2] = pb; d[o + 3] = 255;
        }
      }
    }
    mapCtx.putImageData(img, 0, 0);
    var ctx = mapCtx;
    drawInterventionRings(ctx, 0, 0, S);
    if (mode === 'realms' || mode === 'solidarity' || mode === 'divergence') drawWorldLabels(s);
    // you
    var px0 = app.person.x * S + S / 2, py0 = app.person.y * S + S / 2;
    var pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    ctx.strokeStyle = 'rgba(255,236,170,' + (0.5 + pulse * 0.5) + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px0, py0, 7 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffe9a8'; ctx.strokeStyle = '#1a1408'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px0, py0, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    drawTarget(ctx, 0, 0, S);
    drawObjective(ctx, s, 0, 0, S, false);
    if (app.hover >= 0) {
      var r = radiusOf(app.tool), hx = app.hover % W, hy = (app.hover / W) | 0;
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1;
      ctx.strokeRect((hx - r) * S + 0.5, (hy - r) * S + 0.5, (2 * r + 1) * S - 1, (2 * r + 1) * S - 1);
    }
    drawFlash(ctx, 0, 0, S);
    app.needsRender = true; // keep the "you are here" pulse alive
  }

  function drawWorldLabels(s) {
    var ctx = mapCtx, nc = s.g[1], c, i;
    var sx = new Float64Array(nc), sy = new Float64Array(nc);
    for (i = 0; i < N; i++) { c = s.owner[i]; if (c >= 0) { sx[c] += i % W; sy[c] += (i / W) | 0; } }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (c = 0; c < nc; c++) {
      var tiles = s.sTiles[c];
      if (!s.cAlive[c] || tiles < 4) continue;
      var cap = s.cCap[c], px = (cap % W) * S + S / 2, py = ((cap / W) | 0) * S + S / 2;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, tiles >= 60 ? 3.5 : 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (tiles >= 45 && (!app.selected || app.selected === s.cSig[c])) {
        var size = Math.max(11, Math.min(24, 8 + Math.sqrt(tiles) * 0.45));
        ctx.font = '600 ' + size + 'px ' + SERIF;
        var lx = sx[c] / tiles * S + S / 2, ly = sy[c] / tiles * S + S / 2, name = Sim.civName(s.cSig[c]).toUpperCase();
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,18,.8)';
        ctx.strokeText(name, lx, ly); ctx.fillStyle = '#f4ecd8'; ctx.fillText(name, lx, ly);
      }
    }
  }

  // ---- close view that follows you ----
  function camOrigin() {
    return {
      x: Math.max(0, Math.min(W - VW, app.person.x - (VW >> 1))),
      y: Math.max(0, Math.min(H - VH, app.person.y - (VH >> 1)))
    };
  }

  function renderClose(s) {
    var ctx = mapCtx, cam = camOrigin(), mode = app.mode, i, x, y;
    var natural = mode === 'realms' || mode === 'terrain' || mode === 'climate';
    ctx.fillStyle = '#10192a'; ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    for (y = 0; y < VH; y++) for (x = 0; x < VW; x++) {
      i = (cam.y + y) * W + cam.x + x;
      var sx = x * TS, sy = y * TS;
      ctx.fillStyle = rgb(tr[i], tg[i], tb[i]);
      ctx.fillRect(sx, sy, TS, TS);
      if (natural) drawTerrainDetail(ctx, s, i, sx, sy);
    }
    // rivers
    if (natural) {
      ctx.strokeStyle = 'rgba(64,118,176,.95)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (y = 0; y < VH; y++) for (x = 0; x < VW; x++) {
        i = (cam.y + y) * W + cam.x + x;
        if (!s.river[i]) continue;
        var cx = x * TS + TS / 2, cy = y * TS + TS / 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy); ctx.stroke();
        for (var d = 0; d < 4; d++) {
          var n = Sim.NB[i * 4 + d];
          if (n < 0 || !(s.river[n] || s.terrain[n] < TER.PLAINS)) continue;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + [0, 1, 0, -1][d] * TS / 2, cy + [-1, 0, 1, 0][d] * TS / 2); ctx.stroke();
        }
      }
    }
    // borders
    if (mode === 'realms' || mode === 'solidarity' || mode === 'divergence') {
      ctx.lineWidth = 3; ctx.lineCap = 'square';
      for (y = 0; y < VH; y++) for (x = 0; x < VW; x++) {
        i = (cam.y + y) * W + cam.x + x;
        var c = s.owner[i];
        if (c < 0) continue;
        var col = civRGB(s.cSig[c]);
        ctx.strokeStyle = rgb(col[0] * 0.55, col[1] * 0.55, col[2] * 0.55);
        var bx = x * TS, by = y * TS;
        ctx.beginPath();
        if (cam.y + y > 0 && s.owner[i - W] !== c) { ctx.moveTo(bx + 1.5, by + 1.5); ctx.lineTo(bx + TS - 1.5, by + 1.5); }
        if (cam.y + y < H - 1 && s.owner[i + W] !== c) { ctx.moveTo(bx + 1.5, by + TS - 1.5); ctx.lineTo(bx + TS - 1.5, by + TS - 1.5); }
        if (cam.x + x > 0 && s.owner[i - 1] !== c) { ctx.moveTo(bx + 1.5, by + 1.5); ctx.lineTo(bx + 1.5, by + TS - 1.5); }
        if (cam.x + x < W - 1 && s.owner[i + 1] !== c) { ctx.moveTo(bx + TS - 1.5, by + 1.5); ctx.lineTo(bx + TS - 1.5, by + TS - 1.5); }
        ctx.stroke();
      }
    }
    // settlements, capitals, plague
    var labels = [];
    for (y = 0; y < VH; y++) for (x = 0; x < VW; x++) {
      i = (cam.y + y) * W + cam.x + x;
      var c2 = s.owner[i];
      if (c2 < 0 || s.pop[i] <= 0) continue;
      var isCap = s.cCap[c2] === i;
      drawSettlement(ctx, s, i, x * TS, y * TS, isCap);
      if (isCap && s.sTiles[c2] >= 2) labels.push({ x: x * TS + TS / 2, y: y * TS - 4, text: Sim.civName(s.cSig[c2]), sig: s.cSig[c2] });
    }
    drawInterventionRings(ctx, cam.x, cam.y, TS);
    // realm names above capitals
    ctx.font = '600 13px ' + SERIF; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    labels.forEach(function (l) {
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,18,.85)'; ctx.strokeText(l.text, l.x, l.y);
      ctx.fillStyle = '#f4ecd8'; ctx.fillText(l.text, l.x, l.y);
    });
    drawTarget(ctx, cam.x, cam.y, TS);
    drawObjective(ctx, s, cam.x, cam.y, TS, true);
    drawPerson(ctx, (app.person.x - cam.x) * TS + TS / 2, (app.person.y - cam.y) * TS + TS / 2);
    if (app.hover >= 0) {
      var r = app.tool === 'walk' ? 0 : radiusOf(app.tool), hx = app.hover % W - cam.x, hy = ((app.hover / W) | 0) - cam.y;
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5;
      ctx.strokeRect((hx - r) * TS + 1, (hy - r) * TS + 1, (2 * r + 1) * TS - 2, (2 * r + 1) * TS - 2);
    }
    drawFlash(ctx, cam.x, cam.y, TS);
    drawMinimap(ctx, cam);
  }

  function drawTerrainDetail(ctx, s, i, sx, sy) {
    var t = s.terrain[i], h = Sim.hash4(7, i, 0, 0), k, ox, oy;
    if (t === TER.FOREST) {
      ctx.fillStyle = 'rgba(30,58,34,.75)';
      for (k = 0; k < 3; k++) {
        ox = sx + 5 + ((h >>> (k * 5)) % 18); oy = sy + 8 + ((h >>> (k * 5 + 15)) % 16);
        ctx.beginPath(); ctx.moveTo(ox, oy - 8); ctx.lineTo(ox + 5, oy + 3); ctx.lineTo(ox - 5, oy + 3); ctx.fill();
      }
    } else if (t === TER.MOUNTAIN) {
      ox = sx + TS / 2 + ((h % 7) - 3); oy = sy + TS - 6;
      ctx.fillStyle = 'rgba(92,88,84,.9)';
      ctx.beginPath(); ctx.moveTo(ox, sy + 5); ctx.lineTo(ox + 12, oy); ctx.lineTo(ox - 12, oy); ctx.fill();
      ctx.fillStyle = 'rgba(240,240,236,.9)';
      ctx.beginPath(); ctx.moveTo(ox, sy + 5); ctx.lineTo(ox + 4, sy + 11); ctx.lineTo(ox - 4, sy + 11); ctx.fill();
    } else if (t === TER.HILLS) {
      ctx.strokeStyle = 'rgba(80,70,46,.7)'; ctx.lineWidth = 1.5;
      for (k = 0; k < 2; k++) {
        ox = sx + 8 + k * 12 + ((h >>> (k * 4)) % 4); oy = sy + 16 + k * 4;
        ctx.beginPath(); ctx.arc(ox, oy, 6, Math.PI, 0); ctx.stroke();
      }
    } else if (t === TER.DESERT) {
      ctx.fillStyle = 'rgba(150,126,80,.6)';
      for (k = 0; k < 4; k++) ctx.fillRect(sx + 3 + ((h >>> (k * 6)) % 24), sy + 3 + ((h >>> (k * 6 + 3)) % 24), 2, 2);
    } else if (t === TER.SEA || t === TER.DEEP) {
      ctx.strokeStyle = 'rgba(150,190,230,.18)'; ctx.lineWidth = 1;
      ox = sx + 4 + (h % 12); oy = sy + 8 + ((h >>> 8) % 14);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(ox + 4, oy - 3, ox + 8, oy); ctx.quadraticCurveTo(ox + 12, oy + 3, ox + 16, oy); ctx.stroke();
    }
  }

  function drawSettlement(ctx, s, i, sx, sy, isCap) {
    var pop = s.pop[i], h = Sim.hash4(9, i, 0, 0);
    var n = Math.min(7, 1 + Math.floor(Math.log2(pop / 40 + 1)));
    var sick = s.plague[i] > 0, roof = sick ? '#8a2a2a' : '#7a4a32', wall = sick ? '#c9a39a' : '#eadfc6';
    if (isCap) {
      // a small castle
      var cx = sx + TS / 2, cy = sy + TS / 2 + 2;
      ctx.fillStyle = '#d8cfba'; ctx.strokeStyle = '#2a2116'; ctx.lineWidth = 1.2;
      ctx.fillRect(cx - 9, cy - 6, 18, 11); ctx.strokeRect(cx - 9, cy - 6, 18, 11);
      ctx.fillRect(cx - 11, cy - 11, 6, 16); ctx.strokeRect(cx - 11, cy - 11, 6, 16);
      ctx.fillRect(cx + 5, cy - 11, 6, 16); ctx.strokeRect(cx + 5, cy - 11, 6, 16);
      ctx.fillStyle = civCSS(s.cSig[s.owner[i]]);
      ctx.fillRect(cx - 1, cy - 16, 1.5, 10);
      ctx.beginPath(); ctx.moveTo(cx + 0.5, cy - 16); ctx.lineTo(cx + 8, cy - 13); ctx.lineTo(cx + 0.5, cy - 10); ctx.fill();
      ctx.fillStyle = '#2a2116'; ctx.fillRect(cx - 2, cy, 4, 5);
      n = Math.max(0, n - 4);
    }
    for (var k = 0; k < n; k++) {
      var ox = sx + 4 + ((h >>> (k * 4)) % 18), oy = sy + 9 + ((h >>> (k * 4 + 2)) % 16);
      if (isCap && Math.abs(ox + 3 - (sx + TS / 2)) < 12 && Math.abs(oy - (sy + TS / 2)) < 12) continue;
      ctx.fillStyle = wall; ctx.strokeStyle = 'rgba(30,22,14,.8)'; ctx.lineWidth = 1;
      ctx.fillRect(ox, oy, 6, 5); ctx.strokeRect(ox + 0.5, oy + 0.5, 5, 4);
      ctx.fillStyle = roof;
      ctx.beginPath(); ctx.moveTo(ox - 1, oy + 0.5); ctx.lineTo(ox + 3, oy - 3.5); ctx.lineTo(ox + 7, oy + 0.5); ctx.fill();
    }
    if (sick) { ctx.fillStyle = 'rgba(200,30,40,.9)'; ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('☣', sx + TS - 11, sy + 1); }
    if (s.starve[i]) { ctx.fillStyle = 'rgba(230,160,60,.9)'; ctx.fillRect(sx + 2, sy + TS - 4, TS - 4, 2); }
  }

  function drawPerson(ctx, x, y) {
    var t = performance.now() / 1000, walking = app.person.target >= 0, bob = walking ? Math.sin(t * 14) * 1.5 : 0;
    ctx.fillStyle = 'rgba(255,230,150,.22)';
    ctx.beginPath(); ctx.arc(x, y + 4, 15 + Math.sin(t * 3) * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(x, y + 12, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1408'; ctx.lineWidth = 1.5;
    // cloak
    ctx.fillStyle = '#d8aa4e';
    ctx.beginPath(); ctx.moveTo(x, y - 5 + bob); ctx.lineTo(x + 7, y + 11); ctx.lineTo(x - 7, y + 11); ctx.closePath(); ctx.fill(); ctx.stroke();
    // head
    ctx.fillStyle = '#f2dcc0';
    ctx.beginPath(); ctx.arc(x, y - 8 + bob, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // staff
    ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 9, y - 10 + bob); ctx.lineTo(x + 9, y + 12); ctx.stroke();
    if (app.person.knowledge) { ctx.fillStyle = '#9ad0ff'; ctx.beginPath(); ctx.arc(x + 9, y - 11 + bob, 2.5, 0, Math.PI * 2); ctx.fill(); }
    app.needsRender = true; // animate
  }

  function drawTarget(ctx, ox, oy, ts) {
    var p = app.person;
    if (p.target < 0) return;
    var tx = (p.target % W - ox) * ts + ts / 2, ty = (((p.target / W) | 0) - oy) * ts + ts / 2;
    ctx.strokeStyle = 'rgba(255,233,168,.7)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo((p.x - ox) * ts + ts / 2, (p.y - oy) * ts + ts / 2); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(tx, ty, ts > 10 ? 6 : 4, 0, Math.PI * 2); ctx.stroke();
  }

  function drawInterventionRings(ctx, ox, oy, ts) {
    var ivs = app.cur.interventions;
    for (var k = 0; k < ivs.length; k++) {
      var iv = ivs[k];
      if (iv.t > app.tick) continue;
      var age = app.tick - iv.t;
      var cx = (iv.x - ox) * ts + ts / 2, cy = (iv.y - oy) * ts + ts / 2;
      if (cx < -40 || cy < -40 || cx > mapCanvas.width + 40 || cy > mapCanvas.height + 40) continue;
      ctx.strokeStyle = (isDeed(iv.type) ? 'rgba(216,170,78,' : 'rgba(190,150,255,') + Math.max(0.3, 1 - age / 80) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, (ts > 10 ? 14 : 6) + (age < 80 ? age / 8 : 0), 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawFlash(ctx, ox, oy, ts) {
    if (!app.flash || performance.now() >= app.flash.until) return;
    var f = 1 - (app.flash.until - performance.now()) / 1500;
    ctx.strokeStyle = 'rgba(255,230,160,' + (1 - f) + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc((app.flash.x - ox) * ts + ts / 2, (app.flash.y - oy) * ts + ts / 2, 8 + f * 40, 0, Math.PI * 2); ctx.stroke();
    app.needsRender = true;
  }

  function drawMinimap(ctx, cam) {
    var d = miniImg.data;
    for (var i = 0, o = 0; i < N; i++, o += 4) { d[o] = tr[i]; d[o + 1] = tg[i]; d[o + 2] = tb[i]; d[o + 3] = 255; }
    miniCtx.putImageData(miniImg, 0, 0);
    var mw = 160, mh = 100, mx = mapCanvas.width - mw - 10, my = mapCanvas.height - mh - 10;
    ctx.fillStyle = 'rgba(10,12,18,.7)'; ctx.fillRect(mx - 3, my - 3, mw + 6, mh + 6);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mini, mx, my, mw, mh);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1;
    ctx.strokeRect(mx + cam.x + 0.5, my + cam.y + 0.5, VW, VH);
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(mx + app.person.x - 1, my + app.person.y - 1, 3, 3);
  }

  function radiusOf(tool) { return { bless: 2, blight: 2, prophet: 3, smite: 1, mountain: 1, sea: 1, land: 1 }[tool] || 0; }

  function tileFromEvent(e) {
    var r = mapCanvas.getBoundingClientRect();
    var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    if (fx < 0 || fy < 0 || fx >= 1 || fy >= 1) return -1;
    if (app.camera === 'close') {
      var cam = camOrigin();
      // minimap click jumps the walk target there
      var mw = 160, mh = 100, mx = mapCanvas.width - mw - 10, my = mapCanvas.height - mh - 10;
      var px = fx * mapCanvas.width, py = fy * mapCanvas.height;
      if (px >= mx && py >= my && px < mx + mw && py < my + mh) return Math.floor(py - my) * W + Math.floor(px - mx);
      return (cam.y + Math.floor(fy * VH)) * W + cam.x + Math.floor(fx * VW);
    }
    return Math.floor(fy * H) * W + Math.floor(fx * W);
  }

  // ---------------------------------------------------------------------------
  // History chart
  // ---------------------------------------------------------------------------
  var chart = $('chart'), chartCtx = chart.getContext('2d');
  var chartBuf = document.createElement('canvas'), bufCtx = chartBuf.getContext('2d');
  var PAD_TOP = 16;

  function sizeChart() {
    var r = chart.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    var w = Math.max(100, Math.round(r.width * dpr)), h = Math.max(60, Math.round(r.height * dpr));
    if (chart.width !== w || chart.height !== h) { chart.width = chartBuf.width = w; chart.height = chartBuf.height = h; app.chartDirty = true; }
  }

  function sortedSample(arr) {
    var idx = [];
    for (var k = 0; k < arr.length; k += 3) idx.push(k);
    idx.sort(function (a, b) { return arr[a + 2] - arr[b + 2] || arr[a] - arr[b]; });
    return idx;
  }

  function drawChartBuffer() {
    var w = chartBuf.width, h = chartBuf.height, ctx = bufCtx, b = app.cur, cmp = app.cmp;
    var dpr = window.devicePixelRatio || 1, top = PAD_TOP * dpr;
    ctx.clearRect(0, 0, w, h);
    var max = 1, t;
    for (t = 0; t < b.computedTo; t++) if (b.popHist[t] > max) max = b.popHist[t];
    if (cmp) for (t = 0; t < cmp.computedTo; t++) if (cmp.popHist[t] > max) max = cmp.popHist[t];
    app.chartMax = max;
    var scale = (h - top - 2) / max, colW = w / (HORIZON / SAMPLE), sel = app.selected;
    var known = locked() ? Math.min(b.computedTo, app.tick + 1) : b.computedTo;
    var n = Math.min(b.samples.length, Math.ceil(known / SAMPLE));
    for (var k = 0; k < n; k++) {
      var arr = b.samples[k];
      if (!arr) continue;
      var x = k * colW, y = h, idx = sortedSample(arr);
      for (var j = 0; j < idx.length; j++) {
        var q = idx[j], hh = arr[q + 1] * scale;
        ctx.globalAlpha = sel && arr[q] !== sel ? 0.28 : 0.95;
        ctx.fillStyle = civCSS(arr[q]);
        ctx.fillRect(x, y - hh, colW + 0.6, hh);
        y -= hh;
      }
    }
    ctx.globalAlpha = 1;
    if (cmp && cmp.computedTo > 0 && !locked()) {
      ctx.strokeStyle = 'rgba(240,235,220,.8)'; ctx.lineWidth = 1.5 * dpr; ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.beginPath();
      for (t = 0; t < cmp.computedTo; t += SAMPLE) {
        var px = t / HORIZON * w, py = h - cmp.popHist[t] * scale;
        if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    var fx = known / HORIZON * w;
    if (fx < w) {
      ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(fx, 0, w - fx, h);
      ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
      for (var hx = fx - h; hx < w; hx += 10 * dpr) { ctx.beginPath(); ctx.moveTo(Math.max(fx, hx), hx < fx ? h - (fx - hx) : h); ctx.lineTo(hx + h, 0); ctx.stroke(); }
      ctx.fillStyle = 'rgba(216,170,78,.8)'; ctx.font = 'italic ' + 12 * dpr + 'px Georgia, serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      if (w - fx > 160 * dpr) ctx.fillText(locked() ? 'the future is hidden from you…' : 'the future is being written…', fx + 10 * dpr, h / 2);
    }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = 10 * dpr + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (t = 500; t < HORIZON; t += 500) { var gx = t / HORIZON * w; ctx.fillRect(gx, 0, 1, 4 * dpr); ctx.fillText(String(t), gx, 4 * dpr); }
    var ivs = b.interventions, inh = b.inherited || 0;
    for (var m = 0; m < ivs.length; m++) {
      var ix = ivs[m].t / HORIZON * w;
      ctx.fillStyle = m >= inh ? (isDeed(ivs[m].type) ? '#d8aa4e' : '#be96ff') : 'rgba(216,170,78,.5)';
      ctx.fillRect(ix - dpr / 2, 0, dpr, h);
      ctx.beginPath(); ctx.moveTo(ix - 4 * dpr, 0); ctx.lineTo(ix + 4 * dpr, 0); ctx.lineTo(ix, 6 * dpr); ctx.fill();
    }
    app.chartDrawn = performance.now();
    app.chartDirty = false;
  }

  function drawChart() {
    var w = chart.width, h = chart.height, dpr = window.devicePixelRatio || 1;
    chartCtx.clearRect(0, 0, w, h);
    chartCtx.drawImage(chartBuf, 0, 0);
    var x = app.tick / HORIZON * w;
    chartCtx.fillStyle = '#fff';
    chartCtx.fillRect(Math.round(x) - dpr / 2, 0, dpr, h);
    chartCtx.beginPath(); chartCtx.arc(x, h - 4 * dpr, 3.5 * dpr, 0, Math.PI * 2); chartCtx.fill();
  }

  function chartTickAt(clientX) {
    var r = chart.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * HORIZON);
  }

  function chartCivAt(clientX, clientY) {
    var r = chart.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    var k = Math.floor(chartTickAt(clientX) / SAMPLE), arr = app.cur.samples[k];
    if (!arr) return null;
    var h = chart.height, top = PAD_TOP * dpr, scale = (h - top - 2) / app.chartMax;
    var yy = (clientY - r.top) * dpr, y = h, idx = sortedSample(arr);
    for (var j = 0; j < idx.length; j++) {
      var q = idx[j], hh = arr[q + 1] * scale;
      if (yy <= y && yy >= y - hh) return { sig: arr[q], pop: arr[q + 1], t: k * SAMPLE };
      y -= hh;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Panels
  // ---------------------------------------------------------------------------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function fmtPop(p) { return p >= 1e6 ? (p / 1e6).toFixed(2) + 'M' : p >= 1e4 ? Math.round(p / 1000) + 'k' : p >= 1000 ? (p / 1000).toFixed(1) + 'k' : String(p); }

  function worldAge(s) {
    var best = 0;
    for (var c = 0; c < s.g[1]; c++) if (s.cAlive[c] && s.sTiles[c] > 0 && s.cTech[c] > best) best = s.cTech[c];
    return Sim.AGES[Sim.ageOf(best)].name;
  }

  function updateYearCard() {
    var s = app.view.s;
    $('year').textContent = 'Year ' + app.tick;
    if (!s) return;
    var pop = 0, states = 0;
    for (var c = 0; c < s.g[1]; c++) if (s.sTiles[c] > 0) { pop += s.sPop[c]; if (s.sTiles[c] >= 3) states++; }
    $('age').textContent = worldAge(s);
    $('year-stats').textContent = fmtPop(pop) + ' people · ' + states + ' realms';
    var div = $('divergence');
    if (app.cmp && app.impact && !locked()) {
      div.hidden = false;
      $('div-label').innerHTML = 'Compared with ' + esc(app.cmp.name) + ': <b>' + fmtPop(app.impact.lives) + '</b> lives changed · <b>' +
        (app.impact.owners * 100).toFixed(1) + '%</b> of lands ruled differently';
      $('div-bar').style.width = Math.max(app.impact.owners * 100, Math.min(100, Math.log10(app.impact.lives + 1) * 12)).toFixed(1) + '%';
    } else div.hidden = true;
    updateYou(s);
    updateHotbar(s);
  }

  function updateYou(s) {
    var p = app.person, i = p.y * W + p.x, c = s.owner[i], t = s.terrain[i];
    var PLACE = ['sail the deep ocean', 'sail the shallow sea', 'stand on the plains', 'walk in a forest', 'stand in the hills', 'climb in the mountains', 'cross the desert'];
    var html = '<b>' + (app.story.mode === 'story' && p.name ? esc(p.name) : 'You') + '</b>' + (app.story.mode === 'story' && p.name ? ': you ' : ' ') + PLACE[t] + (s.river[i] ? ' by a river' : '') + ' at (' + p.x + ', ' + p.y + ')';
    if (c >= 0) {
      html += ', among the <span class="sw" style="background:' + civCSS(s.cSig[c]) + '"></span><b>' + esc(Sim.civName(s.cSig[c])) + '</b>';
      html += ' (' + fmtPop(s.pop[i]) + ' here' + (s.cCap[c] === i ? ', their capital' : '') + ')';
      if (s.plague[i]) html += ' <span class="warn">· plague</span>';
      if (s.starve[i]) html += ' <span class="warn">· famine</span>';
    } else if (Sim.isLand(t)) html += ', in empty wilderness';
    html += '.';
    if (p.knowledge) html += '<br><span class="muted">You carry the knowledge of the ' + esc(Sim.civName(p.knowledge.sig)) + ': ' + Sim.AGES[Sim.ageOf(p.knowledge.tech)].name + ' (' + p.knowledge.tech + ').</span>';
    if (p.stalled) html += '<br><span class="muted">Waiting for the future to be written…</span>';
    if (app.story.mode === 'story' && app.story.stage !== 'loading') {
      var hc = p.health >= 55 ? 'var(--new)' : p.health >= 25 ? 'var(--gold)' : 'var(--erased)';
      html += '<div class="vitals"><span>Age <b>' + p.age + '</b></span><span>' + (p.dead ? 'dead' : Story.condition(p.health)) + '</span>' +
        '<div class="hbar" title="Health ' + Math.round(p.health) + ' of ' + Story.maxHealth(p.age) + '"><div style="width:' + Math.max(0, p.health) + '%;background:' + hc + '"></div></div>' +
        '<span>' + Math.round(p.health) + '</span></div>';
      if (p.reasons.length) html += '<div class="reasons">Year ' + p.reasonsYear + (p.reasonsYear !== app.tick - 1 ? ' (the last year you lived)' : '') + ': ' + p.reasons.map(function (r) {
        return '<span class="' + (r[1] >= 0 ? 'pos' : 'neg') + '">' + esc(r[0]) + ' ' + (r[1] >= 0 ? '+' : '') + r[1] + '</span>';
      }).join(' · ') + '</div>';
      if (p.life > 1) html += '<div class="reasons">Bearer ' + p.life + ' of the Chronoscope</div>';
      html += humHTML();
    }
    $('you').innerHTML = html;
  }

  function updateHotbar(s) {
    var p = app.person, pass = $('btn-pass'), here = p.y * W + p.x;
    pass.hidden = !(app.story.mode === 'story' && app.story.unlocked);
    pass.classList.toggle('blocked', s.owner[here] < 0 || s.pop[here] <= 0 || p.dead);
    DEEDS.forEach(function (d) {
      var btn = document.querySelector('[data-deed="' + d.id + '"]');
      if (!btn) return;
      var why = Sim.deedBlocker(s, d.id, p.x, p.y, p.knowledge);
      btn.classList.toggle('blocked', !!why);
      var hum = app.oracle && app.story.hints && app.story.stage === 'quest' ? app.oracle.hum(p.x, p.y, app.tick) : null;
      btn.classList.toggle('hum', !!(hum && hum.level === 3 && hum.deed === d.id));
      btn.title = d.name + ' (' + d.key + '): ' + d.desc + (why ? '\n\n' + why : '\n\nTakes a year.');
    });
  }

  function updateBranchLine() {
    $('branch-line').hidden = locked();
    if (locked()) return;
    var w = app.world, html = '<span class="muted">Timeline:</span> <b>' + esc(app.cur.name) + '</b>';
    var opts = '<option value="-1">nothing</option>' + w.branches.filter(function (b) { return b !== app.cur && !b.deleted; }).map(function (b) {
      return '<option value="' + b.id + '"' + (app.cmp === b ? ' selected' : '') + '>' + esc(b.name) + '</option>';
    }).join('');
    html += ' <span class="muted">vs</span> <select id="cmp-select" aria-label="Compare with">' + opts + '</select>';
    $('branch-line').innerHTML = html;
    $('cmp-select').onchange = function () {
      var v = parseInt(this.value, 10);
      app.cmp = v >= 0 ? w.branches[v] : null;
      app.impact = null; invalidateAll();
    };
  }

  function updateToolHint() {
    var def = toolDef(app.tool), hint;
    if (app.tool === 'walk') hint = 'Click the map to walk there, or use WASD. Deeds (1–8) act where you stand.';
    else if (app.tool === 'inspect') hint = 'Click a realm on the map to follow its history.';
    else hint = '<b>' + esc(def.name) + '</b> (a divine power): ' + esc(def.desc) + ' Click the map to act in year ' + app.tick + '.';
    $('tool-hint').innerHTML = hint;
  }

  function interventionRows(b) {
    return b.interventions.filter(function (iv) { return iv.t < Math.max(b.computedTo, app.tick + 1); }).map(function (iv) {
      var deed = isDeed(iv.type), def = toolDef(iv.type);
      var text = iv.note || (deed ? 'You: ' + def.name.toLowerCase() + ' at (' + iv.x + ', ' + iv.y + ').' : 'A divine hand: ' + def.name.toLowerCase() + ' at (' + iv.x + ', ' + iv.y + ').');
      return { e: { t: iv.t, type: deed ? 'you' : 'power', text: text, x: iv.x, y: iv.y, a: 0, major: true }, diff: 'mine' };
    });
  }

  function renderChronicle(force) {
    var b = app.cur, cmp = app.cmp;
    var major = $('f-major').checked, onlyChanges = cmp && $('f-changes').checked;
    var key = [locked(), b.id, b.version, b.events.length, b.interventions.length, cmp ? cmp.id + ':' + cmp.events.length : '-', major, onlyChanges, Math.floor(app.tick / 5)].join('|');
    if (!force && key === app.chronKey) return;
    app.chronKey = key;
    var upTo = cmp ? Math.min(b.computedTo, cmp.computedTo) : 0;
    var rows = cmp ? Timeline.diffChronicle(b.events, cmp.events, upTo) : b.events.map(function (e) { return { e: e, diff: '' }; });
    rows = rows.concat(interventionRows(b)).sort(function (x, y) { return x.e.t - y.e.t || (y.diff === 'mine') - (x.diff === 'mine'); });
    var html = '', nowIdx = -1, count = 0;
    for (var k = 0; k < rows.length; k++) {
      var e = rows[k].e, diff = rows[k].diff;
      if (major && !e.major && !diff) continue;
      if (onlyChanges && !diff) continue;
      if (locked() && e.t > app.tick) continue;
      var cls = [e.t > app.tick ? 'future' : '', diff].join(' ');
      if (nowIdx < 0 && e.t > app.tick) nowIdx = count;
      var tag = diff === 'mine' ? '' : diff ? '<span class="tag ' + diff + '">' + diff + '</span>' : '';
      html += '<li class="' + cls + '" data-t="' + e.t + '" data-x="' + e.x + '" data-y="' + e.y + '">' +
        '<span class="t">Y' + e.t + '</span><span class="i">' + (EVENT_ICON[e.type] || '·') + '</span><span class="x">' + esc(e.text) + tag + '</span></li>';
      count++;
    }
    if (!count) html = '<li class="empty">' + (b.computedTo < 200 ? 'History is just beginning…' : onlyChanges ? 'No differences yet. The ripples have not reached the chronicle.' : 'Nothing recorded yet.') + '</li>';
    var list = $('chronicle'), panel = $('panel-chronicle');
    var atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 30;
    list.innerHTML = html;
    if (app.playing || atBottom || force) {
      var target = nowIdx >= 0 ? list.children[nowIdx] : list.lastElementChild;
      if (target && target.offsetTop) panel.scrollTop = Math.max(0, target.offsetTop - panel.clientHeight + 60);
    }
    $('f-changes-wrap').style.display = cmp ? '' : 'none';
  }

  function renderTimelines(force) {
    var w = app.world;
    if (locked()) { $('timelines').innerHTML = '<p class="muted">There is only one history, the one you are living.</p>'; app.tlKey = ''; return; }
    var key = w.branches.map(function (b) { return b.id + ':' + b.interventions.length + ':' + Math.floor(b.computedTo / 100) + (b.deleted ? 'd' : ''); }).join(',') + '|' + app.cur.id + '|' + (app.cmp ? app.cmp.id : '-');
    if (!force && key === app.tlKey) return;
    app.tlKey = key;
    var html = '<p class="muted" style="margin:0 0 8px;font-size:12px">World ' + w.seed + '. Every timeline is this world plus a list of deeds, and replays identically. Acting later in a timeline continues it; going back and acting starts a new one.</p>';
    var children = {};
    w.branches.forEach(function (b) { if (!b.deleted) (children[b.parent] = children[b.parent] || []).push(b); });
    (function walk(parent, depth) {
      (children[parent] || []).forEach(function (b) {
        var own = w.ownInterventions(b);
        html += '<div class="tl' + (b === app.cur ? ' current' : '') + '" style="margin-left:' + Math.min(depth, 4) * 14 + 'px">' +
          '<div class="tl-head"><span class="tl-name">' + esc(b.name) + '</span>' +
          (b === app.cur ? '<span class="tl-badge">you are here</span>' : '<button class="btn" data-go="' + b.id + '">Travel</button>') +
          (b !== app.cur ? (app.cmp === b ? '<span class="tl-badge">comparing</span>' : '<button class="btn" data-cmp="' + b.id + '">Compare</button>') : '') +
          '</div><div class="tl-meta">' + (b.parent < 0 ? 'The original history' : 'Branched in year ' + b.forkTick) + '</div>';
        if (own.length) {
          html += '<ul>' + own.slice(-8).map(function (iv) { var d = toolDef(iv.type); return '<li>Y' + iv.t + ' ' + d.icon + ' ' + esc(d.name) + ' at (' + iv.x + ', ' + iv.y + ')</li>'; }).join('') +
            (own.length > 8 ? '<li class="muted">and ' + (own.length - 8) + ' earlier</li>' : '') + '</ul>';
        }
        html += '<div class="progress" title="Years computed"><div style="width:' + (b.computedTo / HORIZON * 100).toFixed(1) + '%"></div></div></div>';
        walk(b.id, depth + 1);
      });
    }(-1, 0));
    if (w.ownInterventions(app.cur).length) html += '<button class="btn" id="btn-undo" style="margin-top:6px">Undo last deed (Ctrl+Z)</button>';
    var el = $('timelines');
    el.innerHTML = html;
    el.querySelectorAll('[data-go]').forEach(function (btn) { btn.onclick = function () { switchBranch(w.branches[+btn.dataset.go]); }; });
    el.querySelectorAll('[data-cmp]').forEach(function (btn) { btn.onclick = function () { app.cmp = w.branches[+btn.dataset.cmp]; app.impact = null; invalidateAll(); }; });
    if ($('btn-undo')) $('btn-undo').onclick = undo;
  }

  function findCiv(s, sig) {
    for (var c = 0; c < s.g[1]; c++) if (s.cSig[c] === sig && s.cAlive[c] && s.sTiles[c] > 0) return c;
    return -1;
  }

  function renderRealm() {
    var el = $('realm'), s = app.view.s, sig = app.selected;
    if (!sig) { el.innerHTML = '<p class="muted">Use the Inspect tool and click a realm, or double-click a band in the history chart, to follow a people through time.</p>'; return; }
    var b = app.cur, first = -1, last = -1, peak = 0, peakT = 0;
    var series = new Float64Array(b.samples.length);
    for (var k = 0; k < b.samples.length; k++) {
      var arr = b.samples[k];
      if (!arr) continue;
      for (var j = 0; j < arr.length; j += 3) if (arr[j] === sig) {
        series[k] = arr[j + 1];
        if (first < 0) first = k * SAMPLE;
        last = k * SAMPLE;
        if (arr[j + 1] > peak) { peak = arr[j + 1]; peakT = k * SAMPLE; }
        break;
      }
    }
    var c = s ? findCiv(s, sig) : -1, col = civCSS(sig), name = Sim.civName(sig);
    var html = '<div class="realm"><div class="realm-head"><div class="realm-swatch" style="background:' + col + '"></div><div><div class="realm-name">' + esc(name) + '</div>';
    if (c >= 0) {
      var parent = s.cParent[c] ? Sim.civName(s.cParent[c]) : null;
      html += '<div class="realm-sub">Founded year ' + s.cFounded[c] + (parent ? ', from ' + esc(parent) : '') + ' · ' + (app.tick - s.cFounded[c]) + ' years old</div></div></div>';
      var A = Sim.meanAsab(s, c);
      html += '<dl class="realm-grid">' +
        '<dt>People</dt><dd>' + fmtPop(s.sPop[c]) + '</dd>' +
        '<dt>Provinces</dt><dd>' + s.sTiles[c] + '</dd>' +
        '<dt>Technology</dt><dd>' + Sim.AGES[Sim.ageOf(s.cTech[c])].name + ' (' + s.cTech[c] + ')</dd>' +
        '<dt>Solidarity</dt><dd>' + (A / 100).toFixed(0) + '%' + (A < Sim.CFG.collapseAsab ? ' <span class="warn">· in crisis</span>' : '') + '</dd>' +
        '<dt>Capital</dt><dd>(' + (s.cCap[c] % W) + ', ' + ((s.cCap[c] / W) | 0) + ') <button class="btn mini" id="btn-goto-cap">Walk there</button></dd>' +
        '<dt>Famine</dt><dd>' + s.sFamine[c] + ' provinces</dd>' +
        '<dt>Plague</dt><dd>' + s.sPlague[c] + ' provinces</dd></dl>';
    } else {
      html += '<div class="realm-sub">' + (first < 0 ? 'Not yet recorded in this timeline' : app.tick < first ? 'Not yet born in year ' + app.tick : 'No longer exists in year ' + app.tick) + '</div></div></div><p></p>';
    }
    if (first >= 0) html += '<div class="realm-sub">Recorded ' + first + ' to ' + last + ' · peak ' + fmtPop(peak) + ' people in year ' + peakT + '</div>';
    html += '<canvas id="realm-spark" width="600" height="140"></canvas><div class="links">' +
      (first >= 0 ? '<button class="btn" data-jump="' + first + '">Go to birth</button><button class="btn" data-jump="' + peakT + '">Go to peak</button><button class="btn" data-jump="' + last + '">Go to end</button>' : '') +
      '<button class="btn" id="btn-unselect">Clear</button></div></div>';
    el.innerHTML = html;
    el.querySelectorAll('[data-jump]').forEach(function (btn) { btn.onclick = function () { app.playing = false; syncPlay(); setTick(+btn.dataset.jump); }; });
    $('btn-unselect').onclick = function () { app.selected = 0; invalidateAll(); renderRealm(); };
    el.querySelectorAll('[data-jump]').forEach(function (btn) { if (locked()) btn.hidden = true; });
    if ($('btn-goto-cap')) $('btn-goto-cap').onclick = function () { app.person.target = s.cCap[c]; setTool('walk'); };
    var cv = $('realm-spark'), ctx = cv.getContext('2d'), maxv = peak || 1;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, cv.height);
    for (k = 0; k < series.length; k++) ctx.lineTo(k * SAMPLE / HORIZON * cv.width, cv.height - series[k] / maxv * (cv.height - 8));
    ctx.lineTo(series.length * SAMPLE / HORIZON * cv.width, cv.height); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(app.tick / HORIZON * cv.width - 1, 0, 2, cv.height);
  }

  function setTab(tab) {
    app.tab = tab;
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
    ['journal', 'chronicle', 'timelines', 'realm'].forEach(function (p) { $('panel-' + p).hidden = p !== tab; });
    app.panelsAt = 0; app.chronKey = ''; app.tlKey = '';
  }

  var toastTimer = 0;
  function toast(html) {
    var t = $('toast'); t.innerHTML = html; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 5200);
  }

  // ---------------------------------------------------------------------------
  // Tooltip
  // ---------------------------------------------------------------------------
  function showTooltip(e) {
    var tip = $('tooltip'), s = app.view.s, i = app.hover;
    if (!s || i < 0) { tip.hidden = true; return; }
    var c = s.owner[i], t = s.terrain[i], html = '';
    html += Sim.TERRAIN_NAMES[t] + (s.river[i] ? ' · river' : '') + ' <span class="muted">(' + (i % W) + ', ' + ((i / W) | 0) + ')</span>';
    if (Sim.isLand(t)) {
      html += '<br>Soil ' + Math.round(s.soil[i] / 100) + '% · Climate ' + (s.clim[i] >= 100 ? 'kind' : s.clim[i] >= 92 ? 'fair' : 'harsh');
      if (c >= 0) {
        html += '<br><span class="sw" style="background:' + civCSS(s.cSig[c]) + '"></span><b>' + esc(Sim.civName(s.cSig[c])) + '</b> · ' + Sim.AGES[Sim.ageOf(s.cTech[c])].name;
        html += '<br>' + fmtPop(s.pop[i]) + ' people · solidarity ' + Math.round(s.asab[i] / 100) + '%';
        if (s.cCap[c] === i) html += ' · <b>capital</b>';
        if (s.plague[i]) html += '<br><span class="warn">Plague!</span>';
        if (s.starve[i]) html += '<br><span class="warn">Famine</span>';
      } else html += '<br><span class="muted">Wilderness</span>';
    }
    var p = app.person, dist = Math.abs(i % W - p.x) + Math.abs(((i / W) | 0) - p.y);
    if (app.tool === 'walk' && dist > 0) html += '<br><span class="muted">Walk here: about ' + (dist * STEP_COST < 1 ? Math.round(dist * STEP_COST * 12) + ' months' : (dist * STEP_COST).toFixed(1) + ' years') + '</span>';
    else if (app.tool !== 'walk' && app.tool !== 'inspect') html += '<br><span class="muted">Click: ' + esc(toolDef(app.tool).name) + '</span>';
    tip.innerHTML = html; tip.hidden = false;
    var wrap = $('map-wrap').getBoundingClientRect();
    var x = e.clientX - wrap.left + 14, y = e.clientY - wrap.top + 14;
    if (x + tip.offsetWidth > wrap.width) x = e.clientX - wrap.left - tip.offsetWidth - 14;
    if (y + tip.offsetHeight > wrap.height) y = e.clientY - wrap.top - tip.offsetHeight - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }

  // ---------------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------------
  function frame(now) {
    var dt = app.last ? Math.min(0.1, (now - app.last) / 1000) : 0;
    app.last = now;
    var w = app.world, b = app.cur, kept = [b];
    if (app.cmp) kept.push(app.cmp);
    w.touch(b, kept);
    if (app.cmp) w.touch(app.cmp, kept);

    // background computation of the future
    var budget = document.hidden ? 0 : app.story.stage === 'loading' ? 40 : 10, t0 = performance.now();
    if (!w.isComplete(b)) { w.compute(b, budget); app.chartDirty = true; }
    if (app.cmp && !w.isComplete(app.cmp) && performance.now() - t0 < budget) { w.compute(app.cmp, budget - (performance.now() - t0)); app.chartDirty = true; }
    if (app.oracle && !app.oracle.done && app.story.stage === 'quest' && !document.hidden) {
      var spare = (app.playing ? 6 : 12) - (performance.now() - t0);
      if (spare > 1) app.oracle.work(spare);
    }

    // time flows on its own while playing
    if (app.playing) {
      app.acc += dt * (living() ? Math.min(app.speed, LIVING_SPEED) : app.speed);
      var adv = Math.min(Math.floor(app.acc), living() ? 4 : 1e9);
      if (adv > 0) {
        app.acc -= adv;
        var target = Math.min(app.tick + adv, b.computedTo);
        while (app.tick < target && !app.person.dead) liveThroughYear();
        if (app.tick >= HORIZON) { app.playing = false; syncPlay(); }
      }
    }
    // and while you walk or work
    payTime();
    storyFrame();
    if (locked() && app.view.tick !== app.tick) app.chartDirty = true;
    if (app.view.s && app.view.tick === app.tick && !app.person.stalled) stepToward(now);

    var overlay = $('map-overlay');
    if (app.needsRender || app.view.branch !== b || app.view.version !== b.version || app.view.tick !== app.tick) {
      if (canSeek(b, app.tick)) {
        var moved = app.view.tick !== app.tick || app.view.branch !== b || app.view.version !== b.version;
        app.view.seek(b, app.tick);
        if (moved || !app.impact) {
          if (app.cmp && canSeek(app.cmp, app.tick)) {
            app.cview.seek(app.cmp, app.tick);
            app.impact = Timeline.impact(app.view.s, app.cview.s);
          } else app.impact = null;
        }
        overlay.hidden = true;
        app.needsRender = false;
        renderMap();
        if (moved || now - app.panelsAt > 250) { updateYearCard(); updateToolHint(); }
      } else {
        overlay.hidden = false;
        overlay.textContent = 'Recomputing ' + b.name + '… year ' + b.computedTo + ' of ' + app.tick;
      }
    }
    if (app.chartDirty && now - app.chartDrawn > 250) drawChartBuffer();
    drawChart();

    if (now - app.panelsAt > 300) {
      app.panelsAt = now;
      $('compute-status').textContent = locked() ? '' : w.isComplete(b) ? 'Future known to year ' + HORIZON : 'Writing the future… year ' + b.computedTo;
      if (app.story.stage === 'quest') checkQuest();
      updateBranchLine();
      if (app.view.s) { updateYou(app.view.s); updateHotbar(app.view.s); }
      if (app.tab === 'journal') renderJournal();
      else if (app.tab === 'chronicle') renderChronicle();
      else if (app.tab === 'timelines') renderTimelines();
      else renderRealm();
    }
    requestAnimationFrame(frame);
  }

  function syncPlay() { $('btn-play').textContent = app.playing ? '❚❚' : '▶'; }

  // ---------------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------------
  function toolButton(t, extra) {
    return '<button class="tool' + (extra || '') + (t.id === app.tool ? ' active' : '') + '" data-tool="' + t.id + '" title="' + esc(t.name + ': ' + t.desc) + '" aria-label="' + esc(t.name) + '">' +
      t.icon + '<small>' + esc(t.short || SHORT[t.id] || t.name) + '</small></button>';
  }
  function buildToolbar() {
    var tb = $('toolbar');
    var powers = app.story.mode === 'sandbox' || app.story.stage === 'won';
    if (!powers && POWERS.some(function (t) { return t.id === app.tool; })) app.tool = 'walk';
    tb.innerHTML = BASE_TOOLS.map(function (t) { return toolButton(t); }).join('') +
      (powers ? '<div class="toolbar-label" title="Act as a god instead of a person">Powers</div>' +
      POWERS.map(function (t) { return toolButton(t, ' power'); }).join('') : '');
    tb.querySelectorAll('.tool').forEach(function (btn) { btn.onclick = function () { setTool(btn.dataset.tool); }; });
  }
  function buildHotbar() {
    $('hotbar').innerHTML = DEEDS.map(function (d) {
      return '<button class="deed" data-deed="' + d.id + '" aria-label="' + esc(d.name) + '"><span class="k">' + d.key + '</span><span class="di">' + d.icon + '</span><span class="dn">' + esc(d.name) + '</span></button>';
    }).join('') + '<button class="deed rest" id="btn-rest" title="Let a year pass where you are (R)"><span class="k">R</span><span class="di">☾</span><span class="dn">Rest a year</span></button>' +
      '<button class="deed pass" id="btn-pass" title="Give the Chronoscope to a young person here and end your life as its bearer (P)"><span class="k">P</span><span class="di">⧗</span><span class="dn">Pass it on</span></button>';
    document.querySelectorAll('[data-deed]').forEach(function (btn) { btn.onclick = function () { doDeed(btn.dataset.deed); }; });
    $('btn-rest').onclick = function () { spendTime(1); };
    $('btn-pass').onclick = offerPassOn;
  }
  function setTool(id) {
    app.tool = id;
    document.querySelectorAll('.tool').forEach(function (b) { b.classList.toggle('active', b.dataset.tool === id); });
    updateToolHint();
    app.needsRender = true;
  }
  function buildModes() {
    var m = $('map-modes');
    m.innerHTML = MODES.map(function (md) { return '<button data-mode="' + md.id + '" title="' + md.name + ' (M cycles)"' + (md.id === app.mode ? ' class="active"' : '') + '>' + md.name + '</button>'; }).join('');
    m.querySelectorAll('button').forEach(function (btn) { btn.onclick = function () { setMode(btn.dataset.mode); }; });
  }
  function setMode(id) {
    app.mode = id;
    document.querySelectorAll('#map-modes button').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === id); });
    app.needsRender = true;
    if (id === 'divergence' && !app.cmp) toast('Do a deed (or pick a timeline to compare with) to see divergence.');
  }
  function setCamera(cam) {
    app.camera = cam;
    $('btn-camera').textContent = cam === 'close' ? 'World view' : 'Close view';
    app.needsRender = true;
  }

  function wire() {
    buildToolbar(); buildModes(); buildHotbar();
    mapCanvas.addEventListener('mousemove', function (e) {
      var i = tileFromEvent(e);
      if (i !== app.hover) { app.hover = i; app.needsRender = true; }
      showTooltip(e);
    });
    mapCanvas.addEventListener('mouseleave', function () { app.hover = -1; $('tooltip').hidden = true; app.needsRender = true; });
    mapCanvas.addEventListener('click', function (e) {
      var i = tileFromEvent(e);
      if (i < 0) return;
      if (app.tool === 'walk') { app.person.target = i; app.needsRender = true; }
      else if (app.tool === 'inspect') {
        var s = app.view.s, c = s ? s.owner[i] : -1;
        app.selected = c >= 0 ? s.cSig[c] : 0;
        if (app.selected) setTab('realm');
        invalidateAll();
      } else usePower(i % W, (i / W) | 0);
    });

    var dragging = false;
    chart.addEventListener('pointerdown', function (e) {
      if (locked()) { lockedToast(); return; }
      dragging = true; chart.setPointerCapture(e.pointerId);
      app.playing = false; syncPlay(); app.person.target = -1; setTick(chartTickAt(e.clientX));
    });
    chart.addEventListener('pointermove', function (e) {
      if (dragging) setTick(chartTickAt(e.clientX));
      var hit = chartCivAt(e.clientX, e.clientY), tip = $('chart-tip'), t = chartTickAt(e.clientX);
      tip.innerHTML = 'Year ' + t + (hit ? '<br><span class="sw" style="background:' + civCSS(hit.sig) + '"></span><b>' + esc(Sim.civName(hit.sig)) + '</b> · ' + fmtPop(hit.pop) : '') +
        (t > app.cur.computedTo ? '<br><span class="muted">not yet computed</span>' : '');
      tip.hidden = false;
      var r = $('chart-wrap').getBoundingClientRect(), x = e.clientX - r.left + 12;
      if (x + tip.offsetWidth > r.width) x = e.clientX - r.left - tip.offsetWidth - 12;
      tip.style.left = x + 'px'; tip.style.top = '8px';
    });
    chart.addEventListener('pointerup', function () { dragging = false; });
    chart.addEventListener('dblclick', function (e) {
      var hit = chartCivAt(e.clientX, e.clientY);
      if (hit) { app.selected = hit.sig; setTab('realm'); invalidateAll(); }
    });
    chart.addEventListener('pointerleave', function () { $('chart-tip').hidden = true; });

    $('btn-play').onclick = function () {
      if (app.person.dead) return;
      if (app.tick >= HORIZON) { if (locked()) return; setTick(0, true); }
      app.playing = !app.playing; syncPlay();
    };
    $('btn-start').onclick = function () { if (locked()) return lockedToast(); setTick(0); };
    $('btn-end').onclick = function () { if (locked()) return lockedToast(); setTick(app.cur.computedTo); };
    $('btn-back').onclick = function (e) { if (locked()) return lockedToast(); app.playing = false; syncPlay(); setTick(app.tick - (e.shiftKey ? 10 : 1)); };
    $('btn-fwd').onclick = function (e) { if (locked()) return lockedToast(); app.playing = false; syncPlay(); setTick(app.tick + (e.shiftKey ? 10 : 1)); };
    $('speed').onchange = function () { app.speed = +this.value; };
    $('btn-camera').onclick = function () { setCamera(app.camera === 'close' ? 'world' : 'close'); };
    $('f-major').onchange = $('f-changes').onchange = function () { renderChronicle(true); };
    document.querySelectorAll('.tab').forEach(function (t) { t.onclick = function () { setTab(t.dataset.tab); }; });

    $('chronicle').addEventListener('click', function (e) {
      var li = e.target.closest('li[data-t]');
      if (!li) return;
      if (locked()) return;
      app.playing = false; syncPlay();
      setTick(+li.dataset.t);
      if (+li.dataset.x >= 0) app.flash = { x: +li.dataset.x, y: +li.dataset.y, until: performance.now() + 1500 };
      app.needsRender = true;
    });

    $('btn-new').onclick = function () {
      var v = $('seed').value.trim();
      if (v.indexOf('seed=') >= 0) {
        var p = Timeline.decode(v);
        if (p.home && !p.interventions.length) { newWorld(p.seed || 0, [], 'story', { home: p.home, born: p.born }); return; }
        newWorld(p.seed || 0, p.interventions, 'sandbox');
        if (p.interventions.length) toast('Timeline restored: ' + p.interventions.length + ' deed' + (p.interventions.length > 1 ? 's' : '') + ' replayed.');
      } else newWorld(parseInt(v, 10) || 0);
    };
    $('btn-random').onclick = function () { newWorld(Math.floor(Math.random() * 1e6)); };
    $('btn-today').onclick = function () { newWorld(todaySeed()); toast('Today\'s world: everyone who plays today is born into this same life.'); };
    $('help').querySelector('#btn-sandbox').onclick = function () { $('help').hidden = true; newWorld(app.world.seed, [], 'sandbox'); };
    $('seed').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('btn-new').click(); });
    $('btn-link').onclick = function () {
      var st = app.story, challenge = st.mode === 'story' && st.home && st.birth != null;
      var code = challenge ? 'seed=' + app.world.seed + '&home=' + st.home.sig + '&born=' + (st.birth % W) + '.' + ((st.birth / W) | 0)
        : Timeline.encode(app.world.seed, app.cur.interventions);
      var what = challenge ? 'Challenge code' : 'Timeline code';
      var how = challenge ? 'Whoever enters it in the World box is born where you were, as ' + esc(app.story.home.name) + ', facing the same fall.'
        : 'Paste it into the World box to replay exactly this history.';
      var show = function (msg) { toast(msg + '<br><code class="code">' + esc(code) + '</code>'); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { show(what + ' copied. ' + how); }, function () { show('Copy this ' + what.toLowerCase() + '. ' + how); });
        else show('Copy this ' + what.toLowerCase() + '. ' + how);
      } catch (e) { show('Copy this ' + what.toLowerCase() + '. ' + how); }
    };
    $('btn-help').onclick = function () { $('help').hidden = false; };
    $('btn-help-close').onclick = function () { $('help').hidden = true; try { localStorage.setItem('chronoscope-help', '2'); } catch (e) { /* ignore */ } };
    $('help').addEventListener('click', function (e) { if (e.target === this) $('btn-help-close').click(); });

    var MOVES = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (!$('help').hidden) { if (e.key === 'Escape' || e.key === 'Enter') $('btn-help-close').click(); return; }
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key, mv = MOVES[key];
      if (mv && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        app.person.target = -1;
        if (app.view.tick === app.tick) moveTo(app.person.x + mv[0], app.person.y + mv[1]);
        return;
      }
      var step = e.shiftKey ? 10 : 1;
      if (!$('story').hidden) { if (e.key === 'Enter' || e.key === 'Escape') { var sb = $('story-actions').querySelector('button'); if (sb) sb.click(); } return; }
      if (locked() && (key === ',' || key === '.' || key === '<' || key === '>' || e.key === 'Home' || e.key === 'End')) { lockedToast(); return; }
      if (e.key === ' ') { e.preventDefault(); $('btn-play').click(); }
      else if (key === ',' || key === '<') { app.playing = false; syncPlay(); setTick(app.tick - step); }
      else if (key === '.' || key === '>') { app.playing = false; syncPlay(); setTick(app.tick + step); }
      else if (e.key === 'Home') setTick(0);
      else if (e.key === 'End') setTick(app.cur.computedTo);
      else if (e.key === 'Escape') setTool('walk');
      else if ((e.ctrlKey || e.metaKey) && key === 'z') { e.preventDefault(); undo(); }
      else if (e.ctrlKey || e.metaKey || e.altKey) return;
      else if (key === 'z') setCamera(app.camera === 'close' ? 'world' : 'close');
      else if (key === 'm') { var k = MODES.findIndex(function (m) { return m.id === app.mode; }); setMode(MODES[(k + 1) % MODES.length].id); }
      else if (key === 'r') spendTime(1);
      else if (key === 'p') offerPassOn();
      else if (key === 'i') setTool('inspect');
      else {
        var deed = DEEDS.filter(function (d) { return d.key === key; })[0];
        if (deed) doDeed(deed.id);
      }
    });
    window.addEventListener('resize', sizeChart);
  }

  function boot() {
    wire();
    var parsed = Timeline.decode(location.hash);
    var sandbox = parsed.interventions.length > 0;
    newWorld(parsed.seed != null ? parsed.seed : Math.floor(Math.random() * 1e6), parsed.interventions, sandbox ? 'sandbox' : 'story',
      parsed.home ? { home: parsed.home, born: parsed.born } : null);
    sizeChart();
    syncPlay();
    requestAnimationFrame(frame);
  }
  boot();
}());
