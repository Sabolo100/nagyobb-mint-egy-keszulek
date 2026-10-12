/* A papír jobb, mint a tablet — prezentáció: a diák kódvezérelt animációi és interaktív részei.
   Az animációk csak az aktív diában futnak (a deck.js `deck:on` / `deck:off` eseményére indulnak / állnak le),
   az alapállapot a végleges kép, így az áttekintő nézet és a nyomtatás is jó. A logika a weboldal (js/main.js) megfelelő részeiből készült. */
(function () {
  'use strict';
  var D = window.Deck;
  if (!D) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceNow = function () { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); };
  var IMG = 'assets/img/';
  var slideEl = function (id) { return document.getElementById('slide-' + id); };
  function hook(id, on, off) {
    var sl = slideEl(id);
    if (!sl) return;
    if (on) sl.addEventListener('deck:on', on);
    if (off) sl.addEventListener('deck:off', off);
  }

  /* ------------------------------------------------------------ számlálók: az alapszöveg a végleges érték, aktiváláskor 0-ról felfut */
  D.slides.forEach(function (sl) {
    var els = $$('[data-count]', sl);
    if (!els.length) return;
    var rafs = [];
    els.forEach(function (el) { el._final = el.textContent; });
    var fmt = function (el, v) {
      var dec = +(el.getAttribute('data-dec') || 0);
      return v.toLocaleString('hu-HU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    sl.addEventListener('deck:on', function () {
      if (reduceNow()) return;
      els.forEach(function (el, i) {
        var end = parseFloat(el.getAttribute('data-count')), t0 = performance.now() + 450, dur = 1700;
        var step = function (t) {
          var p = Math.max(0, Math.min(1, (t - t0) / dur));
          el.textContent = fmt(el, end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) rafs[i] = requestAnimationFrame(step); else el.textContent = el._final;
        };
        el.textContent = fmt(el, 0);
        rafs[i] = requestAnimationFrame(step);
      });
    });
    sl.addEventListener('deck:off', function () {
      rafs.forEach(function (r) { cancelAnimationFrame(r); });
      els.forEach(function (el) { el.textContent = el._final; });
    });
  });

  /* ------------------------------------------------------------ csúszkák: a kitöltés színe (--p) */
  function paintRange(el) { el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min)) * 100 + '%'); }

  /* ------------------------------------------------------------ 07 — két hurok: külső jutalom vs. belső megértés */
  (function () {
    var extSvg = $('#loop-ext'), intSvg = $('#loop-int');
    if (!extSvg || !intSvg) return;
    var NS = 'http://www.w3.org/2000/svg';
    function el(name, attrs) { var n = document.createElementNS(NS, name); Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }
    function buildLoop(svg, labels, o) {
      var cx = 210, cy = 192, R = 125, n = labels.length;
      svg.setAttribute('viewBox', '-70 0 560 366');
      svg.appendChild(el('circle', { cx: cx, cy: cy, r: R, fill: 'none', stroke: o.color, 'stroke-width': 3, 'stroke-dasharray': '4 9', 'stroke-linecap': 'round', opacity: .55 }));
      var nodes = labels.map(function (l, i) {
        var a = -Math.PI / 2 + (i / n) * Math.PI * 2, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
        var g = el('g');
        g.appendChild(el('circle', { cx: x, cy: y, r: 31, fill: o.nodeFill, stroke: o.color, 'stroke-width': 3 }));
        if (l.img) g.appendChild(el('image', { href: IMG + l.img + '.webp', x: x - 20, y: y - 20, width: 40, height: 40 }));
        else { var ic = el('text', { x: x, y: y + 7, 'text-anchor': 'middle', 'font-size': 24 }); ic.textContent = l.ico; g.appendChild(ic); }
        var cs = Math.cos(a), sn = Math.sin(a);
        var t = el('text', { x: x + (cs > 0.3 ? 41 : cs < -0.3 ? -41 : 0), y: y + (sn > 0.5 ? 57 : sn < -0.5 ? -44 : 7), 'text-anchor': cs > 0.3 ? 'start' : cs < -0.3 ? 'end' : 'middle', fill: o.text, 'font-size': 22 });
        t.textContent = l.t; g.appendChild(t);
        g.style.transformOrigin = x + 'px ' + y + 'px'; g.style.transition = 'transform .25s';
        svg.appendChild(g);
        return g;
      });
      var center = el('text', { x: cx, y: cy + 9, 'text-anchor': 'middle', fill: o.text, 'font-size': 32, 'font-family': 'Bricolage Grotesque, sans-serif', 'font-weight': 800 });
      center.textContent = o.center; svg.appendChild(center);
      var dot = el('circle', { r: 13, fill: o.dot, stroke: '#fff', 'stroke-width': 3 });
      svg.appendChild(dot);
      var ang = -Math.PI / 2, last = 0, lastNode = -1, laps = 0, running = false, raf = 0;
      var place = function () { dot.setAttribute('cx', cx + R * Math.cos(ang)); dot.setAttribute('cy', cy + R * Math.sin(ang)); };
      var frame = function (t) {
        if (!running) return;
        var dt = Math.min(50, t - last); last = t;
        ang += o.speed(laps) * dt / 1000;
        var rel = ((ang + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        var idx = Math.floor(rel / (Math.PI * 2 / n) + 0.02) % n;
        if (idx !== lastNode) {
          if (idx === 0 && lastNode !== -1) laps++;
          lastNode = idx;
          var g = nodes[idx]; g.style.transform = 'scale(1.16)'; setTimeout(function () { g.style.transform = ''; }, 260);
          if (o.onNode) o.onNode(idx, laps);
        }
        place();
        raf = requestAnimationFrame(frame);
      };
      place();
      return {
        start: function () { ang = -Math.PI / 2; lastNode = -1; laps = 0; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
        stop: function () { running = false; cancelAnimationFrame(raf); ang = -Math.PI / 2; place(); }
      };
    }
    var rewards = 0, insight = 0;
    var extNum = $('#ext-count'), extBar = $('#ext-bar'), intNum = $('#int-count'), intBar = $('#int-bar');
    var base = { ext: [extNum.textContent, extBar.style.width], int: [intNum.textContent, intBar.style.width] };
    var ext = buildLoop(extSvg, [{ img: 'st-pencil', t: 'Feladat' }, { img: 'st-star', t: 'Csillag' }, { img: 'st-chest', t: 'Láda?' }, { img: 'st-avatar', t: 'Avatar-tárgy' }, { img: 'st-trophy', t: '„Még egyet!”' }], {
      color: '#ffb3d7', text: '#fff', nodeFill: '#fff4f9', dot: '#ffd36e', center: 'gyorsul',
      speed: function (laps) { return Math.min(5.2, 1.3 + laps * 0.45); },
      onNode: function (i) { if (i === 1 || i === 3) { rewards++; extNum.textContent = rewards; extBar.style.width = Math.min(100, rewards * 3) + '%'; } }
    });
    var inn = buildLoop(intSvg, [{ ico: '❓', t: 'Kérdés' }, { img: 'st-pencil', t: 'Próbálkozás' }, { ico: '🌀', t: 'Elakadás' }, { img: 'st-brain', t: 'Aha!' }, { img: 'st-book', t: 'Új kérdés' }], {
      color: '#2340f5', text: '#1b2bc9', nodeFill: '#ffe1ef', dot: '#ff6fb5', center: 'mélyül',
      speed: function () { return 0.9; },
      onNode: function (i) { if (i === 3) { insight++; intNum.textContent = insight; intBar.style.width = Math.min(100, insight * 12) + '%'; } }
    });
    hook('hurkok', function () {
      rewards = 0; insight = 0;
      extNum.textContent = '0'; extBar.style.width = '0%'; intNum.textContent = '0'; intBar.style.width = '0%';
      if (!reduceNow()) { ext.start(); inn.start(); }
    }, function () {
      ext.stop(); inn.stop();
      extNum.textContent = base.ext[0]; extBar.style.width = base.ext[1]; intNum.textContent = base.int[0]; intBar.style.width = base.int[1];
    });
  })();

  /* ------------------------------------------------------------ 10 — tükör: a jutalomréteg „élőben” */
  (function () {
    var stageEl = $('.mr-stage'), xpEl = $('#mrXp'), lvlEl = $('#mrLvl'), stEl = $('#mrStreak'), barEl = $('#mrBar'), badges = $('#mrBadges'), toast = $('#mrToast');
    var offBtn = $('#mrOff'), offMsg = $('#mrOffMsg');
    if (!stageEl) return;
    var baseBadges = badges.innerHTML, base = { xp: xpEl.textContent, lvl: lvlEl.textContent, st: stEl.textContent, bar: barEl.style.width };
    var timers = [];
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var setXp = function (xp, streak) { xpEl.textContent = xp + ' XP'; lvlEl.textContent = 'Szint ' + (1 + Math.floor(xp / 100)); barEl.style.width = (xp % 100) + '%'; stEl.textContent = '🔥 ' + streak; };
    var pop = function (img, t, s) { $('img', toast).src = IMG + img + '.webp'; $('#mrToastT').textContent = t; $('#mrToastS').textContent = s; toast.classList.remove('is-hidden'); later(function () { toast.classList.add('is-hidden'); }, 1900); };
    var addBadge = function (img) { var im = document.createElement('img'); im.src = IMG + img + '.webp'; im.alt = ''; badges.appendChild(im); if (im.animate && !reduceNow()) im.animate([{ transform: 'scale(0) rotate(-30deg)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,1.6,.4,1)' }); };
    var cycle = function () {
      if (stageEl.classList.contains('is-off')) return;
      toast.classList.add('is-hidden'); badges.innerHTML = ''; setXp(0, 0);
      later(function () { setXp(25, 1); pop('st-star', '+25 XP', 'Új fejezetet fedeztél fel!'); }, 700);
      later(function () { setXp(50, 2); pop('st-star', '+25 XP', 'Új fejezetet fedeztél fel!'); }, 2900);
      later(function () { setXp(75, 3); addBadge('st-star'); pop('st-star', 'Új jelvény: Kíváncsi olvasó!', 'Gyűjtsd össze mind a négyet!'); }, 5100);
      later(function () { setXp(100, 4); pop('st-trophy', 'Szintlépés! Szint 2', 'Csak így tovább – már majdnem a következő!'); }, 7300);
      later(function () { setXp(130, 5); addBadge('st-book'); pop('st-book', 'Új jelvény: Könyvmoly!', 'Gyűjtsd össze mind a négyet!'); }, 9500);
      later(function () { setXp(210, 6); pop('st-chest', 'EPIKUS LÁDA!!!', '+80 XP – ez ritkán jön ki!'); }, 11700);
      later(cycle, 14500);
    };
    var clear = function () { timers.forEach(clearTimeout); timers = []; };
    hook('tukor', function () {
      stageEl.classList.remove('is-off'); offMsg.hidden = true; offBtn.hidden = false;
      if (!reduceNow()) cycle();
    }, function () {
      clear(); stageEl.classList.remove('is-off'); offMsg.hidden = true; offBtn.hidden = false;
      xpEl.textContent = base.xp; lvlEl.textContent = base.lvl; stEl.textContent = base.st; barEl.style.width = base.bar; badges.innerHTML = baseBadges; toast.classList.remove('is-hidden');
    });
    offBtn.addEventListener('click', function () { clear(); stageEl.classList.add('is-off'); offMsg.hidden = false; offBtn.hidden = true; });
  })();

  /* ------------------------------------------------------------ 13 — kézírás-labor */
  (function () {
    var pad = $('#pad');
    if (!pad) return;
    var ctx = pad.getContext('2d'), hint = $('#padHint');
    var drawing = false, lx = 0, ly = 0, lastAng = null, strokes = 0, dist = 0, turns = 0, taps = 0;
    var CW = 528; // a vászon CSS-szélessége (px) a 1280×720-as színpadon
    ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = '#1b2bc9';
    var upd = function () {
      $('#m-strokes').textContent = strokes;
      $('#m-turns').textContent = turns;
      $('#m-dist').textContent = (dist / 37.8).toFixed(1).replace('.', ',') + ' cm*';
      $('#t-hand').style.width = Math.min(100, turns / 1.2) + '%';
      $('#t-key').style.width = taps ? '8%' : '0%';
      $('#m-taps').textContent = taps;
    };
    var pos = function (e) { var r = pad.getBoundingClientRect(), k = pad.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
    pad.addEventListener('pointerdown', function (e) {
      drawing = true; try { pad.setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
      var p = pos(e); lx = p[0]; ly = p[1]; lastAng = null; strokes++; hint.classList.add('is-gone'); upd();
    });
    pad.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e), dx = p[0] - lx, dy = p[1] - ly, d = Math.hypot(dx, dy);
      if (d < 6) return;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p[0], p[1]); ctx.stroke();
      var a = Math.atan2(dy, dx);
      if (lastAng !== null) { var da = Math.abs(a - lastAng); if (da > Math.PI) da = 2 * Math.PI - da; if (da > 0.6) turns++; }
      lastAng = a; dist += d / 2; lx = p[0]; ly = p[1]; upd(); // a távolság: CSS-képpontban (a vászon 2×-es felbontású)
    });
    var end = function () { drawing = false; };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    var clear = function () { ctx.clearRect(0, 0, pad.width, pad.height); strokes = dist = turns = taps = 0; $('#typed').textContent = ''; hint.classList.remove('is-gone'); upd(); };
    $('#pad-clear').addEventListener('click', clear);
    var typed = $('#typed');
    $$('.key').forEach(function (k) {
      k.addEventListener('click', function () { taps++; typed.textContent = (typed.textContent + k.textContent).slice(-14); k.classList.add('hit'); setTimeout(function () { k.classList.remove('hit'); }, 120); upd(); });
    });
    void CW;
    hook('lab', null, function () { /* a szabadon rajzolt tartalom megmarad, amíg a bemutató nyitva van */ });
    upd();
  })();

  /* ------------------------------------------------------------ 16 — fókusz-teszt (csendes kör vs. gamifikált kör) */
  (function () {
    var game = $('#game');
    if (!game) return;
    var stage = $('.game-stage', game), topBar = $('.game-top', game), noise = $('.noise-layer', game);
    var N = 6, round = 0, i = 0, t0 = 0, res = [{}, {}], noiseT = null, combo = 0, timers = [];
    var fx = function (v) { return v.toFixed(1).replace('.', ','); };
    var gen = function () {
      var t = Math.random(), a, b, op, r;
      if (t < 0.4) { a = 12 + Math.floor(Math.random() * 60); b = 8 + Math.floor(Math.random() * 30); op = '+'; r = a + b; }
      else if (t < 0.7) { a = 40 + Math.floor(Math.random() * 50); b = 7 + Math.floor(Math.random() * 30); op = '−'; r = a - b; }
      else { a = 3 + Math.floor(Math.random() * 7); b = 4 + Math.floor(Math.random() * 6); op = '×'; r = a * b; }
      var opts = [r];
      while (opts.length < 4) { var d = [1, 2, 10, -1, -2, -10, 9, 11][Math.floor(Math.random() * 8)]; if (r + d > 0 && opts.indexOf(r + d) < 0) opts.push(r + d); }
      return { q: a + ' ' + op + ' ' + b, r: r, opts: opts.sort(function () { return Math.random() - 0.5; }) };
    };
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var intro = function () {
      stage.innerHTML = '<div><h3>Két kör, ' + N + '–' + N + ' egyszerű feladat.</h3><p>Az első kör csendes, mint egy füzetlap. A második „gamifikált”: csillagok, kombók, ládák repkednek körülötted. Mérjük az idődet és a hibáidat.</p><button class="btn btn--blue" id="g-start" type="button">Indítsd az 1. kört <span class="arr">→</span></button></div>';
      $('#g-start').onclick = function () { start(0); };
      topBar.innerHTML = '<span>Fókusz-teszt</span><span>játékos demonstráció, nem tudományos mérés</span>';
    };
    var start = function (r) { round = r; i = 0; res[r] = { time: 0, err: 0 }; combo = 0; game.classList.toggle('noisy', r === 1); if (r === 1) startNoise(); next(); };
    var next = function () {
      if (i >= N) return finish();
      var p = gen(); t0 = performance.now();
      topBar.innerHTML = '<span>' + (round === 0 ? '1. kör · csendes' : '2. kör · gamifikált 🔥') + '</span><span>' + (i + 1) + ' / ' + N + '</span>';
      stage.innerHTML = '<div><div class="prob">' + p.q + ' = ?</div><div class="answers">' + p.opts.map(function (o) { return '<button type="button">' + o + '</button>'; }).join('') + '</div></div>';
      $$('.answers button', stage).forEach(function (b) {
        b.onclick = function () {
          res[round].time += performance.now() - t0;
          if (+b.textContent !== p.r) { res[round].err++; combo = 0; } else combo++;
          if (round === 1 && combo > 1 && !reduceNow()) { var c = document.createElement('div'); c.className = 'combo'; c.textContent = 'KOMBÓ ×' + combo + '!'; c.style.left = (20 + Math.random() * 60) + '%'; c.style.top = (20 + Math.random() * 40) + '%'; stage.appendChild(c); later(function () { c.remove(); }, 1000); }
          i++; later(next, round === 1 ? 180 : 60);
        };
      });
    };
    var startNoise = function () {
      if (reduceNow()) return;
      var imgs = ['st-star', 'st-chest', 'st-trophy', 'st-avatar'];
      noiseT = setInterval(function () {
        var f = document.createElement('img'); f.className = 'fly'; f.src = IMG + imgs[Math.floor(Math.random() * 4)] + '.webp'; f.alt = '';
        f.style.left = (Math.random() * 90) + '%'; f.style.top = (Math.random() * 80) + '%';
        f.style.setProperty('--dx', (Math.random() - 0.5) * 400 + 'px'); f.style.setProperty('--dy', (Math.random() - 0.5) * 300 + 'px');
        noise.appendChild(f); setTimeout(function () { f.remove(); }, 2500);
      }, 260);
    };
    var finish = function () {
      clearInterval(noiseT); noise.innerHTML = ''; game.classList.remove('noisy');
      if (round === 0) {
        stage.innerHTML = '<div><h3>1. kör kész.</h3><p>Átlagosan ' + fx(res[0].time / N / 1000) + ' mp / feladat. Most jön a zajos kör.</p><button class="btn btn--pink" id="g-2" type="button">Indítsd a 2. kört <span class="arr">→</span></button></div>';
        $('#g-2').onclick = function () { start(1); }; return;
      }
      var a = res[0].time / N / 1000, b = res[1].time / N / 1000, diff = Math.round((b / a - 1) * 100);
      var msg = diff > 5 ? 'A gamifikált körben <b>' + diff + '%-kal lassabb</b> voltál. A villogó jutalmak a te figyelmedet is elvitték – pedig te felnőtt vagy, és tudtad, hogy ez csak teszt.'
        : diff < -5 ? 'A gamifikált körben <b>' + (-diff) + '%-kal gyorsabb</b> lettél. Ez is beszédes: a kombó és a jutalom <b>tempóra</b> ösztönöz, nem gondolkodásra. Hibáid: ' + res[0].err + ' → ' + res[1].err + '. Vajon fel tudnád idézni, melyik feladatot oldottad meg utoljára?'
        : 'Nagyjából ugyanolyan gyors voltál. Egy felnőtt jól szűr – egy 8–10 éves gyerek önszabályozása, végrehajtó funkciói viszont még fejlődésben vannak.';
      stage.innerHTML = '<div style="max-width:660px"><h3>Az eredményed</h3><div class="result-grid"><div><span>Csendes kör</span><b>' + fx(a) + ' mp</b><span>' + res[0].err + ' hiba</span></div><div><span>Gamifikált kör</span><b>' + fx(b) + ' mp</b><span>' + res[1].err + ' hiba</span></div></div><p>' + msg + '</p><button class="btn btn--ghost btn--sm" id="g-re" type="button">Újra</button></div>';
      $('#g-re').onclick = intro;
    };
    var reset = function () { clearInterval(noiseT); timers.forEach(clearTimeout); timers = []; noise.innerHTML = ''; game.classList.remove('noisy'); intro(); };
    intro();
    hook('fokusz', null, reset);
  })();

  /* ------------------------------------------------------------ 20 — heti képernyő-mérleg */
  (function () {
    var calc = $('#calc');
    if (!calc) return;
    var ids = ['c-app', 'c-dig', 'c-hw', 'c-wd', 'c-we'];
    var fmtH = function (m) { var h = Math.floor(m / 60), mm = Math.round(m % 60); return h ? h + ' óra' + (mm ? ' ' + mm + ' perc' : '') : mm + ' perc'; };
    var hu = function (n, d) { return n.toLocaleString('hu-HU', { maximumFractionDigits: d == null ? 1 : d }); };
    var upd = function () {
      var v = {};
      ids.forEach(function (id) { var e = $('#' + id); paintRange(e); v[id] = +e.value; });
      $('#o-app').textContent = v['c-app'] + ' perc/hét';
      $('#o-dig').textContent = v['c-dig'] + ' perc/hét';
      $('#o-hw').textContent = v['c-hw'] + ' perc/nap';
      $('#o-wd').textContent = hu(v['c-wd']) + ' óra/nap';
      $('#o-we').textContent = hu(v['c-we']) + ' óra/nap';
      var school = v['c-app'] + v['c-dig'], hw = v['c-hw'] * 5, free = v['c-wd'] * 60 * 5 + v['c-we'] * 60 * 2, week = school + hw + free;
      $('#tot-week').textContent = hu(week / 60);
      var year = (school + hw) * 36 / 60 + free * 52 / 60;
      $('#tot-year').textContent = Math.round(year).toLocaleString('hu-HU');
      $('#tot-days').textContent = Math.round(year / 24);
      $('#tot-school').textContent = fmtH(school + hw);
      var max = Math.max(v['c-wd'] * 60 + school / 5 + v['c-hw'], v['c-we'] * 60, 240);
      $$('#week > div').forEach(function (d, k) {
        var wk = k < 5, s = wk ? school / 5 : 0, h = wk ? v['c-hw'] : 0, f = wk ? v['c-wd'] * 60 : v['c-we'] * 60;
        $('.s', d).style.height = (s / max) * 100 + '%'; $('.h', d).style.height = (h / max) * 100 + '%'; $('.f', d).style.height = (f / max) * 100 + '%';
      });
      var daily = week / 7 / 60;
      var verdict = 'Napi átlag: <b>' + hu(daily) + ' óra</b> képernyő. ';
      verdict += daily >= 3 ? 'Ez már a nagy expozíció tartománya. Egy 2025-ös metaanalízisben <b>minden további napi óra kb. 21%-kal magasabb</b> rövidlátás-eséllyel társult (összefüggés, nem bizonyított ok).'
        : daily >= 1.5 ? 'Az iskola által hozzáadott perc nem a nulláról indul, hanem erre a mennyiségre <b>adódik rá</b>. Ezért kérdezd meg: mennyi a teljes heti iskolai képernyőidő?'
        : 'Ez mérsékelt mennyiség. Itt a fő kérdés nem az egészség, hanem a <b>kiszorítás</b>: mit nem csinál a gyerek ez alatt az idő alatt?';
      $('#verdict').innerHTML = verdict;
    };
    ids.forEach(function (id) { $('#' + id).addEventListener('input', upd); });
    upd();
    hook('merleg', function () {
      // belépéskor a „hét” oszlopai alulról felnőnek
      if (reduceNow()) return;
      $$('#week > div i').forEach(function (e) { if (e.animate) e.animate([{ transform: 'scaleY(0)', transformOrigin: 'bottom' }, { transform: 'scaleY(1)', transformOrigin: 'bottom' }], { duration: 900, delay: 500, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }); });
    });
  })();

  /* ------------------------------------------------------------ 21 — kiszorítás: a csúszka kiejti a tevékenységeket */
  (function () {
    var rng = $('#ks-min');
    if (!rng) return;
    var tiles = $$('#displace .dp');
    var upd = function () {
      paintRange(rng);
      var v = +rng.value, gone = Math.min(6, Math.floor(v / 30));
      $('#ks-out').textContent = v + ' perc';
      tiles.forEach(function (t, k) { t.classList.toggle('gone', k < gone); });
      $('#gone-n').textContent = gone;
    };
    rng.addEventListener('input', upd);
    upd();
  })();

  /* ------------------------------------------------------------ 24 — kvíz (a kérdések a weboldallal közösek: js/data.js) */
  (function () {
    var quiz = $('#quiz'), Q = window.QUIZ || [];
    if (!quiz || !Q.length) return;
    var qi = 0, score = 0;
    var prog = function () { return '<div class="q-progress">' + Q.map(function (_, k) { return '<i class="' + (k < qi ? 'done' : k === qi ? 'cur' : '') + '"></i>'; }).join('') + '</div>'; };
    var show = function () {
      if (qi >= Q.length) return final();
      var q = Q[qi];
      quiz.innerHTML = prog() + '<div class="note">' + (qi + 1) + '. kérdés / ' + Q.length + '</div><div class="q-text">' + q.q + '</div><div class="q-opts">' +
        q.o.map(function (o, k) { return '<button type="button" data-i="' + k + '"><span class="k">' + 'ABC'[k] + '</span>' + o + '</button>'; }).join('') + '</div><div class="q-expl"></div><div class="q-nav"></div>';
      $$('.q-opts button', quiz).forEach(function (b) {
        b.onclick = function () {
          var k = +b.getAttribute('data-i'), ok = k === q.a;
          if (ok) score++;
          $$('.q-opts button', quiz).forEach(function (x) { x.disabled = true; if (+x.getAttribute('data-i') === q.a) x.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          var ex = $('.q-expl', quiz); ex.innerHTML = (ok ? '<b>Így van!</b> ' : '<b>Nem egészen.</b> ') + q.e; ex.classList.add('show');
          $('.q-nav', quiz).innerHTML = '<button class="btn btn--blue btn--sm" type="button">' + (qi < Q.length - 1 ? 'Következő' : 'Eredmény') + ' <span class="arr">→</span></button>';
          $('.q-nav button', quiz).onclick = function () { qi++; show(); };
        };
      });
    };
    var final = function () {
      var msg = score >= 9 ? 'Kiváló! Te pontosan tudod, hol húzódik a bizonyítékok határa – ezzel vagy a legmeggyőzőbb egy szülői értekezleten.'
        : score >= 6 ? 'Jó eredmény! Néhány árnyalat meglepett – pont ezek teszik hitelessé az érvelést.'
        : 'Érdemes újraolvasni a fenti részeket – a téma tele van féligazságokkal mindkét oldalon.';
      quiz.innerHTML = '<div class="q-final"><div class="note">Az eredményed</div><div class="score">' + score + '<span>/' + Q.length + '</span></div><p>' + msg + '</p><button class="btn btn--blue" id="q-re" type="button">Újra</button></div>';
      $('#q-re').onclick = function () { qi = 0; score = 0; show(); };
    };
    show();
    hook('teszt', null, function () { qi = 0; score = 0; show(); });
  })();

  /* ------------------------------------------------------------ 26 — levélgenerátor */
  (function () {
    var out = $('#letter-out');
    if (!out) return;
    var val = function (id, fb) { return ($('#' + id).value || '').trim() || fb; };
    var build = function () {
      var school = val('l-school', '[iskola neve]'), cls = val('l-class', '[osztály]'), name = val('l-name', '[név]'), kid = val('l-kid', '[gyermek neve]');
      var qs = $$('.qlist input:checked').map(function (i) { return i.value; });
      var txt = 'Tisztelt Igazgató Asszony/Úr! Tisztelt Tanárnő/Tanár Úr!\n\n' +
        kid + ' (' + cls + ') szülőjeként azzal a kéréssel fordulok Önökhöz, hogy a tervezett tabletes / gamifikált digitális matematikai alkalmazás bevezetése előtt segítsenek megérteni a döntés pedagógiai hátterét.\n\n' +
        'Nem a technológia ellen érvelek: elismerem, hogy jól megválasztott, rövid, célzott digitális feladatoknak lehet helyük. Ugyanakkor több európai ország – különösen Svédország és Dánia – oktatáspolitikája az utóbbi években az „az analóg az alap, a digitális a kivétel” elv felé mozdult el: digitális eszköz akkor kerüljön be, ha dokumentált pedagógiai többletértéket ad, és nem szorítja ki a kézírást, a könyvet, a tárgyi tevékenységet és a tanári, társas gondolkodást.\n\n' +
        'Ezért tisztelettel az alábbi kérdésekre kérnék választ:\n\n' +
        (qs.map(function (q, i) { return (i + 1) + '. ' + q; }).join('\n') || '(válasszon kérdéseket a listából)') + '\n\n' +
        'Javaslom, hogy a bevezetés – ha megtörténik – időben korlátozott, kiértékelt próbaidőszakként induljon, a nem tananyaghoz kötődő jutalmazási elemek (avatárok, ládák, ranglisták) kikapcsolásával, és legyen egyenértékű papíralapú alternatíva azoknak a családoknak, akik ezt kérik.\n\n' +
        'Köszönöm a munkájukat és a válaszukat. Szívesen részt veszek egy személyes egyeztetésen is.\n\n' +
        'Tisztelettel:\n' + name + '\n' + school;
      out.textContent = txt;
      return txt;
    };
    $$('#letter-form input, #qlist input').forEach(function (i) { i.addEventListener('input', build); i.addEventListener('change', build); });
    build();
    $('#l-copy').addEventListener('click', function (e) {
      var b = e.currentTarget;
      var done = function () { b.textContent = 'Kimásolva ✓'; setTimeout(function () { b.textContent = 'Másolás'; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(build()).then(done, function () { out.focus(); });
      else out.focus();
    });
    $('#l-mail').addEventListener('click', function () { location.href = 'mailto:?subject=' + encodeURIComponent('Kérdések a tabletes matematikaoktatás bevezetéséről') + '&body=' + encodeURIComponent(build()); });
    $('#l-print').addEventListener('click', function () {
      var w = window.open('', '_blank'); if (!w) return;
      w.document.write('<pre style="white-space:pre-wrap;font:15px/1.6 Georgia,serif;max-width:680px;margin:40px auto">' + build().replace(/</g, '&lt;') + '</pre>');
      w.document.close(); w.print();
    });
  })();
})();
