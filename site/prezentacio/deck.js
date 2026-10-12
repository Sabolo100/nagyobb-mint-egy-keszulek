/* A papír jobb, mint a tablet — prezentáció: lapozás, fejezetek, áttekintő nézet, teljes képernyő, indítókapu, felugró ablakok, hivatkozások.
   A diák 1280×720-as vásznon készülnek; a vászon transform: scale()-lel igazodik a nézetablakhoz, így a tördelés minden képernyőn
   és kivetítőn azonos. A diák animációit a demos.js indítja: a deck.js `deck:on` / `deck:off` eseményt küld a dia elemén,
   amikor az aktívvá válik / megszűnik aktívnak lenni. */
(function () {
  'use strict';

  var W = 1280, H = 720;
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;
  var deck = $('deck'), stage = $('stage');
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  var bar = $('deckBar'), titleEl = $('deckTitle'), curNum = $('curNum'), totNum = $('totNum');
  var prevBtn = $('prevBtn'), nextBtn = $('nextBtn'), edgePrev = $('edgePrev'), edgeNext = $('edgeNext');
  var overview = $('overview'), ovGrid = $('ovGrid'), gate = $('gate');
  var current = -1;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  totNum.textContent = slides.length;

  function emit(el, name) { try { el.dispatchEvent(new CustomEvent(name)); } catch (e) { /* noop */ } }

  /* ------------------------------------------------------------ skálázás */
  function fit() {
    var full = body.classList.contains('is-fs');
    var availW = deck.clientWidth - (full ? 0 : 40);
    var availH = deck.clientHeight - (full ? 0 : 32);
    var s = Math.min(availW / W, availH / H);
    if (!isFinite(s) || s <= 0) s = 1;
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    stage.style.setProperty('--scale', s);
  }

  /* ------------------------------------------------------------ fejezetek a felső sávban */
  var chapters = [];
  slides.forEach(function (sl, i) {
    var c = sl.getAttribute('data-chap');
    var name = sl.getAttribute('data-chapname');
    if (c && c !== '0' && name) chapters.push({ key: c, name: name, first: i });
  });
  var chapEl = $('deckChap');
  if (chapEl) {
    chapters.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = c.name; b.setAttribute('data-chap', c.key);
      b.addEventListener('click', function () { show(c.first); });
      chapEl.appendChild(b);
    });
  }

  /* ------------------------------------------------------------ lapozás */
  function show(i, push) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    var moved = i !== current;
    var before = current;
    slides.forEach(function (sl, n) {
      sl.classList.toggle('is-active', n === i);
      sl.classList.toggle('is-prev', moved && n < i);
      sl.classList.toggle('is-next', moved && n > i);
    });
    current = i;
    if (moved) {
      if (before >= 0) emit(slides[before], 'deck:off');
      emit(slides[i], 'deck:on');
    }
    curNum.textContent = i + 1;
    bar.style.width = ((i + 1) / slides.length * 100) + '%';
    titleEl.textContent = (i + 1) + ' · ' + (slides[i].getAttribute('data-title') || '');
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === slides.length - 1;
    edgePrev.style.display = i === 0 ? 'none' : '';
    edgeNext.style.display = i === slides.length - 1 ? 'none' : '';
    var ck = slides[i].getAttribute('data-chap');
    if (chapEl) Array.prototype.forEach.call(chapEl.children, function (b) { b.classList.toggle('is-on', b.getAttribute('data-chap') === ck); });
    if (ovGrid) Array.prototype.forEach.call(ovGrid.children, function (c, n) { c.classList.toggle('is-current', n === i); });
    if (push !== false) { try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) { /* noop */ } }
  }
  function next() { if (current < slides.length - 1) show(current + 1); }
  function prev() { if (current > 0) show(current - 1); }
  function goto(id) {
    for (var n = 0; n < slides.length; n++) if (slides[n].getAttribute('data-id') === id) { show(n); return; }
  }
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  edgePrev.addEventListener('click', prev);
  edgeNext.addEventListener('click', next);

  // a csempék és az útiterv a megfelelő diára visznek
  stage.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); if (dlg.open) dlg.close(); goto(g.getAttribute('data-goto')); }
  });

  /* ------------------------------------------------------------ indítókapu és teljes képernyő */
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function toggleFullscreen() {
    var el = document.documentElement;
    if (!isFull()) {
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { try { var p = req.call(el); if (p && p.catch) p.catch(function () { /* elutasítva */ }); } catch (e) { /* noop */ } }
    } else {
      var ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) { try { var q = ex.call(document); if (q && q.catch) q.catch(function () { /* noop */ }); } catch (e) { /* noop */ } }
    }
  }
  function onFullChange() {
    body.classList.toggle('is-fs', isFull());
    if (!isFull()) body.classList.remove('is-idle');
    fit();
    scaleThumbs();
  }
  document.addEventListener('fullscreenchange', onFullChange);
  document.addEventListener('webkitfullscreenchange', onFullChange);
  var fsBtn = $('fsBtn');
  if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

  var started = false;
  function start(full) {
    if (started) return;
    started = true;
    if (full) toggleFullscreen();
    gate.classList.add('is-gone');
    setTimeout(function () { gate.style.display = 'none'; }, 700);
    fit();
    current = -1;
    show(0, false);
  }
  $('gateFull').addEventListener('click', function () { start(true); });
  $('gateWin').addEventListener('click', function () { start(false); });

  /* ------------------------------------------------------------ billentyűk */
  var dlg = $('dlg');
  function dialogOpen() { return !!dlg.open; }
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    if (!started) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(true); }
      else if (e.key === 'Escape') { e.preventDefault(); start(false); }
      return;
    }
    if (dialogOpen()) return; // a dialógus maga kezeli (Esc)
    if (overview.classList.contains('is-open')) {
      if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') { e.preventDefault(); closeOverview(); }
      return;
    }
    var t = e.target;
    // űrlapelemekben (csúszka, szövegmező, jelölőnégyzet) a nyilak és a gépelés az elemé
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    var onControl = t && t.closest && t.closest('button, a, [role="button"]');
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
      case ' ': case 'Enter': if (onControl) return; e.preventDefault(); next(); break;
      case 'Backspace': e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); show(0); break;
      case 'End': e.preventDefault(); show(slides.length - 1); break;
      case 'o': case 'O': case 'Escape': e.preventDefault(); openOverview(); break;
      case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
      case 'b': case 'B': case '.': e.preventDefault(); stage.style.visibility = stage.style.visibility === 'hidden' ? '' : 'hidden'; break;
      default: break;
    }
  });

  /* ------------------------------------------------------------ érintés: lapozás ujjhúzással */
  var tx = 0, ty = 0, tracking = false;
  deck.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || (e.target.closest && e.target.closest('canvas, input, textarea, pre'))) { tracking = false; return; }
    tracking = true; tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  /* ------------------------------------------------------------ teljes képernyőn: a keret elbújik, ha nem mozog az egér */
  var idleTimer = 0;
  function wake() {
    body.classList.remove('is-idle');
    clearTimeout(idleTimer);
    if (isFull() && !overview.classList.contains('is-open')) idleTimer = setTimeout(function () { body.classList.add('is-idle'); }, 2600);
  }
  document.addEventListener('mousemove', wake);
  document.addEventListener('mousedown', wake);

  /* ------------------------------------------------------------ áttekintő nézet (a diák klónjai: az alapállapot = a végleges kép) */
  function uniqueSvgIds(root, suffix) {
    Array.prototype.forEach.call(root.querySelectorAll('svg'), function (svg) {
      var ids = {};
      Array.prototype.forEach.call(svg.querySelectorAll('[id]'), function (n) { ids[n.id] = n.id + suffix; n.id = ids[n.id]; });
      var fix = function (el) {
        Array.prototype.forEach.call(el.attributes, function (at) {
          var nv = at.value.replace(/url\(#([^)]+)\)/g, function (m, id) { return ids[id] ? 'url(#' + ids[id] + ')' : m; });
          if (nv !== at.value) el.setAttribute(at.name, nv);
        });
      };
      fix(svg);
      Array.prototype.forEach.call(svg.querySelectorAll('*'), fix);
    });
  }
  var ovBuilt = false;
  function buildOverview() {
    if (ovBuilt) return;
    slides.forEach(function (sl, i) {
      var cell = document.createElement('button');
      cell.type = 'button'; cell.className = 'ov-cell';
      cell.setAttribute('aria-label', (i + 1) + '. dia: ' + (sl.getAttribute('data-title') || ''));
      var frame = document.createElement('div');
      frame.className = 'ov-frame';
      var clone = sl.cloneNode(true);
      clone.classList.remove('is-active', 'is-prev', 'is-next');
      clone.removeAttribute('id');
      uniqueSvgIds(clone, '-o' + i);
      Array.prototype.forEach.call(clone.querySelectorAll('[id]'), function (n) { if (!(n.closest && n.closest('svg'))) n.removeAttribute('id'); });
      Array.prototype.forEach.call(clone.querySelectorAll('[data-open], [data-goto], [data-share], canvas'), function (n) {
        n.removeAttribute('data-open'); n.removeAttribute('data-goto'); n.removeAttribute('data-share');
      });
      frame.appendChild(clone);
      try { frame.inert = true; } catch (e) { /* noop */ }
      var cap = document.createElement('div');
      cap.className = 'ov-cap';
      cap.textContent = (i + 1) + ' · ' + (sl.getAttribute('data-title') || '');
      cell.appendChild(frame); cell.appendChild(cap);
      cell.addEventListener('click', function () { closeOverview(); show(i); });
      ovGrid.appendChild(cell);
    });
    ovBuilt = true;
    scaleThumbs();
  }
  function scaleThumbs() {
    if (!ovBuilt) return;
    Array.prototype.forEach.call(ovGrid.children, function (cell) {
      var frame = cell.querySelector('.ov-frame'), clone = frame.querySelector('.slide');
      if (frame.clientWidth) clone.style.transform = 'scale(' + (frame.clientWidth / W) + ')';
    });
  }
  function openOverview() {
    if (ovBuilt) { // a klónok az élő dia aktuális (pl. játék-, kvíz-) állapotát tükrözzék
      ovGrid.innerHTML = ''; ovBuilt = false;
    }
    buildOverview();
    overview.classList.add('is-open');
    body.classList.remove('is-idle');
    scaleThumbs();
    Array.prototype.forEach.call(ovGrid.children, function (c, n) { c.classList.toggle('is-current', n === current); });
    var cur = ovGrid.children[current];
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }
  function closeOverview() { overview.classList.remove('is-open'); wake(); }
  if ($('ovBtn')) $('ovBtn').addEventListener('click', openOverview);
  if ($('ovClose')) $('ovClose').addEventListener('click', closeOverview);

  /* ------------------------------------------------------------ hivatkozások: a forráslista sorszámai */
  var srcItems = Array.prototype.slice.call(document.querySelectorAll('#srcList li'));
  var srcById = {};
  srcItems.forEach(function (li, i) { li.setAttribute('data-n', i + 1); srcById[li.id.replace(/^s-/, '')] = li; });
  function fillCites(root) {
    Array.prototype.forEach.call(root.querySelectorAll('sup.c'), function (sup) {
      if (sup.querySelector('a')) return;
      sup.innerHTML = sup.getAttribute('data-s').split(',').map(function (id) {
        id = id.trim();
        var li = srcById[id];
        if (!li) return '';
        var tip = li.textContent.replace(/\s+/g, ' ').trim().slice(0, 180).replace(/"/g, '&quot;');
        return '<a class="cite" role="button" tabindex="0" data-cite="' + id + '" title="' + tip + '">' + li.getAttribute('data-n') + '</a>';
      }).join(' ');
    });
  }
  fillCites(document);

  /* ------------------------------------------------------------ felugró ablakok (a weboldal részletező ablakai) */
  var dlgBody = $('dlgBody'), dlgBack = $('dlgBack'), lastFocus = null, curDlg = null, backTo = null;
  function renderSources(filter, flashId) {
    var f = filter || 'all';
    var topics = [['all', 'Mind'], ['policy', 'Oktatáspolitika'], ['learning', 'Tanulás'], ['motivation', 'Motiváció & gamifikáció'], ['health', 'Egészség'], ['product', 'Termék']];
    var html = '<div class="eyebrow">Források</div><h3>Forrásmegjelölt állítások</h3>' +
      '<p class="note">Kormányzati dokumentumok, metaanalízisek, lektorált tanulmányok – és a gyártó saját leírásai.</p>' +
      '<div class="src-filter">' + topics.map(function (t) { return '<button type="button" data-f="' + t[0] + '" class="' + (t[0] === f ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<ol class="src-list">' + srcItems.map(function (li) {
        return '<li data-id="' + li.id.replace(/^s-/, '') + '" data-t="' + li.getAttribute('data-t') + '" data-n="' + li.getAttribute('data-n') + '">' + li.innerHTML + '</li>';
      }).join('') + '</ol>';
    dlgBody.innerHTML = html;
    var apply = function (ff) {
      Array.prototype.forEach.call(dlgBody.querySelectorAll('.src-filter button'), function (b) { b.classList.toggle('on', b.getAttribute('data-f') === ff); });
      Array.prototype.forEach.call(dlgBody.querySelectorAll('.src-list li'), function (li) {
        li.hidden = ff !== 'all' && li.getAttribute('data-t').split(' ').indexOf(ff) < 0;
      });
    };
    apply(f);
    Array.prototype.forEach.call(dlgBody.querySelectorAll('.src-filter button'), function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-f')); }); });
    Array.prototype.forEach.call(dlgBody.querySelectorAll('.src-list a'), function (a) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
    if (flashId) {
      var li = dlgBody.querySelector('.src-list li[data-id="' + flashId + '"]');
      if (li) setTimeout(function () { li.scrollIntoView({ block: 'center' }); li.classList.add('flash'); setTimeout(function () { li.classList.remove('flash'); }, 2200); }, 120);
    }
  }
  function openDialog(id, opts) {
    opts = opts || {};
    if (id === 'forrasok') renderSources(opts.filter, opts.flash);
    else {
      var tpl = $('m-' + id);
      if (!tpl) return;
      dlgBody.innerHTML = tpl.innerHTML;
      fillCites(dlgBody);
    }
    curDlg = id;
    dlg.classList.toggle('dlg--wide', id === 'forrasok');
    backTo = opts.from || null;
    dlgBack.hidden = !backTo;
    if (!dlg.open) {
      lastFocus = document.activeElement;
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    }
    var box = dlg.querySelector('.dlg__box');
    if (box && !opts.flash) box.scrollTop = 0;
  }
  function closeDialog() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', function () { if (dlg.open) return; dlgBody.innerHTML = ''; curDlg = null; if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* noop */ } } });
  $('dlgX').addEventListener('click', closeDialog);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(); });
  dlgBack.addEventListener('click', function () { if (backTo) openDialog(backTo); });
  document.addEventListener('click', function (e) {
    var cite = e.target.closest && e.target.closest('a.cite');
    if (cite) { e.preventDefault(); openDialog('forrasok', { flash: cite.getAttribute('data-cite'), from: dlg.open ? curDlg : null }); return; }
    var o = e.target.closest && e.target.closest('[data-open]');
    if (o && stage.contains(o) || (o && dlg.contains(o))) { e.preventDefault(); openDialog(o.getAttribute('data-open'), { filter: o.getAttribute('data-filter') || undefined }); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('cite')) { e.preventDefault(); e.target.click(); }
  });

  /* ------------------------------------------------------------ megosztás: a weboldal linkje */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-share]');
    if (!b) return;
    var url = new URL('index.html', location.href).href.replace(/index\.html$/, '');
    var data = { title: 'A papír jobb, mint a tablet', text: 'Miért legyen az általános iskolában a könyv, a papír és a tanár az alap – és miért ne szoktassa az iskola a gyereket csillagokra, ládákra és avatárokra?', url: url };
    if (navigator.share) { navigator.share(data).catch(function () { /* megszakítva */ }); }
    else if (navigator.clipboard && navigator.clipboard.writeText) {
      var label = b.innerHTML;
      navigator.clipboard.writeText(url).then(function () { b.innerHTML = 'Link kimásolva ✓'; setTimeout(function () { b.innerHTML = label; }, 2400); }, function () { /* a link úgyis látszik */ });
    }
  });

  /* ------------------------------------------------------------ indulás */
  window.addEventListener('resize', function () { fit(); scaleThumbs(); });
  window.addEventListener('orientationchange', fit);
  window.addEventListener('hashchange', function () {
    var n = parseInt((location.hash || '').replace('#', ''), 10);
    if (isFinite(n) && n > 0 && n - 1 !== current && started) show(n - 1, false);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit).catch(function () { /* noop */ });

  window.Deck = { slides: slides, show: show, goto: goto, openDialog: openDialog, reduce: reduce, isActive: function (el) { return el.classList.contains('is-active'); } };

  var startAt = parseInt((location.hash || '').replace('#', ''), 10);
  fit();
  if ((isFinite(startAt) && startAt > 0) || /[?&](start|nogate)\b/.test(location.search)) {
    gate.style.display = 'none';
    gate.classList.add('is-gone');
    started = true;
    // a demók (demos.js) betöltése után lépünk, hogy az első dia `deck:on` eseményét is megkapják
    window.addEventListener('DOMContentLoaded', function () { /* a szkriptek a body végén vannak, a DOM kész */ });
    setTimeout(function () { show(isFinite(startAt) && startAt > 0 ? startAt - 1 : 0, false); }, 0);
  } else {
    // a kapu mögött egy dia sem aktív: az animációk a kapu után indulnak
    slides.forEach(function (sl) { sl.classList.remove('is-active'); });
    titleEl.textContent = '';
  }
})();
