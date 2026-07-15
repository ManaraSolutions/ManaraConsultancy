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
    if (!list || list.querySelector('.mnr-voice')) return;   // already added
    var v = src.cloneNode(true);
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

  function apply() {
    injectSolutionsCard();
    injectVoice();
    styleCardButtons();
    injectPublications();
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
})();
