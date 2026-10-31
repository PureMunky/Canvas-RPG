/*
 * Chronoscope UI: renders the deterministic world, drives playback and
 * background computation, and turns clicks into timeline interventions.
 * Nothing in here affects the simulation except World.intervene / undo.
 */
(function () {
  'use strict';
  var W = Sim.W, H = Sim.H, N = Sim.N, S = 6;
  var HORIZON = 3000, KF = 50, SAMPLE = Timeline.SAMPLE;
  var TER = Sim.TER;
  var $ = function (id) { return document.getElementById(id); };

  var MODES = [
    { id: 'realms', name: 'Realms' }, { id: 'terrain', name: 'Terrain' }, { id: 'people', name: 'People' },
    { id: 'solidarity', name: 'Solidarity' }, { id: 'climate', name: 'Climate' }, { id: 'divergence', name: 'Divergence' }
  ];
  var TOOLS = [{ id: 'inspect', name: 'Inspect', icon: '⌕', desc: 'Hover and click to learn about peoples and places.' }].concat(Sim.TOOLS);
  var SHORT = { inspect: 'Inspect', bless: 'Bless', blight: 'Salt', tribe: 'People', prophet: 'Prophet', knowledge: 'Ideas',
    plague: 'Plague', smite: 'Smite', mountain: 'Mount', sea: 'Flood', land: 'Land' };
  var EVENT_ICON = { rise: '↑', collapse: '✕', fall: '†', sack: '⚔', secede: '⇋', age: '✦', plague: '☣' };

  var app = {
    world: null, view: null, cview: null, cur: null, cmp: null,
    tick: 0, playing: true, speed: 25, acc: 0, last: 0,
    tool: 'inspect', mode: 'realms', selected: 0, hover: -1,
    needsRender: true, chartDirty: true, chartDrawn: 0, panelsAt: 0, chronKey: '', tlKey: '',
    flash: null, tab: 'chronicle', chartMax: 1, divergence: null
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
    if (!c) {
      c = hsl2rgb(sig % 360, 55 + ((sig >>> 9) % 30), 46 + ((sig >>> 17) % 16));
      colorCache[sig] = c;
    }
    return c;
  }
  function civCSS(sig, a) { var c = civRGB(sig); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }

  // ---------------------------------------------------------------------------
  // World lifecycle
  // ---------------------------------------------------------------------------
  function newWorld(seed, interventions) {
    seed = seed >>> 0;
    app.world = new Timeline.World(seed, { horizon: HORIZON, kfEvery: KF, maxCached: 4 });
    app.view = new Timeline.View(app.world);
    app.cview = new Timeline.View(app.world);
    app.cur = app.world.root;
    app.cmp = null;
    app.tick = 0; app.selected = 0; app.chartMax = 1; app.divergence = null;
    colorCache = {};
    $('seed').value = seed;
    (interventions || []).forEach(function (iv) {
      var prev = app.cur;
      app.cur = app.world.intervene(app.cur, iv.t, iv);
      if (app.cur !== prev) app.cmp = prev;
    });
    if (app.cur !== app.world.root) app.cmp = app.world.root;
    invalidateAll();
    updateHash();
  }

  function invalidateAll() { app.needsRender = true; app.chartDirty = true; app.chronKey = ''; app.tlKey = ''; app.panelsAt = 0; }

  function updateHash() {
    try { history.replaceState(null, '', '#' + Timeline.encode(app.world.seed, app.cur.interventions)); } catch (e) { /* file:// or sandbox */ }
  }

  function canSeek(b, t) {
    return t <= b.computedTo || !!b.keyframes[Math.floor(t / KF)];
  }

  function setTick(t, force) {
    t = Math.max(0, Math.min(HORIZON, Math.round(t)));
    if (!force) t = Math.min(t, Math.max(app.cur.computedTo, app.tick));
    if (t !== app.tick) { app.tick = t; app.needsRender = true; }
  }

  // ---------------------------------------------------------------------------
  // Interventions
  // ---------------------------------------------------------------------------
  function toolDef(id) { for (var k = 0; k < TOOLS.length; k++) if (TOOLS[k].id === id) return TOOLS[k]; return TOOLS[0]; }

  function intervene(x, y) {
    var prev = app.cur, def = toolDef(app.tool);
    var b = app.world.intervene(app.cur, app.tick, { type: app.tool, x: x, y: y });
    app.cur = b;
    if (b !== prev) {
      app.cmp = prev;
      toast('<b>' + esc(b.name) + '</b> branches from ' + esc(prev.name) + ' in year ' + app.tick + '. ' + def.name + ' at (' + x + ', ' + y + '). The future is being rewritten…');
    } else {
      toast(def.name + ' added to <b>' + esc(b.name) + '</b> in year ' + app.tick + '.');
    }
    app.flash = { x: x, y: y, until: performance.now() + 1500 };
    invalidateAll();
    updateHash();
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
  // Map rendering
  // ---------------------------------------------------------------------------
  var mapCanvas = $('map'), mapCtx = mapCanvas.getContext('2d');
  var img = mapCtx.createImageData(W * S, H * S);
  var tr = new Uint8ClampedArray(N), tg = new Uint8ClampedArray(N), tb = new Uint8ClampedArray(N);
  var edgeOwner = new Int32Array(N);

  function mix(a, b, t) { return a + (b - a) * t; }

  function renderMap() {
    var s = app.view.s, cs = (app.cmp && app.cview.s && app.cview.tick === app.tick) ? app.cview.s : null;
    if (!s) return;
    var mode = app.mode, sel = app.selected, i, c;
    var showBorders = mode === 'realms' || mode === 'solidarity' || mode === 'divergence';
    for (i = 0; i < N; i++) {
      var t = s.terrain[i], base = TERRAIN_RGB[t], shade = t >= TER.PLAINS ? (s.elev[i] - 560) / 900 : (s.elev[i] - 420) / 1400;
      var r = base[0] * (1 + shade), g = base[1] * (1 + shade), b = base[2] * (1 + shade);
      var land = t >= TER.PLAINS;
      c = s.owner[i];
      var sig = c >= 0 ? s.cSig[c] : 0;
      edgeOwner[i] = c;
      if (mode === 'realms') {
        if (land && c >= 0) {
          var cc = civRGB(sig), k = (sel && sig !== sel) ? 0.22 : 0.64;
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
          var cl = (s.clim[i] - 88) / 20; // ~ -0.65..+0.75
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
          }
        }
      }
      tr[i] = r; tg[i] = g; tb[i] = b;
    }

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
          if ((bU && py === 0) || (bD && py === S - 1) || (bL && px === 0) || (bR && px === S - 1)) {
            pr *= 0.42; pg *= 0.42; pb *= 0.42;
          }
          d[o] = pr; d[o + 1] = pg; d[o + 2] = pb; d[o + 3] = 255;
        }
      }
    }
    mapCtx.putImageData(img, 0, 0);
    drawMapOverlays(s);
  }

  function drawMapOverlays(s) {
    var ctx = mapCtx, mode = app.mode, nc = s.g[1], c, i;
    // interventions in this timeline
    var ivs = app.cur.interventions;
    for (var k = 0; k < ivs.length; k++) {
      var iv = ivs[k];
      if (iv.t > app.tick) continue;
      var age = app.tick - iv.t, cx = iv.x * S + S / 2, cy = iv.y * S + S / 2;
      ctx.strokeStyle = 'rgba(216,170,78,' + Math.max(0.35, 1 - age / 80) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, age < 80 ? 10 + age / 8 : 6, 0, Math.PI * 2); ctx.stroke();
    }
    if (mode === 'realms' || mode === 'solidarity' || mode === 'divergence') {
      // centroids for labels
      var sx = new Float64Array(nc), sy = new Float64Array(nc);
      for (i = 0; i < N; i++) { c = s.owner[i]; if (c >= 0) { sx[c] += i % W; sy[c] += (i / W) | 0; } }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (c = 0; c < nc; c++) {
        var tiles = s.sTiles[c];
        if (!s.cAlive[c] || tiles < 4) continue;
        var cap = s.cCap[c], px = (cap % W) * S + S / 2, py = ((cap / W) | 0) * S + S / 2;
        var rad = tiles >= 60 ? 3.5 : 2.2;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (tiles >= 45 && (!app.selected || app.selected === s.cSig[c])) {
          var size = Math.max(11, Math.min(24, 8 + Math.sqrt(tiles) * 0.45));
          ctx.font = '600 ' + size + 'px ' + getComputedStyle(document.body).getPropertyValue('--serif');
          var lx = sx[c] / tiles * S + S / 2, ly = sy[c] / tiles * S + S / 2;
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,18,.8)';
          var name = Sim.civName(s.cSig[c]).toUpperCase();
          ctx.strokeText(name, lx, ly); ctx.fillStyle = '#f4ecd8'; ctx.fillText(name, lx, ly);
        }
      }
    }
    if (app.hover >= 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1;
      var hx = app.hover % W, hy = (app.hover / W) | 0;
      var r = radiusOf(app.tool);
      ctx.strokeRect((hx - r) * S + 0.5, (hy - r) * S + 0.5, (2 * r + 1) * S - 1, (2 * r + 1) * S - 1);
    }
    if (app.flash && performance.now() < app.flash.until) {
      var f = 1 - (app.flash.until - performance.now()) / 1500;
      ctx.strokeStyle = 'rgba(255,230,160,' + (1 - f) + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(app.flash.x * S + S / 2, app.flash.y * S + S / 2, 8 + f * 40, 0, Math.PI * 2); ctx.stroke();
      app.needsRender = true;
    }
  }
  function radiusOf(tool) { return { bless: 2, blight: 2, prophet: 3, smite: 1, mountain: 1, sea: 1, land: 1 }[tool] || 0; }

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
    var n = Math.min(b.samples.length, Math.ceil(b.computedTo / SAMPLE));
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
    // compare line
    if (cmp && cmp.computedTo > 0) {
      ctx.strokeStyle = 'rgba(240,235,220,.8)'; ctx.lineWidth = 1.5 * dpr; ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.beginPath();
      for (t = 0; t < cmp.computedTo; t += SAMPLE) {
        var px = t / HORIZON * w, py = h - cmp.popHist[t] * scale;
        if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    // unknown future
    var fx = b.computedTo / HORIZON * w;
    if (fx < w) {
      ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(fx, 0, w - fx, h);
      ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
      for (var hx = fx - h; hx < w; hx += 10 * dpr) { ctx.beginPath(); ctx.moveTo(Math.max(fx, hx), hx < fx ? h - (fx - hx) : h); ctx.lineTo(hx + h, 0); ctx.stroke(); }
      ctx.fillStyle = 'rgba(216,170,78,.8)'; ctx.font = 'italic ' + 12 * dpr + 'px Georgia, serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      if (w - fx > 160 * dpr) ctx.fillText('the future is being written…', fx + 10 * dpr, h / 2);
    }
    // century gridlines
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = 10 * dpr + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (t = 500; t < HORIZON; t += 500) {
      var gx = t / HORIZON * w;
      ctx.fillRect(gx, 0, 1, 4 * dpr);
      ctx.fillText(String(t), gx, 4 * dpr);
    }
    // interventions
    var ivs = b.interventions, inh = b.inherited || 0;
    for (var m = 0; m < ivs.length; m++) {
      var ix = ivs[m].t / HORIZON * w;
      ctx.fillStyle = m >= inh ? '#d8aa4e' : 'rgba(216,170,78,.55)';
      ctx.fillRect(ix - dpr, 0, 2 * dpr, h);
      ctx.beginPath(); ctx.moveTo(ix - 5 * dpr, 0); ctx.lineTo(ix + 5 * dpr, 0); ctx.lineTo(ix, 7 * dpr); ctx.fill();
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
    if (app.cmp && app.divergence != null) {
      div.hidden = false;
      $('div-label').innerHTML = '<b>' + (app.divergence * 100).toFixed(1) + '%</b> of the world is ruled differently than in ' + esc(app.cmp.name);
      $('div-bar').style.width = (app.divergence * 100).toFixed(1) + '%';
    } else div.hidden = true;
  }

  function updateBranchLine() {
    var w = app.world, html = '<span class="muted">Timeline:</span> <b>' + esc(app.cur.name) + '</b>';
    var opts = '<option value="-1">nothing</option>' + w.branches.filter(function (b) { return b !== app.cur && !b.deleted; }).map(function (b) {
      return '<option value="' + b.id + '"' + (app.cmp === b ? ' selected' : '') + '>' + esc(b.name) + '</option>';
    }).join('');
    html += ' <span class="muted">vs</span> <select id="cmp-select" aria-label="Compare with">' + opts + '</select>';
    $('branch-line').innerHTML = html;
    $('cmp-select').onchange = function () {
      var v = parseInt(this.value, 10);
      app.cmp = v >= 0 ? w.branches[v] : null;
      app.divergence = null; invalidateAll();
    };
  }

  function updateToolHint() {
    var def = toolDef(app.tool);
    $('tool-hint').innerHTML = app.tool === 'inspect'
      ? 'Pick a tool on the left, then click the map to change history in year ' + app.tick + '.'
      : '<b>' + esc(def.name) + '</b>: ' + esc(def.desc) + ' Click the map to act in year ' + app.tick + (app.cur.parent < 0 || app.world.ownInterventions(app.cur).some(function (o) { return o.t !== app.tick; }) ? '. This creates a new timeline.' : '.');
  }

  function renderChronicle(force) {
    var b = app.cur, cmp = app.cmp;
    var major = $('f-major').checked, onlyChanges = cmp && $('f-changes').checked;
    var key = [b.id, b.version, b.events.length, cmp ? cmp.id + ':' + cmp.events.length : '-', major, onlyChanges, Math.floor(app.tick / 5)].join('|');
    if (!force && key === app.chronKey) return;
    app.chronKey = key;
    var upTo = cmp ? Math.min(b.computedTo, cmp.computedTo) : 0;
    var rows = cmp ? Timeline.diffChronicle(b.events, cmp.events, upTo) : b.events.map(function (e) { return { e: e, diff: '' }; });
    var html = '', nowIdx = -1, count = 0;
    for (var k = 0; k < rows.length; k++) {
      var e = rows[k].e, diff = rows[k].diff;
      if (major && !e.major && !diff) continue;
      if (onlyChanges && !diff) continue;
      var cls = [e.t > app.tick ? 'future' : '', diff].join(' ');
      if (nowIdx < 0 && e.t > app.tick) nowIdx = count;
      html += '<li class="' + cls + '" data-t="' + e.t + '" data-a="' + e.a + '" data-x="' + e.x + '" data-y="' + e.y + '">' +
        '<span class="t">Y' + e.t + '</span><span class="i">' + (EVENT_ICON[e.type] || '·') + '</span><span class="x">' + esc(e.text) +
        (diff ? '<span class="tag ' + diff + '">' + diff + '</span>' : '') + '</span></li>';
      count++;
    }
    if (!count) html = '<li class="empty">' + (b.computedTo < 200 ? 'History is just beginning…' : onlyChanges ? 'No differences yet. The ripples have not reached the chronicle.' : 'Nothing recorded yet.') + '</li>';
    var list = $('chronicle'), panel = $('panel-chronicle');
    var atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 30;
    list.innerHTML = html;
    if (app.playing || atBottom) {
      var target = nowIdx >= 0 ? list.children[nowIdx] : list.lastElementChild;
      if (target && target.offsetTop) panel.scrollTop = Math.max(0, target.offsetTop - panel.clientHeight + 60);
    }
    $('f-changes-wrap').style.display = cmp ? '' : 'none';
  }

  function renderTimelines(force) {
    var w = app.world;
    var key = w.branches.map(function (b) { return b.id + ':' + b.interventions.length + ':' + Math.floor(b.computedTo / 100) + (b.deleted ? 'd' : ''); }).join(',') + '|' + app.cur.id + '|' + (app.cmp ? app.cmp.id : '-');
    if (!force && key === app.tlKey) return;
    app.tlKey = key;
    var html = '<p class="muted" style="margin:0 0 8px;font-size:12px">World ' + w.seed + '. Every timeline is just this seed plus a list of changes, and replays identically.</p>';
    var children = {};
    w.branches.forEach(function (b) { if (!b.deleted) (children[b.parent] = children[b.parent] || []).push(b); });
    (function walk(parent, depth) {
      (children[parent] || []).forEach(function (b) {
        var own = w.ownInterventions(b);
        html += '<div class="tl' + (b === app.cur ? ' current' : '') + '" style="margin-left:' + depth * 14 + 'px">' +
          '<div class="tl-head"><span class="tl-name">' + esc(b.name) + '</span>' +
          (b === app.cur ? '<span class="tl-badge">you are here</span>' : '<button class="btn" data-go="' + b.id + '">Travel</button>') +
          (b !== app.cur ? (app.cmp === b ? '<span class="tl-badge">comparing</span>' : '<button class="btn" data-cmp="' + b.id + '">Compare</button>') : '') +
          '</div><div class="tl-meta">' + (b.parent < 0 ? 'The original history' : 'Branched in year ' + b.forkTick) + '</div>';
        if (own.length) html += '<ul>' + own.map(function (iv) { var d = toolDef(iv.type); return '<li>Y' + iv.t + ' ' + d.icon + ' ' + esc(d.name) + ' at (' + iv.x + ', ' + iv.y + ')</li>'; }).join('') + '</ul>';
        html += '<div class="progress" title="Years computed"><div style="width:' + (b.computedTo / HORIZON * 100).toFixed(1) + '%"></div></div></div>';
        walk(b.id, depth + 1);
      });
    }(-1, 0));
    if (w.ownInterventions(app.cur).length) html += '<button class="btn" id="btn-undo" style="margin-top:6px">Undo last change (Ctrl+Z)</button>';
    var el = $('timelines');
    el.innerHTML = html;
    el.querySelectorAll('[data-go]').forEach(function (btn) { btn.onclick = function () { switchBranch(w.branches[+btn.dataset.go]); }; });
    el.querySelectorAll('[data-cmp]').forEach(function (btn) { btn.onclick = function () { app.cmp = w.branches[+btn.dataset.cmp]; app.divergence = null; invalidateAll(); }; });
    if ($('btn-undo')) $('btn-undo').onclick = undo;
  }

  function findCiv(s, sig) {
    for (var c = 0; c < s.g[1]; c++) if (s.cSig[c] === sig && s.cAlive[c] && s.sTiles[c] > 0) return c;
    return -1;
  }

  function renderRealm() {
    var el = $('realm'), s = app.view.s, sig = app.selected;
    if (!sig) { el.innerHTML = '<p class="muted">Click a realm on the map (with the Inspect tool) or a band in the history chart to follow a people through time.</p>'; return; }
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
        '<dt>Solidarity</dt><dd>' + (A / 100).toFixed(0) + '%' + (A < Sim.CFG.collapseAsab ? ' <span style="color:var(--erased)">· in crisis</span>' : '') + '</dd>' +
        '<dt>Capital</dt><dd>(' + (s.cCap[c] % W) + ', ' + ((s.cCap[c] / W) | 0) + ')</dd>' +
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
    el.querySelectorAll('[data-jump]').forEach(function (btn) { btn.onclick = function () { app.playing = false; setTick(+btn.dataset.jump); syncPlay(); }; });
    $('btn-unselect').onclick = function () { app.selected = 0; invalidateAll(); renderRealm(); };
    var cv = $('realm-spark'), ctx = cv.getContext('2d'), maxv = peak || 1;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, cv.height);
    for (k = 0; k < series.length; k++) ctx.lineTo(k * SAMPLE / HORIZON * cv.width, cv.height - series[k] / maxv * (cv.height - 8));
    ctx.lineTo(series.length * SAMPLE / HORIZON * cv.width, cv.height); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(app.tick / HORIZON * cv.width - 1, 0, 2, cv.height);
  }

  function setTab(tab) {
    app.tab = tab;
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
    ['chronicle', 'timelines', 'realm'].forEach(function (p) { $('panel-' + p).hidden = p !== tab; });
    app.panelsAt = 0; app.chronKey = ''; app.tlKey = '';
  }

  var toastTimer = 0;
  function toast(html) {
    var t = $('toast'); t.innerHTML = html; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 4200);
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
        if (s.plague[i]) html += '<br><span style="color:var(--erased)">Plague!</span>';
        if (s.starve[i]) html += '<br><span style="color:var(--erased)">Famine</span>';
      } else html += '<br><span class="muted">Wilderness</span>';
    }
    if (app.tool !== 'inspect') html += '<br><span class="muted">Click: ' + esc(toolDef(app.tool).name) + '</span>';
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
    var budget = document.hidden ? 0 : 10, t0 = performance.now();
    if (!w.isComplete(b)) { w.compute(b, budget); app.chartDirty = true; }
    if (app.cmp && !w.isComplete(app.cmp) && performance.now() - t0 < budget) { w.compute(app.cmp, budget - (performance.now() - t0)); app.chartDirty = true; }

    // playback
    if (app.playing) {
      app.acc += dt * app.speed;
      var adv = Math.floor(app.acc);
      if (adv > 0) {
        app.acc -= adv;
        var target = Math.min(app.tick + adv, b.computedTo);
        if (target > app.tick) { app.tick = target; app.needsRender = true; }
        if (app.tick >= HORIZON) { app.playing = false; syncPlay(); }
      }
    }

    // render
    var overlay = $('map-overlay');
    if (app.needsRender || app.view.branch !== b || app.view.version !== b.version) {
      if (canSeek(b, app.tick)) {
        app.view.seek(b, app.tick);
        if (app.cmp && canSeek(app.cmp, app.tick)) {
          app.cview.seek(app.cmp, app.tick);
          app.divergence = Timeline.divergence(app.view.s, app.cview.s);
        } else app.divergence = null;
        overlay.hidden = true;
        renderMap();
        app.needsRender = false;
        updateYearCard();
        updateToolHint();
      } else {
        overlay.hidden = false;
        overlay.textContent = 'Recomputing ' + b.name + '… year ' + b.computedTo + ' of ' + app.tick;
      }
    }
    if (app.chartDirty && now - app.chartDrawn > 250) drawChartBuffer();
    drawChart();

    if (now - app.panelsAt > 300) {
      app.panelsAt = now;
      $('compute-status').textContent = w.isComplete(b) ? 'Future known to year ' + HORIZON
        : 'Writing the future… year ' + b.computedTo;
      updateBranchLine();
      if (app.tab === 'chronicle') renderChronicle();
      else if (app.tab === 'timelines') renderTimelines();
      else renderRealm();
    }
    requestAnimationFrame(frame);
  }

  function syncPlay() { $('btn-play').textContent = app.playing ? '❚❚' : '▶'; }

  // ---------------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------------
  function buildToolbar() {
    var tb = $('toolbar');
    tb.innerHTML = TOOLS.map(function (t) {
      return '<button class="tool' + (t.id === 'inspect' ? ' inspect' : '') + (t.id === app.tool ? ' active' : '') + '" data-tool="' + t.id + '" title="' + esc(t.name + ': ' + t.desc) + '" aria-label="' + esc(t.name) + '">' +
        t.icon + '<small>' + SHORT[t.id] + '</small></button>';
    }).join('');
    tb.querySelectorAll('.tool').forEach(function (btn) { btn.onclick = function () { setTool(btn.dataset.tool); }; });
  }
  function setTool(id) {
    app.tool = id;
    document.querySelectorAll('.tool').forEach(function (b) { b.classList.toggle('active', b.dataset.tool === id); });
    updateToolHint();
    app.needsRender = true;
  }
  function buildModes() {
    var m = $('map-modes');
    m.innerHTML = MODES.map(function (md, k) { return '<button data-mode="' + md.id + '" title="' + md.name + ' (' + (k + 1) + ')"' + (md.id === app.mode ? ' class="active"' : '') + '>' + md.name + '</button>'; }).join('');
    m.querySelectorAll('button').forEach(function (btn) { btn.onclick = function () { setMode(btn.dataset.mode); }; });
  }
  function setMode(id) {
    app.mode = id;
    document.querySelectorAll('#map-modes button').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === id); });
    app.needsRender = true;
    if (id === 'divergence' && !app.cmp) toast('Make a change (or pick a timeline to compare with) to see divergence.');
  }

  function tileFromEvent(e) {
    var r = mapCanvas.getBoundingClientRect();
    var x = Math.floor((e.clientX - r.left) / r.width * W), y = Math.floor((e.clientY - r.top) / r.height * H);
    if (x < 0 || y < 0 || x >= W || y >= H) return -1;
    return y * W + x;
  }

  function wire() {
    buildToolbar(); buildModes();
    mapCanvas.addEventListener('mousemove', function (e) {
      var i = tileFromEvent(e);
      if (i !== app.hover) { app.hover = i; app.needsRender = true; }
      showTooltip(e);
    });
    mapCanvas.addEventListener('mouseleave', function () { app.hover = -1; $('tooltip').hidden = true; app.needsRender = true; });
    mapCanvas.addEventListener('click', function (e) {
      var i = tileFromEvent(e);
      if (i < 0) return;
      if (app.tool === 'inspect') {
        var s = app.view.s, c = s ? s.owner[i] : -1;
        app.selected = c >= 0 ? s.cSig[c] : 0;
        if (app.selected) setTab('realm');
        invalidateAll();
      } else intervene(i % W, (i / W) | 0);
    });

    var dragging = false;
    chart.addEventListener('pointerdown', function (e) {
      dragging = true; chart.setPointerCapture(e.pointerId);
      app.playing = false; syncPlay(); setTick(chartTickAt(e.clientX));
    });
    chart.addEventListener('pointermove', function (e) {
      if (dragging) setTick(chartTickAt(e.clientX));
      var hit = chartCivAt(e.clientX, e.clientY), tip = $('chart-tip');
      var t = chartTickAt(e.clientX);
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
      if (app.tick >= HORIZON) setTick(0, true);
      app.playing = !app.playing; syncPlay();
    };
    $('btn-start').onclick = function () { setTick(0); };
    $('btn-end').onclick = function () { setTick(app.cur.computedTo); };
    $('btn-back').onclick = function (e) { app.playing = false; syncPlay(); setTick(app.tick - (e.shiftKey ? 10 : 1)); };
    $('btn-fwd').onclick = function (e) { app.playing = false; syncPlay(); setTick(app.tick + (e.shiftKey ? 10 : 1)); };
    $('speed').onchange = function () { app.speed = +this.value; };
    $('f-major').onchange = $('f-changes').onchange = function () { renderChronicle(true); };
    document.querySelectorAll('.tab').forEach(function (t) { t.onclick = function () { setTab(t.dataset.tab); }; });

    $('chronicle').addEventListener('click', function (e) {
      var li = e.target.closest('li[data-t]');
      if (!li) return;
      app.playing = false; syncPlay();
      setTick(+li.dataset.t);
      if (+li.dataset.x >= 0) app.flash = { x: +li.dataset.x, y: +li.dataset.y, until: performance.now() + 1500 };
      app.needsRender = true;
    });

    // The World box takes a plain number or a full timeline code (seed=…&iv=…).
    $('btn-new').onclick = function () {
      var v = $('seed').value.trim();
      if (v.indexOf('seed=') >= 0) {
        var p = Timeline.decode(v);
        newWorld(p.seed || 0, p.interventions);
        if (p.interventions.length) toast('Timeline restored: ' + p.interventions.length + ' change' + (p.interventions.length > 1 ? 's' : '') + ' replayed.');
      } else newWorld(parseInt(v, 10) || 0);
      app.playing = true; syncPlay();
    };
    $('btn-random').onclick = function () { newWorld(Math.floor(Math.random() * 1e6)); app.playing = true; syncPlay(); };
    $('seed').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('btn-new').click(); });
    $('btn-link').onclick = function () {
      var code = Timeline.encode(app.world.seed, app.cur.interventions);
      var show = function (msg) { toast(msg + '<br><code class="code">' + esc(code) + '</code>'); };
      var done = function () { show('Timeline code copied. Paste it into the World box to replay exactly this history.'); };
      var fail = function () { show('Copy this code and paste it into the World box to replay this history:'); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, fail);
        else fail();
      } catch (e) { fail(); }
    };
    $('btn-help').onclick = function () { $('help').hidden = false; };
    $('btn-help-close').onclick = function () { $('help').hidden = true; app.playing = true; syncPlay(); try { localStorage.setItem('chronoscope-help', '1'); } catch (e) { /* ignore */ } };
    $('help').addEventListener('click', function (e) { if (e.target === this) $('btn-help-close').click(); });

    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      var step = e.shiftKey ? 10 : 1;
      if (e.key === ' ') { e.preventDefault(); $('btn-play').click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); app.playing = false; syncPlay(); setTick(app.tick - step); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); app.playing = false; syncPlay(); setTick(app.tick + step); }
      else if (e.key === 'Home') setTick(0);
      else if (e.key === 'End') setTick(app.cur.computedTo);
      else if (e.key === 'Escape') { if (!$('help').hidden) $('btn-help-close').click(); else setTool('inspect'); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      else if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) setMode(MODES[+e.key - 1].id);
    });
    window.addEventListener('resize', sizeChart);
  }

  function boot() {
    wire();
    var parsed = Timeline.decode(location.hash);
    var seed = parsed.seed != null ? parsed.seed : 1;
    newWorld(seed, parsed.interventions);
    sizeChart();
    syncPlay();
    var seen = false;
    try { seen = localStorage.getItem('chronoscope-help') === '1'; } catch (e) { /* ignore */ }
    if (!seen) { $('help').hidden = false; app.playing = false; syncPlay(); }
    requestAnimationFrame(frame);
  }
  boot();
}());
