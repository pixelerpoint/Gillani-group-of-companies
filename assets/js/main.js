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
    (groups.get(tg) || []).forEach(function (el) { el.classList.add('in'); });
  }
  var statsEl = $('#stats'), mapEl = $('#map');
  if ('IntersectionObserver' in w) {
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) reveal(e.target); }); }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  }
  $$('[data-rv]').forEach(function (el) {
    var v = el.getAttribute('data-rv');
    var tg = (v === 'img' || v === 'mline' || v === 'line' || v === 'vline') ? el.parentElement : el;
    if (!reduced) {
      var rd = el.getAttribute('data-rd');
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.hasAttribute('data-rv'); });
      el.style.setProperty('--d', ((rd != null ? +rd : Math.max(0, sibs.indexOf(el))) * 90) + 'ms');
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
  var hdr = $('#hdr'), bar = $('[data-scrollbar]'), collage = $('#collage'), par = $('#par'), sr = 0;
  function onScroll() {
    if (sr) return;
    sr = requestAnimationFrame(function () {
      sr = 0;
      // all reads first, then all writes, to avoid forcing extra layouts
      var max = root.scrollHeight - root.clientHeight, y = w.scrollY;
      var r = !reduced && vw() >= 960 ? collage.getBoundingClientRect() : null;
      sweep();
      bar.style.width = (max > 0 ? y / max * 100 : 0) + '%';
      hdr.classList.toggle('scrolled', y > 40);
      par.style.transform = r ? 'translateY(' + Math.round(((r.top + r.height / 2) - w.innerHeight / 2) * 0.08) + 'px)' : '';
    });
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  hdr.classList.toggle('scrolled', w.scrollY > 40);

  /* ---------- desktop dropdowns ---------- */
  $$('.nav-i.has-dd').forEach(function (it) {
    var a = it.firstElementChild;
    function set(o) { it.classList.toggle('open', o); a.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    it.addEventListener('mouseenter', function () { set(true); });
    it.addEventListener('mouseleave', function () { set(false); });
    it.addEventListener('focusin', function () { set(true); });
    it.addEventListener('focusout', function (e) { if (!it.contains(e.relatedTarget)) set(false); });
    it.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); a.focus(); } });
  });

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

  /* ---------- hero carousel ---------- */
  var hero = $('#hero'), slides = $$('.slide', hero), progBar = $('[data-progbar]'), slideNum = $('#slideNum'), heroToggle = $('#heroToggle');
  // the slow zoom and the progress bar are CSS animations (7s); the bar's end moves to the next slide
  var cur = 0, hovered = false, userPaused = false;
  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === cur; s.classList.toggle('on', on); s.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('a', s).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    });
    loadImgs(slides[cur]); loadImgs(slides[(cur + 1) % slides.length]);
    slideNum.textContent = '0' + (cur + 1);
    progBar.style.animation = 'none'; void progBar.offsetWidth; progBar.style.animation = '';
  }
  function setPaused() { hero.classList.toggle('paused', hovered || userPaused); }
  progBar.addEventListener('animationend', function () { show(cur + 1); });
  w.addEventListener('load', function () { setTimeout(function () { slides.forEach(loadImgs); }, 4000); });
  $('#heroPrev').addEventListener('click', function () { show(cur - 1); });
  $('#heroNext').addEventListener('click', function () { show(cur + 1); });
  heroToggle.addEventListener('click', function () { userPaused = !userPaused; heroToggle.textContent = userPaused ? 'Play' : 'Pause'; setPaused(); });
  hero.addEventListener('mouseenter', function () { hovered = true; setPaused(); });
  hero.addEventListener('mouseleave', function () { hovered = false; setPaused(); });
  hero.addEventListener('focusin', function () { hovered = true; setPaused(); });
  hero.addEventListener('focusout', function () { hovered = false; setPaused(); });
  var tx = 0;
  hero.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(dx < 0 ? cur + 1 : cur - 1); });

  /* ---------- projects carousel (infinite loop) ---------- */
  var track = $('#track'), carousel = $('#carousel'), dots = $$('#dots span'), projToggle = $('#projToggle');
  var real = $$('.pcard', track), n = real.length;
  function cloneSet() { var f = d.createDocumentFragment(); real.forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); $$('img', k).forEach(function (i) { i.alt = ''; }); f.appendChild(k); }); return f; }
  track.insertBefore(cloneSet(), track.firstChild); track.appendChild(cloneSet());
  var pi = n, pHover = false, pUser = false, cardW = 940;
  function layout(anim) {
    var W = vw(), side = Math.min(80, Math.max(20, 0.05 * W)), left = (W > 1600 ? (W - 1600) / 2 : 0) + side;
    cardW = Math.round(Math.min(940, Math.max(260, (W - left) * 0.8)));
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

  /* ---------- marquees ---------- */
  function marquee(el, dir) {
    var inner = el.firstElementChild, paused = false, started = false, visible = false, running = false, half = 0, pos = 0;
    whenNear(el, function () { loadImgs(el); });
    if (reduced) return;
    Array.prototype.slice.call(inner.children).forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); (k.tagName === 'IMG' ? [k] : $$('img', k)).forEach(function (i) { i.alt = ''; }); inner.appendChild(k); });
    var measure = function () { half = inner.scrollWidth / 2; };
    w.addEventListener('resize', measure);
    ['mouseenter', 'focus', 'touchstart'].forEach(function (ev) { el.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'blur', 'touchend'].forEach(function (ev) { el.addEventListener(ev, function () { paused = false; pos = el.scrollLeft; }); });
    function tick() {
      if (!visible) { running = false; return; }
      if (half < 50) measure();
      if (!paused && half >= 50) {
        if (!started) { started = true; pos = dir < 0 ? half : 0; }
        pos += 0.6 * dir;
        if (pos >= half) pos -= half; else if (pos <= 0 && dir < 0) pos += half;
        el.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    }
    // only animate while the strip is on screen
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !running) { running = true; measure(); requestAnimationFrame(tick); }
    }).observe(el);
  }
  marquee($('#marq2'), -1);

  /* ---------- map pins (labels on tap for small screens) ---------- */
  $$('.pin').forEach(function (p) {
    var on = function () { $$('.pin.show').forEach(function (q) { q.classList.remove('show'); }); p.classList.add('show'); };
    var off = function () { p.classList.remove('show'); };
    p.addEventListener('mouseenter', on); p.addEventListener('focus', on); p.addEventListener('click', on);
    p.addEventListener('mouseleave', off); p.addEventListener('blur', off);
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
