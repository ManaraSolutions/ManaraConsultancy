/* Manara — overlay bootstrap for the bundled/compiled pages.
   The page's template runtime rebuilds the whole <head> after load, which
   discards any stylesheet <link> present in the source HTML. This script's
   closures survive that rebuild, so it re-injects the overlay stylesheet
   whenever it goes missing, and upgrades the Captain Marlow pirate icon
   to a more detailed illustration. Purely additive — no app logic touched. */
(function () {
  var CSS_ID = 'manara-overlay-css';
  var CSS_HREF = 'assets/css/manara-overlay.css?v=22';

  function injectCss() {
    if (document.getElementById(CSS_ID)) return;
    var link = document.createElement('link');
    link.id = CSS_ID;
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    (document.head || document.documentElement).appendChild(link);
  }

  /* ---------------------------------------------------------------------
     The lighthouse keeper: a full-body figure holding a lit lantern.

     Drawn in a 48x72 viewBox. The old captain was 64x64, a head-and-shoulders
     crop that simply has no room for legs. All motion is CSS, driven by a state
     class on the <svg>: .is-idle, .is-walk, .is-sit, .is-wave. Groups carry
     `transform-box: view-box` so transform-origin can be written in viewBox
     units instead of pixels of the rendered box.

     He sways while standing, strides and paces across while walking, folds onto
     a stool when sitting, and raises his free hand to wave. The lantern flickers
     throughout: it is the one thing that never stops.
     --------------------------------------------------------------------- */
  var KEEPER_SVG =
    '<defs>' +
    '<linearGradient id="kCoat" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#27405a"/><stop offset="1" stop-color="#0f1c2a"/></linearGradient>' +
    '<radialGradient id="kSkin" cx="42%" cy="35%" r="70%">' +
    '<stop offset="0" stop-color="#f0d0a8"/><stop offset="1" stop-color="#cf9f6f"/></radialGradient>' +
    '<radialGradient id="kGlow">' +
    '<stop offset="0" stop-color="rgba(255,228,155,.95)"/>' +
    '<stop offset="45%" stop-color="rgba(255,205,110,.32)"/>' +
    '<stop offset="100%" stop-color="rgba(255,200,110,0)"/></radialGradient>' +
    '<linearGradient id="kGlass" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#fff5d6"/><stop offset="1" stop-color="#ffcf72"/></linearGradient>' +
    '</defs>' +

    '<ellipse class="k-shadow" cx="24" cy="68.6" rx="12.5" ry="2.3" fill="rgba(0,0,0,.34)"/>' +

    '<g class="k-stool">' +
    '<rect x="14.6" y="56.2" width="18.8" height="2.8" rx="1.2" fill="#26333f"/>' +
    '<path d="M17.4 59 L16 67 M30.6 59 L32 67" stroke="#26333f" stroke-width="1.7" stroke-linecap="round"/>' +
    '</g>' +

    '<g class="k-figure">' +

    '<g class="k-leg k-leg-l">' +
    '<rect x="17.6" y="42.6" width="5.3" height="13.2" rx="2.6" fill="#16273a"/>' +
    '<g class="k-shin k-shin-l">' +
    '<rect x="17.9" y="54" width="4.7" height="11.4" rx="2.3" fill="#16273a"/>' +
    '<rect x="16.4" y="63.6" width="7.5" height="4.2" rx="1.6" fill="#0e1a27"/>' +
    '</g></g>' +
    '<g class="k-leg k-leg-r">' +
    '<rect x="25.1" y="42.6" width="5.3" height="13.2" rx="2.6" fill="#132234"/>' +
    '<g class="k-shin k-shin-r">' +
    '<rect x="25.4" y="54" width="4.7" height="11.4" rx="2.3" fill="#132234"/>' +
    '<rect x="24.1" y="63.6" width="7.5" height="4.2" rx="1.6" fill="#0b1622"/>' +
    '</g></g>' +

    '<rect x="22.3" y="20.6" width="3.4" height="5.6" rx="1.5" fill="#cf9f6f"/>' +
    '<path d="M16.5 26 Q24 22.6 31.5 26 L34 50.6 Q24 54.6 14 50.6 Z" fill="url(#kCoat)"/>' +
    '<path d="M20.4 25.2 L24 30 L27.6 25.2" fill="none" stroke="rgba(230,204,140,.22)" stroke-width=".7"/>' +
    '<path d="M24 24.6 L24 51.6" stroke="rgba(230,204,140,.26)" stroke-width=".8"/>' +
    '<rect x="16.2" y="43.4" width="15.6" height="2.4" rx="1.1" fill="#C7A14E" opacity=".6"/>' +
    '<circle cx="24" cy="44.6" r="1.05" fill="#E6CC8C"/>' +
    '<path d="M18.6 25.7 Q24 28.7 29.4 25.7 L28.9 28.1 Q24 30.7 19.1 28.1 Z" fill="#7d2f2a"/>' +

    '<g class="k-arm-lantern">' +
    '<path d="M30.6 28.4 L35.6 21.6" stroke="#31506f" stroke-width="4.4" stroke-linecap="round"/>' +
    '<circle cx="36" cy="20.9" r="2.3" fill="url(#kSkin)"/>' +
    '<path d="M36 22.6 L36 25.4" stroke="#C7A14E" stroke-width="1"/>' +
    '<g class="k-lantern">' +
    '<circle class="k-glow" cx="36" cy="30.2" r="16" fill="url(#kGlow)"/>' +
    '<path d="M32.9 25.4 h6.2 l.8 1.6 h-7.8 z" fill="#C7A14E"/>' +
    '<rect x="33.2" y="27" width="5.6" height="6.4" fill="url(#kGlass)"/>' +
    '<path d="M34.9 27 v6.4 M36.8 27 v6.4" stroke="rgba(120,80,20,.45)" stroke-width=".45"/>' +
    '<rect x="32.6" y="33.4" width="6.8" height="1.7" rx=".7" fill="#C7A14E"/>' +
    '<circle class="k-core" cx="36" cy="30.2" r="2.6" fill="rgba(255,246,214,.95)"/>' +
    '</g></g>' +

    '<g class="k-arm-wave">' +
    '<path d="M17.4 28.4 L12.4 20.8" stroke="#31506f" stroke-width="4.4" stroke-linecap="round"/>' +
    '<circle cx="12" cy="19.7" r="2.4" fill="url(#kSkin)"/>' +
    '</g>' +

    '<circle cx="24" cy="16.4" r="6.2" fill="url(#kSkin)"/>' +
    '<circle cx="21.6" cy="16.3" r="1.05" fill="#2a2119"/><circle cx="26.4" cy="16.3" r="1.05" fill="#2a2119"/>' +
    '<circle cx="22" cy="15.9" r=".34" fill="#fff"/><circle cx="26.8" cy="15.9" r=".34" fill="#fff"/>' +
    '<path d="M19.9 13.9 q1.6 -1 3 -.3 M25.1 13.6 q1.4 -.7 3 .3" stroke="#6b5a45" stroke-width=".9" fill="none" stroke-linecap="round"/>' +
    // beard on the jaw only, and a moustache above it, so the face stays a face
    '<path d="M20.6 20.4 Q21 25 24 25.6 Q27 25 27.4 20.4 Q25.8 22.5 24 22.5 Q22.2 22.5 20.6 20.4 Z" fill="#8e8880"/>' +
    '<path d="M21.9 19.6 q2.1 1.3 4.2 0 q-1 1.6 -2.1 1.6 q-1.1 0 -2.1 -1.6 Z" fill="#7b756c"/>' +
    '<path d="M22.6 22.6 q1.4 .8 2.8 0" stroke="#7a4a3b" stroke-width=".7" fill="none" stroke-linecap="round"/>' +
    '<path d="M18.2 12.4 Q24 7.2 29.8 12.4 Z" fill="#16283c"/>' +
    '<rect x="16.6" y="12" width="14.8" height="2.2" rx="1.1" fill="#0e1c2b"/>' +
    '<circle cx="24" cy="10.1" r="1.1" fill="#E6CC8C"/>' +

    '</g>';

  // the aria-label changes with the art, so match either wording
  var CAPTAIN_BTN = 'button[aria-label*="captain"], button[aria-label*="keeper"]';

  /* idle -> wave -> walk -> idle -> sit, then round again */
  var KEEPER_CYCLE = [
    ['is-idle', 4200],
    ['is-wave', 2400],
    ['is-walk', 5200],
    ['is-idle', 2600],
    ['is-sit', 6000]
  ];
  var KEEPER_STATES = ['is-idle', 'is-walk', 'is-sit', 'is-wave'];

  function armKeeper(svg) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setState(s) {
      KEEPER_STATES.forEach(function (c) { svg.classList.remove(c); });
      void svg.getBoundingClientRect();   // reflow, so a repeated state restarts
      svg.classList.add(s);
    }
    if (reduce) { setState('is-idle'); return; }

    var i = 0;
    function step() {
      var frame = KEEPER_CYCLE[i % KEEPER_CYCLE.length];
      setState(frame[0]);
      i++;
      svg.__mnrTimer = setTimeout(step, frame[1]);
    }
    step();

    // clicking the keeper makes him wave back, then the cycle resumes
    var btn = svg.closest('button');
    if (btn && !btn.__mnrWaveBound) {
      btn.__mnrWaveBound = true;
      btn.addEventListener('click', function () {
        // a tap on the keeper summons his wisdom back if it was dismissed
        window.__mnrCaptainClosed = false;
        var w = btn.parentElement;
        if (w) w.classList.remove('is-dismissed');
        clearTimeout(svg.__mnrTimer);
        setState('is-wave');
        i = 2;   // resume at the walk that follows a wave
        svg.__mnrTimer = setTimeout(step, 2400);
      });
    }
  }

  function upgradePirate() {
    document.querySelectorAll(CAPTAIN_BTN).forEach(function (btn) {
      var label = btn.getAttribute('aria-label') || '';
      if (label.indexOf('captain') > -1) {
        btn.setAttribute('aria-label', 'Another reflection from the lighthouse keeper');
      }
      var svg = btn.querySelector('svg');
      if (!svg || svg.__mnrKeeper) return;
      svg.__mnrKeeper = true;
      svg.setAttribute('viewBox', '0 0 48 72');
      svg.setAttribute('width', '58');
      svg.setAttribute('height', '87');
      svg.classList.add('mnr-keeper');
      svg.innerHTML = KEEPER_SVG;
      armKeeper(svg);
    });
  }


  /* ---------------------------------------------------------------------
     Captain Marlow speaks wisdom, not pirate puns.

     PROVENANCE — every line below is either a standard translation of a
     primary source, or is credited to the person who actually wrote it.
     Two famous lines were checked and deliberately handled:
       • "We are what we repeatedly do…" is WILL DURANT paraphrasing Aristotle
         in The Story of Philosophy (1926) — it is NOT a quotation of Aristotle,
         so it is credited to Durant.
       • "The whole problem with the world is that fools and fanatics…" is an
         internet paraphrase of Russell and is NOT used; his real sentence,
         from "The Triumph of Stupidity" (1933), appears instead.
     Lines marked (trad.) are traditional attributions reported by later
     sources (Diogenes Laertius; Plato's Cratylus) rather than surviving text.
     --------------------------------------------------------------------- */
  var QUOTES = [
    // — ancient Greek —
    { q: 'The unexamined life is not worth living.', a: 'Socrates' },
    { q: 'The beginning is the most important part of the work.', a: 'Plato' },
    { q: 'We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.', a: 'Aristotle' },
    { q: 'Men are disturbed not by things, but by the views which they take of them.', a: 'Epictetus' },
    { q: 'First say to yourself what you would be; and then do what you have to do.', a: 'Epictetus' },
    { q: 'No man ever steps in the same river twice.', a: 'Heraclitus' }, // trad., via Plato's Cratylus
    { q: 'The wealth required by nature is limited and easy to procure.', a: 'Epicurus' },
    { q: 'We have two ears and one mouth, so that we may listen more and speak less.', a: 'Zeno of Citium' }, // trad.
    // — contemporary —
    { q: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', a: 'Will Durant' },
    { q: 'When we are no longer able to change a situation, we are challenged to change ourselves.', a: 'Viktor Frankl' },
    { q: 'Nothing in life is as important as you think it is while you are thinking about it.', a: 'Daniel Kahneman' },
    { q: 'You may not control all the events that happen to you, but you can decide not to be reduced by them.', a: 'Maya Angelou' },
    { q: 'Becoming is better than being.', a: 'Carol Dweck' },
    { q: 'Enthusiasm is common. Endurance is rare.', a: 'Angela Duckworth' },
    { q: 'Difficulty is what wakes up the genius.', a: 'Nassim Nicholas Taleb' },
    { q: 'Civilization advances by extending the number of important operations which we can perform without thinking about them.', a: 'Alfred North Whitehead' },
    { q: 'It takes twenty years to build a reputation and five minutes to ruin it.', a: 'Warren Buffett' },
    { q: 'To be a good human being is to have a kind of openness to the world.', a: 'Martha Nussbaum' }
  ];

  var OPEN = '“', CLOSE = '”', DASH = ' — ';

  // Fisher-Yates so the captain never repeats until the deck is spent
  var order = QUOTES.map(function (_, i) { return i; });
  for (var s = order.length - 1; s > 0; s--) {
    var j = Math.floor(Math.random() * (s + 1));
    var tmp = order[s]; order[s] = order[j]; order[j] = tmp;
  }
  var cursor = 0;

  function nextQuote() {
    var q = QUOTES[order[cursor]];
    cursor = (cursor + 1) % order.length;
    return OPEN + q.q + CLOSE + DASH + q.a;
  }

  function isOurs(text) {
    return text.charAt(0) === OPEN && text.indexOf(DASH) > -1;
  }

  /* Anchor on the captain's button, never on text. Searching for a <div> whose
     textContent is "Captain Marlow" looks tempting, but while the quote span is
     momentarily empty mid-render an ANCESTOR div also matches that text; divs come
     back in document order, so the ancestor wins and the search scope balloons to
     the whole page — which is how a quote once landed in the header's clock. The
     button and the bubble are siblings under the same wrapper. */
  function findBubbleSpan() {
    var btn = document.querySelector(CAPTAIN_BTN);
    var wrap = btn && btn.parentElement;
    if (!wrap) return null;
    var span = wrap.querySelector('span.sc-interp');
    // never write into page chrome, whatever the markup does next
    if (!span || span.closest('header')) return null;
    return span;
  }

  /* React owns this text node, so we cannot simply replace it once: every time
     the runtime re-renders a joke we overwrite it with the next quote. Writing
     our own text triggers another mutation, hence the isOurs() guard. */
  function captainSpeaksWisdom() {
    var btn = document.querySelector(CAPTAIN_BTN);
    if (btn && btn.getAttribute('aria-label').indexOf('joke') > -1) {
      btn.setAttribute('aria-label', 'Another reflection from the captain');
    }
    var span = findBubbleSpan();
    if (!span) return;
    var text = (span.textContent || '').trim();
    if (!text || isOurs(text)) return;
    span.textContent = nextQuote();
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

  /* The bundled page's "Request a consultation" CTAs are <a href="#contact">
     wired to a React handler that opens a blank mailto template. Point them at
     the real consultation form instead. The href swap alone is not enough — the
     runtime's delegated click listener still fires — so a capture-phase guard
     stops the event before it reaches React's root listener. */
  /* Every CTA aimed at the contact anchor ("Request a consultation", "Discuss →",
     "Automate my content", …) used to open a blank mailto template. Rather than
     enumerate the copy, rewire them all and exclude only the bare nav "Contact"
     link, which should still jump to the contact section (WhatsApp / call). */
  var NAV_CONTACT = /^contact$/i;
  var TENDER_CTA = /tender|invitation to bid|invitations to bid/i;
  // pricing.html / content-studio.html link across to the homepage anchor
  var CONSULT_HREFS = 'a[href="#contact"], a[href="index.html#contact"]';

  /* A CTA sitting inside the tender card ("Discuss your tender") belongs on the
     tender brief, not the generic consultation form. Decide by the link's own
     wording first, then by the small card that encloses it. The length guard
     stops the climb from matching a whole section that merely mentions tenders. */
  function targetFor(a) {
    if (TENDER_CTA.test((a.textContent || '').trim())) return 'tender.html';
    var n = a.parentElement, depth = 0;
    while (n && depth++ < 4) {
      var t = (n.textContent || '');
      if (t.length < 400 && TENDER_CTA.test(t)) return 'tender.html';
      n = n.parentElement;
    }
    return 'consultation.html';
  }

  function isConsultCta(el) {
    var a = el && el.closest ? el.closest('a') : null;
    if (!a) return null;
    if (!a.getAttribute('data-manara-consult')) return null;
    return a;
  }

  function rewireConsultCtas() {
    document.querySelectorAll(CONSULT_HREFS).forEach(function (a) {
      if (a.getAttribute('data-manara-consult')) return;
      if (NAV_CONTACT.test((a.textContent || '').trim())) return;
      var target = targetFor(a);
      // the attribute carries the destination, so the guard cannot disagree with the href
      a.setAttribute('data-manara-consult', target);
      a.setAttribute('href', target);
    });
  }

  function armConsultGuard() {
    if (window.__manaraConsultGuard) return;
    window.__manaraConsultGuard = true;
    document.addEventListener('click', function (e) {
      var a = isConsultCta(e.target);
      if (!a) return;
      // let modified clicks (new tab / new window) behave natively
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href = a.getAttribute('data-manara-consult');
    }, true);
  }

  /* ---------------------------------------------------------------------
     The captain's quote bubble: the bundle renders it beige (its cream token)
     with a navy line, which fights the dark page. We reskin it to dark glass
     and give it a close control the visitor can always reach. The bundle owns
     the markup and re-renders it, so this is idempotent (class-presence checks)
     and re-runs every tick. Dismissal is a window flag re-applied each tick, so
     it survives a re-render; tapping the keeper clears it and wisdom returns. */
  function styleCaptainBubble() {
    var btn = document.querySelector(CAPTAIN_BTN);
    var wrap = btn && btn.parentElement;
    if (!wrap) return;
    wrap.classList.add('mnr-cap-wrap');

    var span = wrap.querySelector('span.sc-interp');
    var bubble = span && span.closest('div');
    if (!bubble || bubble === wrap) return;
    bubble.classList.add('mnr-cap-bubble');

    var name = bubble.querySelector('div');           // the "Captain Marlow" label
    if (name) name.classList.add('mnr-cap-name');

    if (!bubble.querySelector('.mnr-cap-close')) {
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'mnr-cap-close';
      x.setAttribute('aria-label', 'Dismiss');
      x.textContent = '×';
      bubble.appendChild(x);
    }

    if (window.__mnrCaptainClosed) wrap.classList.add('is-dismissed');
    else wrap.classList.remove('is-dismissed');
  }

  /* One delegated, capturing listener: pressing × hides the bubble for the
     session. Capture + stopPropagation so nothing else acts on the click. */
  function armCaptainClose() {
    if (window.__mnrCapCloseBound) return;
    window.__mnrCapCloseBound = true;
    document.addEventListener('click', function (e) {
      var x = e.target && e.target.closest ? e.target.closest('.mnr-cap-close') : null;
      if (!x) return;
      e.preventDefault();
      e.stopPropagation();
      window.__mnrCaptainClosed = true;
      var wrap = x.closest('.mnr-cap-wrap');
      if (!wrap) { var b = x.closest('.mnr-cap-bubble'); wrap = b && b.parentElement; }
      if (wrap) wrap.classList.add('is-dismissed');
    }, true);
  }

  // Safety net for un-rendered template bindings. If the homepage bundle fails to
  // hydrate a piece of content — e.g. the HR modal opened before hydration, an
  // intermittent render error, or the page opened as a local file:// where the
  // bundle can't fully run — raw "{{ token }}" text is left visible. Hide any
  // element whose visible text is just an un-rendered token, and the fixed overlay
  // (the modal) it sits inside, so visitors never see broken placeholders.
  function guardRawTokens() {
    var re = /^\s*\{\{\s*[\w.$-]+\s*\}\}\s*$/;
    var cands = document.querySelectorAll('h1,h2,h3,h4,span,div,p,button,li');
    for (var i = 0; i < cands.length; i++) {
      var el = cands[i];
      if (el.children.length) continue;          // leaf text nodes only
      if (el.offsetParent === null) continue;     // skip hidden template scripts etc.
      if (!re.test(el.textContent)) continue;
      var host = el, p = el.parentElement;
      while (p && p !== document.body) {
        var s = (p.getAttribute && p.getAttribute('style')) || '';
        if (/position:\s*fixed/.test(s)) { host = p; break; } // hide the whole modal
        p = p.parentElement;
      }
      host.style.setProperty('display', 'none', 'important');
    }
  }

  // The HR "guide" modal is a compiled-bundle feature that intermittently opens
  // with un-rendered {{ }} tokens (worst under file://). It's been unreliable, so
  // we retire it: hide its trigger button and hide the modal if it ever appears.
  function killHrModal() {
    // Point the homepage HR trigger at the proper HR page instead of the flaky modal.
    var trigs = document.querySelectorAll('a[href="#hr-show"],[data-tk="hrc_b"]');
    for (var i = 0; i < trigs.length; i++) {
      if (trigs[i].tagName === 'A') trigs[i].setAttribute('href', 'hr-consulting.html');
    }
    var boxes = document.querySelectorAll('div,section');
    for (var j = 0; j < boxes.length; j++) {
      var el = boxes[j];
      var s = (el.getAttribute && el.getAttribute('style')) || '';
      if (/position:\s*fixed/.test(s) && /Our HRM Department/.test(el.textContent || '')) {
        el.style.setProperty('display', 'none', 'important');
      }
    }
  }

  // Solar, Freight and Water live together under one "Solutions" service (three
  // extensions on one page), so the menus get a single link, not three.
  var NEW_SERVICES = [
    ['solutions.html', 'Solutions']
  ];

  // Add the "Solutions" link wherever HR Consultancy is linked (the services
  // dropdown and the footer practice column). Clone the HR link so it inherits the
  // exact styling in each context. Idempotent per parent, and re-applies if React
  // re-renders the list and drops the injected sibling.
  function injectNewServices() {
    var hrs = document.querySelectorAll('a[href="hr-consulting.html"]');
    for (var i = 0; i < hrs.length; i++) {
      var hr = hrs[i], parent = hr.parentNode;
      if (!parent) continue;
      if (/Meet our HR manager/i.test(hr.textContent || '')) continue;   // skip the old card's link
      if (parent.querySelector('a[href="solutions.html"]')) continue;
      var after = hr;
      for (var k = 0; k < NEW_SERVICES.length; k++) {
        var a = hr.cloneNode(true);
        a.setAttribute('href', NEW_SERVICES[k][0]);
        a.textContent = NEW_SERVICES[k][1];
        a.removeAttribute('data-tk');
        a.removeAttribute('onclick');
        parent.insertBefore(a, after.nextSibling);
        after = a;
      }
    }
  }

  // Remove the legacy "Meet our HR manager" promo card. HR is now a full service
  // and a dedicated page, so the old block is redundant. tagHrCard() flags it;
  // hide it durably (re-applied each tick, so a React re-render can't bring it back).
  function removeOldHrCard() {
    var cards = document.querySelectorAll('.manara-hr-card');
    for (var i = 0; i < cards.length; i++) {
      if (/Meet our HR manager/i.test(cards[i].textContent || '')) {
        cards[i].style.setProperty('display', 'none', 'important');
      }
    }
  }

  function tick() {
    injectCss();
    upgradePirate();
    captainSpeaksWisdom();
    styleCaptainBubble();
    upgradeHrmIcon();
    tagHrCard();
    removeOldHrCard();
    injectAboutNav();
    injectNewServices();
    rewireConsultCtas();
    injectFooterSocial();
    killHrModal();
    guardRawTokens();
  }

  var mo = new MutationObserver(function () {
    // cheap: runs at most once per animation frame
    if (mo._raf) return;
    mo._raf = requestAnimationFrame(function () {
      mo._raf = null;
      tick();
    });
  });

  var LINKEDIN_URL = 'https://www.linkedin.com/in/manara-consultancy-lebanon/';
  var LINKEDIN_PATH = 'M4.98 3.5a2.5 2.5 0 1 1-.02 5.001A2.5 2.5 0 0 1 4.98 3.5zM3 8.98h4v12.02H3V8.98zM9.5 8.98h3.83v1.64h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.44 4.78 5.61V21h-4v-5.7c0-1.36-.03-3.1-1.9-3.1-1.9 0-2.19 1.47-2.19 2.99V21h-4V8.98z';

  function injectFooterSocial() {
    // Footer social icons (LinkedIn / Instagram / Facebook) now live directly in
    // each page's footer markup, so no runtime injection is needed.
  }

  // The homepage's embedded careers form submits via a mailto (which cannot
  // carry the CV file). Intercept it in the capture phase — before React's own
  // submit handler runs — and route the applicant to /careers.html, where the CV
  // is uploaded and sent directly. Fields are carried over so nothing is retyped.
  function armCareersRedirect() {
    if (window.__mnrCareersArmed) return;
    window.__mnrCareersArmed = true;
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || form.tagName !== 'FORM') return;
      var fileInput = form.querySelector('input[type=file][accept*="pdf"],input[type=file][accept*=".doc"]');
      if (!fileInput) return; // not the careers form
      e.preventDefault();
      e.stopImmediatePropagation();
      var role = (form.querySelector('select') || {}).value || '';
      var ins = form.querySelectorAll('input:not([type=file])');
      var q = new URLSearchParams();
      if (role) q.set('role', role);
      if (ins[0] && ins[0].value) q.set('name', ins[0].value);
      if (ins[1] && ins[1].value) q.set('email', ins[1].value);
      var ta = form.querySelector('textarea');
      if (ta && ta.value) q.set('msg', ta.value);
      window.location.href = 'careers.html' + (q.toString() ? '?' + q : '');
    }, true);
  }

  // The chat panel's X closes via React's toggleChat, which is unreliable in the
  // compiled bundle (and dead under file://). Close it ourselves the instant the X
  // is clicked — without blocking the event, so React's own toggle still runs and
  // state stays in sync — then re-enable it when the launcher (a click outside the
  // panel) is used, so it can reopen.
  function armChatClose() {
    if (window.__mnrChatBound) return;
    window.__mnrChatBound = true;
    var css = document.createElement('style');
    // Keep the close button clickable above the decorative animations, and define a
    // "force-closed" state using properties React does NOT manage (visibility /
    // opacity / pointer-events), so a re-render can't undo it.
    css.textContent =
      '.chat-panel [aria-label="Close"]{position:relative;z-index:40;pointer-events:auto !important;}' +
      '.chat-panel.mnr-force-closed{visibility:hidden !important;opacity:0 !important;pointer-events:none !important;}';
    (document.head || document.documentElement).appendChild(css);

    // Close: press the launcher so React's chatOpen flips false (keeps state in sync).
    // Then, as a guarantee, if the panel is somehow STILL shown a moment later, force
    // it hidden. So the X (and Escape) always close it — no matter what React does.
    function doClose() {
      var launcher = document.querySelector('[aria-label="Ask Manara"]');
      if (launcher) launcher.click();
      setTimeout(function () {
        var p = document.querySelector('.chat-panel');
        if (p && getComputedStyle(p).display !== 'none') p.classList.add('mnr-force-closed');
      }, 240);
    }

    // Using the launcher to REOPEN must clear the force-hide: after React runs, if the
    // panel is actually shown (display != none), drop the class so it's visible again.
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest || !t.closest('[aria-label="Ask Manara"]')) return;
      setTimeout(function () {
        var p = document.querySelector('.chat-panel');
        if (p && getComputedStyle(p).display !== 'none') p.classList.remove('mnr-force-closed');
      }, 70);
    }, true);

    // The X: block its unreliable native handler, then close through doClose().
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (!t.closest('.chat-panel [aria-label="Close"]')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      doClose();
    }, true);

    // Escape closes from anywhere.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        var p = document.querySelector('.chat-panel');
        if (p && getComputedStyle(p).display !== 'none' && !p.classList.contains('mnr-force-closed')) doClose();
      }
    });
  }

  function arm() {
    tick();
    armConsultGuard();
    armCaptainClose();
    armCareersRedirect();
    armChatClose();
    // Block the retired HR-modal trigger before React's own handler runs, and run
    // the kill + raw-token guard right after any click (setTimeout, so it works
    // even when requestAnimationFrame is throttled).
    document.addEventListener('click', function (e) {
      var tr = e.target && e.target.closest && e.target.closest('a[href="#hr-show"],[data-tk="hrc_b"]');
      if (tr) { e.stopImmediatePropagation(); } // block React's openHR; let the href navigate to hr-consulting.html
      setTimeout(killHrModal, 0);
      setTimeout(guardRawTokens, 60);
      setTimeout(guardRawTokens, 400);
    }, true);
    // characterData matters: React swaps the captain's line by rewriting a text
    // node, which is not a childList mutation and would otherwise go unseen.
    // Observe `document` so a documentElement swap can't detach us either.
    mo.observe(document, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arm);
  } else {
    arm();
  }
  window.addEventListener('load', tick);
  setTimeout(tick, 1500);
  setTimeout(tick, 4000);
  // Captain Marlow's bubble is refreshed by the mutation observer via
  // requestAnimationFrame, which browsers throttle in background/inactive tabs —
  // that can leave the bundle's default pirate joke showing instead of a quote.
  // A steady timer guarantees a motivational quote always wins. It is idempotent:
  // once the bubble already holds one of our quotes, captainSpeaksWisdom() skips it,
  // so the quote stays put and does not cycle on its own.
  setInterval(function () { try { captainSpeaksWisdom(); } catch (e) {} }, 1200);
})();
