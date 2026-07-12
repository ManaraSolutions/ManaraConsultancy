/* Manara Consultancy — shared UI behavior.
   Scroll-reveal (with per-group stagger) + animated counters.
   Respects prefers-reduced-motion. Pairs with assets/css/manara-theme.css. */
(function () {
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // ---- stagger: index each [data-reveal] within its parent so CSS
  // transition-delay (var(--i)) fans siblings out instead of firing at once ----
  (function indexReveals() {
    var seen = [];
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      var parent = el.parentElement;
      var idx = seen.indexOf(parent);
      if (idx === -1) { seen.push(parent); parent.__manaraCount = 0; idx = seen.length - 1; }
      var count = parent.__manaraCount || 0;
      el.style.setProperty('--i', reduce ? 0 : Math.min(count, 8));
      parent.__manaraCount = count + 1;
    });
  })();

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  // fallback in case IntersectionObserver never fires (e.g. hidden ancestor)
  setTimeout(function () {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }, 900);

  // ---- animated counters: <span data-counter="250" data-suffix="+">0</span> ----
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-counter'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = (el.getAttribute('data-decimals') || '0') | 0;
    if (reduce) {
      el.textContent = target.toFixed(decimals) + suffix;
      el.classList.add('in');
      return;
    }
    var duration = parseFloat(el.getAttribute('data-duration') || '1600');
    var start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.classList.add('in');
    }
    requestAnimationFrame(tick);
  }
  var counterIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-counter]').forEach(function (el) { counterIo.observe(el); });

  // ---- respect reduced motion for autoplaying ambient videos ----
  if (reduce) {
    document.querySelectorAll('video[autoplay]').forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
    });
  } else {
    // some browsers ignore the autoplay attribute until a play() nudge
    window.addEventListener('load', function () {
      document.querySelectorAll('video[autoplay]').forEach(function (v) {
        v.muted = true;
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* poster stays visible */ });
      });
    });
  }

  // ---- footer social icons now live directly in each page's markup
  //      (LinkedIn / Instagram / Facebook in .fin .social), so no injection here. ----

  // ---- surface the About page in shared chrome (header, footer, explore lists) ----
  (function injectAbout() {
    var onAbout = /\/about\.html$/.test(location.pathname);

    // header: add an About pill before the "Back to Manara" button
    var hin = document.querySelector('header .hin');
    if (hin && !onAbout && !hin.querySelector('[data-manara-about]')) {
      var back = hin.querySelector('.back');
      var a = document.createElement('a');
      a.href = 'about.html';
      a.className = 'back';
      a.textContent = 'About';
      a.setAttribute('data-manara-about', '1');
      if (back && back.parentElement === hin) hin.insertBefore(a, back);
      else hin.appendChild(a);
    }

    // footer: prepend an About Manara link
    var fin = document.querySelector('footer .fin');
    if (fin && !fin.querySelector('[data-manara-about]')) {
      var wrap = document.createElement('span');
      var fa = document.createElement('a');
      fa.href = 'about.html';
      fa.textContent = 'About Manara';
      fa.setAttribute('data-manara-about', '1');
      fa.style.color = '#E6CC8C';
      fa.style.borderBottom = '1px solid rgba(230,204,140,.5)';
      wrap.appendChild(fa);
      fin.insertBefore(wrap, fin.firstChild);
    }

    // "Explore more from Manara" lists: prepend an About card
    if (!onAbout) {
      document.querySelectorAll('.xgrid').forEach(function (g) {
        if (g.querySelector('[data-manara-about]')) return;
        var c = document.createElement('a');
        c.className = 'xl';
        c.href = 'about.html';
        c.setAttribute('data-manara-about', '1');
        c.innerHTML = '<strong>About Manara</strong><span>Our story, vision and mission</span>';
        g.insertBefore(c, g.firstChild);
      });
    }
  })();
})();
