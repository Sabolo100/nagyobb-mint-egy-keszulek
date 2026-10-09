/* Nagyobb, mint egy készülék — mobil PWA */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = window.APPDATA, C = window.CONTENT, QUIZ = window.QUIZ || [];
  const IMG = '../assets/img/';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('nmek:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('nmek:' + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem('nmek:' + k); } catch {} },
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  const fx = (v, d = 1) => v.toLocaleString('hu-HU', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const srcMap = Object.fromEntries(D.sources.map(s => [s.id, s]));
  const cites = html => String(html).replace(/<sup class="c" data-s="([^"]+)"><\/sup>/g, (_, ids) => ids.split(',').map(id => {
    const s = srcMap[id.trim()];
    return s ? `<button class="cite" data-s="${s.id}" aria-label="${s.n}. forrás">${s.n}</button>` : '';
  }).join(''));
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const APP_URL = location.href.split('#')[0];
  const SITE_URL = new URL('../', APP_URL).href;

  const app = $('#app'), view = $('#view'), backBtn = $('#back'), titleEl = $('#title');
  const xpChip = $('#xp'), chestBtn = $('#chest'), toastEl = $('#toast');
  const sheet = $('#sheet'), sheetBody = $('#sheet-body');
  const ICON = {
    chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  };

  /* ==========================================================
     Alsó lap (sheet) – Android vissza gombbal is zárható
     ========================================================== */
  let sheetPushed = false, ignorePop = false, pendingGo = null;
  function openSheet(html) {
    sheetBody.innerHTML = html;
    sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false');
    $('.sheet-box', sheet).style.transform = '';
    if (!sheetPushed) { history.pushState({ sheet: true }, '', location.href); sheetPushed = true; }
  }
  function closeSheet(fromPop) {
    if (!sheet.classList.contains('open')) return;
    sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true');
    if (!fromPop && sheetPushed) { sheetPushed = false; ignorePop = true; history.back(); }
    else sheetPushed = false;
  }
  addEventListener('popstate', () => {
    if (ignorePop) { ignorePop = false; if (pendingGo) { const p = pendingGo; pendingGo = null; go(p); } return; }
    if (sheet.classList.contains('open')) closeSheet(true);
  });
  $('.scrim', sheet).addEventListener('click', () => closeSheet());
  // lehúzással zárás
  (() => {
    const box = $('.sheet-box', sheet); let y0 = null, dy = 0;
    box.addEventListener('pointerdown', e => { if (e.target.closest('.grab') || (sheetBody.scrollTop <= 0 && e.clientY - box.getBoundingClientRect().top < 60)) { y0 = e.clientY; dy = 0; box.style.transition = 'none'; box.setPointerCapture(e.pointerId); } });
    box.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); box.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 === null) return; y0 = null; box.style.transition = ''; box.style.transform = ''; if (dy > 90) closeSheet(); };
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  })();

  /* ---------- toast + konfetti ---------- */
  let toastT;
  function toast(img, title, sub = '') {
    toastEl.innerHTML = `${img ? `<img src="${IMG}${img}.webp" alt="">` : ''}<div>${title}${sub ? `<small>${sub}</small>` : ''}</div>`;
    toastEl.classList.add('show'); clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }
  function confetti(x, y, n = 36) {
    if (reduce) return;
    const r = app.getBoundingClientRect(), cols = ['#ff6fb5', '#2340f5', '#ffd36e', '#ffb3d7', '#8fa0ff'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'confetti';
      c.style.background = cols[i % cols.length]; c.style.left = (x - r.left) + 'px'; c.style.top = (y - r.top) + 'px';
      app.appendChild(c);
      const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 180;
      c.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v + 220}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => c.remove();
    }
  }

  /* ==========================================================
     A jutalomréteg – szándékos kísérlet az olvasón
     ========================================================== */
  const BADGES = [
    { at: 40, img: 'st-star', name: 'Kíváncsi olvasó' }, { at: 120, img: 'st-book', name: 'Könyvmoly' },
    { at: 220, img: 'st-brain', name: 'Kutató elme' }, { at: 340, img: 'st-trophy', name: 'Bajnok szülő' },
  ];
  const LEVEL = 100;
  const hud = {
    st: store.get('hud', null) || { xp: 0, badges: [], chests: 0, toasts: 0, start: Date.now(), seen: [] },
    off: store.get('hudOff', false),
    chestReady: false,
    save() { store.set('hud', this.st); },
    level() { return 1 + Math.floor(this.st.xp / LEVEL); },
    render() {
      xpChip.hidden = this.off;
      $('b', xpChip).textContent = this.st.xp;
      $('.lvl', xpChip).textContent = this.level();
      chestBtn.hidden = this.off || !this.chestReady;
    },
    toast(img, t, s) { if (this.off) return; this.st.toasts++; toast(img, t, s); },
    award(n, label) {
      if (this.off || !n) return;
      const before = this.st.xp; this.st.xp += n;
      xpChip.classList.remove('bump'); void xpChip.offsetWidth; xpChip.classList.add('bump');
      let shown = false;
      BADGES.forEach(b => {
        if (before < b.at && this.st.xp >= b.at) { this.st.badges.push(b.img); this.toast(b.img, 'Új jelvény: ' + b.name + '!', 'Gyűjtsd össze mind a négyet!'); shown = true; buzz(40); }
      });
      if (Math.floor(before / LEVEL) < Math.floor(this.st.xp / LEVEL)) {
        this.toast('st-trophy', `Szintlépés! ${this.level()}. szint`, 'Csak így tovább – már majdnem a következő!');
        const r = xpChip.getBoundingClientRect(); confetti(r.left + r.width / 2, r.bottom, 40); buzz([30, 40, 60]); shown = true;
        if (this.level() >= 2 && !store.get('revealSeen', false)) setTimeout(() => this.reveal(), 2600);
      }
      if (!shown && label) this.toast('st-star', `+${n} XP`, label);
      if (!this.chestReady && this.st.xp >= 60 + this.st.chests * 110) this.chestReady = true;
      this.save(); this.render();
    },
    visit(key, n, label) {
      if (this.off || this.st.seen.includes(key)) return;
      this.st.seen.push(key); this.award(n, label);
    },
    openChest() {
      this.chestReady = false; this.st.chests++;
      const r = Math.random();
      const p = r < 0.6 ? [5, 'Közönséges jutalom', '+5 XP – legközelebb talán több…'] : r < 0.9 ? [25, 'Ritka jutalom!', '+25 XP'] : [80, 'EPIKUS LÁDA!!!', '+80 XP – ez ritkán jön ki!'];
      const b = chestBtn.getBoundingClientRect(); confetti(b.left + b.width / 2, b.top, p[0] > 20 ? 60 : 16);
      buzz(p[0] > 20 ? [40, 60, 40, 60, 120] : 30);
      this.toast('st-chest', p[1], p[2]);
      const lvlBefore = this.level();
      this.st.xp += p[0]; this.save(); this.render();
      if (this.level() > lvlBefore) this.award(0);
      if (!this.chestReady && this.st.xp >= 60 + this.st.chests * 110) { this.chestReady = true; this.render(); }
    },
    setOff(v) { this.off = v; store.set('hudOff', v); if (v) toastEl.classList.remove('show'); this.render(); },
    reset() { this.st = { xp: 0, badges: [], chests: 0, toasts: 0, start: Date.now(), seen: [] }; this.chestReady = false; store.del('revealSeen'); this.save(); this.render(); },
    reveal() {
      if (this.off || sheet.classList.contains('open')) return;
      store.set('revealSeen', true);
      openSheet(`<div class="big-emoji">🏆</div><h3 style="text-align:center">Szintlépés! … de egy pillanat.</h3>
        <p>Észrevetted? Amióta itt vagy, ez az app <b>pontokat, jelvényeket és ládát</b> ad neked. Semmit nem tanultál tőlük – mégis odanéztél, talán rá is koppintottál a ládára.</p>
        <p>Te felnőtt vagy, és tudod, hogy ez csak egy app. Egy 10 éves gyerek ugyanezt <b>hétről hétre, az iskola jóváhagyásával</b> kapná.</p>
        <button class="btn btn-blue btn-block" data-go="lab/jutalom">Mutasd, mit csinált velem</button>
        <button class="btn btn-ghost btn-block" style="margin-top:10px" data-close>Később</button>`);
    },
    minutes() { return Math.max(1, Math.round((Date.now() - this.st.start) / 60000)); },
  };
  xpChip.addEventListener('click', () => {
    openSheet(`<span class="eyebrow">A pontjaid</span><h3>${hud.st.xp} XP · ${hud.level()}. szint</h3>
      <div style="display:flex;gap:8px;margin:8px 0 14px">${hud.st.badges.map(b => `<img src="${IMG}${b}.webp" alt="" style="width:44px;height:44px">`).join('') || '<span class="note">Még nincs jelvényed.</span>'}</div>
      <p>Ez a pontszámláló <b>szándékos kísérlet</b>: így érezheted a saját bőrödön, hogyan működik a gamifikáció.</p>
      <button class="btn btn-blue btn-block" data-go="lab/jutalom">Mi ez az egész?</button>`);
  });
  chestBtn.addEventListener('click', () => hud.openChest());

  /* ==========================================================
     Útválasztó – hash alapú, vermelt navigáció
     ========================================================== */
  const TABS = ['home', 'learn', 'lab', 'act', 'more'];
  const lastByTab = {};
  const stack = [];
  let current = null;
  const go = path => { if (location.hash !== '#/' + path) location.hash = '#/' + path; else route(); };
  const parse = () => (location.hash.replace(/^#\/?/, '') || 'home').split('/').filter(Boolean).map(decodeURIComponent);

  function route() {
    closeSheet(true);
    const segs = parse();
    if (!TABS.includes(segs[0])) { location.replace('#/home'); return; }
    const path = segs.join('/');
    let dir = 'fade';
    if (stack.length > 1 && stack[stack.length - 2] === path) { stack.pop(); dir = 'back'; }
    else if (stack[stack.length - 1] !== path) stack.push(path);
    if (current && dir !== 'back' && current.segs[0] === segs[0]) dir = segs.length > current.segs.length ? 'fwd' : segs.length < current.segs.length ? 'back' : 'fade';
    if (current && current.segs[0] !== segs[0]) dir = 'fade';
    lastByTab[segs[0]] = path;
    current = { segs, path };
    render(segs, dir);
  }
  addEventListener('hashchange', route);

  backBtn.addEventListener('click', () => {
    const parent = current.segs.slice(0, -1).join('/');
    if (stack.length > 1 && stack[stack.length - 2] === parent) history.back();
    else { stack.pop(); stack.push(parent); location.replace('#/' + parent); }
  });
  $$('.tab').forEach(t => t.addEventListener('click', e => {
    e.preventDefault();
    const tab = t.dataset.tab;
    if (current && current.segs[0] === tab) {
      if (current.segs.length > 1) go(tab);
      else { const sc = $('.screen:last-child', view); sc && sc.scrollTo({ top: 0, behavior: 'smooth' }); }
    } else go(lastByTab[tab] || tab);
  }));

  // globális kattintások
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) {
      e.preventDefault();
      if (sheet.classList.contains('open')) { pendingGo = g.dataset.go; closeSheet(); return; }
      go(g.dataset.go); return;
    }
    const c = e.target.closest('.cite');
    if (c) { e.preventDefault(); e.stopPropagation(); openSource(c.dataset.s); return; }
    if (e.target.closest('[data-close]')) { closeSheet(); return; }
    if (e.target.closest('[data-share]')) { shareApp(); return; }
  });

  function openSource(id) {
    const s = srcMap[id]; if (!s) return;
    openSheet(`<span class="eyebrow">${s.n}. forrás</span><h3>${esc(s.head)}</h3><p>${esc(s.text)}</p>
      ${s.url ? `<a class="btn btn-blue btn-block" href="${esc(s.url)}" target="_blank" rel="noopener">Megnyitás: ${esc(s.linkText || 'link')} ↗</a>` : ''}
      <button class="btn btn-ghost btn-block" style="margin-top:10px" data-go="more/sources">Összes forrás</button>`);
  }

  async function shareApp(text) {
    const data = { title: 'Nagyobb, mint egy készülék', text: text || 'Miért legyen az általános iskolában a könyv, a papír és a tanár az alap – és miért ne szoktassa az iskola a gyereket csillagokra, ládákra és avatárokra?', url: APP_URL };
    if (navigator.share) { try { await navigator.share(data); } catch {} }
    else { try { await navigator.clipboard.writeText(data.url); toast('st-pencil', 'Link kimásolva', 'Illeszd be bárhová'); } catch {} }
  }
  $('#share-top').addEventListener('click', () => shareApp());

  /* ---------- képernyő-renderelés ---------- */
  function render(segs, dir) {
    const s = buildScreen(segs);
    const el = document.createElement('section');
    el.className = 'screen' + (s.fixed ? ' fixed' : '');
    el.innerHTML = s.html;
    const old = $$('.screen', view);
    view.appendChild(el);
    app.classList.remove('immersive', 'scrolled');
    // fejléc
    backBtn.hidden = segs.length <= 1;
    $('#share-top').hidden = !hud.off && !xpChip.hidden && segs.length > 1;
    titleEl.innerHTML = s.root ? '<span class="brand">Nagyobb, mint egy készülék.</span>' : `<span class="crumb">${esc(s.crumb || '')}</span>${esc(s.title || '')}`;
    $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === segs[0]));
    // átmenet
    const anim = reduce ? '' : dir === 'fwd' ? 'in-fwd' : dir === 'back' ? 'in-back' : 'in-fade';
    if (anim) el.classList.add(anim);
    old.forEach(o => {
      o._cleanup && o._cleanup();
      if (reduce || dir === 'fade') { o.remove(); return; }
      o.classList.add(dir === 'fwd' ? 'out-fwd' : 'out-back');
      if (dir === 'back') o.style.zIndex = 3;
      setTimeout(() => o.remove(), 360);
    });
    el.addEventListener('scroll', () => app.classList.toggle('scrolled', el.scrollTop > 4), { passive: true });
    if (s.mount) el._cleanup = s.mount(el) || null;
    hud.render();
  }

  function buildScreen(segs) {
    const [tab, a, b] = segs;
    const last = segs[segs.length - 1];
    if (last && last.startsWith('d:')) return detailScreen(last.slice(2), segs);
    if (tab === 'home') return homeScreen();
    if (tab === 'learn') {
      if (!a) return learnScreen();
      const t = C.topics.find(x => x.id === a);
      if (t) return deckScreen(t.id, t.cards, { title: t.title, crumb: 'Tudás', doneTo: 'learn', base: `learn/${t.id}` });
    }
    if (tab === 'lab') {
      if (!a) return labScreen();
      const f = { jutalom: labReward, focus: labFocus, pad: labPad, calc: labCalc, quiz: labQuiz }[a];
      if (f) return f();
    }
    if (tab === 'act') {
      if (!a) return actScreen();
      const f = { letter: actLetter, teachers: actTeachers, policy: actPolicy, share: actShare }[a];
      if (f) return f();
    }
    if (tab === 'more') {
      if (!a) return moreScreen();
      const f = { sources: moreSources, install: moreInstall, about: moreAbout }[a];
      if (f) return f();
    }
    return { title: 'Nem található', html: `<div class="center-block"><h2>Ez az oldal nem található.</h2><button class="btn btn-pink" data-go="home">Főoldal</button></div>` };
  }

  const tile = (go, icon, title, sub, tone = '', extra = '') => `<button class="tile ${tone ? 't-' + tone : ''}" data-go="${go}">
    <span class="ti">${icon.startsWith('city') ? `<img class="photo" src="${IMG}${icon}.webp" alt="">` : `<img src="${IMG}${icon}.webp" alt="">`}</span>
    <span>${extra}<h3>${title}</h3><p>${sub}</p></span>${ICON.chev}</button>`;

  /* ==========================================================
     FŐOLDAL
     ========================================================== */
  let deferredInstall = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const c = $('#install-slot'); if (c) c.innerHTML = installCard(); });
  addEventListener('appinstalled', () => { deferredInstall = null; toast('st-trophy', 'Telepítve!', 'Megtalálod a kezdőképernyőn'); });
  const installCard = () => (isStandalone() || (!deferredInstall && !isIOS)) ? '' :
    `<div class="install-card"><img src="icons/icon-192.png" alt=""><div><b>Tedd a kezdőképernyőre</b><span>Offline is működik, mint egy app.</span></div><button class="btn btn-pink" data-go="more/install">Telepítés</button></div>`;

  function homeScreen() {
    return {
      root: true,
      html: `<div class="home-hero"><img src="${IMG}hero.webp" alt=""><div class="sticker">A gyerekkor nem tesztlabor.</div>
          <span class="eyebrow" style="color:#fff">Szülőknek · tanároknak</span>
          <h1>Nagyobb, mint egy készülék.</h1>
          <p>Analóg az alap, digitális a kivétel. Kutatásokkal, forrásokkal – 5 perc alatt.</p>
          <button class="btn btn-pink" data-go="learn/lenyeg">A lényeg 60 mp alatt →</button></div>
        <div id="install-slot">${installCard()}</div>
        <div class="section-h">A fő üzenet</div>
        <div class="tiles">${tile('learn/csapda', 'st-chest', 'A jutalomcsapda', 'Ne az iskola szoktassa rá a gyereket a játékmechanikára.', 'blue')}</div>
        <div class="section-h">Próbáld ki <button data-go="lab">Mind</button></div>
        <div class="tiles two">
          <button class="tile square t-pink" data-go="lab/focus"><span class="ti"><img src="${IMG}st-star.webp" alt=""></span><span><h3>Fókusz-teszt</h3><p>Csendes vs. csillogó</p></span>${ICON.chev}</button>
          <button class="tile square" data-go="lab/quiz"><span class="ti"><img src="${IMG}st-brain.webp" alt=""></span><span><h3>Kvíz</h3><p>10 kérdés</p></span>${ICON.chev}</button>
          <button class="tile square" data-go="lab/calc"><span class="ti"><img src="${IMG}st-eye.webp" alt=""></span><span><h3>Heti mérleg</h3><p>Mennyi képernyő?</p></span>${ICON.chev}</button>
          <button class="tile square t-ink" data-go="act/letter"><span class="ti"><img src="${IMG}st-pencil.webp" alt=""></span><span><h3>Levél</h3><p>az iskolának</p></span>${ICON.chev}</button>
        </div>`,
      mount() { hud.render(); },
    };
  }

  /* ==========================================================
     TUDÁS – témalista, lapozható kártyák, részletek
     ========================================================== */
  function learnScreen() {
    const done = store.get('done', []);
    return {
      root: true,
      html: `<h1 class="big-title">Tudás</h1><p class="lead">Hét téma, lapozható kártyákon. Minden állítás mögött forrás – koppints a kis számokra.</p>
        <div class="tiles">${C.topics.map(t => {
          const pos = store.get('deckpos:' + t.id, 0);
          const prog = done.includes(t.id) ? '<span class="prog">✓ kész</span>' : pos > 0 ? `<span class="prog" style="color:var(--pink-hot)">${pos + 1}/${t.cards.length}</span>` : '';
          return tile('learn/' + t.id, t.icon, t.title, t.sub, t.id === 'csapda' ? 'blue' : '', prog);
        }).join('')}</div>`,
    };
  }

  function cardHTML(c, base) {
    const bg = c.bg ? ' bg-' + c.bg : '';
    const more = c.more ? `<button class="more" data-go="${base}/d:${c.more}">${c.moreLabel || 'Részletek'}</button>` : '';
    const eb = c.eyebrow ? `<span class="eyebrow">${c.eyebrow}</span>` : '';
    const txt = c.text ? `<div class="txt">${cites(c.text)}</div>` : '';
    switch (c.t) {
      case 'cover':
        return `<div class="card cover"><img src="${IMG}${c.img}.webp" alt="" style="object-position:${c.pos || '50% 35%'}"><div class="cv">${eb}<h2>${c.title}</h2>${txt}<span class="swipe-hint">lapozz <i></i></span></div></div>`;
      case 'photo':
        return `<div class="card photo${bg}"><img src="${IMG}${c.img}.webp" alt=""><div class="cv">${eb}<h2>${c.title}</h2>${txt}${more}</div></div>`;
      case 'text':
        return `<div class="card${bg}${c.dashed ? ' dashed' : ''}">${eb}<h2>${c.title}</h2>${txt}<div class="spacer"></div>${more}</div>`;
      case 'stat':
        return `<div class="card${bg}">${c.num ? `<span class="num">${c.num}</span>` : ''}${c.icon ? `<img class="ico" src="${IMG}${c.icon}.webp" alt="">` : ''}${c.big ? `<div class="big">${c.big}</div>` : ''}${eb}<h2>${c.title}</h2>${txt}<div class="spacer"></div>${more}</div>`;
      case 'quote':
        return `<div class="card${bg}"><blockquote class="q">${c.text}<div class="q-cite">— ${cites(c.cite)}</div></blockquote></div>`;
      case 'stats':
        return `<div class="card${bg}"><h2>${c.title}</h2><div class="stat-grid">${c.items.map(i => `<div><b>${i.n}${i.u ? `<small> ${i.u}</small>` : ''}</b><span>${i.l} ${cites(`<sup class="c" data-s="${i.s}"></sup>`)}</span></div>`).join('')}</div></div>`;
      case 'cta':
        return `<div class="card${bg}">${c.icon ? `<img class="ico" src="${IMG}${c.icon}.webp" alt="">` : ''}<h2>${c.title}</h2>${txt}<div class="spacer"></div><button class="btn ${c.bg === 'blue' ? 'btn-pink' : 'btn-blue'} btn-block" data-go="${c.go}">${c.label} →</button></div>`;
      case 'list':
        return `<div class="card${bg}">${eb}<h2>${c.title}</h2><div class="rows">${c.rows.map(r => `<button class="row" data-go="${base}/d:${r.d}"><img src="${IMG}${r.icon}.webp" alt=""><span><b>${r.title}</b><span>${r.sub}</span></span></button>`).join('')}</div></div>`;
      case 'loop':
        return `<div class="card${bg}">${eb}<h2>${c.title}</h2><svg class="loop-svg" data-loop="${c.kind}" role="img" aria-label="${c.kind === 'ext' ? 'Gyorsuló jutalomkör' : 'Egyenletes tanulási kör'}"></svg>${txt}<div class="meter">${c.kind === 'ext' ? 'Begyűjtött jutalom' : 'Aha-élmény'}: <span data-count-loop>0</span><span class="bar"><i></i></span></div></div>`;
      case 'bars':
        return `<div class="card${bg}">${eb}<h2>${c.title}</h2>${txt}<div class="bars">${c.bars.map(b => `<div class="bar-row${b.hl ? ' hl' : ''}"><span>${b.l}</span><b>${b.v}</b><div class="track"><div class="fill" data-w="${b.w}"></div></div></div>`).join('')}</div><p class="note">${c.note}</p></div>`;
      case 'mirror':
        return `<div class="card${bg}" data-mirror>${mirrorHTML()}</div>`;
      case 'readdemo':
        return `<div class="card${bg}"><h2>${c.title}</h2><div class="read-demo" aria-hidden="true">
          <div class="rd paper"><h5>Papír</h5><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="lines">${'<i></i>'.repeat(8)}</div><div class="lines">${'<i></i>'.repeat(8)}</div></div><span class="mark"></span></div>
          <div class="rd screen"><h5>Képernyő</h5><div class="lines">${'<i></i>'.repeat(26)}</div><span class="mark"></span></div></div>${txt}</div>`;
      case 'anim':
        return `<div class="card${bg}"><div class="anim">${ANIMS[c.anim]}</div><div class="big">${c.big}</div><h2>${c.title}</h2>${txt}<div class="spacer"></div>${more}</div>`;
      case 'curve':
        return `<div class="card${bg} curve-card"><h2>${c.title}</h2><div class="curve">${CURVE}</div>${txt}<div class="spacer"></div>${more}</div>`;
      case 'timeline':
        return `<div class="card${bg}"><h2>${c.title}</h2><ul class="tl">${c.items.map(i => `<li><span class="y">${i[0]}</span><b>${i[1]}</b><p>${i[2]}</p></li>`).join('')}</ul></div>`;
      case 'countries':
        return `<div class="card${bg}"><h2>${c.title}</h2><div class="cgrid">${c.items.map(i => `<button class="cbtn" data-go="${base}/d:${i.d}"><div class="ci">${i.img ? `<img src="${IMG}${i.img}.webp" alt="">` : `<span>${i.txt}</span>`}</div><b>${i.name}</b><small>${i.tag}</small></button>`).join('')}</div></div>`;
      case 'claims':
        return `<div class="card${bg}"><span class="eyebrow">Koppints a mondatra</span>${D.claims.slice(c.from, c.to).map(x => `<button class="claim"><span class="bad">„${x.bad.replace(/^„|”$/g, '')}”</span><span class="tap">Mit mondunk helyette? →</span><span class="good">${x.good}</span></button>`).join('')}</div>`;
      case 'counter':
        return `<div class="card${bg}"><h2>${c.title}</h2><div class="rows">${D.counter.slice(c.from || 0, c.to || D.counter.length).map(x => `<button class="row" data-go="${base}/d:${x.id}"><span><b>${x.title}</b></span></button>`).join('')}</div></div>`;
      default: return `<div class="card">${txt}</div>`;
    }
  }

  const ANIMS = {
    eye: `<svg class="eye-anim" viewBox="0 0 200 80" width="190" aria-hidden="true"><path d="M10 40 Q60 0 110 40 Q60 80 10 40Z" fill="#ffe1ef" stroke="#2340f5" stroke-width="3"/><g class="iris"><circle cx="60" cy="40" r="17" fill="#2340f5"/><circle cx="60" cy="40" r="7" fill="#121a7a"/></g><g class="dot"><rect x="105" y="30" width="16" height="22" rx="3" fill="#ff6fb5"/></g></svg>`,
    moon: `<svg class="moon-anim" viewBox="0 0 200 90" width="190" aria-hidden="true"><path d="M70 20 a30 30 0 1 0 30 45 a24 24 0 1 1 -30 -45Z" fill="#ffb3d7"/><rect class="scr" x="120" y="40" width="36" height="46" rx="5" fill="#fff"/><rect class="scr" x="125" y="45" width="26" height="34" rx="2" fill="#bcd0ff"/><text class="pulse" x="40" y="30" fill="#ffd36e" font-size="18" font-weight="800">z</text></svg>`,
    phone: `<svg viewBox="0 0 200 90" width="190" aria-hidden="true"><rect x="78" y="6" width="44" height="78" rx="9" fill="#2340f5"/><rect x="84" y="14" width="32" height="58" rx="3" fill="#ffe1ef"/><circle cx="100" cy="78" r="3" fill="#ffb3d7"/><g class="pulse"><circle cx="138" cy="20" r="9" fill="#ff6fb5"/><text x="134.5" y="25" fill="#fff" font-size="12" font-weight="800">!</text></g></svg>`,
  };
  const CURVE = `<svg viewBox="0 0 520 300" aria-label="Fogalmi ábra: mérsékelt, tanulási célú használat a legjobb; szabadidős használat 1 óra felett romló">
    <line x1="50" y1="250" x2="500" y2="250" stroke="#ffb3d7" stroke-width="2"/><line x1="50" y1="30" x2="50" y2="250" stroke="#ffb3d7" stroke-width="2"/>
    <text x="275" y="285" fill="#fff" font-size="18" text-anchor="middle">napi használat →</text>
    <path class="draw" d="M50 170 C 110 110, 150 90, 190 92 S 300 140, 360 190 S 450 230, 500 236" fill="none" stroke="#ffb3d7" stroke-width="7" stroke-linecap="round"/>
    <path class="draw" d="M50 150 C 100 146, 140 150, 180 170 S 300 220, 500 246" fill="none" stroke="#ffd36e" stroke-width="6" stroke-linecap="round"/>
    <circle cx="190" cy="92" r="9" fill="#ffb3d7"/><text x="205" y="80" fill="#ffb3d7" font-size="19" font-weight="700">célzott tanulás</text>
    <text x="196" y="210" fill="#ffd36e" font-size="18">szabadidős</text>
    <line x1="186" y1="40" x2="186" y2="250" stroke="#fff" stroke-dasharray="4 6" opacity=".45"/><text x="140" y="44" fill="#fff" font-size="16" opacity=".85">~1 óra</text></svg>`;

  function mirrorHTML() {
    if (hud.off) return `<span class="eyebrow">A jutalomréteg</span><h2>Ki van kapcsolva.</h2>
      <p>Ebben az appban egy kis pont-, jelvény- és ládarendszer fut, hogy saját bőrödön érezd a gamifikációt. Most nem fut.</p>
      <div class="switch-row"><span>Jutalomréteg</span><button class="switch" role="switch" aria-checked="false" data-hud-switch></button></div>`;
    return `<span class="eyebrow">Nézd meg a jobb felső sarkot</span><h2>Észrevetted, mit csináltunk veled?</h2>
      <p>Az elmúlt <b><span data-m="mins">${hud.minutes()}</span> percben</b> ez az app pontokat, jelvényeket és ládát adott neked. <b>Semmit nem tanultál tőlük.</b> Mégis odanéztél.</p>
      <div class="mirror-grid"><div><b data-m="xp">${hud.st.xp}</b><span>XP</span></div><div><b data-m="badges">${hud.st.badges.length}</b><span>jelvény</span></div>
        <div><b data-m="toasts">${hud.st.toasts}</b><span>értesítés</span></div><div><b data-m="chests">${hud.st.chests}</b><span>láda</span></div></div>
      <p>Egy 10 éves ugyanezt <b>hétről hétre, éveken át</b>, az iskola jóváhagyásával kapná.</p>
      <div class="switch-row"><span>Jutalomréteg bekapcsolva</span><button class="switch" role="switch" aria-checked="true" data-hud-switch></button></div>`;
  }
  function wireMirror(root) {
    const upd = () => $$('[data-mirror]', root).forEach(m => {
      const set = (k, v) => { const e = $(`[data-m="${k}"]`, m); if (e) e.textContent = v; };
      set('xp', hud.st.xp); set('badges', hud.st.badges.length); set('toasts', hud.st.toasts); set('chests', hud.st.chests); set('mins', hud.minutes());
    });
    const onClick = e => {
      const sw = e.target.closest('[data-hud-switch]'); if (!sw) return;
      const turnOn = sw.getAttribute('aria-checked') !== 'true';
      hud.setOff(!turnOn);
      $$('[data-mirror]', root).forEach(m => { m.innerHTML = mirrorHTML() + (turnOn ? '' : '<p class="hand-note">Kikapcsolva. Hiányzik egy kicsit? Na, pont erről beszélünk.</p>'); });
    };
    root.addEventListener('click', onClick);
    const t = setInterval(upd, 1000);
    return () => clearInterval(t);
  }

  /* ---------- hurok-animáció ---------- */
  function buildLoop(svg, labels, opts) {
    const NS = 'http://www.w3.org/2000/svg', cx = 210, cy = 170, R = 118;
    svg.setAttribute('viewBox', '0 0 420 340');
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); svg.appendChild(e); return e; };
    mk('circle', { cx, cy, r: R, fill: 'none', stroke: opts.color, 'stroke-width': 3, 'stroke-dasharray': '4 9', 'stroke-linecap': 'round', opacity: .6 });
    const nodes = labels.map((l, i) => {
      const a = -Math.PI / 2 + (i / labels.length) * Math.PI * 2, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      const g = document.createElementNS(NS, 'g');
      const anchor = Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle';
      g.innerHTML = `<circle cx="${x}" cy="${y}" r="29" fill="${opts.nodeFill}" stroke="${opts.color}" stroke-width="3"/>` +
        (l.img ? `<image href="${IMG}${l.img}.webp" x="${x - 19}" y="${y - 19}" width="38" height="38"/>` : `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="22">${l.ico}</text>`) +
        `<text x="${x + (anchor === 'start' ? 36 : anchor === 'end' ? -36 : 0)}" y="${y + (Math.sin(a) > 0.5 ? 50 : Math.sin(a) < -0.5 ? -38 : 5)}" text-anchor="${anchor}" fill="${opts.text}">${l.t}</text>`;
      g.style.transformOrigin = `${x}px ${y}px`; g.style.transition = 'transform .25s';
      svg.appendChild(g); return g;
    });
    const c = mk('text', { x: cx, y: cy + 9, 'text-anchor': 'middle', fill: opts.text, 'font-size': 28, 'font-family': 'Bricolage Grotesque, sans-serif', 'font-weight': 800 });
    c.textContent = opts.center;
    const dot = mk('circle', { r: 12, fill: opts.dot, stroke: '#fff', 'stroke-width': 3, cx, cy: cy - R });
    let ang = -Math.PI / 2, last = 0, lastNode = -1, laps = 0, running = false, raf = 0;
    const step = t => {
      const dt = Math.min(50, t - last); last = t;
      ang += opts.speed(laps) * dt / 1000;
      const rel = ((ang + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const idx = Math.floor(rel / (Math.PI * 2 / labels.length) + 0.02) % labels.length;
      if (idx !== lastNode) {
        if (idx === 0 && lastNode !== -1) laps++;
        lastNode = idx;
        const n = nodes[idx]; n.style.transform = 'scale(1.18)'; setTimeout(() => (n.style.transform = ''), 260);
        opts.onNode && opts.onNode(idx);
      }
      dot.setAttribute('cx', cx + R * Math.cos(ang)); dot.setAttribute('cy', cy + R * Math.sin(ang));
      if (running) raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && !running && !reduce) { running = true; last = performance.now(); raf = requestAnimationFrame(step); }
      else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
    }), { threshold: .3 });
    io.observe(svg);
    return () => { running = false; cancelAnimationFrame(raf); io.disconnect(); };
  }
  function wireLoops(root) {
    const cleanups = [];
    $$('[data-loop]', root).forEach(svg => {
      const card = svg.closest('.card'), cnt = $('[data-count-loop]', card), bar = $('.meter .bar i', card);
      let k = 0;
      if (svg.dataset.loop === 'ext') {
        cleanups.push(buildLoop(svg, [{ img: 'st-pencil', t: 'Feladat' }, { img: 'st-star', t: 'Csillag' }, { img: 'st-chest', t: 'Láda?' }, { img: 'st-avatar', t: 'Avatar' }, { img: 'st-trophy', t: '„Még!”' }],
          { color: '#ffb3d7', text: '#fff', nodeFill: '#fff4f9', dot: '#ffd36e', center: 'gyorsul', speed: l => Math.min(5.2, 1.3 + l * 0.45), onNode: i => { if (i === 1 || i === 3) { k++; cnt.textContent = k; bar.style.width = Math.min(100, k * 3) + '%'; } } }));
      } else {
        cleanups.push(buildLoop(svg, [{ ico: '❓', t: 'Kérdés' }, { img: 'st-pencil', t: 'Próba' }, { ico: '🌀', t: 'Elakadás' }, { img: 'st-brain', t: 'Aha!' }, { img: 'st-book', t: 'Új kérdés' }],
          { color: '#2340f5', text: '#1b2bc9', nodeFill: '#ffe1ef', dot: '#ff6fb5', center: 'mélyül', speed: () => 0.9, onNode: i => { if (i === 3) { k++; cnt.textContent = k; bar.style.width = Math.min(100, k * 12) + '%'; } } }));
      }
    });
    return () => cleanups.forEach(f => f());
  }

  /* ---------- lapozható kártyasor ---------- */
  function deckScreen(id, cards, { title, crumb, doneTo, base }) {
    const n = cards.length;
    return {
      title, crumb, fixed: true,
      html: `<div class="deck-top">${'<i></i>'.repeat(n)}</div>
        <div class="deck" tabindex="0" aria-roledescription="kártyasor">${cards.map((c, i) => `<div class="slot" aria-label="${i + 1}. kártya / ${n}">${cardHTML(c, base)}</div>`).join('')}</div>
        <div class="deck-ctrl"><button class="round prev" aria-label="Előző">${ICON.prev}</button><span class="pos">1 / ${n}</span><button class="btn btn-pink next">Tovább →</button></div>`,
      mount(el) {
        const deck = $('.deck', el), bars = $$('.deck-top i', el), pos = $('.pos', el), prev = $('.prev', el), next = $('.next', el);
        let idx = Math.min(store.get('deckpos:' + id, 0), n - 1);
        if (store.get('done', []).includes(id) && idx === n - 1) idx = 0;
        const w = () => deck.clientWidth;
        const upd = () => {
          bars.forEach((b, i) => { b.classList.toggle('done', i < idx); b.classList.toggle('cur', i === idx); });
          pos.textContent = `${idx + 1} / ${n}`;
          prev.disabled = idx === 0;
          next.innerHTML = idx === n - 1 ? 'Kész ✓' : 'Tovább →';
          store.set('deckpos:' + id, idx);
          if (idx === n - 1) {
            const done = store.get('done', []);
            if (!done.includes(id)) { done.push(id); store.set('done', done); hud.visit('done:' + id, 40, 'Témát fejeztél be!'); }
          }
        };
        deck.scrollLeft = idx * w(); upd();
        deck.addEventListener('scroll', () => { const i = Math.round(deck.scrollLeft / w()); if (i !== idx && i >= 0 && i < n) { idx = i; upd(); } }, { passive: true });
        const to = i => deck.scrollTo({ left: i * w(), behavior: reduce ? 'auto' : 'smooth' });
        prev.addEventListener('click', () => to(Math.max(0, idx - 1)));
        next.addEventListener('click', () => { if (idx < n - 1) to(idx + 1); else { const p = doneTo; stack.length > 1 && stack[stack.length - 2] === p ? history.back() : go(p); } });
        const key = e => { if (sheet.classList.contains('open')) return; if (e.key === 'ArrowRight') to(Math.min(n - 1, idx + 1)); if (e.key === 'ArrowLeft') to(Math.max(0, idx - 1)); };
        addEventListener('keydown', key);
        // kártya megjelenése → animációk
        const io = new IntersectionObserver(es => es.forEach(e => {
          if (!e.isIntersecting) return;
          const card = e.target; card.classList.add('in');
          $$('[data-w]', card).forEach(f => (f.style.width = f.dataset.w + '%'));
        }), { root: deck, threshold: .55 });
        $$('.card', el).forEach(c => io.observe(c));
        // koppintásra forduló állítások
        el.addEventListener('click', e => { const c = e.target.closest('.claim'); if (c && !e.target.closest('.cite')) c.classList.toggle('open'); });
        hud.visit('topic:' + id, 25, 'Új témát nyitottál meg!');
        const cl = [wireLoops(el), wireMirror(el)];
        return () => { removeEventListener('keydown', key); io.disconnect(); cl.forEach(f => f && f()); };
      },
    };
  }

  function detailScreen(id, segs) {
    const counter = D.counter.find(x => x.id === id);
    const d = counter ? { title: counter.title, eyebrow: 'Ellenérv', html: counter.html } : D.details[id];
    if (!d) return { title: 'Nem található', html: '<p>Ez a részlet nem található.</p>' };
    const heroes = { se: 'city-stockholm', dk: 'city-copenhagen', no: 'city-oslo', us: 'city-losangeles', matific: 'tablet', eeg: 'handwriting', reading: 'reading', kiszoritas: 'manipulatives', kez: 'handwriting', analog: 'teacher' };
    const parentTopic = C.topics.find(t => t.id === segs[1]);
    return {
      title: d.eyebrow || 'Részletek', crumb: parentTopic ? parentTopic.title : 'Részletek',
      html: `<article class="detail">${heroes[id] ? `<div class="detail-hero"><img src="${IMG}${heroes[id]}.webp" alt=""></div>` : ''}<span class="eyebrow">${esc(d.eyebrow || '')}</span><h1>${esc(d.title)}</h1>${cites(d.html)}
        <div style="margin-top:22px"><button class="btn btn-ghost btn-block" data-back>← Vissza</button></div></article>`,
      mount(el) {
        hud.visit('d:' + id, 10);
        $('[data-back]', el).addEventListener('click', () => backBtn.click());
      },
    };
  }

  /* ==========================================================
     KÍSÉRLETEK
     ========================================================== */
  function labScreen() {
    return {
      root: true,
      html: `<h1 class="big-title">Kísérletek</h1><p class="lead">Próbáld ki magadon – mindegyik 1–2 perc. Nem tudományos mérések, hanem szemléltetések.</p>
        <div class="tiles">${C.labs.map(l => tile('lab/' + l.id, l.icon, l.title, l.sub, l.tone === 'cream' ? '' : l.tone)).join('')}</div>`,
    };
  }

  function labReward() {
    return {
      title: 'A jutalomréteg', crumb: 'Kísérlet',
      html: `<div class="card bg-ink" data-mirror style="flex:none;margin-top:4px">${mirrorHTML()}</div>
        <div class="section-h">Hogyan működik?</div>
        <div class="rows">
          <button class="row" data-go="lab/jutalom/d:varratio"><img src="${IMG}st-chest.webp" alt=""><span><b>A láda: kiszámíthatatlan jutalom</b><span>Ugyanaz az elv, mint a nyerőgépnél</span></span></button>
          <button class="row" data-go="lab/jutalom/d:overjust"><img src="${IMG}st-star.webp" alt=""><span><b>Túligazolási hatás</b><span>A jutalom átírja, miért csináljuk</span></span></button>
          <button class="row" data-go="lab/jutalom/d:habit"><img src="${IMG}st-trophy.webp" alt=""><span><b>Szokásformálás</b><span>Szintek, sorozatok, értesítések</span></span></button>
          <button class="row" data-go="learn/csapda"><img src="${IMG}st-book.webp" alt=""><span><b>A teljes téma</b><span>A jutalomcsapda kártyái</span></span></button>
        </div>
        <button class="btn btn-ghost btn-block" style="margin-top:18px" id="hud-reset">Pontok nullázása (újrakezdés)</button>`,
      mount(el) {
        hud.visit('lab:jutalom', 15);
        store.set('revealSeen', true);
        $('#hud-reset', el).addEventListener('click', () => { hud.reset(); $$('[data-mirror]', el).forEach(m => (m.innerHTML = mirrorHTML())); toast(null, 'Nullázva', 'A kísérlet újraindult'); });
        return wireMirror(el);
      },
    };
  }

  /* ---------- kézírás-labor ---------- */
  function labPad() {
    return {
      title: 'Kézírás-labor', crumb: 'Kísérlet', fixed: true,
      html: `<div class="lab">
        <div class="seg" role="tablist"><button class="on" data-step="0">1. Kézzel</button><button data-step="1">2. Billentyűn</button><button data-step="2">3. Mérleg</button></div>
        <div data-pane="0" style="display:flex;flex-direction:column;gap:12px;flex:1;min-height:0">
          <div class="pad-wrap"><canvas class="pad" id="pad" aria-label="Rajzfelület"></canvas><div class="pad-hint">írd ide a neved<br>az ujjaddal ✎</div></div>
          <div class="chips"><div class="chip"><b id="m-strokes">0</b><span>vonás</span></div><div class="chip"><b id="m-turns">0</b><span>irányváltás</span></div><div class="chip"><b id="m-dist">0</b><span>cm út</span></div></div>
          <div style="display:flex;gap:10px"><button class="btn btn-ghost btn-sm" id="pad-clear" style="flex:1">Törlés</button><button class="btn btn-blue btn-sm" data-next style="flex:2">Most gépeld be →</button></div>
        </div>
        <div data-pane="1" hidden style="flex-direction:column;gap:14px;flex:1">
          <p class="lead" style="margin:0">Koppints a betűkre, mintha begépelnéd ugyanazt.</p>
          <div class="typed" aria-live="polite"></div>
          <div class="keys">${['A', 'N', 'Y', 'A', '7', '3', '+', '='].map(k => `<button class="key">${k}</button>`).join('')}</div>
          <div class="chips"><div class="chip k"><b id="m-taps">0</b><span>koppintás</span></div><div class="chip k"><b>1</b><span>féle mozdulat</span></div><div class="chip k"><b>0</b><span>irányváltás</span></div></div>
          <div class="spacer" style="flex:1"></div>
          <button class="btn btn-blue btn-block" data-next>Lássuk a mérleget →</button>
        </div>
        <div data-pane="2" hidden style="flex-direction:column;gap:12px;flex:1;overflow-y:auto">
          <div class="compare" id="compare"></div>
          <p style="margin:0">Kézírásnál minden jelhez saját mozgásprogram kell, amit az agy összekapcsol a látott formával. Kisgyerekeknél a kézzel gyakorolt betűket jobban ismerték fel.${cites('<sup class="c" data-s="longcamp"></sup>')}</p>
          <p class="note" style="margin:0">Szemléltetés, nem mérés.</p>
          <button class="btn btn-ghost btn-block" data-go="learn/kez">A téma kártyái →</button>
        </div></div>`,
      mount(el) {
        hud.visit('lab:pad', 15, 'Kísérletet indítottál!');
        const pad = $('#pad', el), ctx = pad.getContext('2d');
        let drawing = false, lx = 0, ly = 0, lastAng = null, strokes = 0, dist = 0, turns = 0, taps = 0;
        const fit = () => { const r = pad.getBoundingClientRect(), d = devicePixelRatio || 1; if (!r.width) return; pad.width = r.width * d; pad.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#1b2bc9'; };
        requestAnimationFrame(fit);
        const upd = () => {
          $('#m-strokes', el).textContent = strokes; $('#m-turns', el).textContent = turns; $('#m-dist', el).textContent = fx(dist / 37.8);
          $('#m-taps', el).textContent = taps;
          $('#compare', el).innerHTML = `<p style="margin:0 0 8px">Kézzel: <b>${strokes} vonás, ${turns} irányváltás</b>, ${fx(dist / 37.8)} cm út – mind apró finommotoros döntés.</p><p style="margin:0">Billentyűn: <b>${taps} koppintás</b>, mind ugyanaz a mozdulat.</p>`;
        };
        const pos = e => { const r = pad.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        pad.addEventListener('pointerdown', e => { drawing = true; pad.setPointerCapture(e.pointerId); [lx, ly] = pos(e); lastAng = null; strokes++; $('.pad-hint', el).style.opacity = 0; upd(); });
        pad.addEventListener('pointermove', e => {
          if (!drawing) return;
          const [x, y] = pos(e), dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy); if (d < 3) return;
          ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
          const a = Math.atan2(dy, dx);
          if (lastAng !== null) { let da = Math.abs(a - lastAng); if (da > Math.PI) da = 2 * Math.PI - da; if (da > 0.6) turns++; }
          lastAng = a; dist += d; lx = x; ly = y; upd();
        });
        const end = () => { drawing = false; };
        pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
        $('#pad-clear', el).addEventListener('click', () => { ctx.clearRect(0, 0, pad.width, pad.height); strokes = dist = turns = 0; $('.pad-hint', el).style.opacity = 1; upd(); });
        const typed = $('.typed', el);
        $$('.key', el).forEach(k => k.addEventListener('click', () => { taps++; typed.textContent = (typed.textContent + k.textContent).slice(-14); k.classList.add('hit'); buzz(8); setTimeout(() => k.classList.remove('hit'), 110); upd(); }));
        let step = 0;
        const show = s => { step = s; $$('.seg button', el).forEach(b => b.classList.toggle('on', +b.dataset.step === s)); $$('[data-pane]', el).forEach(p => { const on = +p.dataset.pane === s; p.hidden = !on; p.style.display = on ? 'flex' : 'none'; }); if (s === 0) requestAnimationFrame(fit); if (s === 2) hud.visit('pad:done', 20, 'Kísérlet teljesítve!'); };
        $$('.seg button', el).forEach(b => b.addEventListener('click', () => show(+b.dataset.step)));
        $$('[data-next]', el).forEach(b => b.addEventListener('click', () => show(step + 1)));
        upd();
        addEventListener('resize', fit);
        return () => removeEventListener('resize', fit);
      },
    };
  }

  /* ---------- fókusz-teszt ---------- */
  function labFocus() {
    return {
      title: 'Fókusz-teszt', crumb: 'Kísérlet', fixed: true,
      html: `<div class="game" id="game"><div class="noise" aria-hidden="true"></div><div class="game-bar"><span id="g-label">Fókusz-teszt</span><span class="dots" id="g-dots"></span></div><div class="game-stage" id="g-stage" aria-live="polite"></div><div class="answers" id="g-ans"></div></div>`,
      mount(el) {
        hud.visit('lab:focus', 15, 'Kísérletet indítottál!');
        const game = $('#game', el), stage = $('#g-stage', el), ans = $('#g-ans', el), noise = $('.noise', el), label = $('#g-label', el), dots = $('#g-dots', el);
        const N = 6; let round = 0, i = 0, t0 = 0, res = [{}, {}], noiseT = null, combo = 0;
        const gen = () => {
          const t = Math.random(); let a, b, op, r;
          if (t < 0.4) { a = 12 + ~~(Math.random() * 60); b = 8 + ~~(Math.random() * 30); op = '+'; r = a + b; }
          else if (t < 0.7) { a = 40 + ~~(Math.random() * 50); b = 7 + ~~(Math.random() * 30); op = '−'; r = a - b; }
          else { a = 3 + ~~(Math.random() * 7); b = 4 + ~~(Math.random() * 6); op = '×'; r = a * b; }
          const o = new Set([r]); while (o.size < 4) { const d = [1, 2, 10, -1, -2, -10, 9, 11][~~(Math.random() * 8)]; if (r + d > 0) o.add(r + d); }
          return { q: `${a} ${op} ${b}`, r, opts: [...o].sort(() => Math.random() - .5) };
        };
        const intro = () => {
          app.classList.remove('immersive'); ans.innerHTML = ''; dots.innerHTML = ''; label.textContent = 'Fókusz-teszt';
          stage.innerHTML = `<div class="center-block"><img src="${IMG}st-star.webp" alt="" style="width:70px;margin:0 auto 10px"><h2>Két kör, ${N}–${N} feladat.</h2><p style="color:var(--muted)">Az első csendes, mint egy füzetlap. A második „gamifikált”: csillagok, kombók, rezgés. Mérjük az idődet és a hibáidat.</p><p class="note">Szemléltetés, nem tudományos mérés.</p><button class="btn btn-blue btn-block" id="g-start">Indulhat az 1. kör</button></div>`;
          $('#g-start', el).onclick = () => start(0);
        };
        const start = r => { round = r; i = 0; res[r] = { time: 0, err: 0 }; combo = 0; app.classList.add('immersive'); game.classList.toggle('noisy', r === 1); if (r === 1) startNoise(); next(); };
        const next = () => {
          if (i >= N) return finish();
          const p = gen(); t0 = performance.now();
          label.textContent = round === 0 ? '1. kör · csendes' : '2. kör · gamifikált 🔥';
          dots.innerHTML = Array.from({ length: N }, (_, k) => `<i class="${k < i ? 'd' : ''}"></i>`).join('');
          stage.innerHTML = `<div class="prob">${p.q} = ?</div>`;
          ans.innerHTML = p.opts.map(o => `<button>${o}</button>`).join('');
          $$('button', ans).forEach(b => b.onclick = () => {
            res[round].time += performance.now() - t0;
            if (+b.textContent !== p.r) { res[round].err++; combo = 0; if (round === 1) buzz(120); } else { combo++; if (round === 1) buzz(25); }
            if (round === 1 && combo > 1 && !reduce) { const c = document.createElement('div'); c.className = 'combo'; c.textContent = `KOMBÓ ×${combo}!`; c.style.left = 10 + Math.random() * 50 + '%'; c.style.top = 15 + Math.random() * 40 + '%'; game.appendChild(c); setTimeout(() => c.remove(), 1000); }
            i++; ans.innerHTML = ''; setTimeout(next, round === 1 ? 160 : 60);
          });
        };
        const startNoise = () => {
          if (reduce) return;
          const imgs = ['st-star', 'st-chest', 'st-trophy', 'st-avatar'];
          noiseT = setInterval(() => {
            const f = document.createElement('img'); f.className = 'fly'; f.src = IMG + imgs[~~(Math.random() * 4)] + '.webp'; f.alt = '';
            f.style.left = Math.random() * 80 + '%'; f.style.top = Math.random() * 75 + '%';
            f.style.setProperty('--dx', (Math.random() - .5) * 300 + 'px'); f.style.setProperty('--dy', (Math.random() - .5) * 300 + 'px');
            noise.appendChild(f); setTimeout(() => f.remove(), 2300);
          }, 260);
        };
        const finish = () => {
          clearInterval(noiseT); noise.innerHTML = ''; game.classList.remove('noisy'); ans.innerHTML = '';
          const avg = r => res[r].time / N / 1000;
          if (round === 0) {
            app.classList.remove('immersive');
            stage.innerHTML = `<div class="center-block"><h2>1. kör kész.</h2><p style="color:var(--muted)">Átlagosan ${fx(avg(0))} mp / feladat. Most jön a zajos kör – rezegni is fog.</p><button class="btn btn-pink btn-block" id="g-2">Indulhat a 2. kör 🔥</button></div>`;
            $('#g-2', el).onclick = () => start(1); return;
          }
          app.classList.remove('immersive');
          const a = avg(0), b = avg(1), diff = Math.round((b / a - 1) * 100);
          const msg = diff > 5 ? `A gamifikált körben <b>${diff}%-kal lassabb</b> voltál. A villogás és a rezgés a te figyelmedet is elvitte – pedig tudtad, hogy ez csak teszt.`
            : diff < -5 ? `A gamifikált körben <b>${-diff}%-kal gyorsabb</b> lettél. A kombó és a jutalom <b>tempóra</b> ösztönöz, nem gondolkodásra. Hibák: ${res[0].err} → ${res[1].err}.`
            : 'Nagyjából ugyanolyan gyors voltál. Egy felnőtt jól szűr – egy 8–10 éves önszabályozása még fejlődik.';
          stage.innerHTML = `<div class="center-block" style="width:100%"><h2>Az eredményed</h2><div class="result"><div><span>Csendes</span><b>${fx(a)} mp</b><span>${res[0].err} hiba</span></div><div><span>Gamifikált</span><b>${fx(b)} mp</b><span>${res[1].err} hiba</span></div></div><p style="text-align:left">${msg}</p><div style="display:flex;gap:10px"><button class="btn btn-ghost" id="g-re" style="flex:1">Újra</button><button class="btn btn-blue" data-go="learn/figyelem" style="flex:2">A kutatások →</button></div></div>`;
          $('#g-re', el).onclick = intro;
          hud.visit('focus:done', 30, 'Kísérlet teljesítve!');
        };
        intro();
        return () => { clearInterval(noiseT); app.classList.remove('immersive'); };
      },
    };
  }

  /* ---------- heti mérleg ---------- */
  function labCalc() {
    const sl = (id, label, min, max, step, val, hint = '') => `<div class="sl"><label for="${id}">${label} <output id="o-${id}"></output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">${hint ? `<div class="note">${hint}</div>` : ''}</div>`;
    return {
      title: 'Heti mérleg', crumb: 'Kísérlet',
      html: `<div class="calc-sum" style="position:sticky;top:0;z-index:3;margin-top:4px"><div class="tot"><span id="tot-week">0</span> óra<small>képernyő egy héten</small></div>
          <div class="week" id="week">${'<div><i class="f"></i><i class="h"></i><i class="s"></i></div>'.repeat(7)}</div></div>
        <div class="note" style="margin:8px 2px 12px;display:flex;gap:12px"><span>▮ <b style="color:var(--pink-hot)">iskola</b></span><span>▮ <b style="color:#c99a1c">házi</b></span><span>▮ <b style="color:#5d70e8">szabadidő</b></span><span style="margin-left:auto">H–V</span></div>
        ${sl('c-app', 'Matekapp az iskolában', 0, 225, 15, 30, 'A gyártó heti 15–30 percet említ.')}
        ${sl('c-dig', 'Egyéb digitális óra', 0, 600, 15, 60)}
        ${sl('c-hw', 'Digitális házi', 0, 60, 5, 10)}
        ${sl('c-wd', 'Szabadidő hétköznap', 0, 6, .5, 1.5)}
        ${sl('c-we', 'Szabadidő hétvégén', 0, 8, .5, 3)}
        <div class="section-h" style="margin-top:14px">Mit szorít ki? <span class="note" id="gone-n"></span></div>
        <div class="displace">
          <div class="dp"><img src="${IMG}st-pencil.webp" alt="">Kézírás</div><div class="dp"><img src="${IMG}st-brain.webp" alt="">Fejszámolás</div><div class="dp"><img src="${IMG}st-book.webp" alt="">Olvasás</div>
          <div class="dp"><span class="e">🧱</span>Tárgyak</div><div class="dp"><span class="e">🗣️</span>Tanár</div><div class="dp"><span class="e">🤝</span>Társak</div></div>
        <p class="note" style="margin:6px 2px 12px">Minden fél óra iskolai képernyő egy analóg tevékenység idejét veszi el (szemléltetés).</p>
        <div class="verdict" id="verdict"></div>`,
      mount(el) {
        hud.visit('lab:calc', 15, 'Kísérletet indítottál!');
        const ids = ['c-app', 'c-dig', 'c-hw', 'c-wd', 'c-we'];
        const saved = store.get('calc', null);
        if (saved) ids.forEach(id => { if (saved[id] != null) $('#' + id, el).value = saved[id]; });
        const upd = () => {
          const v = {};
          ids.forEach(id => { const i = $('#' + id, el); i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min)) * 100 + '%'); v[id] = +i.value; });
          store.set('calc', v);
          $('#o-c-app', el).textContent = v['c-app'] + ' p/hét'; $('#o-c-dig', el).textContent = v['c-dig'] + ' p/hét'; $('#o-c-hw', el).textContent = v['c-hw'] + ' p/nap';
          $('#o-c-wd', el).textContent = fx(v['c-wd']) + ' ó/nap'; $('#o-c-we', el).textContent = fx(v['c-we']) + ' ó/nap';
          const school = v['c-app'] + v['c-dig'], hw = v['c-hw'] * 5, free = v['c-wd'] * 300 + v['c-we'] * 120, week = school + hw + free;
          $('#tot-week', el).textContent = fx(week / 60);
          const max = Math.max(v['c-wd'] * 60 + school / 5 + v['c-hw'], v['c-we'] * 60, 240);
          $$('#week div', el).forEach((d, i) => {
            const wk = i < 5;
            d.querySelector('.s').style.height = (wk ? school / 5 : 0) / max * 100 + '%';
            d.querySelector('.h').style.height = (wk ? v['c-hw'] : 0) / max * 100 + '%';
            d.querySelector('.f').style.height = (wk ? v['c-wd'] : v['c-we']) * 60 / max * 100 + '%';
          });
          const daily = week / 7 / 60, year = (school + hw) * 36 / 60 + free * 52 / 60;
          let t = `Napi átlag <b>${fx(daily)} óra</b>; egy évben kb. <b>${Math.round(year).toLocaleString('hu-HU')} óra</b> (${Math.round(year / 24)} teljes nap). `;
          t += daily >= 3 ? 'Ez nagy expozíció: egy metaanalízisben minden további napi óra kb. 21%-kal magasabb rövidlátás-eséllyel társult (összefüggés).' + cites('<sup class="c" data-s="ha2025"></sup>')
            : daily >= 1.5 ? 'Az iskolai percek erre <b>adódnak rá</b>. Kérdezd meg: mennyi a teljes heti iskolai képernyőidő?'
            : 'Mérsékelt mennyiség – itt a fő kérdés a <b>kiszorítás</b>: mit nem csinál a gyerek közben?';
          $('#verdict', el).innerHTML = t;
          const gone = Math.min(6, Math.floor(school / 30));
          $$('.dp', el).forEach((d, i) => d.classList.toggle('gone', i < gone));
          $('#gone-n', el).textContent = gone ? `${gone} kiesett tevékenység` : '';
        };
        ids.forEach(id => $('#' + id, el).addEventListener('input', upd));
        upd();
      },
    };
  }

  /* ---------- kvíz ---------- */
  function labQuiz() {
    return {
      title: 'Kvíz', crumb: 'Kísérlet', fixed: true,
      html: `<div class="quiz" id="quiz"></div>`,
      mount(el) {
        hud.visit('lab:quiz', 15, 'Kísérletet indítottál!');
        const box = $('#quiz', el); let qi = 0, score = 0;
        const show = () => {
          if (qi >= QUIZ.length) return final();
          const q = QUIZ[qi];
          box.innerHTML = `<div class="qbar">${QUIZ.map((_, i) => `<i class="${i < qi ? 'd' : i === qi ? 'c' : ''}"></i>`).join('')}</div>
            <div class="qscroll"><div class="note">${qi + 1}. kérdés / ${QUIZ.length}</div><div class="qtext">${q.q}</div>
            <div class="qopts">${q.o.map((o, i) => `<button data-i="${i}"><span class="k">${'ABC'[i]}</span>${o}</button>`).join('')}</div><div id="qx"></div></div>
            <button class="btn btn-blue btn-block" id="qn" hidden>${qi < QUIZ.length - 1 ? 'Következő →' : 'Eredmény →'}</button>`;
          $$('.qopts button', box).forEach(b => b.onclick = () => {
            const i = +b.dataset.i, ok = i === q.a; if (ok) score++;
            buzz(ok ? 20 : [40, 40, 40]);
            $$('.qopts button', box).forEach(x => { x.disabled = true; if (+x.dataset.i === q.a) x.classList.add('right'); });
            if (!ok) b.classList.add('wrong');
            $('#qx', box).innerHTML = `<div class="qexpl"><b>${ok ? 'Így van!' : 'Nem egészen.'}</b> ${q.e}</div>`;
            $('#qn', box).hidden = false;
            $('#qx', box).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
            hud.award(ok ? 15 : 5);
          });
          const n = $('#qn', box); n.onclick = () => { qi++; show(); };
        };
        const final = () => {
          const msg = score >= 9 ? 'Kiváló! Pontosan tudod, hol húzódik a bizonyítékok határa.' : score >= 6 ? 'Jó eredmény! Néhány árnyalat meglepett – pont ezek teszik hitelessé az érvelést.' : 'Érdemes átlapozni a Tudás témáit – tele vannak féligazságokkal mindkét oldalon.';
          box.innerHTML = `<div class="qscroll" style="justify-content:center;text-align:center"><div class="note">Az eredményed</div><div class="score">${score}<span>/${QUIZ.length}</span></div><p>${msg}</p><p class="note">Észrevetted? Ehhez a kvízhez nem kellett jelvény, hogy végigcsináld. 😉</p></div>
            <button class="btn btn-pink btn-block" id="q-share">Küldd tovább egy szülőtársnak</button><button class="btn btn-ghost btn-block" id="q-re">Újra</button>`;
          $('#q-share', box).onclick = () => shareApp(`${score}/${QUIZ.length} pontot értem el a „Nagyobb, mint egy készülék” kvízében. Neked mennyi lesz?`);
          $('#q-re', box).onclick = () => { qi = 0; score = 0; show(); };
          const r = box.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 120, 50);
          hud.visit('quiz:done', 30, 'Kvíz teljesítve!');
        };
        show();
      },
    };
  }

  /* ==========================================================
     CSELEKVÉS
     ========================================================== */
  function actScreen() {
    return {
      root: true,
      html: `<h1 class="big-title">Cselekvés</h1><p class="lead">Ne tiltást kérj – kérdezz jól. Az iskola meg tudja mondani, <b>mit vált ki, mennyi ideig, milyen céllal és milyen bizonyíték alapján</b>.</p>
        <div class="tiles">${C.acts.map(a => tile('act/' + a.id, a.icon, a.title, a.sub, a.tone === 'cream' ? '' : a.tone, `<span class="who">${a.who}</span>`)).join('')}</div>`,
    };
  }

  const letterState = { step: 0, sel: null, f: { name: '', kid: '', cls: '', school: '' } };
  function buildLetter() {
    const f = letterState.f, qs = D.letterQs.filter((q, i) => letterState.sel.has(i)).map(q => q.value);
    return `Tisztelt Igazgató Asszony/Úr! Tisztelt Tanárnő/Tanár Úr!

${f.kid || '[gyermek neve]'} (${f.cls || '[osztály]'}) szülőjeként azzal a kéréssel fordulok Önökhöz, hogy a tervezett tabletes / gamifikált digitális matematikai alkalmazás bevezetése előtt segítsenek megérteni a döntés pedagógiai hátterét.

Nem a technológia ellen érvelek: elismerem, hogy jól megválasztott, rövid, célzott digitális feladatoknak lehet helyük. Ugyanakkor több európai ország – különösen Svédország és Dánia – oktatáspolitikája az utóbbi években az „analóg az alap, digitális a kivétel” elv felé mozdult el: digitális eszköz akkor kerüljön be, ha dokumentált pedagógiai többletértéket ad, és nem szorítja ki a kézírást, a könyvet, a tárgyi tevékenységet és a tanári, társas gondolkodást.

Ezért tisztelettel az alábbi kérdésekre kérnék választ:

${qs.map((q, i) => `${i + 1}. ${q}`).join('\n') || '(válasszon kérdéseket)'}

Javaslom, hogy a bevezetés – ha megtörténik – időben korlátozott, kiértékelt próbaidőszakként induljon, a nem tananyaghoz kötődő jutalmazási elemek (avatárok, ládák, ranglisták) kikapcsolásával, és legyen egyenértékű papíralapú alternatíva azoknak a családoknak, akik ezt kérik.

Köszönöm a munkájukat és a válaszukat. Szívesen részt veszek egy személyes egyeztetésen is.

Tisztelettel:
${f.name || '[név]'}
${f.school || '[iskola neve]'}`;
  }
  function actLetter() {
    if (!letterState.sel) letterState.sel = new Set(D.letterQs.map((q, i) => q.checked ? i : -1).filter(i => i >= 0));
    return {
      title: 'Levél az iskolának', crumb: 'Szülőknek', fixed: true,
      html: `<div class="wiz"><div class="wiz-steps"><div data-s="0"><i></i>Kérdések</div><div data-s="1"><i></i>Adatok</div><div data-s="2"><i></i>Levél</div></div><div class="wiz-body" id="wb"></div><div class="wiz-foot" id="wf"></div></div>`,
      mount(el) {
        hud.visit('act:letter', 10);
        const body = $('#wb', el), foot = $('#wf', el);
        const show = s => {
          letterState.step = s;
          $$('.wiz-steps div', el).forEach(d => { const k = +d.dataset.s; d.classList.toggle('on', k === s); d.classList.toggle('done', k < s); });
          body.scrollTop = 0;
          if (s === 0) {
            body.innerHTML = `<p class="lead">Válaszd ki, mit kérdeznél. A legfontosabbak be vannak jelölve.</p>` + D.letterQs.map((q, i) => `<label class="check"><input type="checkbox" data-i="${i}" ${letterState.sel.has(i) ? 'checked' : ''}><span><b>${q.title}</b><small>${q.sub}</small></span></label>`).join('');
            $$('input', body).forEach(c => c.addEventListener('change', () => { c.checked ? letterState.sel.add(+c.dataset.i) : letterState.sel.delete(+c.dataset.i); foot.querySelector('.btn-blue').textContent = `Tovább (${letterState.sel.size} kérdés) →`; }));
            foot.innerHTML = `<button class="btn btn-blue">Tovább (${letterState.sel.size} kérdés) →</button>`;
            foot.querySelector('.btn-blue').onclick = () => show(1);
          } else if (s === 1) {
            const f = letterState.f;
            body.innerHTML = `<p class="lead">Ezek csak a levélbe kerülnek – a telefonodon maradnak, sehová nem küldjük.</p>
              <label class="field"><span>A te neved</span><input id="l-name" autocomplete="name" value="${esc(f.name)}"></label>
              <label class="field"><span>Gyermeked neve</span><input id="l-kid" value="${esc(f.kid)}"></label>
              <label class="field"><span>Osztály</span><input id="l-cls" placeholder="pl. 5.b" value="${esc(f.cls)}"></label>
              <label class="field"><span>Iskola neve</span><input id="l-school" value="${esc(f.school)}"></label>`;
            ['name', 'kid', 'cls', 'school'].forEach(k => $('#l-' + k, body).addEventListener('input', e => (f[k] = e.target.value.trim())));
            foot.innerHTML = `<button class="btn btn-ghost" style="flex:0 0 auto">←</button><button class="btn btn-blue">Levél előnézete →</button>`;
            foot.querySelector('.btn-ghost').onclick = () => show(0); foot.querySelector('.btn-blue').onclick = () => show(2);
          } else {
            body.innerHTML = `<div class="letter" id="l-out"></div>`;
            $('#l-out', body).textContent = buildLetter();
            foot.innerHTML = `<button class="btn btn-ghost" style="flex:0 0 auto">←</button><button class="btn btn-ghost" id="l-copy" style="flex:0 0 auto">Másolás</button><button class="btn btn-blue" id="l-send">Küldés…</button>`;
            foot.querySelector('.btn-ghost').onclick = () => show(1);
            $('#l-copy', foot).onclick = async () => { try { await navigator.clipboard.writeText(buildLetter()); toast('st-pencil', 'Kimásolva', 'Illeszd be az e-mailbe vagy a KRÉTA-üzenetbe'); } catch {} };
            $('#l-send', foot).onclick = async () => {
              const text = buildLetter();
              if (navigator.share) { try { await navigator.share({ title: 'Kérdések a tabletes matematikaoktatásról', text }); return; } catch {} }
              location.href = 'mailto:?subject=' + encodeURIComponent('Kérdések a tabletes matematikaoktatás bevezetéséről') + '&body=' + encodeURIComponent(text);
            };
            hud.visit('letter:done', 20, 'Levelet készítettél!');
          }
        };
        show(letterState.step);
      },
    };
  }

  function actTeachers() {
    const cards = [
      { t: 'photo', img: 'teacher', bg: 'cream', eyebrow: 'Pedagógusoknak', title: 'A játék nem ellenség.', text: '<b>A képernyős, gyűjtögetős jutalomhurok az.</b> Lapozz: hat bevált, analóg módszer, amely játékos, mégis a megértést jutalmazza.' },
      ...D.ideas.map((x, i) => ({ t: 'stat', bg: i % 2 ? 'cream' : 'pink', big: x.em, title: x.title, text: x.text })),
      { t: 'text', bg: 'blue', eyebrow: 'Visszajelzés', title: 'Szó a munkáról, nem virtuális tárgy.', text: 'A konkrét tanári visszajelzés („Itt jól választottad a közös nevezőt”) a teljesítményről és a stratégiáról szól. Ez építi a kompetenciaélményt – a belső motiváció egyik alapját. Gyerekeknél a szóbeli dicséret nem csökkentette a belső motivációt.<sup class="c" data-s="deci"></sup>' },
    ];
    return deckScreen('teachers', cards, { title: 'Játékos, mégis analóg', crumb: 'Pedagógusoknak', doneTo: 'act', base: 'act/teachers' });
  }
  function actPolicy() {
    const cards = [
      { t: 'text', bg: 'blue', eyebrow: 'Döntéshozóknak', title: 'Analóg először – digitális kivételként.', text: 'Egy védhető szakpolitikai keret 7–14 éves korra, hét pontban. Ugyanez az elv, amely felé Svédország, Dánia, Norvégia és az UNESCO is elmozdult.' },
      ...D.policy.map((p, i) => ({ t: 'stat', bg: i % 2 ? 'pink' : 'cream', num: String(i + 1).padStart(2, '0'), title: p.title.replace(/:$/, ''), text: p.text.replace(/^[:\s]+/, '') })),
      { t: 'cta', bg: 'pink', icon: 'st-pencil', title: 'Vidd tovább.', text: 'Szülőként egy jól feltett kérdéssor többet ér egy tiltásnál.', label: 'Levél az iskolának', go: 'act/letter' },
    ];
    return deckScreen('policy', cards, { title: 'Analóg először', crumb: 'Döntéshozóknak', doneTo: 'act', base: 'act/policy' });
  }
  function actShare() {
    return {
      title: 'Add tovább', crumb: 'Mindenkinek',
      html: `<div class="card bg-blue" style="flex:none;margin-top:4px"><img class="ico" src="${IMG}st-star.webp" alt=""><h2>Egy szülőtárs, egy tanár, egy igazgató.</h2><p>A legtöbb szülő nem tudja, hogy Svédország és Dánia már visszafordult. Egy link többet ér egy vitánál.</p></div>
        <div class="tiles" style="margin-top:14px">
          <button class="tile t-pink" id="sh-parent"><span class="ti"><img src="${IMG}st-book.webp" alt=""></span><span><h3>Szülőtársnak</h3><p>Rövid, barátságos üzenet</p></span>${ICON.chev}</button>
          <button class="tile" id="sh-teacher"><span class="ti"><img src="${IMG}st-pencil.webp" alt=""></span><span><h3>Pedagógusnak</h3><p>Tiszteletteljes, szakmai hangon</p></span>${ICON.chev}</button>
          <button class="tile" id="sh-copy"><span class="ti"><img src="${IMG}st-eye.webp" alt=""></span><span><h3>Link másolása</h3><p>${esc(APP_URL.replace(/^https?:\/\//, ''))}</p></span>${ICON.chev}</button>
        </div>`,
      mount(el) {
        $('#sh-parent', el).onclick = () => shareApp('Szia! Ezt érdemes megnézni, mielőtt tabletes matekot vezetnek be az osztályban – rövid, forrásokkal, és van benne egy meglepő kísérlet is:');
        $('#sh-teacher', el).onclick = () => shareApp('Tisztelt Tanárnő/Tanár Úr! Egy forrásokkal alátámasztott összefoglalót küldök arról, hogyan gondolkodnak ma Svédországban, Dániában és Norvégiában az alsó tagozatos digitális eszközhasználatról. Kíváncsi lennék a véleményére:');
        $('#sh-copy', el).onclick = async () => { try { await navigator.clipboard.writeText(APP_URL); toast('st-pencil', 'Link kimásolva'); } catch {} };
      },
    };
  }

  /* ==========================================================
     TÖBB
     ========================================================== */
  function moreScreen() {
    return {
      root: true,
      html: `<h1 class="big-title">Több</h1>
        <div class="menu">
          <button class="menu-item" data-go="more/sources"><span class="mi">📚</span><span><b>Források</b><small>${D.sources.length} hivatkozás, témák szerint</small></span><span class="end">→</span></button>
          <button class="menu-item" data-go="learn/vita"><span class="mi">⚖️</span><span><b>Amit nem állítunk</b><small>Tisztességes vita, ellenérvek</small></span><span class="end">→</span></button>
          <button class="menu-item" data-go="more/install"><span class="mi">📲</span><span><b>Telepítés</b><small>${isStandalone() ? 'Már telepítve ✓' : 'Tedd a kezdőképernyőre'}</small></span><span class="end">→</span></button>
        </div>
        <div class="menu">
          <div class="menu-item"><span class="mi">⭐</span><span><b>Jutalomréteg</b><small>Pontok, jelvények, láda – szándékos kísérlet</small></span><button class="switch" role="switch" aria-checked="${!hud.off}" id="hud-sw" aria-label="Jutalomréteg"></button></div>
          <button class="menu-item" data-go="lab/jutalom"><span class="mi">🪞</span><span><b>Mit csinált velem az app?</b><small>A leleplezés</small></span><span class="end">→</span></button>
          <button class="menu-item" id="reset-all"><span class="mi">↺</span><span><b>Haladás törlése</b><small>Témák, pontok, beállítások</small></span></button>
        </div>
        <div class="menu">
          <a class="menu-item" href="${SITE_URL}?full=1"><span class="mi">🖥️</span><span><b>Teljes weboldal</b><small>Asztali nézet, egy oldalon</small></span><span class="end">↗</span></a>
          <button class="menu-item" data-share><span class="mi">💌</span><span><b>Megosztás</b><small>Küldd el valakinek</small></span><span class="end">→</span></button>
          <button class="menu-item" data-go="more/about"><span class="mi">ℹ️</span><span><b>Rólunk és adatkezelés</b><small>Független szülői kezdeményezés</small></span><span class="end">→</span></button>
        </div>
        <p class="note" style="text-align:center">Utolsó frissítés: 2026. október · Offline is működik</p>`,
      mount(el) {
        $('#hud-sw', el).addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', on); hud.setOff(!on); toast(null, on ? 'Jutalomréteg bekapcsolva' : 'Jutalomréteg kikapcsolva'); });
        $('#reset-all', el).addEventListener('click', () => {
          openSheet(`<h3>Biztosan törlöd?</h3><p>Az elolvasott témák, a pontok és a kísérletek beállításai törlődnek erről a készülékről.</p><button class="btn btn-pink btn-block" id="do-reset">Igen, törlöm</button><button class="btn btn-ghost btn-block" style="margin-top:10px" data-close>Mégse</button>`);
          $('#do-reset').onclick = () => {
            try { Object.keys(localStorage).filter(k => k.startsWith('nmek:')).forEach(k => localStorage.removeItem(k)); } catch {}
            hud.off = false; hud.reset(); closeSheet(); toast(null, 'Törölve', 'Tiszta lappal indulsz');
          };
        });
      },
    };
  }
  function moreSources() {
    return {
      title: 'Források', crumb: 'Több',
      html: `<div class="filters">${C.sourceFilters.map(([k, l], i) => `<button data-f="${k}" class="${i ? '' : 'on'}">${l}</button>`).join('')}</div>
        <div id="src-list">${D.sources.map(s => `<div class="src" data-t="${s.topics.join(' ')}"><span class="n">${s.n}</span><div><b>${esc(s.head)}</b> ${esc(s.text)} ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.linkText || 'link')} ↗</a>` : ''}</div></div>`).join('')}</div>`,
      mount(el) {
        $$('.filters button', el).forEach(b => b.addEventListener('click', () => {
          $$('.filters button', el).forEach(x => x.classList.toggle('on', x === b));
          $$('.src', el).forEach(s => (s.hidden = b.dataset.f !== 'all' && !s.dataset.t.split(' ').includes(b.dataset.f)));
          el.scrollTo({ top: 0 });
        }));
      },
    };
  }
  function moreInstall() {
    const body = isStandalone()
      ? `<div class="card bg-pink" style="flex:none"><h2>Már telepítve ✓</h2><p>Az app a kezdőképernyőn van, és offline is működik.</p></div>`
      : isIOS
        ? `<div class="card" style="flex:none"><h2>iPhone / iPad</h2><ol style="padding-left:20px;margin:0">
            <li>Nyisd meg ezt az oldalt <b>Safariban</b>.</li><li>Koppints a <b>Megosztás</b> ikonra <span style="display:inline-block;border:2px solid var(--blue);border-radius:6px;padding:0 6px">⬆︎</span> alul.</li>
            <li>Válaszd: <b>Főképernyőhöz adás</b>.</li><li>Koppints a <b>Hozzáadás</b> gombra.</li></ol></div>`
        : deferredInstall
          ? `<div class="card bg-blue" style="flex:none"><img class="ico" src="icons/icon-192.png" alt="" style="border-radius:18px"><h2>Egy koppintás.</h2><p>Kezdőképernyőre kerül, saját ablakban nyílik, offline is működik.</p><button class="btn btn-pink btn-block" id="do-install">Telepítés</button></div>`
          : `<div class="card" style="flex:none"><h2>Android / Chrome</h2><ol style="padding-left:20px;margin:0"><li>Koppints a böngésző <b>⋮ menüjére</b>.</li><li>Válaszd: <b>Alkalmazás telepítése</b> vagy <b>Hozzáadás a kezdőképernyőhöz</b>.</li></ol></div>`;
    return {
      title: 'Telepítés', crumb: 'Több',
      html: `<div style="height:4px"></div>${body}<div class="section-h">Miért jó?</div>
        <div class="rows"><div class="row" style="pointer-events:none"><span><b>Offline is működik</b><span>Szülői értekezleten wifi nélkül is megmutathatod.</span></span></div>
        <div class="row" style="pointer-events:none"><span><b>Nincs regisztráció, nincs követés</b><span>Minden adat csak a te készülékeden marad.</span></span></div></div>`,
      mount(el) {
        const b = $('#do-install', el);
        if (b) b.onclick = async () => { deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch {} deferredInstall = null; };
      },
    };
  }
  function moreAbout() {
    return {
      title: 'Rólunk', crumb: 'Több',
      html: `<article class="detail"><span class="eyebrow">Rólunk és adatkezelés</span><h1>Független szülői kezdeményezés.</h1>
        <p>Célunk a tájékoztatás: szülők, pedagógusok és oktatáspolitikai döntéshozók számára, forrásokkal alátámasztva. Az app nem orvosi tanács, és nem egy konkrét iskola vagy cég elleni kampány; a termékekre vonatkozó leírások a gyártók saját nyilvános dokumentációján alapulnak.</p>
        <div class="k-box blue"><b>Adatkezelés:</b> nincs regisztráció, nincs analitika, nincs süti. A haladásod, a pontjaid és a levélben megadott adatok csak a saját készülékeden maradnak, és a „Haladás törlése” menüponttal bármikor törölheted.</div>
        <p>Az app képei mesterséges intelligenciával készültek, illusztrációs céllal. Utolsó frissítés: 2026. október.</p>
        <button class="btn btn-ghost btn-block" data-go="more/sources">Források</button></article>`,
    };
  }

  /* ==========================================================
     Indulás + service worker
     ========================================================== */
  hud.render();
  route();
  const devHost = /^(localhost|127.0.0.1)$/.test(location.hostname) && !/[?&]sw=1/.test(location.search);
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !devHost) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(() => {});
    let shown = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || shown) return; shown = true;
      openSheet(`<h3>Frissítés érhető el</h3><p>Az app új verziója letöltődött.</p><button class="btn btn-blue btn-block" id="do-reload">Frissítés most</button><button class="btn btn-ghost btn-block" style="margin-top:10px" data-close>Később</button>`);
      $('#do-reload').onclick = () => location.reload();
    });
  }
})();
