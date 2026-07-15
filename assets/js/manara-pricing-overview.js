/* Manara — injects a static "Overview of prices" section near the top of the
 * Pricing page (a compiled bundle), so the fixed starting rates live in one place.
 * Runtime injection only — the bundle itself is untouched. Idempotent + self-heals
 * if the page re-renders.
 */
(function () {
  'use strict';

  var ROWS = [
    ['Business Strategy', '$150'],
    ['Startup Consultancy', '$200'],
    ['Marketing &amp; Content', '$250'],
    ['Career Advisory', '$100'],
    ['LinkedIn Management', '$250 / month'],
    ['Thesis &amp; Research', 'from $15 / page']
  ];

  function rowsHtml() {
    return ROWS.map(function (r) {
      return '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;' +
        'padding:13px 2px;border-bottom:1px solid rgba(230,204,140,.14)">' +
        '<span style="color:#EBE2CF;font-size:16px">' + r[0] + '</span>' +
        '<span style="font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:22px;' +
        'color:#E6CC8C;white-space:nowrap">' + r[1] + '</span></div>';
    }).join('');
  }

  var HTML =
    '<section class="mnr-price-ov" style="max-width:720px;margin:26px auto 0;padding:0 22px">' +
      '<div style="border:1px solid rgba(230,204,140,.2);border-radius:18px;padding:clamp(24px,4vw,38px);' +
      'background:linear-gradient(160deg,rgba(230,204,140,.06),rgba(12,26,42,.55))">' +
        '<div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#C7A14E;font-weight:600;margin-bottom:8px">At a glance</div>' +
        '<h2 style="font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:clamp(26px,3.4vw,36px);color:#F4EEE1;margin:0 0 6px;line-height:1.05">Overview of prices</h2>' +
        '<p style="color:#CBBA98;font-size:15px;line-height:1.6;margin:0 0 14px;max-width:560px">Indicative starting rates. Everything else is priced by scope after a free review — build your own estimate below.</p>' +
        rowsHtml() +
        '<p style="color:#8C99A8;font-size:13.5px;line-height:1.6;margin:16px 0 0">Legal, Fashion, HR, LinkedIn, AI Agents, Tender, and Solar / Freight / Water — priced by scope, on request.</p>' +
      '</div>' +
    '</section>';

  function inject() {
    if (document.querySelector('.mnr-price-ov')) return;
    var h1 = null;
    var hs = document.querySelectorAll('h1');
    for (var i = 0; i < hs.length; i++) { if (/Clear counsel|clear terms/i.test(hs[i].textContent || '')) { h1 = hs[i]; break; } }
    if (!h1) return;
    var sec = h1.closest('section') || h1.parentElement;
    if (!sec || !sec.parentNode) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = HTML;
    sec.parentNode.insertBefore(wrap.firstElementChild, sec.nextSibling);
  }

  function tick() { try { inject(); } catch (_) {} }
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
