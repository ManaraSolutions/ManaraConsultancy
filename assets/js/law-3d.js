/* Manara — Legal page 3D emblem. A slow-turning cube whose six faces carry the
   disciplines of the practice (justice, corporate, arbitration, real estate,
   family, AI law). CSS drives the idle rotation; this adds drag-to-spin and a
   pause on hover, so the piece feels alive without stealing the page's calm.
   Additive and dependency-free. */
(function () {
  'use strict';
  var cube = document.getElementById('lawCube');
  var stage = document.getElementById('lawStage');
  if (!cube || !stage) return;

  var rx = -18, ry = 0;           // current orientation
  var dragging = false, px = 0, py = 0, moved = false;

  function apply() {
    cube.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
  }

  function down(e) {
    dragging = true; moved = false;
    px = e.clientX; py = e.clientY;
    cube.classList.add('is-drag');       // freezes the CSS keyframe
    // The idle keyframe only turns Y (X tilt is constant), so read just the live
    // Y angle to continue smoothly; keep the stored X tilt to avoid a gimbal jump.
    try {
      var m = new DOMMatrixReadOnly(getComputedStyle(cube).transform);
      ry = Math.atan2(m.m13, m.m11) * 180 / Math.PI;
    } catch (e) { /* keep current ry */ }
    apply();
  }
  function move(e) {
    if (!dragging) return;
    var dx = e.clientX - px, dy = e.clientY - py;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    ry += dx * 0.5;
    rx = Math.max(-80, Math.min(80, rx - dy * 0.5));
    px = e.clientX; py = e.clientY;
    apply();
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    // resume idle spin from where the visitor left it
    cube.style.setProperty('--ry0', ry + 'deg');
    cube.style.setProperty('--rx0', rx + 'deg');
    cube.style.transform = '';            // hand control back to the keyframe
    cube.classList.remove('is-drag');
  }

  stage.addEventListener('pointerdown', function (e) { e.preventDefault(); down(e); });
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);

  /* Each face is also a shortcut into its discipline's section — but only on a
     genuine click, never at the end of a drag (which would hijack the release). */
  [].slice.call(cube.querySelectorAll('.law-face')).forEach(function (face) {
    face.addEventListener('click', function () {
      if (moved) return;
      var sel = face.getAttribute('data-scroll');
      var target = sel && document.querySelector(sel);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Subtle front-face highlight: whichever face is turned toward the viewer gets
     brightened. We read the cube's live (animated) matrix and each face's own
     static matrix, combine them, and pick the face whose outward normal points
     most toward the camera (largest world +Z). Throttled — no per-frame cost. */
  (function () {
    if (typeof DOMMatrixReadOnly === 'undefined') return;
    var faces = [].slice.call(cube.querySelectorAll('.law-face'));
    var faceMats = null;
    function detect() {
      var cm;
      try { cm = new DOMMatrixReadOnly(getComputedStyle(cube).transform); } catch (e) { return; }
      if (!faceMats) {
        faceMats = faces.map(function (f) {
          try { return new DOMMatrixReadOnly(getComputedStyle(f).transform); }
          catch (e) { return new DOMMatrixReadOnly(); }
        });
      }
      var best = 0, bestZ = -Infinity;
      for (var i = 0; i < faces.length; i++) {
        var m = cm.multiply(faceMats[i]);   // world normal = cube * face applied to +Z
        if (m.m33 > bestZ) { bestZ = m.m33; best = i; }
      }
      for (var j = 0; j < faces.length; j++) {
        faces[j].classList.toggle('is-front-face', j === best);
      }
    }
    setInterval(detect, 140);
    detect();
  })();
})();
