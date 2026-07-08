/* Manara — lighthouse-themed animated backgrounds.
   Reads the scene name from <body data-scene="..."> (fallback window.MANARA_SCENE, else "stars").
   Draws a full-viewport canvas layered inside .bg (behind content). Respects reduced-motion. */
(function () {
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var host = document.querySelector('.bg') || document.body;
  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  host.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1, HZ = 0;

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight; HZ = H * 0.70;
    canvas.width = Math.max(1, W * DPR); canvas.height = Math.max(1, H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize); resize();

  var scene = (document.body.getAttribute('data-scene') || window.MANARA_SCENE || 'stars').toLowerCase();

  // ---- shared field data ----
  var stars = [], bubbles = [], rain = [], gulls = [];
  for (var i = 0; i < 90; i++) stars.push({ x: Math.random(), y: Math.random() * 0.6, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.28, s: 0.4 + Math.random() });
  for (var b = 0; b < 34; b++) bubbles.push({ x: Math.random(), y: Math.random(), r: Math.random() * 3 + 1, sp: 0.02 + Math.random() * 0.05, dr: Math.random() * 0.4 });
  for (var r0 = 0; r0 < 140; r0++) rain.push({ x: Math.random(), y: Math.random(), l: 12 + Math.random() * 16, sp: 0.9 + Math.random() * 0.7 });
  for (var g0 = 0; g0 < 5; g0++) gulls.push({ x: Math.random(), y: 0.12 + Math.random() * 0.22, sp: 0.006 + Math.random() * 0.008, ph: Math.random() * 6.28 });

  // ---- helpers ----
  function gold(a) { return 'rgba(230,204,140,' + a + ')'; }
  function fillGold(a) { return 'rgba(199,161,78,' + a + ')'; }

  function drawStars(t, alpha) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], tw = 0.55 + 0.45 * Math.sin(t * s.s + s.p);
      ctx.fillStyle = 'rgba(244,238,225,' + (alpha * tw * 0.9) + ')';
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.29); ctx.fill();
    }
  }

  // filled sea + moving crest lines from baseline y
  function sea(t, baseY, amp, speed, tint) {
    ctx.save();
    var grd = ctx.createLinearGradient(0, baseY, 0, H);
    grd.addColorStop(0, tint || 'rgba(14,30,50,.55)');
    grd.addColorStop(1, 'rgba(4,9,15,.85)');
    ctx.beginPath(); ctx.moveTo(0, baseY);
    for (var x = 0; x <= W; x += 12) {
      var y = baseY + Math.sin((x / 150) + t * speed) * amp + Math.sin((x / 57) - t * speed * 1.6) * (amp * 0.4);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    // crest highlight
    ctx.beginPath();
    for (var x2 = 0; x2 <= W; x2 += 12) {
      var y2 = baseY + Math.sin((x2 / 150) + t * speed) * amp + Math.sin((x2 / 57) - t * speed * 1.6) * (amp * 0.4);
      if (x2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = gold(0.35); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
    return baseY;
  }

  function waterRays(t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 5; i++) {
      var cx = (i / 4) * W + Math.sin(t * 0.2 + i) * 30;
      var g = ctx.createLinearGradient(cx, 0, cx + 60, H);
      g.addColorStop(0, 'rgba(230,204,140,.10)'); g.addColorStop(1, 'rgba(230,204,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx - 30, 0); ctx.lineTo(cx + 30, 0); ctx.lineTo(cx + 120, H); ctx.lineTo(cx + 40, H); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawBubbles(t) {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      var y = (b.y - (t * b.sp % 1) + 1) % 1;
      var x = b.x + Math.sin(t + i) * 0.01 * b.dr;
      ctx.strokeStyle = 'rgba(230,204,140,' + (0.10 + 0.12 * (1 - y)) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x * W, y * H, b.r, 0, 6.29); ctx.stroke();
    }
  }

  function lighthouse(x, baseY, s, t, beam) {
    ctx.save(); ctx.translate(x, baseY);
    // rocky base
    ctx.fillStyle = 'rgba(10,20,32,.9)'; ctx.strokeStyle = gold(0.25); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14 * s, 2 * s);
    ctx.quadraticCurveTo(-10 * s, -3 * s, -4 * s, -1.5 * s);
    ctx.quadraticCurveTo(0, -4 * s, 5 * s, -1.5 * s);
    ctx.quadraticCurveTo(11 * s, -3 * s, 14 * s, 2 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // tapered masonry tower with side shading
    var grd = ctx.createLinearGradient(-7 * s, 0, 7 * s, 0);
    grd.addColorStop(0, 'rgba(199,161,78,.30)'); grd.addColorStop(0.5, 'rgba(199,161,78,.12)'); grd.addColorStop(1, 'rgba(199,161,78,.26)');
    ctx.fillStyle = grd; ctx.strokeStyle = gold(0.6); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-6.5 * s, 0); ctx.lineTo(-4.2 * s, -34 * s); ctx.lineTo(4.2 * s, -34 * s); ctx.lineTo(6.5 * s, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    // horizontal bands
    ctx.strokeStyle = gold(0.35); ctx.lineWidth = 1;
    for (var i = 1; i <= 3; i++) {
      var w = (6.5 - 2.3 * i / 4) * s, yy = -34 * s * i / 4;
      ctx.beginPath(); ctx.moveTo(-w, yy); ctx.lineTo(w, yy); ctx.stroke();
    }
    // arched door + porthole window
    ctx.fillStyle = 'rgba(8,16,26,.85)';
    ctx.beginPath(); ctx.moveTo(-1.8 * s, 0); ctx.lineTo(-1.8 * s, -4.6 * s);
    ctx.quadraticCurveTo(0, -6.6 * s, 1.8 * s, -4.6 * s); ctx.lineTo(1.8 * s, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = gold(0.4); ctx.beginPath(); ctx.arc(0, -19 * s, 1.5 * s, 0, 6.29); ctx.stroke();
    // gallery deck with railing
    ctx.fillStyle = fillGold(0.5);
    ctx.fillRect(-6 * s, -35.6 * s, 12 * s, 1.6 * s);
    ctx.strokeStyle = gold(0.5); ctx.lineWidth = 0.9;
    for (var r = -5; r <= 5; r += 2) {
      ctx.beginPath(); ctx.moveTo(r * s, -35.6 * s); ctx.lineTo(r * s, -38.2 * s); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-5.4 * s, -38.2 * s); ctx.lineTo(5.4 * s, -38.2 * s); ctx.stroke();
    // lantern room: warm glow + glass mullions
    var pulse = 0.55 + 0.35 * Math.sin(t * 3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var halo = ctx.createRadialGradient(0, -40 * s, 0, 0, -40 * s, 16 * s);
    halo.addColorStop(0, 'rgba(255,235,180,' + (0.22 * pulse) + ')'); halo.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, -40 * s, 16 * s, 0, 6.29); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,235,180,' + pulse + ')';
    ctx.fillRect(-3.4 * s, -43 * s, 6.8 * s, 5.5 * s);
    ctx.strokeStyle = 'rgba(12,20,30,.75)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-1.1 * s, -43 * s); ctx.lineTo(-1.1 * s, -37.5 * s);
    ctx.moveTo(1.1 * s, -43 * s); ctx.lineTo(1.1 * s, -37.5 * s); ctx.stroke();
    // conical roof + finial
    ctx.fillStyle = fillGold(0.55); ctx.strokeStyle = gold(0.6); ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-4.4 * s, -43 * s); ctx.lineTo(4.4 * s, -43 * s); ctx.lineTo(0, -48.5 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = gold(0.8); ctx.beginPath(); ctx.arc(0, -49.3 * s, 0.9 * s, 0, 6.29); ctx.fill();
    if (beam) {
      var a = -Math.PI / 2 + Math.sin(t * 0.4) * 0.55, len = Math.max(W, H) * 0.9, sp = 0.11;
      ctx.save(); ctx.translate(0, -40 * s); ctx.rotate(a); ctx.globalCompositeOperation = 'lighter';
      var bg = ctx.createLinearGradient(0, 0, len, 0);
      bg.addColorStop(0, 'rgba(255,236,180,.20)'); bg.addColorStop(0.5, 'rgba(230,204,140,.06)'); bg.addColorStop(1, 'rgba(230,204,140,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sp) * len, Math.sin(sp) * len); ctx.lineTo(Math.cos(-sp) * len, Math.sin(-sp) * len); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function landMass(t) {
    ctx.save(); ctx.fillStyle = 'rgba(8,18,30,.9)'; ctx.strokeStyle = gold(0.25); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W, HZ + 4);
    ctx.quadraticCurveTo(W * 0.82, HZ - 34, W * 0.70, HZ + 2);
    ctx.lineTo(W, HZ + 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    lighthouse(W * 0.80, HZ - 6, 0.8, t, true);
  }

  // square-sail sail with billowing edges hanging between ytop and ybot around mast x
  function sailPanel(xm, ytop, ybot, halfw, bil) {
    var mid = (ytop + ybot) / 2;
    ctx.beginPath();
    ctx.moveTo(xm - halfw, ytop);
    ctx.quadraticCurveTo(xm, ytop + 2, xm + halfw, ytop);
    ctx.quadraticCurveTo(xm + halfw + 4 * bil, mid, xm + halfw - 1, ybot);
    ctx.quadraticCurveTo(xm, ybot + 4 * bil, xm - halfw + 1, ybot);
    ctx.quadraticCurveTo(xm - halfw - 4 * bil, mid, xm - halfw, ytop);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  function ship(cx, baseY, s, t) {
    var bob = Math.sin(t * 0.9) * 4, tilt = Math.sin(t * 0.9) * 0.05;
    ctx.save(); ctx.translate(cx, baseY + bob); ctx.rotate(tilt);
    // hull with sheer curve, raised stern and bow
    var hullGrad = ctx.createLinearGradient(0, -6 * s, 0, 14 * s);
    hullGrad.addColorStop(0, 'rgba(199,161,78,.30)'); hullGrad.addColorStop(1, 'rgba(199,161,78,.10)');
    ctx.fillStyle = hullGrad; ctx.strokeStyle = gold(0.65); ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-34 * s, -8 * s);
    ctx.quadraticCurveTo(-31 * s, 6 * s, -18 * s, 10 * s);
    ctx.quadraticCurveTo(0, 14 * s, 18 * s, 10 * s);
    ctx.quadraticCurveTo(30 * s, 7 * s, 36 * s, -9 * s);
    ctx.lineTo(30 * s, -6 * s);
    ctx.quadraticCurveTo(0, -1 * s, -28 * s, -5 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // planking lines
    ctx.strokeStyle = gold(0.22); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-28 * s, 1 * s); ctx.quadraticCurveTo(0, 5 * s, 30 * s, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-24 * s, 5 * s); ctx.quadraticCurveTo(0, 9 * s, 26 * s, 4 * s); ctx.stroke();
    // bowsprit
    ctx.strokeStyle = gold(0.6); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(34 * s, -8 * s); ctx.lineTo(47 * s, -16 * s); ctx.stroke();
    // masts
    ctx.beginPath(); ctx.moveTo(11 * s, -4 * s); ctx.lineTo(11 * s, -47 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-11 * s, -4 * s); ctx.lineTo(-11 * s, -55 * s); ctx.stroke();
    // crow's nest on main mast
    ctx.fillStyle = fillGold(0.4);
    ctx.fillRect(-13 * s, -44 * s, 4 * s, 1.6 * s);
    // sails: two per mast, breathing softly in the wind
    var bil = (1 + 0.05 * Math.sin(t * 1.3)) * s;
    ctx.fillStyle = fillGold(0.16); ctx.strokeStyle = gold(0.55); ctx.lineWidth = 1.1;
    sailPanel(-11 * s, -53 * s, -40 * s, 12 * s, bil);
    sailPanel(-11 * s, -38 * s, -22 * s, 14.5 * s, bil);
    sailPanel(11 * s, -45 * s, -34 * s, 10 * s, bil);
    sailPanel(11 * s, -32 * s, -18 * s, 12.5 * s, bil);
    // jib sail between bowsprit and fore mast
    ctx.beginPath();
    ctx.moveTo(46 * s, -15.5 * s);
    ctx.quadraticCurveTo(30 * s, -34 * s, 12.5 * s, -44 * s);
    ctx.lineTo(12.5 * s, -20 * s);
    ctx.quadraticCurveTo(30 * s, -21 * s, 46 * s, -15.5 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // rigging
    ctx.strokeStyle = gold(0.28); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-11 * s, -55 * s); ctx.lineTo(-30 * s, -7 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-11 * s, -55 * s); ctx.lineTo(11 * s, -47 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11 * s, -47 * s); ctx.lineTo(34 * s, -8 * s); ctx.stroke();
    // pennant flag streaming from the main mast
    var fw = Math.sin(t * 3) * 2 * s;
    ctx.fillStyle = fillGold(0.55);
    ctx.beginPath();
    ctx.moveTo(-11 * s, -55 * s);
    ctx.quadraticCurveTo(-4 * s, -56 * s + fw * 0.4, 1 * s, -54.5 * s + fw);
    ctx.quadraticCurveTo(-4 * s, -53.5 * s + fw * 0.4, -11 * s, -52.5 * s);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawGulls(t) {
    ctx.strokeStyle = gold(0.4); ctx.lineWidth = 1.4;
    for (var i = 0; i < gulls.length; i++) {
      var g = gulls[i], x = ((g.x + t * g.sp) % 1.1) * W, y = g.y * H + Math.sin(t + g.ph) * 6, w = 7 + Math.sin(t * 4 + g.ph) * 3;
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - 5, x, y); ctx.quadraticCurveTo(x, y - 5, x + w, y); ctx.stroke();
    }
  }

  // whale centered at (x,y), head facing +x before dir flip
  function whale(x, y, s, dir, t, ph) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    var flick = Math.sin(t * 1.4 + ph) * 0.18;
    var bodyGrad = ctx.createLinearGradient(0, -20, 0, 20);
    bodyGrad.addColorStop(0, 'rgba(199,161,78,.22)'); bodyGrad.addColorStop(1, 'rgba(199,161,78,.08)');
    ctx.fillStyle = bodyGrad; ctx.strokeStyle = gold(0.5); ctx.lineWidth = 1.4 / s;
    // body: rounded forehead, arched back, tapering tail stock
    ctx.beginPath();
    ctx.moveTo(74, 2);
    ctx.quadraticCurveTo(70, -12, 48, -16);
    ctx.quadraticCurveTo(20, -20, -8, -15);
    ctx.quadraticCurveTo(-30, -11, -52, -4);
    ctx.quadraticCurveTo(-60, -2, -64, 0);
    ctx.quadraticCurveTo(-58, 4, -46, 7);
    ctx.quadraticCurveTo(-20, 16, 14, 18);
    ctx.quadraticCurveTo(48, 17, 66, 9);
    ctx.quadraticCurveTo(73, 6, 74, 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // dorsal fin
    ctx.fillStyle = fillGold(0.2);
    ctx.beginPath(); ctx.moveTo(-2, -16); ctx.quadraticCurveTo(2, -24, 10, -22); ctx.quadraticCurveTo(4, -18, 2, -15); ctx.closePath(); ctx.fill(); ctx.stroke();
    // pectoral fin, gently rowing
    ctx.save(); ctx.translate(30, 10); ctx.rotate(0.5 + Math.sin(t + ph) * 0.08);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, 14, 4, 24); ctx.quadraticCurveTo(-4, 16, -3, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // two-lobed tail flukes with flick
    ctx.save(); ctx.translate(-64, 0); ctx.rotate(flick);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-10, -6, -16, -18);
    ctx.quadraticCurveTo(-17, -21, -22, -22);
    ctx.quadraticCurveTo(-14, -10, -12, -2);
    ctx.quadraticCurveTo(-14, 6, -22, 20);
    ctx.quadraticCurveTo(-16, 19, -14, 16);
    ctx.quadraticCurveTo(-9, 7, 0, 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // ventral pleats along the jaw
    ctx.strokeStyle = gold(0.22); ctx.lineWidth = 1 / s;
    for (var i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(58 - i * 3, 10 + i * 1.6); ctx.quadraticCurveTo(34, 14 + i * 1.4, 16, 15 + i); ctx.stroke();
    }
    // mouth line + eye
    ctx.strokeStyle = gold(0.4); ctx.lineWidth = 1.2 / s;
    ctx.beginPath(); ctx.moveTo(70, 4); ctx.quadraticCurveTo(52, 9, 36, 9); ctx.stroke();
    ctx.fillStyle = gold(0.75); ctx.beginPath(); ctx.arc(56, -1, 1.7, 0, 6.29); ctx.fill();
    // blowhole bubbles drifting up
    ctx.strokeStyle = gold(0.3); ctx.lineWidth = 1 / s;
    for (var b = 0; b < 3; b++) {
      var by = -24 - ((t * 6 + ph * 10 + b * 8) % 22);
      ctx.beginPath(); ctx.arc(46 + Math.sin(t + b) * 2, by, 1.6 + b * 0.5, 0, 6.29); ctx.stroke();
    }
    ctx.restore();
  }

  // merfolk: flowing hair, arched torso, scaled tail with two-lobed fin
  function merfolk(x, y, s, dir, t, ph) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    var sw = Math.sin(t * 1.6 + ph) * 0.16;
    // hair streaming behind the head
    ctx.strokeStyle = gold(0.45); ctx.lineWidth = 1.1 / s;
    for (var h = 0; h < 4; h++) {
      ctx.beginPath();
      ctx.moveTo(-2, -40);
      ctx.quadraticCurveTo(-10 - h * 3, -34 + Math.sin(t * 1.2 + h) * 2, -12 - h * 3.5, -20 + h * 3 + Math.sin(t + h) * 2);
      ctx.stroke();
    }
    // head
    ctx.fillStyle = fillGold(0.2); ctx.strokeStyle = gold(0.55); ctx.lineWidth = 1.2 / s;
    ctx.beginPath(); ctx.arc(0, -34, 6, 0, 6.29); ctx.fill(); ctx.stroke();
    // torso in a gentle S-curve
    ctx.beginPath();
    ctx.moveTo(-4.5, -29);
    ctx.quadraticCurveTo(-8, -18, -5, -8);
    ctx.quadraticCurveTo(-3, -4, -3.5, -2);
    ctx.lineTo(4, -2);
    ctx.quadraticCurveTo(7, -12, 4.8, -22);
    ctx.quadraticCurveTo(4, -27, 3.5, -29);
    ctx.quadraticCurveTo(0, -31, -4.5, -29);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // arm reaching forward, with fingers
    ctx.beginPath(); ctx.moveTo(3, -24); ctx.quadraticCurveTo(14, -22, 22, -26); ctx.quadraticCurveTo(25, -27.5, 27, -27); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(27, -27); ctx.lineTo(29.5, -28.2); ctx.moveTo(27, -27); ctx.lineTo(29.5, -26.2); ctx.stroke();
    // tail with scale rows and hip fin
    ctx.save(); ctx.translate(0, -2); ctx.rotate(sw);
    ctx.beginPath();
    ctx.moveTo(-3.5, 0);
    ctx.quadraticCurveTo(-8, 16, -3, 30);
    ctx.quadraticCurveTo(-1.5, 36, 0, 40);
    ctx.quadraticCurveTo(1.5, 36, 3, 30);
    ctx.quadraticCurveTo(8, 14, 4, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = gold(0.3); ctx.lineWidth = 0.9 / s;
    for (var r = 0; r < 4; r++) {
      ctx.beginPath(); ctx.arc(0, 4 + r * 7, 5.5 - r * 0.7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    ctx.strokeStyle = gold(0.5); ctx.fillStyle = fillGold(0.14);
    ctx.beginPath(); ctx.moveTo(4, 8); ctx.quadraticCurveTo(10, 10, 12, 16); ctx.quadraticCurveTo(7, 15, 4, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    // caudal fin with extra sway and fin rays
    ctx.save(); ctx.translate(0, 40); ctx.rotate(sw * 1.6);
    ctx.fillStyle = fillGold(0.16);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-9, 6, -13, 16);
    ctx.quadraticCurveTo(-6, 13, -2, 12);
    ctx.quadraticCurveTo(0, 14, 2, 12);
    ctx.quadraticCurveTo(6, 13, 13, 16);
    ctx.quadraticCurveTo(9, 6, 0, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = gold(0.3);
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-7, 12); ctx.moveTo(0, 2); ctx.lineTo(0, 12); ctx.moveTo(0, 2); ctx.lineTo(7, 12); ctx.stroke();
    ctx.restore();
    ctx.restore();
    // rising bubbles
    ctx.strokeStyle = gold(0.28); ctx.lineWidth = 1 / s;
    for (var b = 0; b < 3; b++) {
      var by = -44 - ((t * 5 + ph * 8 + b * 7) % 18);
      ctx.beginPath(); ctx.arc(8 + Math.sin(t * 1.3 + b) * 2, by, 1.2 + b * 0.4, 0, 6.29); ctx.stroke();
    }
    ctx.restore();
  }

  // ---- scenes ----
  var SC = {};
  SC.stars = function (t) {
    drawStars(t, 0.9);
    lighthouse(W * 0.5, HZ + 40, 1.1, t, true);
    sea(t, HZ + 44, 6, 0.6);
    drawGulls(t * 0.4);
  };
  SC.ship = function (t) {
    drawStars(t, 0.55);
    landMass(t);
    sea(t, HZ, 8, 0.7);
    var px = (W * 0.12) + ((t * 12) % (W * 0.62));
    ship(px, HZ - 6, 1.0, t);
    drawGulls(t * 0.5);
  };
  SC.sail = function (t) {
    drawStars(t, 0.6);
    // moon glow + reflection
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var mg = ctx.createRadialGradient(W * 0.5, HZ - 120, 0, W * 0.5, HZ - 120, 160);
    mg.addColorStop(0, 'rgba(255,235,180,.18)'); mg.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H); ctx.restore();
    sea(t, HZ, 7, 0.6);
    ship(W * 0.5 + Math.sin(t * 0.3) * 40, HZ - 4, 1.15, t);
    drawGulls(t * 0.5);
  };
  SC.whales = function (t) {
    ctx.fillStyle = 'rgba(6,16,28,.35)'; ctx.fillRect(0, 0, W, H);
    waterRays(t); drawBubbles(t);
    whale(W * 0.30 + Math.sin(t * 0.3) * 40, H * 0.42 + Math.sin(t * 0.5) * 18, 1.1, 1, t, 0);
    whale(W * 0.66 + Math.cos(t * 0.24) * 46, H * 0.60 + Math.cos(t * 0.4) * 16, 0.8, -1, t, 2);
  };
  SC.mermaid = function (t) {
    ctx.fillStyle = 'rgba(6,16,28,.4)'; ctx.fillRect(0, 0, W, H);
    waterRays(t); drawBubbles(t);
    var gap = 60 + Math.sin(t * 0.4) * 30;
    var cy = H * 0.5;
    // meeting glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var gg = ctx.createRadialGradient(W * 0.5, cy - 24, 0, W * 0.5, cy - 24, 90);
    gg.addColorStop(0, 'rgba(255,235,180,' + (0.14 + 0.06 * Math.sin(t)) + ')'); gg.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); ctx.restore();
    merfolk(W * 0.5 - gap, cy, 1.15, 1, t, 0);
    merfolk(W * 0.5 + gap, cy, 1.15, -1, t, 1.4);
  };
  SC.dawn = function (t) {
    // warm sunrise band on horizon
    ctx.save();
    var g = ctx.createLinearGradient(0, HZ - 160, 0, HZ + 30);
    g.addColorStop(0, 'rgba(20,24,44,0)'); g.addColorStop(0.7, 'rgba(210,120,70,.10)'); g.addColorStop(1, 'rgba(248,180,110,.20)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HZ + 30);
    ctx.globalCompositeOperation = 'lighter';
    var sg = ctx.createRadialGradient(W * 0.5, HZ, 0, W * 0.5, HZ, 150);
    sg.addColorStop(0, 'rgba(255,210,140,' + (0.30 + 0.06 * Math.sin(t)) + ')'); sg.addColorStop(1, 'rgba(255,210,140,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W * 0.5, HZ, 150, 0, 6.29); ctx.fill();
    ctx.restore();
    drawStars(t, Math.max(0, 0.3));
    sea(t, HZ, 6, 0.5, 'rgba(60,50,60,.5)');
    drawGulls(t * 0.5);
  };
  SC.storm = function (t) {
    // flash
    var flash = 0; var cyc = t % 6.5;
    if (cyc < 0.18) flash = 1 - cyc / 0.18; else if (cyc > 0.30 && cyc < 0.42) flash = (0.42 - cyc) / 0.12;
    if (flash > 0) { ctx.fillStyle = 'rgba(200,215,240,' + (0.16 * flash) + ')'; ctx.fillRect(0, 0, W, H); }
    // clouds
    ctx.save(); ctx.fillStyle = 'rgba(10,18,30,.5)';
    for (var i = 0; i < 4; i++) { var cx = ((i / 4) * W + t * 8) % (W + 200) - 100, cy = 60 + i * 22; ctx.beginPath(); ctx.ellipse(cx, cy, 150, 34, 0, 0, 6.29); ctx.fill(); }
    ctx.restore();
    // bolt on flash
    if (flash > 0.4) {
      ctx.strokeStyle = 'rgba(220,230,255,' + flash + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); var bx = W * (0.3 + 0.4 * ((t | 0) % 3) / 3);
      ctx.moveTo(bx, 40); ctx.lineTo(bx - 14, 120); ctx.lineTo(bx + 6, 130); ctx.lineTo(bx - 10, 220); ctx.stroke();
    }
    // rain
    ctx.strokeStyle = 'rgba(180,200,230,.22)'; ctx.lineWidth = 1;
    for (var r = 0; r < rain.length; r++) {
      var d = rain[r], y = (d.y + (t * d.sp % 1)) % 1, x = (d.x + y * 0.06) % 1;
      ctx.beginPath(); ctx.moveTo(x * W, y * H); ctx.lineTo(x * W - 3, y * H + d.l); ctx.stroke();
    }
    lighthouse(W * 0.16, HZ + 20, 1.15, t, true);
    sea(t, HZ + 24, 16, 1.5);
  };

  // warm sun sinking into the sea, layered cloud bands and a rippling sun-path
  SC.sunset = function (t) {
    ctx.save();
    // graded sky: deep violet aloft, ember at the waterline
    var sky = ctx.createLinearGradient(0, 0, 0, HZ + 20);
    sky.addColorStop(0, 'rgba(28,22,52,.55)');
    sky.addColorStop(0.45, 'rgba(122,62,86,.34)');
    sky.addColorStop(0.78, 'rgba(214,112,66,.30)');
    sky.addColorStop(1, 'rgba(248,170,96,.34)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ + 20);

    var sunY = HZ - 18 + Math.sin(t * 0.12) * 4;
    ctx.globalCompositeOperation = 'lighter';
    var halo = ctx.createRadialGradient(W * 0.5, sunY, 0, W * 0.5, sunY, 230);
    halo.addColorStop(0, 'rgba(255,196,120,' + (0.30 + 0.05 * Math.sin(t * 0.8)) + ')');
    halo.addColorStop(0.5, 'rgba(240,140,80,.10)');
    halo.addColorStop(1, 'rgba(240,140,80,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(W * 0.5, sunY, 230, 0, 6.29); ctx.fill();
    // the disc, clipped where it meets the horizon
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, HZ + 2); ctx.clip();
    var disc = ctx.createRadialGradient(W * 0.5, sunY, 0, W * 0.5, sunY, 46);
    disc.addColorStop(0, 'rgba(255,236,190,.95)'); disc.addColorStop(1, 'rgba(255,170,90,.55)');
    ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(W * 0.5, sunY, 46, 0, 6.29); ctx.fill();
    ctx.restore();
    ctx.restore();

    // drifting cloud bands crossing the disc
    ctx.save();
    for (var c = 0; c < 5; c++) {
      var cw = 190 + c * 46;
      var cx = ((c / 5) * (W + 420) + t * (5 + c * 2.4)) % (W + 420) - 210;
      var cy = HZ - 150 + c * 26 + Math.sin(t * 0.3 + c) * 4;
      ctx.fillStyle = 'rgba(48,30,44,' + (0.20 - c * 0.025) + ')';
      ctx.beginPath(); ctx.ellipse(cx, cy, cw, 12 + c * 2, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,180,110,' + (0.05 - c * 0.008) + ')';
      ctx.beginPath(); ctx.ellipse(cx, cy + 3, cw * 0.8, 4, 0, 0, 6.29); ctx.fill();
    }
    ctx.restore();

    drawStars(t, 0.18);
    sea(t, HZ, 6, 0.5, 'rgba(70,42,48,.55)');

    // shimmering sun-path: many short, jittered glints that widen with distance
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 34; i++) {
      var f = i / 34;
      var yy = HZ + 4 + f * (H - HZ) * 0.62;
      var spread = 8 + f * f * 130;
      var glints = 1 + (i % 3);
      for (var k = 0; k < glints; k++) {
        var jitter = Math.sin(t * 2.2 + i * 1.7 + k * 2.3);
        var cx = W * 0.5 + jitter * spread * 0.55;
        var len = (14 + f * 46) * (0.5 + 0.5 * Math.abs(Math.cos(t * 1.6 + i + k)));
        ctx.fillStyle = 'rgba(255,196,130,' + (0.16 * (1 - f) * (0.45 + 0.55 * Math.abs(jitter))) + ')';
        ctx.fillRect(cx - len / 2, yy, len, 1.6 + f * 1.6);
      }
    }
    ctx.restore();
    drawGulls(t * 0.45);
  };

  // one aurora band, drawn as dense overlapping vertical curtains so the edges
  // feather out. `dir` = 1 draws downward (sky), -1 mirrors it (reflection).
  // `wob` adds a horizontal water-ripple displacement, `fade` scales opacity.
  function auroraBand(t, b, originY, dir, fade, wob, cw, step) {
    cw = cw || 13;
    step = step || 7;
    var hue = b === 0 ? '120,210,180' : (b === 1 ? '150,190,230' : '210,180,140');
    var peak = (0.15 + 0.05 * Math.sin(t * 0.5 + b)) * fade;
    var offY = 120 + b * 58;
    // step 7 with width 13 keeps columns overlapping (no moiré) at ~half the
    // per-frame gradient allocations of a finer step
    for (var x = -8; x <= W; x += step) {
      var lift = Math.sin(x / 190 + t * 0.32 + b * 1.7) * 30 + Math.sin(x / 70 - t * 0.5 + b) * 9;
      var hgt = 78 + Math.sin(x / 110 + t * 0.4 + b) * 26;
      // slow, long-wavelength ripple so the curtain breathes instead of striping
      var a = peak * (0.6 + 0.4 * Math.sin(x / 130 + t * 0.9 + b * 2.1));
      if (a <= 0.002) continue;
      var top = originY + dir * (offY + lift);
      var y0 = dir > 0 ? top - 30 : top - hgt;
      var xw = wob ? x + Math.sin(x / 34 + t * 1.9 + b) * wob : x;
      var cg = ctx.createLinearGradient(0, y0, 0, y0 + hgt + 30);
      var stopA = dir > 0 ? 0.4 : 0.6;
      cg.addColorStop(0, 'rgba(' + hue + ',0)');
      cg.addColorStop(stopA, 'rgba(' + hue + ',' + a + ')');
      cg.addColorStop(1, 'rgba(' + hue + ',0)');
      ctx.fillStyle = cg;
      ctx.fillRect(xw, y0, cw, hgt + 30);
    }
  }

  // slow aurora ribbons over a calm sea, mirrored in the water — the AI scene
  SC.aurora = function (t) {
    drawStars(t, 0.85);
    var horizon = HZ + 30;

    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // sky bands keep the fine 13px/7px columns — coarser steps show seams
    for (var b = 0; b < 3; b++) auroraBand(t, b, 0, 1, 1, 0);
    ctx.restore();

    // Reflection: a true mirror of a high aurora would land far below the
    // viewport, so flip about the horizon and compress vertically (scale -k).
    // Clipped to the water so it can never bleed back into the sky.
    // K keeps the mirrored bands hugging the horizon; wider columns hide the
    // per-column seams that the dimmer reflection would otherwise reveal.
    var K = 0.17;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, horizon, W, H - horizon); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(0, horizon); ctx.scale(1, -K); ctx.translate(0, -horizon);
    // 22px columns on a 14px step still overlap, at half the gradient count
    for (var b2 = 0; b2 < 3; b2++) auroraBand(t, b2, 0, 1, 0.5, 10, 22, 14);
    ctx.restore();

    // wave crests ride over the reflection
    sea(t, horizon, 7, 0.55, 'rgba(16,36,54,.42)');

    // extra ripple lines catching the aurora light
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 9; i++) {
      var f = i / 9;
      var yy = horizon + 10 + f * (H - horizon) * 0.7;
      ctx.strokeStyle = 'rgba(150,205,200,' + (0.08 * (1 - f)) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var x2 = 0; x2 <= W; x2 += 14) {
        var wy = yy + Math.sin(x2 / (70 + i * 12) + t * (0.7 + f)) * (2 + f * 5);
        if (x2 === 0) ctx.moveTo(x2, wy); else ctx.lineTo(x2, wy);
      }
      ctx.stroke();
    }
    ctx.restore();

    lighthouse(W * 0.82, horizon + 4, 0.9, t, false);
  };

  var draw = SC[scene] || SC.stars;
  var t0 = performance.now();
  function frame(now) {
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    draw(t);
    if (!reduce) requestAnimationFrame(frame);
  }
  if (reduce) { draw(3.0); } else { requestAnimationFrame(frame); }
})();
