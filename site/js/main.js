/* Nagyobb, mint egy készülék — interakciók */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const IMG = 'assets/img/';

  /* ---------- fejléc, menü, olvasási csík ---------- */
  const top = $('.top'), bar = $('.readbar'), nav = $('.nav');
  const onScroll = () => {
    top.classList.toggle('solid', scrollY > innerHeight * 0.6);
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (scrollY / h) * 100 + '%';
  };
  const bands = $$('.band > img');
  const parallax = () => { if (reduce) return; bands.forEach(im => { const r = im.parentElement.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) im.style.transform = 'translateY(' + (-(r.top / innerHeight) * 8 - 8) + '%)'; }); };
  addEventListener('scroll', () => { onScroll(); parallax(); }, { passive: true }); onScroll(); parallax();
  $('.burger').addEventListener('click', () => nav.classList.toggle('open'));
  $$('.nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => secObs.observe(s));

  /* ---------- megjelenés görgetéskor ---------- */
  const countUp = el => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), dur = 1600, t0 = performance.now();
    const fmt = v => v.toLocaleString('hu-HU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduce) { el.textContent = fmt(end); return; }
    const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = fmt(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const rvObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add('in');
    $$('[data-count]', el).forEach(countUp);
    if (el.matches('[data-count]')) countUp(el);
    $$('[data-w]', el).forEach(f => (f.style.width = f.dataset.w + '%'));
    if (el.classList.contains('timeline')) el.style.setProperty('--tl', 1);
    rvObs.unobserve(el);
  }), { threshold: 0.18 });
  if ('IntersectionObserver' in window) $$('.rv, .timeline, .curve-box').forEach(el => rvObs.observe(el));
  else document.documentElement.classList.remove('js');

  /* ---------- források: hivatkozások ---------- */
  const srcItems = $$('.src-list li');
  srcItems.forEach((li, i) => { li.dataset.n = i + 1; });
  const srcById = Object.fromEntries(srcItems.map(li => [li.id, li]));
  $$('sup.c').forEach(sup => {
    const ids = sup.dataset.s.split(',');
    sup.innerHTML = ids.map(id => {
      const li = srcById['s-' + id.trim()];
      if (!li) return '';
      return `<a href="#${li.id}" title="${li.textContent.trim().replace(/"/g, '&quot;').slice(0, 180)}">${li.dataset.n}</a>`;
    }).join(' ');
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('sup.c a');
    if (!a) return;
    const li = $(a.getAttribute('href'));
    if (!li) return;
    closeModal();
    $$('.src-filter button').forEach(b => b.classList.toggle('on', b.dataset.f === 'all'));
    srcItems.forEach(x => (x.hidden = false));
    setTimeout(() => { li.classList.add('flash'); setTimeout(() => li.classList.remove('flash'), 1800); }, 500);
  });
  $$('.src-filter button').forEach(b => b.addEventListener('click', () => {
    $$('.src-filter button').forEach(x => x.classList.toggle('on', x === b));
    srcItems.forEach(li => (li.hidden = b.dataset.f !== 'all' && !li.dataset.t.split(' ').includes(b.dataset.f)));
  }));

  /* ---------- modálok ---------- */
  const modal = $('#modal'), mBody = $('#modal-body');
  let lastFocus = null;
  function openModal(id) {
    const tpl = $('#m-' + id);
    if (!tpl) return;
    lastFocus = document.activeElement;
    mBody.innerHTML = tpl.innerHTML;
    // a modálba másolt hivatkozásokat is feldolgozzuk
    $$('sup.c', mBody).forEach(sup => {
      if (sup.querySelector('a')) return;
      sup.innerHTML = sup.dataset.s.split(',').map(id => { const li = srcById['s-' + id.trim()]; return li ? `<a href="#${li.id}" title="${li.textContent.trim().slice(0, 180).replace(/"/g, '&quot;')}">${li.dataset.n}</a>` : ''; }).join(' ');
    });
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('.close', modal).focus();
    hud.award(10, 'research');
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-modal]');
    if (t) { e.preventDefault(); openModal(t.dataset.modal); }
    if (e.target.closest('#modal .close, #modal .scrim')) closeModal();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ---------- konfetti ---------- */
  function confetti(x, y, n = 40) {
    if (reduce) return;
    const cols = ['#ff6fb5', '#2340f5', '#ffd36e', '#ffb3d7', '#8fa0ff'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'confetti';
      c.style.background = cols[i % cols.length]; c.style.left = x + 'px'; c.style.top = y + 'px';
      document.body.appendChild(c);
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 240;
      c.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v + 260}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1200 + Math.random() * 800, easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => c.remove();
    }
  }

  /* ==========================================================
     A „jutalomréteg”: szándékosan gamifikáljuk az olvasót,
     hogy aztán megmutassuk, mit csinált vele.
     ========================================================== */
  const hud = (() => {
    const el = $('.hud'), toastEl = $('.toast');
    const st = { xp: 0, badges: [], chests: 0, toasts: 0, glances: 0, closedAt: null, seen: new Set(), off: store.get('hudOff') === '1', start: Date.now() };
    const BADGES = [
      { at: 40, img: 'st-star', name: 'Kíváncsi olvasó' },
      { at: 120, img: 'st-book', name: 'Könyvmoly' },
      { at: 220, img: 'st-brain', name: 'Kutató elme' },
      { at: 340, img: 'st-trophy', name: 'Bajnok szülő' },
    ];
    const LEVEL = 100;
    let toastT, chestReady = false;
    const render = () => {
      $('.xp', el).textContent = st.xp + ' XP';
      $('.lvl', el).textContent = 'Szint ' + (1 + Math.floor(st.xp / LEVEL));
      $('.xpbar i', el).style.width = (st.xp % LEVEL) + '%';
      $('.streak', el).textContent = '🔥 ' + st.seen.size;
    };
    const toast = (img, title, sub) => {
      if (st.off) return;
      st.toasts++;
      toastEl.innerHTML = `<img src="${IMG}${img}.webp" alt=""><div>${title}<small>${sub}</small></div>`;
      toastEl.classList.add('show'); clearTimeout(toastT);
      toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
    };
    function award(n, why) {
      if (st.off) return;
      const before = st.xp; st.xp += n;
      BADGES.forEach(b => {
        if (before < b.at && st.xp >= b.at) {
          st.badges.push(b);
          const im = document.createElement('img'); im.src = IMG + b.img + '.webp'; im.alt = b.name; im.title = b.name;
          $('.badges', el).appendChild(im);
          toast(b.img, 'Új jelvény: ' + b.name + '!', 'Gyűjtsd össze mind a négyet!');
        }
      });
      if (Math.floor(before / LEVEL) < Math.floor(st.xp / LEVEL)) {
        toast('st-trophy', 'Szintlépés! Szint ' + (1 + Math.floor(st.xp / LEVEL)), 'Csak így tovább – már majdnem a következő!');
        const r = el.getBoundingClientRect(); confetti(r.left + 110, r.top, 30);
      } else if (why === 'section') toast('st-star', '+' + n + ' XP', 'Új fejezetet fedeztél fel!');
      if (!chestReady && st.xp >= 60 + st.chests * 110) { chestReady = true; $('.chest-btn', el).classList.add('show'); }
      render();
    }
    $('.chest-btn', el).addEventListener('click', e => {
      chestReady = false; st.chests++;
      e.currentTarget.classList.remove('show');
      // változó arányú jutalmazás: kiszámíthatatlan nyeremény
      const r = Math.random();
      const prize = r < 0.6 ? [5, 'Közönséges jutalom', '+5 XP – legközelebb talán több…'] : r < 0.9 ? [25, 'Ritka jutalom!', '+25 XP'] : [80, 'EPIKUS LÁDA!!!', '+80 XP – ez ritkán jön ki!'];
      toast('st-chest', prize[1], prize[2]);
      const b = e.currentTarget.getBoundingClientRect(); confetti(b.left + b.width / 2, b.top, prize[0] > 20 ? 60 : 16);
      st.xp += prize[0]; render();
      setTimeout(() => award(0), 50);
    });
    el.addEventListener('mouseenter', () => st.glances++);
    const turnOff = () => {
      st.off = true; st.closedAt = Date.now(); store.set('hudOff', '1');
      el.classList.remove('show'); toastEl.classList.remove('show');
    };
    $('.x', el).addEventListener('click', turnOff);
    // fejezetek felfedezése → XP
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || st.seen.has(e.target.id)) return;
      st.seen.add(e.target.id);
      if (e.target.id !== 'top') award(25, 'section');
    }), { threshold: 0.25 });
    $$('main > section[id]').forEach(s => so.observe(s));
    // megjelenik, ha elhagytuk a hero-t
    addEventListener('scroll', () => { if (!st.off) el.classList.toggle('show', scrollY > innerHeight * 0.7); }, { passive: true });
    render();
    return { award, turnOff, st, isOff: () => st.off, turnOn() { st.off = false; store.set('hudOff', '0'); el.classList.add('show'); } };
  })();

  /* tükör: amikor az olvasó odaér, megmutatjuk a saját adatait */
  const mirror = $('#mirror');
  if (mirror) {
    const fill = () => {
      const mins = Math.max(1, Math.round((Date.now() - hud.st.start) / 60000));
      $('[data-m=xp]', mirror).textContent = hud.st.xp;
      $('[data-m=badges]', mirror).textContent = hud.st.badges.length;
      $('[data-m=toasts]', mirror).textContent = hud.st.toasts;
      $('[data-m=chests]', mirror).textContent = hud.st.chests;
      $('[data-m=mins]', mirror).textContent = mins;
      $('.mirror-off', mirror).hidden = !hud.isOff();
      $('.mirror-on', mirror).hidden = hud.isOff();
    };
    let mt = null;
    new IntersectionObserver(es => es.forEach(e => { clearInterval(mt); if (e.isIntersecting) { fill(); mt = setInterval(fill, 1000); } }), { threshold: 0.3 }).observe(mirror);
    $('#hud-off').addEventListener('click', () => { hud.turnOff(); fill(); $('#hud-off-msg').hidden = false; });
    $('#hud-on').addEventListener('click', () => { hud.turnOn(); fill(); });
  }

  /* ---------- két hurok (külső jutalom vs. belső megértés) ---------- */
  function buildLoop(svg, labels, opts) {
    const NS = 'http://www.w3.org/2000/svg', cx = 210, cy = 170, R = 125;
    const col = opts.color, txt = opts.text;
    svg.setAttribute('viewBox', '0 0 420 340');
    const ring = document.createElementNS(NS, 'circle');
    Object.entries({ cx, cy, r: R, fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-dasharray': '4 9', 'stroke-linecap': 'round', opacity: .55 }).forEach(([k, v]) => ring.setAttribute(k, v));
    svg.appendChild(ring);
    const nodes = labels.map((l, i) => {
      const a = -Math.PI / 2 + (i / labels.length) * Math.PI * 2;
      const g = document.createElementNS(NS, 'g');
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      g.innerHTML = `<circle cx="${x}" cy="${y}" r="27" fill="${opts.nodeFill}" stroke="${col}" stroke-width="3"/>` +
        (l.img ? `<image href="${IMG}${l.img}.webp" x="${x - 17}" y="${y - 17}" width="34" height="34"/>` : `<text x="${x}" y="${y + 6}" text-anchor="middle" font-size="20">${l.ico}</text>`) +
        `<text x="${x + (Math.cos(a) > 0.3 ? 36 : Math.cos(a) < -0.3 ? -36 : 0)}" y="${y + (Math.sin(a) > 0.5 ? 48 : Math.sin(a) < -0.5 ? -36 : 5)}" text-anchor="${Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle'}" fill="${txt}">${l.t}</text>`;
      g.style.transformOrigin = `${x}px ${y}px`; g.style.transition = 'transform .25s';
      svg.appendChild(g);
      return { g, a };
    });
    const center = document.createElementNS(NS, 'text');
    Object.entries({ x: cx, y: cy + 8, 'text-anchor': 'middle', fill: txt, 'font-size': 26, 'font-family': 'Bricolage Grotesque, sans-serif', 'font-weight': 800 }).forEach(([k, v]) => center.setAttribute(k, v));
    center.textContent = opts.center; svg.appendChild(center);
    const dot = document.createElementNS(NS, 'circle');
    Object.entries({ r: 11, fill: opts.dot, stroke: '#fff', 'stroke-width': 3 }).forEach(([k, v]) => dot.setAttribute(k, v));
    svg.appendChild(dot);
    let ang = -Math.PI / 2, last = performance.now(), lastNode = -1, laps = 0, running = false;
    const step = t => {
      const dt = Math.min(50, t - last); last = t;
      const speed = opts.speed(laps);
      ang += speed * dt / 1000;
      const rel = ((ang + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const idx = Math.floor(rel / (Math.PI * 2 / labels.length) + 0.02) % labels.length;
      if (idx !== lastNode) {
        if (idx === 0 && lastNode !== -1) { laps++; opts.onLap && opts.onLap(laps); }
        lastNode = idx;
        const n = nodes[idx].g; n.style.transform = 'scale(1.18)'; setTimeout(() => (n.style.transform = ''), 260);
        opts.onNode && opts.onNode(idx, laps);
      }
      dot.setAttribute('cx', cx + R * Math.cos(ang)); dot.setAttribute('cy', cy + R * Math.sin(ang));
      if (running) requestAnimationFrame(step);
    };
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && !running && !reduce) { running = true; last = performance.now(); requestAnimationFrame(step); }
      else if (!e.isIntersecting) running = false;
    })).observe(svg);
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy - R);
  }
  const extSvg = $('#loop-ext'), intSvg = $('#loop-int');
  if (extSvg) {
    let rewards = 0;
    buildLoop(extSvg, [
      { img: 'st-pencil', t: 'Feladat' }, { img: 'st-star', t: 'Csillag' }, { img: 'st-chest', t: 'Láda?' },
      { img: 'st-avatar', t: 'Avatar-tárgy' }, { img: 'st-trophy', t: '„Még egyet!”' },
    ], {
      color: '#ffb3d7', text: '#fff', nodeFill: '#fff4f9', dot: '#ffd36e', center: 'gyorsul',
      speed: laps => Math.min(5.2, 1.3 + laps * 0.45),
      onNode: i => { if (i === 1 || i === 3) { rewards++; $('#ext-count').textContent = rewards; $('#ext-bar').style.width = Math.min(100, rewards * 3) + '%'; } },
      onLap: laps => { if (laps > 9) { /* újraindul: a „megszokás” */ } },
    });
    let insight = 0;
    buildLoop(intSvg, [
      { ico: '❓', t: 'Kérdés' }, { img: 'st-pencil', t: 'Próbálkozás' }, { ico: '🌀', t: 'Elakadás' },
      { img: 'st-brain', t: 'Aha!' }, { img: 'st-book', t: 'Új kérdés' },
    ], {
      color: '#2340f5', text: '#1b2bc9', nodeFill: '#ffe1ef', dot: '#ff6fb5', center: 'mélyül',
      speed: () => 0.9,
      onNode: i => { if (i === 3) { insight++; $('#int-count').textContent = insight; $('#int-bar').style.width = Math.min(100, insight * 12) + '%'; } },
    });
  }

  /* ---------- kézírás-labor ---------- */
  const pad = $('#pad');
  if (pad) {
    const ctx = pad.getContext('2d');
    let drawing = false, lx = 0, ly = 0, lastAng = null, strokes = 0, dist = 0, turns = 0, keyTaps = 0;
    const fit = () => {
      const r = pad.getBoundingClientRect(), d = devicePixelRatio || 1;
      const img = pad.width ? ctx.getImageData(0, 0, pad.width, pad.height) : null;
      pad.width = r.width * d; pad.height = r.height * d; ctx.scale(d, d);
      ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = 4.5; ctx.strokeStyle = '#1b2bc9';
      if (img) ctx.putImageData(img, 0, 0);
    };
    fit(); addEventListener('resize', fit);
    const upd = () => {
      $('#m-strokes').textContent = strokes;
      $('#m-turns').textContent = turns;
      $('#m-dist').textContent = (dist / 37.8).toFixed(1).replace('.', ',') + ' cm*';
      $('#t-hand').style.width = Math.min(100, turns / 1.2) + '%';
      $('#t-key').style.width = keyTaps ? '8%' : '0%';
      $('#m-taps').textContent = keyTaps;
    };
    const pos = e => { const r = pad.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    pad.addEventListener('pointerdown', e => {
      drawing = true; pad.setPointerCapture(e.pointerId); [lx, ly] = pos(e); lastAng = null; strokes++;
      $('.pad-hint').style.opacity = 0; upd();
    });
    pad.addEventListener('pointermove', e => {
      if (!drawing) return;
      const [x, y] = pos(e), dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
      if (d < 3) return;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
      const a = Math.atan2(dy, dx);
      if (lastAng !== null) { let da = Math.abs(a - lastAng); if (da > Math.PI) da = 2 * Math.PI - da; if (da > 0.6) turns++; }
      lastAng = a; dist += d; lx = x; ly = y; upd();
    });
    const end = () => { if (drawing) { drawing = false; hud.award(3); } };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    $('#pad-clear').addEventListener('click', () => { ctx.clearRect(0, 0, pad.width, pad.height); strokes = dist = turns = 0; $('.pad-hint').style.opacity = 1; upd(); });
    const typed = $('.typed');
    const tap = k => { keyTaps++; typed.textContent = (typed.textContent + k).slice(-16); upd(); };
    $$('.key').forEach(k => k.addEventListener('click', () => { tap(k.textContent); k.classList.add('hit'); setTimeout(() => k.classList.remove('hit'), 120); }));
    upd();
  }

  /* ---------- fókusz-teszt ---------- */
  const game = $('#game');
  if (game) {
    const stage = $('.game-stage', game), topBar = $('.game-top', game), noise = $('.noise-layer', game);
    const gen = () => {
      const t = Math.random();
      let a, b, op, r;
      if (t < 0.4) { a = 12 + Math.floor(Math.random() * 60); b = 8 + Math.floor(Math.random() * 30); op = '+'; r = a + b; }
      else if (t < 0.7) { a = 40 + Math.floor(Math.random() * 50); b = 7 + Math.floor(Math.random() * 30); op = '−'; r = a - b; }
      else { a = 3 + Math.floor(Math.random() * 7); b = 4 + Math.floor(Math.random() * 6); op = '×'; r = a * b; }
      const opts = new Set([r]);
      while (opts.size < 4) { const d = [1, 2, 10, -1, -2, -10, 9, 11][Math.floor(Math.random() * 8)]; if (r + d > 0) opts.add(r + d); }
      return { q: `${a} ${op} ${b}`, r, opts: [...opts].sort(() => Math.random() - 0.5) };
    };
    const N = 6;
    const fx = v => v.toFixed(1).replace(".", ",");
    let round = 0, i = 0, t0 = 0, res = [{}, {}], noiseT = null, combo = 0;
    const intro = () => {
      stage.innerHTML = `<div><h3 style="color:var(--ink)">Két kör, ${N}–${N} egyszerű feladat.</h3><p style="max-width:46ch;margin:0 auto 20px;color:var(--muted)">Az első kör csendes, mint egy füzetlap. A második „gamifikált”: csillagok, kombók, ládák repkednek körülötted. Mérjük az idődet és a hibáidat.</p><button class="btn btn-blue" id="g-start">Indítsd az 1. kört <span class="arr">→</span></button></div>`;
      $('#g-start').onclick = () => start(0);
      topBar.innerHTML = '<span>Fókusz-teszt</span><span>játékos demonstráció, nem tudományos mérés</span>';
    };
    const start = r => { round = r; i = 0; res[r] = { time: 0, err: 0 }; combo = 0; game.classList.toggle('noisy', r === 1); if (r === 1) startNoise(); next(); };
    const next = () => {
      if (i >= N) return finish();
      const p = gen(); t0 = performance.now();
      topBar.innerHTML = `<span>${round === 0 ? '1. kör · csendes' : '2. kör · gamifikált 🔥'}</span><span>${i + 1} / ${N}</span>`;
      stage.innerHTML = `<div><div class="prob">${p.q} = ?</div><div class="answers">${p.opts.map(o => `<button>${o}</button>`).join('')}</div></div>`;
      $$('.answers button', stage).forEach(b => b.onclick = () => {
        res[round].time += performance.now() - t0;
        if (+b.textContent !== p.r) { res[round].err++; combo = 0; } else combo++;
        if (round === 1 && combo > 1 && !reduce) { const c = document.createElement('div'); c.className = 'combo'; c.textContent = `KOMBÓ ×${combo}!`; c.style.left = 20 + Math.random() * 60 + '%'; c.style.top = 20 + Math.random() * 40 + '%'; stage.appendChild(c); }
        i++; setTimeout(next, round === 1 ? 180 : 60);
      });
    };
    const startNoise = () => {
      if (reduce) return;
      const imgs = ['st-star', 'st-chest', 'st-trophy', 'st-avatar'];
      noiseT = setInterval(() => {
        const f = document.createElement('img'); f.className = 'fly'; f.src = IMG + imgs[Math.floor(Math.random() * 4)] + '.webp'; f.alt = '';
        f.style.left = Math.random() * 90 + '%'; f.style.top = Math.random() * 80 + '%';
        f.style.setProperty('--dx', (Math.random() - 0.5) * 400 + 'px'); f.style.setProperty('--dy', (Math.random() - 0.5) * 300 + 'px');
        noise.appendChild(f); setTimeout(() => f.remove(), 2500);
      }, 260);
    };
    const finish = () => {
      clearInterval(noiseT); noise.innerHTML = ''; game.classList.remove('noisy');
      if (round === 0) {
        stage.innerHTML = `<div><h3 style="color:var(--ink)">1. kör kész.</h3><p style="color:var(--muted)">Átlagosan ${fx(res[0].time / N / 1000)} mp / feladat. Most jön a zajos kör.</p><button class="btn btn-pink" id="g-2">Indítsd a 2. kört <span class="arr">→</span></button></div>`;
        $('#g-2').onclick = () => start(1); return;
      }
      const a = res[0].time / N / 1000, b = res[1].time / N / 1000, diff = Math.round((b / a - 1) * 100);
      const msg = diff > 5 ? `A gamifikált körben <b>${diff}%-kal lassabb</b> voltál. A villogó jutalmak a te figyelmedet is elvitték – pedig te felnőtt vagy, és tudtad, hogy ez csak teszt.`
        : diff < -5 ? `A gamifikált körben <b>${-diff}%-kal gyorsabb</b> lettél. Ez is beszédes: a kombó és a jutalom <b>tempóra</b> ösztönöz, nem gondolkodásra. Hibáid: ${res[0].err} → ${res[1].err}. Vajon fel tudnád idézni, melyik feladatot oldottad meg utoljára?`
        : `Nagyjából ugyanolyan gyors voltál. Egy felnőtt jól szűr – egy 8–10 éves gyerek önszabályozása, végrehajtó funkciói viszont még fejlődésben vannak.`;
      stage.innerHTML = `<div style="max-width:640px"><h3 style="color:var(--ink)">Az eredményed</h3><div class="result-grid"><div><span>Csendes kör</span><b>${a.toFixed(1)} mp</b><span>${res[0].err} hiba</span></div><div><span>Gamifikált kör</span><b>${b.toFixed(1)} mp</b><span>${res[1].err} hiba</span></div></div><p>${msg}</p><p class="note">A kísérlet szemléltetés – a valódi kutatási eredményeket lent találod. Kapcsolódó jelenség: a „csábító részletek” hatása.</p><button class="btn btn-ghost btn-sm" id="g-re">Újra</button></div>`;
      $('#g-re').onclick = intro;
      hud.award(30);
    };
    intro();
  }

  /* ---------- heti mérleg (kalkulátor) ---------- */
  const calc = $('#calc');
  if (calc) {
    const ids = ['c-app', 'c-dig', 'c-hw', 'c-wd', 'c-we'];
    const fmtH = m => { const h = Math.floor(m / 60), mm = Math.round(m % 60); return h ? `${h} óra${mm ? ' ' + mm + ' perc' : ''}` : `${mm} perc`; };
    const upd = () => {
      const v = Object.fromEntries(ids.map(id => { const el = $('#' + id); el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min)) * 100 + '%'); return [id, +el.value]; }));
      $('#o-app').textContent = v['c-app'] + ' perc/hét';
      $('#o-dig').textContent = v['c-dig'] + ' perc/hét';
      $('#o-hw').textContent = v['c-hw'] + ' perc/nap';
      $('#o-wd').textContent = v['c-wd'].toLocaleString('hu-HU') + ' óra/nap';
      $('#o-we').textContent = v['c-we'].toLocaleString('hu-HU') + ' óra/nap';
      const school = v['c-app'] + v['c-dig'];               // perc / hét
      const hw = v['c-hw'] * 5;                               // perc / hét
      const free = v['c-wd'] * 60 * 5 + v['c-we'] * 60 * 2;   // perc / hét
      const week = school + hw + free;
      $('#tot-week').textContent = (week / 60).toLocaleString('hu-HU', { maximumFractionDigits: 1 });
      const year = (school + hw) * 36 / 60 + free * 52 / 60;
      $('#tot-year').textContent = Math.round(year).toLocaleString('hu-HU');
      $('#tot-days').textContent = Math.round(year / 24);
      $('#tot-school').textContent = fmtH(school + hw);
      const max = Math.max(v['c-wd'] * 60 + school / 5 + v['c-hw'], v['c-we'] * 60, 240);
      $$('#week div').forEach((d, i) => {
        const wk = i < 5;
        const s = wk ? school / 5 : 0, h = wk ? v['c-hw'] : 0, f = wk ? v['c-wd'] * 60 : v['c-we'] * 60;
        d.querySelector('.s').style.height = (s / max) * 100 + '%';
        d.querySelector('.h').style.height = (h / max) * 100 + '%';
        d.querySelector('.f').style.height = (f / max) * 100 + '%';
      });
      const daily = week / 7 / 60;
      let verdict = `Napi átlag: <b>${daily.toLocaleString('hu-HU', { maximumFractionDigits: 1 })} óra</b> képernyő. `;
      verdict += daily >= 3 ? `Ez már a nagy expozíció tartománya. Egy 2025-ös metaanalízisben <b>minden további napi óra kb. 21%-kal magasabb</b> rövidlátás-eséllyel társult (összefüggés, nem bizonyított ok).`
        : daily >= 1.5 ? `Az iskola által hozzáadott perc nem a nulláról indul, hanem erre a mennyiségre <b>adódik rá</b>. Ezért kérdezd meg: mennyi a teljes heti iskolai képernyőidő?`
        : `Ez mérsékelt mennyiség. Itt a fő kérdés nem az egészség, hanem a <b>kiszorítás</b>: mit nem csinál a gyerek ez alatt az idő alatt?`;
      $('#verdict').innerHTML = verdict;
      const gone = Math.min(6, Math.floor(school / 30));
      $$('.dp').forEach((d, i) => d.classList.toggle('gone', i < gone));
      $('#gone-n').textContent = gone;
    };
    ids.forEach(id => $('#' + id).addEventListener('input', upd));
    upd();
  }

  /* ---------- kvíz ---------- */
  const QUIZ = [
    { q: 'Svédország betiltotta az iPadeket az iskolákban.', o: ['Igaz, teljes tilalom van', 'Hamis, semmi nem változott', 'Részben: tudatosan visszafordította a digitalizációt'], a: 2,
      e: 'Svédország nem tiltott be minden képernyőt, de milliárdokat költ újra nyomtatott tankönyvekre, elvetette az országos digitalizációs stratégiát, az alsós országos teszteket nem digitalizálja, és mobilmentes iskolát vezet be. Az elv: digitális eszköz csak dokumentált pedagógiai többletérték esetén.' },
    { q: 'A gamifikáció a kutatások szerint átlagosan rontja a tanulást.', o: ['Igaz', 'Hamis'], a: 1,
      e: 'Hamis – és ezt egy hiteles oldalnak ki kell mondania. A metaanalízisek átlagosan kis–közepes pozitív hatást találnak (pl. g = 0,49 kognitív eredményekre). A valódi kérdés az, hogy <b>milyen motivációt</b> épít: a feladat szeretetét, vagy a következő jutalom hajszolását.' },
    { q: 'A híres „filctollas kísérletben” mi történt azokkal az óvodásokkal, akik előre tudták, hogy jutalmat kapnak a rajzolásért?', o: ['Később többet rajzoltak szabadidejükben', 'Később kb. feleannyit rajzoltak szabadidejükben', 'Nem volt különbség'], a: 1,
      e: 'Lepper, Greene és Nisbett (1973): a várt jutalomért rajzoló gyerekek két héttel később szabad játékidőben kb. feleannyi időt töltöttek rajzolással, mint a jutalom nélküli vagy váratlan jutalmat kapó társaik. Ez a „túligazolási hatás”.' },
    { q: 'Hosszabb, információs szövegeket a diákok átlagosan hol értenek meg jobban?', o: ['Papíron', 'Képernyőn', 'Nincs különbség'], a: 0,
      e: 'Több metaanalízis kis, de ismételten kimutatható papírelőnyt talál – különösen időnyomás alatt és ismeretterjesztő szövegeknél. A hátrány az évek során nem tűnt el, pedig a gyerekek egyre több képernyőt használnak.' },
    { q: 'Egy 2025-ös nagy metaanalízisben minden további napi képernyőóra kb. mennyivel magasabb rövidlátás-eséllyel társult?', o: ['kb. 5%', 'kb. 21%', 'kb. 80%'], a: 1,
      e: 'Kb. 21%, több mint 335 000 résztvevő adatai alapján. Fontos: ez összefüggés, a szerzők az oksági bizonyosságot alacsonynak ítélték. A szabadban töltött idő védő tényező.' },
    { q: 'UNESCO szerint 2024 végére hány oktatási rendszerben volt valamilyen iskolai okostelefon-korlátozás?', o: ['kb. 12', 'kb. 79', 'kb. 150'], a: 1,
      e: '79 rendszer – az országok mintegy 40%-a. UNESCO elve: technológiát akkor használjunk, ha az egyértelműen segíti a tanulást – nem azért, mert rendelkezésre áll.' },
    { q: 'Bizonyított-e, hogy egy gamifikált matekapp később videojáték-függőséget okoz?', o: ['Igen, ez bizonyított', 'Nem, erre nincs közvetlen bizonyíték'], a: 1,
      e: 'Nincs közvetlen bizonyíték – ezért nem is állítjuk. Amit viszont tudunk: ezek az appok a játékokból ismert mechanikákat (csillag, láda, avatar, achievement) használják. A jogos kérdés: <b>szükség van-e az iskolában arra, hogy ezekhez szoktassuk a gyereket</b>, ha a motiváció tanári visszajelzésből és a megértés öröméből is felépíthető?' },
    { q: 'Mit jelent a „kiszorítási hatás” (opportunity cost) az iskolai tablet kapcsán?', o: ['A tablet kiszorítja a régi tankönyveket a piacról', 'Ami a tableten történik, az az idő elvész a kézírásos munkától, tárgyi manipulációtól, tanári és társas gondolkodástól', 'A tablet több helyet foglal a padon'], a: 1,
      e: 'Ez a legerősebb, legnehezebben vitatható érv: a figyelem és a tanítási idő véges. A kérdés nem csak az, hogy árt-e a tablet, hanem hogy <b>mit nem csinál közben a gyerek</b>.' },
    { q: 'Mi a „változó arányú jutalmazás”?', o: ['Minden helyes válasz után ugyanannyi pont jár', 'A jutalom kiszámíthatatlan: néha jön, néha nem, néha nagy – ez tartja fenn a legerősebben a viselkedést', 'A tanár osztályzata hétről hétre változik'], a: 1,
      e: 'Ez a nyerőgépek és a játékbeli „loot boxok” működési elve. Ha egy app „ládát” ad, amelyből véletlenszerű jutalom jön ki, ugyanazt a mechanikát alkalmazza – ezen az oldalon is kipróbálhattad a bal alsó sarokban.' },
    { q: 'Melyik állítás a legjobban alátámasztott?', o: ['A tablet csökkenti a gyerekek IQ-ját', 'Az órai digitális figyelemelvonás rosszabb teljesítménnyel társul', 'A kék fény tönkreteszi a gyerekek szemét'], a: 1,
      e: 'A figyelemelvonás a legerősebben dokumentált probléma (OECD PISA). Az IQ-csökkenésre és a kékfény-károsodásra nincs megbízható bizonyíték – aki ilyet állít, gyengíti az ügyet.' },
  ];
  const quiz = $('#quiz');
  if (quiz) {
    let qi = 0, score = 0;
    const prog = () => `<div class="q-progress">${QUIZ.map((_, i) => `<i class="${i < qi ? 'done' : i === qi ? 'cur' : ''}"></i>`).join('')}</div>`;
    const show = () => {
      if (qi >= QUIZ.length) return final();
      const q = QUIZ[qi];
      quiz.innerHTML = `${prog()}<div class="note">${qi + 1}. kérdés / ${QUIZ.length}</div><div class="q-text">${q.q}</div><div class="q-opts">${q.o.map((o, i) => `<button data-i="${i}"><span class="k">${'ABC'[i]}</span>${o}</button>`).join('')}</div><div class="q-expl"></div><div class="q-nav"></div>`;
      $$('.q-opts button', quiz).forEach(b => b.onclick = () => {
        const i = +b.dataset.i, ok = i === q.a;
        if (ok) score++;
        $$('.q-opts button', quiz).forEach(x => { x.disabled = true; if (+x.dataset.i === q.a) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        const ex = $('.q-expl', quiz); ex.innerHTML = (ok ? '<b>Így van!</b> ' : '<b>Nem egészen.</b> ') + q.e; ex.classList.add('show');
        $('.q-nav', quiz).innerHTML = `<button class="btn btn-blue">${qi < QUIZ.length - 1 ? 'Következő' : 'Eredmény'} <span class="arr">→</span></button>`;
        $('.q-nav button', quiz).onclick = () => { qi++; show(); quiz.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
        hud.award(ok ? 15 : 5);
      });
    };
    const final = () => {
      const msg = score >= 9 ? 'Kiváló! Te pontosan tudod, hol húzódik a bizonyítékok határa – ezzel vagy a legmeggyőzőbb egy szülői értekezleten.'
        : score >= 6 ? 'Jó eredmény! Néhány árnyalat meglepett – pont ezek teszik hitelessé az érvelést.'
        : 'Érdemes újraolvasni a fenti részeket – a téma tele van féligazságokkal mindkét oldalon.';
      quiz.innerHTML = `<div class="q-final"><div class="note">Az eredményed</div><div class="score">${score}<span>/${QUIZ.length}</span></div><p class="lead" style="margin:16px auto 24px">${msg}</p><p class="note" style="margin-bottom:22px">Észrevetted? Ehhez a teszthez nem kellett jelvény, hogy végigcsináld. 😉</p><div class="share" style="justify-content:center"><button class="btn btn-pink" data-share>Küldd tovább egy szülőtársnak <span class="arr">→</span></button><button class="btn btn-ghost" id="q-re">Újra</button></div></div>`;
      $('#q-re').onclick = () => { qi = 0; score = 0; show(); };
      const r = quiz.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 120, 50);
    };
    show();
  }

  /* ---------- fülek ---------- */
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t));
    $$('.panel').forEach(p => p.classList.toggle('on', p.id === t.getAttribute('aria-controls')));
  }));

  /* ---------- levélgenerátor ---------- */
  const letter = $('#letter-out');
  if (letter) {
    const build = () => {
      const school = $('#l-school').value.trim() || '[iskola neve]', cls = $('#l-class').value.trim() || '[osztály]',
        name = $('#l-name').value.trim() || '[név]', kid = $('#l-kid').value.trim() || '[gyermek neve]';
      const qs = $$('.qlist input:checked').map(i => i.value);
      const txt = `Tisztelt Igazgató Asszony/Úr! Tisztelt Tanárnő/Tanár Úr!

${kid} (${cls}) szülőjeként azzal a kéréssel fordulok Önökhöz, hogy a tervezett tabletes / gamifikált digitális matematikai alkalmazás bevezetése előtt segítsenek megérteni a döntés pedagógiai hátterét.

Nem a technológia ellen érvelek: elismerem, hogy jól megválasztott, rövid, célzott digitális feladatoknak lehet helyük. Ugyanakkor több európai ország – különösen Svédország és Dánia – oktatáspolitikája az utóbbi években az „analóg az alap, digitális a kivétel” elv felé mozdult el: digitális eszköz akkor kerüljön be, ha dokumentált pedagógiai többletértéket ad, és nem szorítja ki a kézírást, a könyvet, a tárgyi tevékenységet és a tanári, társas gondolkodást.

Ezért tisztelettel az alábbi kérdésekre kérnék választ:

${qs.map((q, i) => `${i + 1}. ${q}`).join('\n') || '(válasszon kérdéseket a listából)'}

Javaslom, hogy a bevezetés – ha megtörténik – időben korlátozott, kiértékelt próbaidőszakként induljon, a nem tananyaghoz kötődő jutalmazási elemek (avatárok, ládák, ranglisták) kikapcsolásával, és legyen egyenértékű papíralapú alternatíva azoknak a családoknak, akik ezt kérik.

Köszönöm a munkájukat és a válaszukat. Szívesen részt veszek egy személyes egyeztetésen is.

Tisztelettel:
${name}
${school}`;
      letter.textContent = txt;
      return txt;
    };
    $$('#letter-form input').forEach(i => i.addEventListener('input', build));
    build();
    $('#l-copy').addEventListener('click', async e => {
      try { await navigator.clipboard.writeText(build()); e.currentTarget.innerHTML = 'Kimásolva ✓'; }
      catch { const r = document.createRange(); r.selectNodeContents(letter); getSelection().removeAllRanges(); getSelection().addRange(r); }
    });
    $('#l-mail').addEventListener('click', () => { location.href = 'mailto:?subject=' + encodeURIComponent('Kérdések a tabletes matematikaoktatás bevezetéséről') + '&body=' + encodeURIComponent(build()); });
    $('#l-print').addEventListener('click', () => {
      const w = open('', '_blank'); if (!w) return;
      w.document.write(`<pre style="white-space:pre-wrap;font:15px/1.6 Georgia,serif;max-width:680px;margin:40px auto">${build().replace(/</g, '&lt;')}</pre>`);
      w.document.close(); w.print();
    });
  }

  /* ---------- megosztás ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-share]');
    if (!b) return;
    const data = { title: 'Nagyobb, mint egy készülék', text: 'Miért legyen az általános iskolában a könyv, a papír és a tanár az alap – és miért ne szoktassa az iskola a gyereket csillagokra, ládákra és avatárokra?', url: location.href.split('#')[0] };
    if (navigator.share) { try { await navigator.share(data); } catch {} }
    else { try { await navigator.clipboard.writeText(data.url); b.innerHTML = 'Link kimásolva ✓'; } catch {} }
  });
})();
