/* Manara — minimal additions layer.
 * Keeps the live site EXACTLY as it is and only wires in the three new things:
 *   1) the HR trigger opens the new HR Consultancy page (not the old modal)
 *   2) the Careers link/form goes to the new Careers page
 *   3) a single "Solutions" link (Solar / Freight / Water) is added to the services menu
 * Nothing else is touched — no layout, styling, chat or captain changes.
 */
(function () {
  'use strict';

  // Make the outline card CTAs (.scp3 — "Discuss your tender", "Meet our HR manager",
  // "Request a … quotation") gold like the AI-agent button (.scp5). A <style> in <head>
  // gets wiped by the page's React helmet, so we set it inline per button and re-apply
  // each tick (React can reset inline styles on re-render; the observer re-applies).
  function styleCardButtons() {
    document.querySelectorAll('.scp6 a.scp3, .scp4 a.scp3').forEach(function (a) {
      a.style.setProperty('background', '#C7A14E', 'important');
      a.style.setProperty('color', '#0C1A2A', 'important');
      a.style.setProperty('border-color', '#C7A14E', 'important');
    });
  }

  var SERVICE_HREFS = ['ai-consulting.html', 'law-consulting.html',
    'fashion-consulting.html', 'startup-consulting.html', 'linkedin-management.html',
    'thesis-support.html', 'career-consulting.html'];

  var SOL_BULLETS = [
    'Smart solar, storage & live monitoring',
    'Air, sea & land freight — 75+ destinations',
    'Water treatment, filtration & purification',
    'Turnkey — designed, installed, guaranteed',
    'One accountable team behind it all'
  ];

  // Give Solutions a prominent, ROBUST homepage presence. Rather than clone a card
  // into the React-controlled grid (which React keeps re-rendering and wiping — that
  // was the "it disappears" problem), we build our OWN standalone section and place
  // it right before the services grid. The observer re-adds it if a render removes it.
  function subCard(href, title, desc) {
    return '<a href="' + href + '" style="display:block;text-decoration:none;border:1px solid rgba(230,204,140,.16);' +
      'border-radius:14px;padding:20px;background:rgba(6,13,22,.4)">' +
      '<div style="font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:21px;color:#F4EEE1;margin-bottom:6px">' + title + ' →</div>' +
      '<div style="color:#CBBA98;font-size:14px;line-height:1.5">' + desc + '</div></a>';
  }
  var SOL_HTML =
    '<div style="border:1px solid rgba(230,204,140,.24);border-radius:20px;padding:clamp(26px,4vw,42px);' +
    'background:linear-gradient(160deg,rgba(230,204,140,.08),rgba(12,26,42,.62))">' +
      '<div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#C7A14E;font-weight:600;margin-bottom:10px">New at Manara</div>' +
      '<h2 style="font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:clamp(28px,3.8vw,42px);color:#F4EEE1;margin:0 0 8px;line-height:1.04">Solar, Freight &amp; Water</h2>' +
      '<p style="color:#CBBA98;font-size:16px;line-height:1.6;margin:0 0 24px;max-width:640px">Beyond consulting, Manara now delivers three hands-on services for homes and businesses — designed, installed and guaranteed.</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px">' +
        subCard('solar-energy.html', 'Solar &amp; Energy', 'Smart solar, storage &amp; live monitoring.') +
        subCard('shipping-freight.html', 'Shipping &amp; Freight', 'Air, sea &amp; land — 75+ destinations.') +
        subCard('water-solutions.html', 'Water Solutions', 'Treatment, filtration &amp; purification.') +
      '</div>' +
      '<div style="margin-top:26px"><a href="solutions.html" style="display:inline-flex;align-items:center;gap:8px;' +
      'font-family:\'Archivo\',sans-serif;font-weight:600;font-size:15px;padding:14px 30px;border-radius:999px;' +
      'background:#C7A14E;color:#0C1A2A;text-decoration:none">Explore all Solutions →</a></div>' +
    '</div>';
  function injectSolutionsCard() {
    if (document.querySelector('.mnr-solutions-section')) return;   // already there
    var tender = null, cards = document.querySelectorAll('.scp6');
    for (var i = 0; i < cards.length; i++) {
      if (/Invitations to Bid|Discuss your tender/i.test(cards[i].textContent)) { tender = cards[i]; break; }
    }
    var sec = tender ? (tender.closest('section') || tender.parentElement) : null;
    if (!sec || !sec.parentNode) return;
    var el = document.createElement('section');
    el.className = 'mnr-solutions-section';
    el.style.cssText = 'max-width:1100px;margin:0 auto;padding:8px 22px 24px';
    el.innerHTML = SOL_HTML;
    sec.parentNode.insertBefore(el, sec);   // right above the services grid — prominent
  }

  // Remove every fixed price shown on the homepage — the card prices, the LinkedIn
  // "$250 / month", the thesis "from $15 / page" — so pricing lives only on the
  // pricing page. Hides only elements whose WHOLE text is a price, so labels like
  // "Learn more →" are left intact.
  var PURE_PRICE = /^(from\s+)?\$\s?\d[\d.,]*(\s*\/\s*(month|page|session|hour|hr|yr|year))?$/i;
  function removeCardPrices() {
    var els = document.getElementsByTagName('*');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.children.length > 4) continue;                    // skip big containers (cheap)
      var t = (el.textContent || '').trim();
      if (t.length <= 18 && PURE_PRICE.test(t)) el.style.setProperty('display', 'none', 'important');
    }
  }

  // Add Omar H.'s testimonial (from Case Studies) to the Voices section, matching the
  // existing 5-star / quote / attribution format. Idempotent; the observer re-adds it.
  function injectVoice() {
    var items = document.querySelectorAll('div.scpa');
    var src = null;
    for (var i = 0; i < items.length; i++) {
      if (/★/.test(items[i].textContent) && items[i].querySelector('p')) { src = items[i]; break; }
    }
    if (!src) return;
    var list = src.parentElement;
    if (!list) return;
    var v = list.querySelector('.mnr-voice');
    if (!v) {
      v = src.cloneNode(true);
      v.classList.add('mnr-voice');
      v.querySelectorAll('[data-tk]').forEach(function (e) { e.removeAttribute('data-tk'); });
      var p = v.querySelector('p');
      if (p) {
        p.textContent = '“Manara built us an AI assistant that answers enquiries day and night in Arabic and English — 90% handled instantly, and our team’s workload dropped 40%.”';
        var attr = p.nextElementSibling;
        if (attr) attr.textContent = 'Omar H., Community Manager · Real estate, Lebanon';
      }
      list.appendChild(v);
    }
    // CRITICAL: this card is injected AFTER the scroll-reveal observer AND its 900ms
    // fallback have already run, so it never receives the 'in' class and stays frozen at
    // opacity:0 / translateY(30px) — an invisible card that reserved a whole empty row,
    // showing the lighthouse background through it (the "big gap" under Voices). Force it
    // permanently visible and drop data-reveal so nothing can reset it. Re-applied each
    // tick, so a React re-render can't undo it.
    [v].concat([].slice.call(v.querySelectorAll('[data-reveal]'))).forEach(function (e) {
      e.removeAttribute('data-reveal');
      e.classList.add('in');
      e.style.setProperty('opacity', '1', 'important');
      e.style.setProperty('transform', 'none', 'important');
    });
  }

  // Publications block for the homepage footer (the bundle). target="_blank" + no
  // download attr => the PDF previews in the browser instead of downloading.
  var PUBS_HTML =
    '<div class="mnr-pubs" style="max-width:1180px;margin:0 auto;padding:26px 24px 6px;' +
    'border-top:1px solid rgba(230,204,140,.14);text-align:center">' +
    '<div style="font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:22px;color:#F4EEE1;line-height:1.1">Publications</div>' +
    '<div style="font-size:13px;color:#8C99A8;margin:2px 0 14px">What we put our name to.</div>' +
    '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
    '<a href="view-company-profile.html" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border:1px solid rgba(230,204,140,.4);border-radius:999px;color:#E6CC8C;text-decoration:none;font-size:13.5px">Company Profile ↗</a>' +
    '<a href="view-sustainability-report.html" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border:1px solid rgba(230,204,140,.4);border-radius:999px;color:#E6CC8C;text-decoration:none;font-size:13.5px">Sustainability Report ↗</a>' +
    '</div></div>';
  function injectPublications() {
    var f = document.querySelector('footer');
    if (!f || f.querySelector('.mnr-pubs')) return;
    var d = document.createElement('div');
    d.innerHTML = PUBS_HTML;
    f.insertBefore(d.firstChild, f.firstChild);
  }

  // A light "Perspectives" band on the dark homepage — previews the blog and matches
  // its light editorial look, so the jump from the dark site into the light blog reads
  // as intentional. Standalone section, inserted just before the footer; the observer
  // re-adds it if a render removes it. All styles inline (a <head> <style> gets wiped).
  function pCard(href, cat, title, desc) {
    return '<a href="' + href + '" style="display:block;text-decoration:none;background:#fff;' +
      'border:1px solid #e6e6ea;border-radius:14px;padding:24px">' +
      '<div style="color:#E60023;font:700 11px/1 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase">' + cat + '</div>' +
      '<div style="font:800 20px/1.25 Arial,Helvetica,sans-serif;color:#1b1b1f;margin:10px 0 8px;letter-spacing:-.3px">' + title + '</div>' +
      '<div style="color:#6b7280;font:400 14px/1.5 Arial,Helvetica,sans-serif">' + desc + '</div></a>';
  }
  var PERSPECTIVES_HTML =
    '<div style="max-width:1080px;margin:0 auto">' +
      '<div style="text-align:center;margin-bottom:34px">' +
        '<div style="color:#E60023;font:700 12px/1 Arial,Helvetica,sans-serif;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:14px">Perspectives</div>' +
        '<h2 style="font:800 clamp(28px,4vw,40px)/1.1 Arial,Helvetica,sans-serif;color:#1b1b1f;margin:0;letter-spacing:-.5px">Field notes from the practice</h2>' +
        '<p style="color:#6b7280;font:400 16px/1.6 Arial,Helvetica,sans-serif;max-width:46ch;margin:14px auto 0">Practical writing on business, AI, Gulf expansion and startups — the same thinking we bring to client work.</p>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px">' +
        pCard('blog-gulf-expansion.html', 'Gulf Strategy', 'Five Things Lebanese Businesses Get Wrong in the Gulf', 'The Gulf feels close — and that proximity is exactly what trips founders up.') +
        pCard('blog-ai-small-business.html', 'AI &amp; Automation', 'What AI Can Actually Do for a Small Business', 'One repetitive job removed, done properly — starting with WhatsApp.') +
        pCard('blog-lebanon-salary-gap.html', 'Compensation', 'The Salary Nobody Declares', 'How Lebanon really pays — and how little of it appears on paper.') +
      '</div>' +
      '<div style="text-align:center;margin-top:34px">' +
        '<a href="blog.html" style="display:inline-flex;align-items:center;gap:8px;font:700 15px/1 Arial,Helvetica,sans-serif;' +
        'padding:14px 30px;border-radius:999px;background:#E60023;color:#fff;text-decoration:none">Read the series →</a>' +
      '</div>' +
    '</div>';
  function injectPerspectives() {
    if (document.querySelector('.mnr-perspectives')) return;   // already there
    var f = document.querySelector('footer');
    if (!f || !f.parentNode) return;
    var el = document.createElement('section');
    el.className = 'mnr-perspectives';
    el.style.cssText = 'background:#ffffff;padding:clamp(48px,7vw,84px) 22px';
    el.innerHTML = PERSPECTIVES_HTML;
    f.parentNode.insertBefore(el, f);   // sits as the last band before the footer
  }

  // The FAQ (faq.html) and the marketing "pain points" section (marketing.html) now
  // live on their own pages. Hide both on the homepage and add footer links to them.
  // Done in the overlay, not the bundle payload (the compiler blanks the page when its
  // sections are edited), so this can never break the homepage. Idempotent, re-run each tick.
  function relocateHomeSections() {
    var faq = document.querySelector('#faq') || document.querySelector('section[data-screen-label="FAQ"]');
    if (faq) faq.style.setProperty('display', 'none', 'important');
    var cards = document.querySelectorAll('div[style*="border-radius:24px"],div[style*="border-radius: 24px"]');
    for (var i = 0; i < cards.length; i++) {
      if (/turning pain points/i.test(cards[i].textContent)) { cards[i].style.setProperty('display', 'none', 'important'); break; }
    }
    var footer = document.querySelector('footer');
    if (!footer || footer.querySelector('.mnr-foot-nav')) return;
    var nav = document.createElement('div');
    nav.className = 'mnr-foot-nav';
    nav.style.cssText = 'text-align:center;padding:2px 24px 14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap';
    var s = 'color:#E6CC8C;text-decoration:none;' +
      "font:600 13.5px/1 'Archivo',sans-serif;letter-spacing:.02em;border:1px solid rgba(230,204,140,.4);" +
      'border-radius:999px;padding:9px 20px;display:inline-block';
    nav.innerHTML = '<a href="marketing.html" style="' + s + '">Marketing strategy →</a>' +
                    '<a href="faq.html" style="' + s + '">Frequently asked questions →</a>';
    var pubs = footer.querySelector('.mnr-pubs');
    if (pubs && pubs.parentNode) pubs.parentNode.insertBefore(nav, pubs.nextSibling);
    else footer.insertBefore(nav, footer.firstChild);
  }

  // The homepage careers section shows the full apply form (with CV upload) — that
  // belongs only on the dedicated Careers page. Hide the embedded form and drop in a
  // button that leads to careers.html, where applicants actually apply.
  function replaceCareersForm() {
    var forms = document.querySelectorAll('form');
    var cf = null;
    for (var i = 0; i < forms.length; i++) { if (forms[i].querySelector('input[type=file]')) { cf = forms[i]; break; } }
    if (!cf) return;
    cf.style.setProperty('display', 'none', 'important');
    var host = cf.parentNode;
    if (host && !host.querySelector('.mnr-careers-btn')) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'text-align:center;padding:6px 0 4px';
      wrap.innerHTML = '<a class="mnr-careers-btn" href="careers.html" ' +
        'style="display:inline-flex;align-items:center;gap:8px;font-family:\'Archivo\',sans-serif;' +
        'font-weight:600;font-size:15px;padding:15px 34px;border-radius:999px;background:#C7A14E;' +
        'color:#0C1A2A;text-decoration:none">Apply to join the team →</a>';
      host.insertBefore(wrap, cf);
    }
  }

  // On phones, the full-screen (min-height:100vh) content sections leave huge empty
  // gaps (the lighthouse background showing through). Shrink them to content height on
  // narrow screens. Desktop keeps the intended full-screen look.
  // The hero already ships its own cue — "Scroll into the light" — which fits the
  // lighthouse motif better than anything we'd add. Rather than introduce a second
  // one, we just light this one: the .mnr-scrollcue class gives it the gold glow.
  function litScrollCue() {
    var spans = document.getElementsByTagName('span');
    for (var i = 0; i < spans.length; i++) {
      var s = spans[i];
      if (s.classList.contains('mnr-scrollcue')) return;   // already lit
      if (/^\s*Scroll into the light\s*$/i.test(s.textContent || '')) {
        s.classList.add('mnr-scrollcue');
        return;
      }
    }
  }

  // Belt-and-braces: the bundle still ships the old "Our HRM Department" modal.
  // HR now lives on its own page, so that card should never surface again — even if
  // some stale trigger or an old cached script tries to open it. We keep it forced
  // shut on every tick, so it cannot flash on load or reappear on a re-render.
  function hideLegacyHRModal() {
    var el = window.__mnrHRModal;
    if (!el || !el.isConnected) {
      el = null;
      var divs = document.getElementsByTagName('div');
      for (var i = 0; i < divs.length; i++) {
        var d = divs[i];
        if (d.children.length > 6) continue;
        if (!/Our HRM Department/i.test(d.textContent || '')) continue;
        if (getComputedStyle(d).position !== 'fixed') continue;
        el = d; break;
      }
      window.__mnrHRModal = el;
    }
    if (el) el.style.setProperty('display', 'none', 'important');
  }

  // The 3D hero is a WebGL scene that pulls ~2MB of Three.js. On a phone that is
  // the single biggest cost on the page — enough to stall the whole load — so the
  // iframe ships with data-src and we only promote it to a real src on screens
  // wide enough to be worth it. Phones get the original lighthouse hero instead,
  // which costs nothing, and the "Explore in 3D" CTA is still there for anyone
  // who wants the full scene. (Visual parity on mobile isn't worth an unusable page.)
  var HERO_3D_MIN_WIDTH = 900;
  var HERO_POSTER = 'assets/img/hero-poster.jpg';   // a real frame of the scene, 24KB

  // Phones get a still of the scene rather than the live render, so the hero looks
  // the same as desktop for ~24KB instead of ~2MB. Tapping the badge swaps in the
  // real thing for anyone who wants it.
  function showPoster(el, ifr) {
    if (el.__mnrPoster) return;
    // The bundle re-renders the hero, handing us a brand-new .mnr-3d-hero whose
    // __mnrPoster flag is undefined. Without this the badge would be re-created on
    // every re-render and stack up invisibly on <body>.
    if (document.querySelector('.mnr-3d-badge')) { el.__mnrPoster = true; return; }
    el.__mnrPoster = true;
    el.style.removeProperty('display');
    el.style.backgroundImage = 'url("' + HERO_POSTER + '")';
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';

    var badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'mnr-3d-badge';
    badge.textContent = 'Tap for 3D';
    // Sits in normal flow alongside the hero's own CTAs rather than at a fixed
    // offset. An earlier version was absolutely positioned at top:152px, which
    // was clear space until the mobile hero was reordered and the headline moved
    // into it. In-flow means it can't collide again at any screen size.
    badge.style.cssText =
      'display:inline-flex;align-items:center;margin:14px 0 0;pointer-events:auto;' +
      'font:600 12px/1 system-ui,sans-serif;letter-spacing:.04em;color:#E6CC8C;' +
      'background:rgba(8,20,32,.72);border:1px solid rgba(230,204,140,.5);' +
      'border-radius:999px;padding:9px 14px;cursor:pointer;';
    /* No listener is attached here on purpose — see the delegated handler below.
       The bundle rebuilds this row, and a re-rendered badge is a fresh element
       with no listeners, so a per-element handler silently stops working. */
    // Host it in the hero's CTA row when we can find it, so it lines up with
    // "Start with a conversation" and moves with them. Body is the fallback.
    var ctaHost = null;
    var anchors = document.getElementsByTagName('a');
    for (var i = 0; i < anchors.length; i++) {
      if (/start with a conversation/i.test(anchors[i].textContent || '')) {
        ctaHost = anchors[i].parentElement;
        break;
      }
    }
    (ctaHost || document.body).appendChild(badge);
  }

  // If a phone is rotated (or a tablet crosses the threshold) into desktop width,
  // drop the poster furniture so the live scene isn't competing with a still.
  function clearPoster(el) {
    if (!el.__mnrPoster) return;
    el.__mnrPoster = false;
    el.style.backgroundImage = '';
    var b = document.querySelector('.mnr-3d-badge');
    if (b) b.remove();
  }

  /* Swaps the still for the live scene. Everything is re-queried at call time,
     because by now the hero may have been re-rendered several times over. */
  function activate3dScene() {
    var el = document.querySelector('.mnr-3d-hero');
    if (!el) return;
    var ifr = el.querySelector('iframe');
    if (ifr && !ifr.getAttribute('src')) {
      var pending = ifr.getAttribute('data-src');
      if (pending) ifr.setAttribute('src', pending);
    }
    el.style.backgroundImage = '';   // let the live scene through
    el.__mnrPoster = false;
    el.__mnrStart = 0;               // restart the paint-verification clock
    var b = document.querySelector('.mnr-3d-badge');
    if (b) b.remove();
  }

  /* Delegated once on document, in the capture phase. Survives every re-render
     of the badge, which a per-element listener does not. */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var hit = t && t.closest ? t.closest('.mnr-3d-badge') : null;
    if (!hit) return;
    e.preventDefault();
    activate3dScene();
  }, true);

  function gate3dHero() {
    var el = document.querySelector('.mnr-3d-hero');
    if (!el) return;
    var ifr = el.querySelector('iframe');

    if (window.innerWidth < HERO_3D_MIN_WIDTH) {
      if (!ifr || !ifr.getAttribute('src')) showPoster(el, ifr);   // never auto-loads the scene
      return;
    }

    // wide screen: load the scene once, then let verify3dHero police it
    clearPoster(el);
    if (ifr && !ifr.getAttribute('src')) {
      var pending = ifr.getAttribute('data-src');
      if (pending) ifr.setAttribute('src', pending);
    }
    if (el.style.display === 'none' && !el.__mnrFailed) el.style.removeProperty('display');
  }

  // The 3D hero must never leave the page looking broken. It can fail to render for
  // reasons we don't control — opened over file:// (ES modules are blocked there), a
  // stale cached copy, or a device that gives up on a second WebGL context. So we
  // verify a canvas actually painted inside the iframe; if it hasn't within a grace
  // period, we drop the layer entirely and the original lighthouse hero shows through.
  function verify3dHero() {
    var el = document.querySelector('.mnr-3d-hero');
    if (!el || el.__mnrVerified) return;
    if (el.__mnrPoster) return;          // poster mode is a valid resting state, not a failure
    var ifr = el.querySelector('iframe');
    if (!ifr || !ifr.getAttribute('src')) return;   // nothing asked to paint yet
    if (!el.__mnrStart) el.__mnrStart = Date.now();

    var painted = false;
    try {
      var d = ifr.contentDocument;                 // throws on an opaque origin (file://)
      var c = d && d.querySelector('canvas');
      painted = !!(c && c.clientWidth > 0 && c.clientHeight > 0);
    } catch (e) { painted = false; }

    if (painted) {                                  // scene is up — keep it
      el.__mnrVerified = true;
      el.style.removeProperty('display');
      return;
    }
    if (Date.now() - el.__mnrStart > 9000) {        // never painted — fall back cleanly
      el.__mnrVerified = true;
      el.__mnrFailed = true;
      el.style.setProperty('display', 'none', 'important');
    }
  }

  function tightenSections() {
    if (window.innerWidth >= 760) return;   // phones/tablets only
    document.querySelectorAll('section, [data-dc-tpl]').forEach(function (s) {
      var mh = s.style.minHeight || '';
      if (/100vh|100dvh/i.test(mh)) s.style.setProperty('min-height', 'auto', 'important');
    });
  }

  function apply() {
    injectSolutionsCard();
    injectVoice();
    styleCardButtons();
    injectPublications();
    injectPerspectives();
    relocateHomeSections();
    replaceCareersForm();
    tightenSections();
    gate3dHero();
    verify3dHero();
    hideLegacyHRModal();
    litScrollCue();
    removeCardPrices();
    // 1) HR trigger -> the real HR page (repoint the href; the click guard below blocks the modal)
    document.querySelectorAll('a[href="#hr-show"], [data-tk="hrc_b"]').forEach(function (el) {
      if (el.tagName === 'A') el.setAttribute('href', 'hr-consulting.html');
    });

    // 2) Careers nav link -> the real Careers page
    document.querySelectorAll('a[href="#careers"], [data-tk="nav_careers"]').forEach(function (el) {
      if (el.tagName === 'A') el.setAttribute('href', 'careers.html');
    });

    // 3) Add ONE "Solutions" link, but only inside a real services menu
    //    (a parent that already lists several service pages), never next to a single card.
    document.querySelectorAll('a[href="business-consulting.html"]').forEach(function (b) {
      var parent = b.parentNode;
      if (!parent || parent.querySelector('a[href="solutions.html"]')) return;
      var count = 0;
      SERVICE_HREFS.forEach(function (h) { if (parent.querySelector('a[href="' + h + '"]')) count++; });
      if (count < 3) return; // not the services menu — skip
      var a = b.cloneNode(true);
      a.setAttribute('href', 'solutions.html');
      a.textContent = 'Solutions';
      a.removeAttribute('data-tk');
      a.removeAttribute('onclick');
      parent.appendChild(a);
    });
  }

  // Block the old modal / anchor behaviour and navigate to the real pages instead.
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('a[href="#hr-show"], [data-tk="hrc_b"], a[href="hr-consulting.html"]')) {
      e.preventDefault(); e.stopImmediatePropagation();
      window.location.href = 'hr-consulting.html'; return;
    }
    if (t.closest('a[href="#careers"], [data-tk="nav_careers"], a[href="careers.html"]')) {
      e.preventDefault(); e.stopImmediatePropagation();
      window.location.href = 'careers.html'; return;
    }
  }, true);

  // The homepage apply form (mailto, can't attach a CV) -> the real Careers page,
  // carrying whatever was typed so nothing is lost.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    if (!/apply|careers/i.test(form.getAttribute('onsubmit') || form.className || '')) {
      // fall back: only treat it as the careers form if it sits in the #careers area
      var inCareers = form.closest('[id*="careers"], [data-tk*="careers"]');
      if (!inCareers) return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    window.location.href = 'careers.html';
  }, true);

  function tick() { try { apply(); } catch (_) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();
  window.addEventListener('load', tick);
  var mo = new MutationObserver(function () {
    if (mo._t) return;
    mo._t = setTimeout(function () { mo._t = null; tick(); }, 150);
  });
  mo.observe(document, { childList: true, subtree: true });
  setTimeout(tick, 1500);
  setTimeout(tick, 4000);
  // later passes so verify3dHero's grace period is actually reached even on a quiet
  // page (the observer only ticks on DOM changes, which may have stopped by then)
  setTimeout(tick, 7000);
  setTimeout(tick, 9500);
  setTimeout(tick, 12000);
})();
