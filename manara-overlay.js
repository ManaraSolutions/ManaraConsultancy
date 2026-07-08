/* Manara — overlay bootstrap for the bundled/compiled pages.
   The page's template runtime rebuilds the whole <head> after load, which
   discards any stylesheet <link> present in the source HTML. This script's
   closures survive that rebuild, so it re-injects the overlay stylesheet
   whenever it goes missing, and upgrades the Captain Marlow pirate icon
   to a more detailed illustration. Purely additive — no app logic touched. */
(function () {
  var CSS_ID = 'manara-overlay-css';
  var CSS_HREF = 'assets/css/manara-overlay.css?v=3';

  function injectCss() {
    if (document.getElementById(CSS_ID)) return;
    var link = document.createElement('link');
    link.id = CSS_ID;
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    (document.head || document.documentElement).appendChild(link);
  }

  /* Refined sea-captain portrait (64x64) replacing the flat cartoon face:
     weathered skin, grey beard, eyepatch, tricorn hat with gold trim. */
  var CAPTAIN_SVG =
    '<defs>' +
    '<radialGradient id="mnrSkin" cx="45%" cy="35%" r="70%">' +
    '<stop offset="0%" stop-color="#f2d4ac"/><stop offset="70%" stop-color="#dfb184"/><stop offset="100%" stop-color="#c69663"/>' +
    '</radialGradient>' +
    '<linearGradient id="mnrHat" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#2b4059"/><stop offset="100%" stop-color="#141f2c"/>' +
    '</linearGradient>' +
    '<linearGradient id="mnrBeard" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#9a9186"/><stop offset="100%" stop-color="#5f574d"/>' +
    '</linearGradient>' +
    '<linearGradient id="mnrCoat" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#22354c"/><stop offset="100%" stop-color="#101a26"/>' +
    '</linearGradient>' +
    '</defs>' +
    '<ellipse cx="32" cy="58" rx="15" ry="3.4" fill="rgba(0,0,0,.28)"/>' +
    '<path d="M15 58 Q22 46 32 46 Q42 46 49 58 Z" fill="url(#mnrCoat)"/>' +
    '<path d="M28 47 L32 52 L36 47" fill="none" stroke="#C7A14E" stroke-width="1.1"/>' +
    '<circle cx="32" cy="54.5" r="1" fill="#C7A14E"/>' +
    '<circle cx="32" cy="34" r="13.5" fill="url(#mnrSkin)"/>' +
    '<path d="M20.5 30 q-1.5 6 1.5 10" stroke="#b78c5e" stroke-width=".8" fill="none" opacity=".6"/>' +
    '<path d="M43.5 30 q1.5 6 -1.5 10" stroke="#b78c5e" stroke-width=".8" fill="none" opacity=".6"/>' +
    '<path d="M19 36 Q19.5 51 32 52.5 Q44.5 51 45 36 Q41 45 32 45 Q23 45 19 36 Z" fill="url(#mnrBeard)"/>' +
    '<path d="M24 44 q1 4 3 6 M32 46 l0 5.5 M40 44 q-1 4 -3 6" stroke="#4c453c" stroke-width=".9" fill="none" opacity=".7"/>' +
    '<path d="M26 40.5 q3 2.6 6 2.6 q3 0 6 -2.6" fill="none" stroke="#4a3423" stroke-width="1.4" stroke-linecap="round"/>' +
    '<path d="M25.5 39 q3.2 -2 6.5 -.6 M38.5 39 q-3.2 -2 -6.5 -.6" stroke="#8a8378" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M31 30.5 q1.6 3.5 .2 5.5 q1.4 .9 2.6 .2" fill="none" stroke="#b58455" stroke-width="1.1" stroke-linecap="round"/>' +
    '<path d="M17.5 29.5 L46.5 25.5" stroke="#171310" stroke-width="2.4" stroke-linecap="round"/>' +
    '<ellipse cx="39" cy="29.6" rx="5" ry="4.5" fill="#171310"/>' +
    '<path d="M36.2 27.4 q2.6 -1.4 5 0" stroke="#3d332a" stroke-width=".8" fill="none"/>' +
    '<path d="M22.5 29.5 q3 -2.6 6.6 -.4 q-1.4 3 -3.6 3 q-2.2 0 -3 -2.6 Z" fill="#fdf6ea"/>' +
    '<circle cx="26" cy="30" r="1.9" fill="#4c3319"/>' +
    '<circle cx="26.6" cy="29.4" r=".6" fill="#fff"/>' +
    '<path d="M21.5 26.5 q3.5 -2.2 7.5 -1" stroke="#6b5a45" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
    '<circle cx="45.8" cy="40.5" r="2" fill="none" stroke="#C7A14E" stroke-width="1.4"/>' +
    '<path d="M10.5 23.5 Q32 4.5 53.5 23.5 L50 27.5 Q32 13.5 14 27.5 Z" fill="url(#mnrHat)"/>' +
    '<path d="M14 27.5 Q32 13.5 50 27.5" fill="none" stroke="#C7A14E" stroke-width="1.4"/>' +
    '<path d="M10.5 23.5 Q32 4.5 53.5 23.5" fill="none" stroke="#0c141d" stroke-width="1"/>' +
    '<path d="M32 15.5 l1.1 2.3 2.5 .35 -1.8 1.75 .45 2.5 -2.25 -1.2 -2.25 1.2 .45 -2.5 -1.8 -1.75 2.5 -.35 Z" fill="#E6CC8C"/>' +
    '<path d="M16 30 q-2 3 -1.5 6 M48 30 q2 3 1.5 6" stroke="#8a8378" stroke-width="1.6" fill="none" stroke-linecap="round"/>';

  function upgradePirate() {
    var btns = document.querySelectorAll('button[aria-label="Another joke from the captain"] svg');
    btns.forEach(function (svg) {
      if (svg.getAttribute('data-manara-captain')) return;
      svg.setAttribute('data-manara-captain', '1');
      svg.innerHTML = CAPTAIN_SVG;
    });
  }

  /* Realistic, self-animating HRM icon: a manager node at the centre of a
     living team network — connectors, pulsing team members, a slowly
     rotating orbit ring and a breathing halo. SMIL keeps it self-contained. */
  var HRM_SVG =
    '<rect width="52" height="52" fill="#12263d"/>' +
    '<circle cx="26" cy="26" r="21" fill="none" stroke="rgba(199,161,78,.32)" stroke-width="1.1" stroke-dasharray="3 5">' +
    '<animateTransform attributeName="transform" type="rotate" from="0 26 26" to="360 26 26" dur="24s" repeatCount="indefinite"/>' +
    '</circle>' +
    '<g stroke="rgba(199,161,78,.5)" stroke-width="1.3">' +
    '<line x1="26" y1="26" x2="26" y2="9"/><line x1="26" y1="26" x2="11" y2="40"/><line x1="26" y1="26" x2="41" y2="40"/>' +
    '</g>' +
    '<g fill="#E6CC8C">' +
    '<g transform="translate(26,9)"><circle r="3.6"/><animate attributeName="opacity" values=".45;1;.45" dur="2.6s" repeatCount="indefinite"/></g>' +
    '<g transform="translate(11,40)"><circle r="3.6"/><animate attributeName="opacity" values=".45;1;.45" dur="2.6s" begin="0.85s" repeatCount="indefinite"/></g>' +
    '<g transform="translate(41,40)"><circle r="3.6"/><animate attributeName="opacity" values=".45;1;.45" dur="2.6s" begin="1.7s" repeatCount="indefinite"/></g>' +
    '</g>' +
    '<circle cx="26" cy="26" r="8.6" fill="none" stroke="rgba(230,204,140,.55)" stroke-width="1">' +
    '<animate attributeName="r" values="8.6;13;8.6" dur="3.2s" repeatCount="indefinite"/>' +
    '<animate attributeName="opacity" values=".55;0;.55" dur="3.2s" repeatCount="indefinite"/>' +
    '</circle>' +
    '<circle cx="26" cy="26" r="8.6" fill="#0C1A2A" stroke="#C7A14E" stroke-width="1.4"/>' +
    '<circle cx="26" cy="23.4" r="2.7" fill="#E6CC8C"/>' +
    '<path d="M21.4 30.8 q0 -4.2 4.6 -4.2 t4.6 4.2 z" fill="#E6CC8C"/>';

  function upgradeHrmIcon() {
    // the HRM avatar svg is the one containing the shoulders path "M10 50 q0 -14 16 -14"
    var shoulder = document.querySelector('svg path[d^="M10 50 q0 -14 16 -14"]');
    if (shoulder) {
      var svg = shoulder.closest('svg');
      if (svg && !svg.getAttribute('data-manara-hrm')) {
        svg.setAttribute('data-manara-hrm', '1');
        svg.setAttribute('viewBox', '0 0 52 52');
        svg.innerHTML = HRM_SVG;
      }
    }
  }

  function tagHrCard() {
    // give the "HR Consultancy" service card a class so CSS can glass it up
    document.querySelectorAll('div[style*="border-radius: 20px"]').forEach(function (card) {
      if (card.getAttribute('data-manara-hr')) return;
      var t = (card.textContent || '').trim();
      if (t.indexOf('HR Consultancy') === 0) {
        card.setAttribute('data-manara-hr', '1');
        card.classList.add('manara-hr-card');
      }
    });
  }

  function injectAboutNav() {
    // desktop nav (.navlinks) and mobile nav (.nav-main) are separate markup
    document.querySelectorAll('.navlinks, .nav-main').forEach(function (nav) {
      if (nav.querySelector('[data-manara-about]')) return;
      var a = document.createElement('a');
      a.href = 'about.html';
      a.textContent = 'About';
      a.setAttribute('data-manara-about', '1');
      a.className = 'scp0';
      a.style.cssText = 'font-size:13.5px;letter-spacing:.04em;color:#EBE2CF;';
      // place just before the Contact link if present, else append
      var contact = [].slice.call(nav.children).filter(function (c) {
        return /^Contact/.test((c.textContent || '').trim());
      })[0];
      if (contact) nav.insertBefore(a, contact);
      else nav.appendChild(a);
    });
  }

  function tick() {
    injectCss();
    upgradePirate();
    upgradeHrmIcon();
    tagHrCard();
    injectAboutNav();
  }

  var mo = new MutationObserver(function () {
    // cheap: runs at most once per animation frame
    if (mo._raf) return;
    mo._raf = requestAnimationFrame(function () {
      mo._raf = null;
      tick();
    });
  });

  function arm() {
    tick();
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arm);
  } else {
    arm();
  }
  window.addEventListener('load', tick);
  setTimeout(tick, 1500);
  setTimeout(tick, 4000);
})();
