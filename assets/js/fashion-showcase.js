/* Manara — Fashion "Season 26·27 Trend Edit": an interactive 3D coverflow of
   real, researched trend directions for Women, Men and Children, drawn from
   A/W 26·27 and S/S 27 forecasts. Cards sit on a cylinder in true 3D
   (perspective + rotateY + translateZ); the visitor switches audience, drags,
   taps arrows/dots, taps a card, or lets it turn on its own. Self-contained:
   silhouettes and palettes are drawn inline, no images, no libraries. */
(function () {
  'use strict';

  var stage = document.getElementById('fxStage');
  var track = document.getElementById('fxCarousel');
  if (!stage || !track) return;

  /* ---- the researched trend edit (A/W 26·27 + S/S 27) ---- */
  var CATS = {
    Women: [
      { name: 'Sharp Power Tailoring', season: 'Fall 26', img: 'wm1.webp',
        desc: 'Structured shoulders, a waistcoat and gold hardware — Schiaparelli’s take on commanding tailoring.',
        pal: ['#d8c7a4', '#b9a06a', '#8a6a2f'] },
      { name: 'Molten Neutrals', season: 'Fall 26', img: 'wm2.webp',
        desc: 'Fluid satin tailoring in warm browns, sculpted close to the body.',
        pal: ['#6b5540', '#a98a63', '#e6d9c3'] },
      { name: 'Liquid Evening Glamour', season: 'Winter 26·27', img: 'wm3.webp',
        desc: 'A second-skin, crystal-flecked column in molten black — drama with restraint.',
        pal: ['#141416', '#2c2c30', '#c9a14e'] },
      { name: 'Denim, Elevated', season: 'Spring 27', img: 'wm4.webp',
        desc: 'Dior pairs a fringed tailored jacket with relaxed, lived-in denim.',
        pal: ['#4a5a6a', '#8aa0b4', '#1b1b1e'] }
    ],
    Men: [
      { name: 'Shearling & Leather', season: 'Winter 26·27', img: 'mn1.jpg',
        desc: 'A shearling-collar leather bomber over a cable knit — rugged, warm, refined.',
        pal: ['#2b2b2f', '#5a5f66', '#e8e2d4'] },
      { name: 'The Grand Fur Coat', season: 'Winter 26·27', img: 'mn2.webp',
        desc: 'A floor-sweeping fur coat over chunky knit and herringbone — statement outerwear.',
        pal: ['#4a3a2a', '#8a6a4a', '#c9b79c'] },
      { name: 'Quiet-Luxury Knit', season: 'Fall 26', img: 'mn3.jpg',
        desc: 'An easy black crewneck with cream trousers — pared-back, considered menswear.',
        pal: ['#1b1b1e', '#3d4350', '#e6ddcf'] },
      { name: 'Polished Off-Duty', season: 'Spring 27', img: 'mn4.jpg',
        desc: 'A waffle-knit polo with dark denim and white sneakers — smart-casual, done right.',
        pal: ['#ece7db', '#1b1b1e', '#8a8f99'] }
    ],
    Children: [
      { name: 'Lavender & Pastels', season: 'Spring 27', img: 'c1.jpg',
        desc: 'Soft lavender, ecru and pastel denim washes lead a gentle spring palette.',
        pal: ['#9a86c4', '#c9b8e6', '#efe7dc'] },
      { name: 'Nautical Stripes', season: 'Summer 27', img: 'cd2.webp',
        desc: 'Breton stripes and a sunny slicker — easy, timeless coastal dressing.',
        pal: ['#1d3a5f', '#f0c24b', '#f2efe4'] },
      { name: 'Everyday Sparkle', season: 'Winter 26·27', img: 'cd4.avif',
        desc: 'Subtle metallics and shimmer bring a little magic to everyday wear.',
        pal: ['#8a8f99', '#c9cdd4', '#eef0f4'] },
      { name: 'Athleisure Ease', season: 'Spring 27', img: 'c5.jpg',
        desc: 'Joggers, tracksuits and sporty ease blended into comfortable everyday play.',
        pal: ['#2f8fd0', '#7cc0e8', '#f0c24b'] },
      { name: 'Conscious Neutrals', season: 'Fall 26', img: 'c6.jpg',
        desc: 'Organic cotton, bamboo and recycled fibres in calm, gender-neutral tones.',
        pal: ['#7c7a5a', '#b4ac8e', '#e8e2d0'] }
    ]
  };

  /* ---- silhouettes (120 x 200 viewBox), gradient fill from the palette ---- */
  function silhouette(kind, fill, accent) {
    var body = {
      column: '<path d="M50 44 h20 l5 14 -6 6 3 84 h-24 l3 -84 -6 -6 z" fill="url(#g)"/>',
      blazer: '<path d="M45 44 h30 l8 24 -8 6 v18 h-30 v-18 l-8 -6 z" fill="url(#g)"/><path d="M47 93 h11 l-1 63 h-8 z M62 93 h11 l3 63 h-8 z" fill="url(#g)"/><path d="M60 51 v40" stroke="' + accent + '" stroke-width="1.5" fill="none"/>',
      coat:   '<path d="M44 44 l6 -2 10 4 10 -4 6 2 8 22 -8 7 5 83 h-42 l5 -83 -8 -7 z" fill="url(#g)"/><path d="M60 47 v95" stroke="' + accent + '" stroke-width="1.4" fill="none"/>',
      gown:   '<path d="M48 44 h24 l6 16 -6 8 20 74 q-26 12 -58 0 l20 -74 -6 -8 z" fill="url(#g)"/><path d="M50 78 q10 6 20 0 M46 108 q14 8 28 0" stroke="' + accent + '" stroke-width="1.3" fill="none"/>',
      maxi:   '<path d="M47 44 h26 l7 18 -7 7 q14 44 4 82 q-24 8 -34 0 q-10 -38 4 -82 l-7 -7 z" fill="url(#g)"/><path d="M50 84 q10 6 20 0 M48 116 q12 7 24 0" stroke="' + accent + '" stroke-width="1.4" fill="none"/>',
      aline:  '<path d="M48 44 h24 l6 18 -8 6 22 80 q-28 10 -52 0 l22 -80 -8 -6 z" fill="url(#g)"/>',
      knit:   '<path d="M44 46 h32 l6 22 -8 5 -2 20 h-24 l-2 -20 -8 -5 z" fill="url(#g)"/><path d="M48 93 h11 l-1 60 h-8 z M61 93 h11 l2 60 h-8 z" fill="url(#g)"/><path d="M50 58 h20 M50 66 h20" stroke="' + accent + '" stroke-width="1.2" fill="none"/>',
      jacket: '<path d="M45 44 h30 l8 20 -8 6 v14 h-30 v-14 l-8 -6 z" fill="url(#g)"/><path d="M48 84 h11 l-1 66 h-8 z M61 84 h11 l2 66 h-8 z" fill="url(#g)"/><path d="M60 50 v34" stroke="' + accent + '" stroke-width="1.4" fill="none"/>',
      suit:   '<path d="M44 44 h32 l9 26 -9 8 v70 h-13 l-2 -40 -2 40 h-13 v-70 l-9 -8 z" fill="url(#g)"/><path d="M60 52 v56" stroke="' + accent + '" stroke-width="1.5" fill="none"/>',
      kid:    '<path d="M49 48 h22 l5 15 -5 6 3 33 h-9 l-1 30 h-6 l-1 -30 h-6 l3 -33 -5 -6 z" fill="url(#g)"/>',
      kidset: '<path d="M49 48 h22 l5 15 -6 5 -1 19 h-18 l-1 -19 -6 -5 z" fill="url(#g)"/><path d="M51 89 h8 l-1 33 h-6 z M61 89 h8 l1 33 h-6 z" fill="url(#g)"/>'
    }[kind] || '';
    return '<svg viewBox="0 0 120 200" width="100%" height="100%" aria-hidden="true">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + fill + '"/><stop offset="1" stop-color="' + accent + '"/>' +
      '</linearGradient></defs>' +
      '<circle cx="60" cy="30" r="9.5" fill="' + fill + '"/>' + body + '</svg>';
  }

  /* ---- carousel state ---- */
  var PREFIX = { Women: 'w', Men: 'm', Children: 'c' };
  var IMG_BASE = 'images/trends/';
  var curPrefix = 'w';

  var LOOKS = [];
  var cards = [];
  var dots = [];
  var n = 6, gap = 160, depth = 130;
  var pos = 0, index = 0, dragging = false;

  var capName = document.getElementById('fxName');
  var capTag = document.getElementById('fxTag');
  var capSeason = document.getElementById('fxSeason');
  var dotsWrap = document.getElementById('fxDots');

  function buildCards() {
    track.innerHTML = '';
    if (dotsWrap) dotsWrap.innerHTML = '';
    cards = []; dots = [];
    n = LOOKS.length;

    LOOKS.forEach(function (lk, i) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'fx-card';
      c.setAttribute('data-i', i);
      c.setAttribute('aria-label', lk.name + ', ' + lk.season + ' — ' + lk.desc);
      c.style.setProperty('--c1', lk.pal[0]);
      c.style.setProperty('--c2', lk.pal[1]);
      c.style.setProperty('--c3', lk.pal[2]);
      c.innerHTML =
        '<span class="fx-badge">' + lk.season + '</span>' +
        '<img class="fx-photo" src="' + IMG_BASE + (lk.img || (curPrefix + (i + 1) + '.jpg')) + '" ' +
        'alt="' + lk.name + ' — ' + lk.desc + '" draggable="false" decoding="async" ' +
        (i === 0 ? 'fetchpriority="high"' : 'fetchpriority="low"') + '>' +
        '<div class="fx-meta"><span class="fx-name">' + lk.name + '</span>' +
        '<span class="fx-sw">' + lk.pal.map(function (p) {
          return '<i style="background:' + p + '"></i>';
        }).join('') + '</span></div>';
      c.addEventListener('click', function () {
        var idx = +c.getAttribute('data-i');
        if (idx === index && !movedFar) { window.location.href = 'fashion-quote.html'; return; }
        autoKick(); goTo(idx);
      });
      track.appendChild(c);
      cards.push(c);

      if (dotsWrap) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'fx-dot';
        b.setAttribute('aria-label', 'Show ' + lk.name);
        b.addEventListener('click', function () { autoKick(); goTo(i); });
        dotsWrap.appendChild(b);
        dots.push(b);
      }
    });
  }

  function measure() {
    var w = stage.clientWidth;
    var cw = Math.max(150, Math.min(230, w * 0.34));
    var ch = Math.round(cw * 1.42);
    gap = cw * 0.72; depth = cw * 0.6;
    if (w < 560) { gap = cw * 0.62; depth = cw * 0.5; }
    cards.forEach(function (c) {
      c.style.width = cw + 'px';
      c.style.height = ch + 'px';
      c.style.marginLeft = (-cw / 2) + 'px';
      c.style.marginTop = (-ch / 2) + 'px';
    });
    render();
  }

  /* nearest circular distance of a card index from the current position */
  function wrapd(d) { return d - n * Math.round(d / n); }

  function setTransition(on) {
    cards.forEach(function (c) {
      c.style.transition = on
        ? 'transform .6s cubic-bezier(.22,.61,.36,1),opacity .5s,filter .5s,box-shadow .5s'
        : 'none';
    });
  }

  /* Coverflow fan: the front card sits centre-flat, neighbours slide out to
     the sides, tilt inward and drop back — so it reads full at any card count
     (a 4-up set no longer leaves the sides edge-on and empty). */
  function render() {
    index = ((Math.round(pos) % n) + n) % n;
    cards.forEach(function (c, i) {
      var d = wrapd(i - pos);
      var ad = Math.abs(d);
      var x = d * gap;
      var z = -ad * depth;
      var ry = -Math.max(-1, Math.min(1, d)) * 48;
      c.style.transform = 'translateX(' + x.toFixed(1) + 'px) translateZ(' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(1) + 'deg)';
      var front = ad < 0.5;
      c.classList.toggle('is-front', front);
      c.style.opacity = front ? '1' : (ad < 1.6 ? '0.72' : '0.34');
      c.style.filter = front ? 'none' : 'saturate(.92) brightness(.82)';
      c.style.zIndex = String(200 - Math.round(ad * 10));
    });
    var lk = LOOKS[index];
    if (lk) {
      if (capName) capName.textContent = lk.name;
      if (capTag) capTag.textContent = lk.desc;
      if (capSeason) capSeason.textContent = lk.season;
    }
    dots.forEach(function (dt, i) { dt.classList.toggle('on', i === index); });
  }

  function goTo(i, smooth) {
    i = ((i % n) + n) % n;
    setTransition(smooth !== false);
    pos = pos + wrapd(i - pos);   // move the short way round
    render();
  }
  function step(dir) { autoKick(); goTo(index + dir); }

  function loadCategory(cat, keepAuto) {
    LOOKS = CATS[cat];
    curPrefix = PREFIX[cat] || 'w';
    buildCards();
    pos = 0;
    measure();
    goTo(0, false);
    if (!keepAuto) autoStart();
  }

  /* ---- audience tabs ---- */
  var tabsWrap = document.getElementById('fxTabs');
  if (tabsWrap) {
    Object.keys(CATS).forEach(function (cat, i) {
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'fx-tab' + (i === 0 ? ' on' : '');
      t.textContent = cat;
      t.setAttribute('role', 'tab');
      t.addEventListener('click', function () {
        [].slice.call(tabsWrap.children).forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        loadCategory(cat, true);
        autoKick();
      });
      tabsWrap.appendChild(t);
    });
  }

  /* ---- controls ---- */
  var prev = stage.querySelector('.fx-prev');
  var next = stage.querySelector('.fx-next');
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });

  /* ---- drag / swipe ---- */
  var startX = 0, startPos = 0, movedFar = false;
  function down(x) { dragging = true; movedFar = false; startX = x; startPos = pos; setTransition(false); autoKick(); }
  function move(x) {
    if (!dragging) return;
    var dx = x - startX;
    if (Math.abs(dx) > 6) movedFar = true;
    pos = startPos - dx / gap;
    render();
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    goTo(Math.round(pos));
  }
  stage.addEventListener('pointerdown', function (e) { down(e.clientX); });
  window.addEventListener('pointermove', function (e) { move(e.clientX); });
  window.addEventListener('pointerup', up);
  stage.setAttribute('tabindex', '0');
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  /* ---- auto-advance every 10 seconds; any interaction just resets the
     countdown so the carousel keeps switching on its own thereafter ---- */
  var auto = null;
  function autoStart() {
    if (auto) return;
    auto = setInterval(function () {
      if (dragging) return;
      goTo(index + 1);
    }, 3000);
  }
  function autoKick() { if (auto) { clearInterval(auto); auto = null; } autoStart(); }

  /* ---- init ---- */
  loadCategory('Women', true);
  autoStart();   // begin the 10s auto-switch immediately

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { measure(); goTo(index, false); }, 150);
  });
})();
