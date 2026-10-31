(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var reduced = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var vw = function () { return root.clientWidth; };
  // images inside the sliders carry data-src and load only when needed
  function loadImgs(box) {
    $$('source[data-srcset]', box).forEach(function (x) { x.srcset = x.dataset.srcset; x.removeAttribute('data-srcset'); });
    $$('img[data-src]', box).forEach(function (i) {
      if (i.dataset.srcset) i.srcset = i.dataset.srcset;
      i.src = i.dataset.src; i.removeAttribute('data-src'); i.removeAttribute('data-srcset');
    });
  }
  function whenNear(el, fn) {
    if (!('IntersectionObserver' in w)) return fn();
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { rootMargin: '800px 0px' });
    o.observe(el);
  }

  /* ---------- in-page links ---------- */
  // sections skip rendering until near the screen; render them all before jumping to a section so the link lands exactly
  if (location.hash) root.classList.add('cv-off');
  d.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="#"]')) root.classList.add('cv-off'); }, true);

  /* ---------- scroll reveal ---------- */
  var groups = new Map(), done = new Set(), io;
  function reveal(tg) {
    if (done.has(tg)) return;
    done.add(tg); if (io) io.unobserve(tg);
    if (tg === statsEl) startStats();
    if (tg === mapEl) mapEl.classList.add('on');
    (groups.get(tg) || []).forEach(function (el) { if (el._d) el.style.setProperty('--d', el._d); el.classList.add('in'); });
  }
  var statsEl = $('#stats'), mapEl = $('#map');
  if ('IntersectionObserver' in w) {
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) reveal(e.target); }); }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  }
  $$('[data-rv]').forEach(function (el) {
    var v = el.getAttribute('data-rv');
    var tg = (v === 'img' || v === 'mline' || v === 'line' || v === 'vline') ? el.parentElement : el;
    if (!reduced) {
      // stagger delay is stored now and applied when the element reveals, so start-up does no style writes
      var rd = el.getAttribute('data-rd');
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.hasAttribute('data-rv'); });
      el._d = ((rd != null ? +rd : Math.max(0, sibs.indexOf(el))) * 90) + 'ms';
    }
    if (!groups.has(tg)) groups.set(tg, []);
    groups.get(tg).push(el);
    if (io) io.observe(tg);
  });
  [statsEl, mapEl].forEach(function (el) { if (el) { if (!groups.has(el)) groups.set(el, []); if (io) io.observe(el); } });
  if (!io) groups.forEach(function (v, tg) { reveal(tg); });
  function sweep() {
    var vh = w.innerHeight * 0.96;
    // read every position first, then reveal, so the page is measured once per scroll frame
    var due = [];
    groups.forEach(function (v, tg) { if (!done.has(tg) && tg.getBoundingClientRect().top < vh) due.push(tg); });
    due.forEach(reveal);
  }

  /* ---------- stats count-up ---------- */
  var nums = $$('[data-count]');
  function setStats(t) {
    nums.forEach(function (n) { n.textContent = Math.round(+n.getAttribute('data-count') * t) + (n.getAttribute('data-suffix') || ''); n.parentNode.style.transform = 'scale(' + (0.94 + 0.06 * t).toFixed(3) + ')'; });
  }
  var statsStarted = false;
  function startStats() {
    if (statsStarted) return; statsStarted = true;
    statsEl.classList.add('on');
    if (reduced) { setStats(1); return; }
    var t0 = performance.now();
    (function step(n) { var t = Math.min(1, (n - t0) / 1300); setStats(1 - Math.pow(1 - t, 3)); if (t < 1) requestAnimationFrame(step); })(t0);
  }
  if (!reduced && w.matchMedia('(scripting: enabled)').matches) setStats(0);

  /* ---------- header, progress bar, parallax ---------- */
  // [data-par] images are taller than their frame and drift gently as the frame crosses the screen
  var hdr = $('#hdr'), bar = $('[data-scrollbar]'), pars = $$('[data-par]'), sr = 0;
  function onScroll() {
    if (sr) return;
    sr = requestAnimationFrame(function () {
      sr = 0;
      // all reads first, then all writes, to avoid forcing extra layouts
      var max = root.scrollHeight - root.clientHeight, y = w.scrollY, vh = w.innerHeight, moves = [];
      if (!reduced && vw() >= 700) pars.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var room = (img.clientHeight - r.height) / 2, off = ((r.top + r.height / 2) - vh / 2) * -0.12;
        moves.push([img, Math.max(-room, Math.min(room, off))]);
      });
      var at = spyRead();
      sweep();
      bar.style.width = (max > 0 ? y / max * 100 : 0) + '%';
      hdr.classList.toggle('scrolled', y > 40);
      moves.forEach(function (m) { m[0].style.transform = 'translate3d(0,' + m[1].toFixed(1) + 'px,0)'; });
      spyWrite(at);
    });
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  hdr.classList.toggle('scrolled', w.scrollY > 40);

  /* ---------- sticky in-page menu: highlights the section in view, indicator slides to it ---------- */
  var spy = $('.subnav'), spyLinks = spy ? $$('.sn-list a', spy) : [], spyCur = -1;
  var spySecs = spyLinks.map(function (a) { return d.getElementById(a.hash.slice(1)); });
  function spyRead() {
    if (!spy) return -1;
    var line = spy.getBoundingClientRect().bottom + 24, at = -1;
    spySecs.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) at = i; });
    return at;
  }
  function placeInd() {
    var ind = $('.sn-ind', spy), box = $('.sn-scroll', spy), a = spyLinks[spyCur];
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1; ind.style.transform = 'translateX(' + a.offsetLeft + 'px) scaleX(' + a.offsetWidth + ')';
    // on the mobile swipe bar, keep the active item in view
    if (a.offsetLeft < box.scrollLeft + 16 || a.offsetLeft + a.offsetWidth > box.scrollLeft + box.clientWidth - 16) box.scrollTo({ left: a.offsetLeft - 32, behavior: reduced ? 'auto' : 'smooth' });
  }
  function spyWrite(at) {
    if (!spy || at === spyCur) return;
    spyCur = at;
    spyLinks.forEach(function (a, i) { a.classList.toggle('on', i === at); if (i === at) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    placeInd();
  }
  if (spy) w.addEventListener('resize', placeInd);

  /* ---------- desktop dropdowns ---------- */
  // opens on mouse hover, on click/tap of the arrow button, and from the keyboard (Enter/Space/arrows, Esc closes)
  var dds = $$('.nav-i.has-dd');
  dds.forEach(function (it) {
    var btn = $('.dd-btn', it), links = $$('.dd a', it);
    function set(o) { it.classList.toggle('open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    function move(e, dir) { e.preventDefault(); var i = links.indexOf(d.activeElement); links[(i + dir + links.length) % links.length].focus(); }
    it.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') set(true); });
    it.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') set(false); });
    // a mouse click keeps a hover-opened menu open; keyboard and touch toggle it
    btn.addEventListener('click', function (e) { var o = e.pointerType === 'mouse' || !it.classList.contains('open'); dds.forEach(function (x) { if (x !== it) { x.classList.remove('open'); $('.dd-btn', x).setAttribute('aria-expanded', 'false'); } }); set(o); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); set(true); links[0].focus(); } });
    links.forEach(function (l) { l.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') move(e, 1); else if (e.key === 'ArrowUp') move(e, -1);
      else if (e.key === 'Home') { e.preventDefault(); links[0].focus(); } else if (e.key === 'End') { e.preventDefault(); links[links.length - 1].focus(); }
    }); });
    it.addEventListener('keydown', function (e) { if (e.key === 'Escape' && it.classList.contains('open')) { set(false); btn.focus(); } });
    it.addEventListener('focusout', function (e) { if (!it.contains(e.relatedTarget)) set(false); });
  });
  d.addEventListener('click', function (e) { dds.forEach(function (it) { if (!it.contains(e.target)) { it.classList.remove('open'); $('.dd-btn', it).setAttribute('aria-expanded', 'false'); } }); });

  /* ---------- mobile drawer ---------- */
  var drawer = $('#drawer'), menuBtn = $('#menuBtn');
  function lock() { d.body.classList.toggle('lock', !drawer.hidden || !modal.hidden); }
  function setDrawer(o) {
    drawer.hidden = !o; menuBtn.setAttribute('aria-expanded', o ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); menuBtn.textContent = o ? 'Close' : 'Menu'; lock();
  }
  menuBtn.addEventListener('click', function () { setDrawer(drawer.hidden); });
  $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  $$('.dr-row button', drawer).forEach(function (b) {
    b.addEventListener('click', function () {
      var sub = b.parentNode.nextElementSibling, open = sub.hidden;
      $$('.dr-sub', drawer).forEach(function (s) { s.hidden = true; s.previousElementSibling.lastElementChild.textContent = '+'; s.previousElementSibling.lastElementChild.setAttribute('aria-expanded', 'false'); });
      sub.hidden = !open; b.textContent = open ? '–' : '+'; b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  w.addEventListener('resize', function () { if (vw() >= 1180 && !drawer.hidden) setDrawer(false); });

  /* ---------- showcase slider: the next card grows into the full-screen image ---------- */
  var xs = $('#showcase');
  if (xs) {
    var xsS = $$('.xs-s', xs), xsC = $$('.xs-card', xs), xsN = xsS.length, xsCur = 0, xsBusy = false;
    var xsBar = $('#xsProg'), xsNum = $('#xsNum'), xsBtn = $('#xsToggle'), XS_DUR = 1500;
    var xsEl = 0, xsLast = 0, xsUser = reduced, xsSeen = true;
    xsBtn.textContent = xsUser ? 'Play' : 'Pause';
    function xsCards() {
      xsC.forEach(function (c, i) {
        var p = (i - xsCur + xsN) % xsN;
        // a card that was the current slide jumps to the back of the queue and fades in there
        if (c.classList.contains('gone') && p !== 0) { c.style.transition = 'opacity .6s ease .5s'; setTimeout(function () { c.style.transition = ''; }, 1200); }
        c.style.setProperty('--p', p);
        c.classList.toggle('gone', p === 0); c.classList.toggle('far', p > 3);
        c.tabIndex = p === 0 ? -1 : 0;
      });
    }
    function xsGo(k, from) {
      k = (k + xsN) % xsN;
      if (k === xsCur || xsBusy) return;
      xsBusy = true;
      var out = xsS[xsCur], inn = xsS[k], m = $('.xs-m', inn), box = xs.getBoundingClientRect(), clip;
      loadImgs(inn);
      if (from === 'card' && !reduced) {
        var r = xsC[k].getBoundingClientRect();
        clip = 'inset(' + (r.top - box.top) + 'px ' + (box.right - r.right) + 'px ' + (box.bottom - r.bottom) + 'px ' + (r.left - box.left) + 'px round 14px)';
      } else clip = from === 'prev' ? 'inset(0px 100% 0px 0px round 0px)' : 'inset(0px 0px 0px 100% round 0px)';
      if (!reduced) {
        m.style.transition = 'none'; m.style.clipPath = clip; inn.classList.add('top');
        void m.offsetWidth;
        m.style.transition = ''; m.style.clipPath = 'inset(0px 0px 0px 0px round 0px)'; inn.classList.remove('top');
      }
      out.classList.remove('on'); out.classList.add('was'); inn.classList.add('on');
      [out, inn].forEach(function (s) {
        var on = s === inn;
        if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
        $$('a', s).forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.tabIndex = -1; });
      });
      xsCur = k; xsEl = 0; xsNum.textContent = '0' + (k + 1); xsCards();
      // load the next card's image early so it is ready when it grows
      loadImgs(xsS[(k + 1) % xsN]);
      setTimeout(function () { out.classList.remove('was'); m.style.clipPath = ''; xsBusy = false; }, reduced ? 0 : 1200);
    }
    xsC.forEach(function (c, i) { c.addEventListener('click', function () { xsGo(i, 'card'); }); });
    $('#xsNext').addEventListener('click', function () { xsGo(xsCur + 1, 'card'); });
    $('#xsPrev').addEventListener('click', function () { xsGo(xsCur - 1, 'prev'); });
    xsBtn.addEventListener('click', function () { xsUser = !xsUser; xsBtn.textContent = xsUser ? 'Play' : 'Pause'; });
    var xsTx = 0;
    xs.addEventListener('touchstart', function (e) { xsTx = e.touches[0].clientX; }, { passive: true });
    xs.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - xsTx; if (Math.abs(dx) > 50) xsGo(dx < 0 ? xsCur + 1 : xsCur - 1, dx < 0 ? 'card' : 'prev'); });
    if ('IntersectionObserver' in w) new IntersectionObserver(function (e) { xsSeen = e[0].isIntersecting; }).observe(xs);
    (function tick(now) {
      if (xsLast && !xsUser && !xsBusy && xsSeen && !d.hidden) xsEl += now - xsLast;
      xsLast = now;
      xsBar.style.transform = 'scaleX(' + Math.min(1, xsEl / XS_DUR).toFixed(4) + ')';
      if (xsEl >= XS_DUR) xsGo(xsCur + 1, 'card');
      requestAnimationFrame(tick);
    })(0);
    xsCards();
    loadImgs(xsS[1]);
  }

  /* ---------- growth journey: scroll moves the cards sideways (wide screens) or fills a rail (small screens) ---------- */
  var gw = $('#grow');
  if (gw) {
    var gwPin = $('.gw-pin', gw), gwTrack = $('.gw-track', gw), gwSteps = $$('.gw-step', gw), gwFill = $('.gw-fill', gw), gwNum = $('#gwNum');
    var gwDist = 0, gwPinned = false, gwQueued = false;
    function gwSize() {
      gwPinned = vw() >= 1180 && !reduced;
      gw.classList.toggle('pinned', gwPinned);
      gwTrack.style.transform = '';
      if (gwPinned) {
        gwDist = Math.max(0, gwTrack.scrollWidth - gwPin.clientWidth);
        gw.style.height = (gwPin.offsetHeight + gwDist) + 'px';
      } else gw.style.height = '';
      gwTick();
    }
    function gwTick() {
      gwQueued = false;
      var r = gw.getBoundingClientRect(), vh = w.innerHeight, p, k;
      if (gwPinned) {
        p = gwDist ? Math.min(1, Math.max(0, (parseFloat(getComputedStyle(gwPin).top) - r.top) / gwDist)) : 0;
        gwTrack.style.transform = 'translate3d(' + (-p * gwDist).toFixed(1) + 'px,0,0)';
        gwFill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        k = Math.round(p * (gwSteps.length - 1));
      } else {
        p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
        gwFill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
        k = -1;
        gwSteps.forEach(function (s, i) { if (s.getBoundingClientRect().top < vh * 0.6) k = i; });
      }
      gwSteps.forEach(function (s, i) { s.classList.toggle('on', i === k); s.classList.toggle('done', i < k); });
      gwNum.textContent = '0' + (Math.max(0, k) + 1);
    }
    w.addEventListener('scroll', function () { if (!gwQueued) { gwQueued = true; requestAnimationFrame(gwTick); } }, { passive: true });
    w.addEventListener('resize', gwSize);
    w.addEventListener('load', gwSize);
    gwSize();
  }

  /* ---------- projects carousel (infinite loop) ---------- */
  var track = $('#track');
  if (track) {
    var carousel = $('#carousel'), dots = $$('#dots span'), projToggle = $('#projToggle');
    var real = $$('.pcard', track), n = real.length;
    function cloneSet() { var f = d.createDocumentFragment(); real.forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); $$('img', k).forEach(function (i) { i.alt = ''; }); f.appendChild(k); }); return f; }
    track.insertBefore(cloneSet(), track.firstChild); track.appendChild(cloneSet());
    var pi = n, pHover = false, pUser = false, cardW = 400;
    function layout(anim) {
      var W = vw(), side = Math.min(80, Math.max(20, 0.05 * W)), left = (W > 1600 ? (W - 1600) / 2 : 0) + side;
      // three cards across on desktop, two on tablet, one (with a peek of the next) on phones
      var avail = Math.min(W, 1600) - 2 * side, per = W >= 1180 ? 3 : W >= 700 ? 2 : 1;
      cardW = per === 1 ? Math.round(avail * 0.86) : Math.floor((avail - (per - 1) * 24) / per);
      $$('.pcard', track).forEach(function (c) { c.style.width = cardW + 'px'; });
      track.style.transition = anim && !reduced ? '' : 'none';
      track.style.transform = 'translateX(' + (left - pi * (cardW + 24)) + 'px)';
      var r = ((pi % n) + n) % n; dots.forEach(function (s, k) { s.classList.toggle('on', k === r); });
    }
    function pMove(dir) { pi += dir; layout(true); if (reduced) settle(); }
    function settle() { if (pi < n || pi >= 2 * n) { pi = n + (((pi % n) + n) % n); layout(false); } }
    track.addEventListener('transitionend', function (e) { if (e.target === track) settle(); });
    // size the cards only when the section comes near, so start-up stays light
    whenNear(carousel, function () { loadImgs(track); layout(false); });
    w.addEventListener('resize', function () { layout(false); });
    setInterval(function () { if (!pHover && !pUser && !reduced && !d.hidden) pMove(1); }, 6000);
    $('#projPrev').addEventListener('click', function () { pUser = true; projToggle.textContent = 'Play'; pMove(-1); });
    $('#projNext').addEventListener('click', function () { pUser = true; projToggle.textContent = 'Play'; pMove(1); });
    projToggle.addEventListener('click', function () { pUser = !pUser; projToggle.textContent = pUser ? 'Play' : 'Pause'; });
    carousel.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') pMove(1); else if (e.key === 'ArrowLeft') pMove(-1); });
    ['mouseenter', 'focusin'].forEach(function (ev) { carousel.addEventListener(ev, function () { pHover = true; }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { carousel.addEventListener(ev, function () { pHover = false; }); });
    var px = 0;
    carousel.addEventListener('touchstart', function (e) { px = e.touches[0].clientX; pHover = true; }, { passive: true });
    carousel.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - px; if (Math.abs(dx) > 50) pMove(dx < 0 ? 1 : -1); pHover = false; });
  }

  /* ---------- map pins (labels on tap for small screens) ---------- */
  $$('.pin').forEach(function (p) {
    var on = function () { $$('.pin.show').forEach(function (q) { q.classList.remove('show'); }); p.classList.add('show'); };
    var off = function () { p.classList.remove('show'); };
    p.addEventListener('mouseenter', on); p.addEventListener('focus', on); p.addEventListener('click', on);
    p.addEventListener('mouseleave', off); p.addEventListener('blur', off);
  });

  /* ---------- tabs (ARIA: arrows, Home/End; links with data-tab open a tab) ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab, panel = d.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (k == null) return; e.preventDefault(); select(tabs[(k + tabs.length) % tabs.length], true);
      });
    });
    $$('[data-tab]').forEach(function (a) { a.addEventListener('click', function () { var t = d.getElementById(a.getAttribute('data-tab')); if (t && tabs.indexOf(t) > -1) select(t); }); });
  });

  /* ---------- accordion ---------- */
  $$('.faq-q').forEach(function (b) {
    b.addEventListener('click', function () { var o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.parentNode.parentNode.classList.toggle('open', o); });
  });

  /* ---------- forms that send an enquiry through WhatsApp ---------- */
  $$('form[data-wa]').forEach(function (f) {
    var status = $('.form-status', f);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null, text = f.getAttribute('data-wa') + '\n';
      if ((f.elements.website || {}).value) return; // spam trap filled in: ignore
      $$('[data-req]', f).forEach(function (x) {
        var msg = String(x.value).trim() ? '' : 'This field is required.'; $('#' + x.id + '-e').textContent = msg;
        if (msg) { x.setAttribute('aria-invalid', 'true'); if (!first) first = x; } else x.removeAttribute('aria-invalid');
      });
      if (first) { first.focus(); return; }
      $$('input,select,textarea', f).forEach(function (x) {
        var v = String(x.value).trim().slice(0, 500), lab = x.id && $('label[for="' + x.id + '"]', f);
        if (v && lab && x.name !== 'website') text += '\n' + lab.textContent.replace(' *', '') + ': ' + v;
      });
      w.open('https://wa.me/923001114901?text=' + encodeURIComponent(text), '_blank', 'noopener');
      status.textContent = 'WhatsApp is opening with your enquiry. Press send to reach our team.';
    });
  });

  /* ---------- quote modal (sends the enquiry through WhatsApp; no server form yet) ---------- */
  var modal = $('#quote'), form = $('#quoteForm'), doneBox = $('.done', modal), opener = null;
  function openQuote(e) {
    opener = e && e.currentTarget; setDrawer(false);
    form.reset(); form.hidden = false; doneBox.hidden = true;
    $$('.err', form).forEach(function (x) { x.textContent = ''; }); $$('[aria-invalid]', form).forEach(function (x) { x.removeAttribute('aria-invalid'); });
    modal.hidden = false; lock(); $('#q-name').focus();
  }
  function closeQuote() { modal.hidden = true; lock(); if (opener) opener.focus(); }
  /* ---------- client logos: pause / play ---------- */
  var clBtn = $('#clToggle');
  if (clBtn) clBtn.addEventListener('click', function () {
    var p = $('.cl-wrap').classList.toggle('paused');
    clBtn.setAttribute('aria-pressed', String(p)); clBtn.textContent = p ? 'Play logos' : 'Pause logos';
  });

  $$('[data-quote]').forEach(function (b) { b.addEventListener('click', openQuote); });
  $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeQuote); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeQuote(); });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) closeQuote(); else if (!drawer.hidden) { setDrawer(false); menuBtn.focus(); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form), first = null, labels = { name: 'Name', company: 'Company', email: 'Email', phone: 'Phone / WhatsApp', product: 'Product or service', scope: 'Quantity / scope', message: 'Message' };
    if (String(fd.get('website') || '').trim()) return;
    ['name', 'company', 'email', 'phone', 'product', 'scope'].forEach(function (k) {
      var v = String(fd.get(k) || '').trim(), msg = '';
      if (!v) msg = 'This field is required.';
      else if (k === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) msg = 'Enter a valid business email address.';
      var input = form.elements[k]; $('#q-' + k + '-e').textContent = msg;
      if (msg) { input.setAttribute('aria-invalid', 'true'); if (!first) first = input; } else input.removeAttribute('aria-invalid');
    });
    if (first) { first.focus(); return; }
    var text = 'Hello Gillani Group Of Companies, I would like to request a quote.\n';
    Object.keys(labels).forEach(function (k) { var v = String(fd.get(k) || '').trim().slice(0, 500); if (v) text += '\n' + labels[k] + ': ' + v; });
    w.open('https://wa.me/923001114901?text=' + encodeURIComponent(text), '_blank', 'noopener');
    form.hidden = true; doneBox.hidden = false; $('h2', doneBox).focus();
  });
})();
