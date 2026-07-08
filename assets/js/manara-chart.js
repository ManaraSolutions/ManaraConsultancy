/* Manara — engagement chart for the Content Studio card.
 *
 * Replaces the bundled page's static bar row with an accessible, interactive
 * column chart. Mounted over the compiled DOM, so it re-mounts if the template
 * runtime rebuilds the card.
 *
 * Design decisions (see the data-viz method):
 *  - One series, so ONE colour for every bar. Colouring bars darker-where-bigger
 *    would double-encode length as hue; instead the peak day gets the bright step
 *    plus a direct label (emphasis, not a value ramp).
 *  - Colours are two steps of a single-hue gold ramp generated in OKLCH and run
 *    through the palette validator against this card's real composited surface
 *    (#0a1522): base #c59f4c = 7.38:1, peak #f6cf7c = 12.36:1.
 *  - Bars: capped thickness, 4px rounded cap, square at the baseline, 2px surface
 *    gap between neighbours. Gridlines are solid hairlines, one step off surface.
 *  - The tooltip enhances but never gates: every value is also in the table view,
 *    and keyboard focus shows exactly what hover shows.
 *
 * NOTE ON THE DATA: the original markup's bar heights (42,58,50,72…) did not match
 * its own tooltips (120,158,196… a perfect +38 linear ramp) — Day 3 claimed more
 * interactions than Day 2 while rendering shorter. The heights carried the
 * realistic weekday rhythm, so they are the series of record here, scaled to
 * interactions. Figures are illustrative, and the card says so.
 */
(function () {
  'use strict';

  var VALUES = [210, 290, 250, 360, 320, 440, 390, 475, 420, 540, 480, 590, 520, 620];
  var Y_MAX = 700;                 // clean headroom above the 620 peak
  var Y_TICKS = [0, 200, 400, 600];
  var LABEL = 'Engagement, last 14 days';

  function fmt(n) { return n.toLocaleString('en-US'); }

  function build(row) {
    var peak = VALUES.indexOf(Math.max.apply(null, VALUES));

    var fig = document.createElement('figure');
    fig.className = 'mchart';
    fig.setAttribute('data-manara-chart', '1');

    // ---- plot: gridlines behind, columns in front ----
    var plot = document.createElement('div');
    plot.className = 'mchart-plot';

    var grid = document.createElement('div');
    grid.className = 'mchart-grid';
    grid.setAttribute('aria-hidden', 'true');
    Y_TICKS.slice().reverse().forEach(function (t) {
      var line = document.createElement('div');
      line.className = 'mchart-gline';
      line.style.bottom = (t / Y_MAX * 100) + '%';
      var lab = document.createElement('span');
      lab.textContent = fmt(t);
      line.appendChild(lab);
      grid.appendChild(line);
    });
    plot.appendChild(grid);

    var bars = document.createElement('div');
    bars.className = 'mchart-bars';
    bars.setAttribute('role', 'list');

    VALUES.forEach(function (v, i) {
      // the column is the hit target (full height, ≥24px wide) — not the bar
      var col = document.createElement('button');
      col.type = 'button';
      col.className = 'mcol' + (i === peak ? ' is-peak' : '');
      col.setAttribute('role', 'listitem');
      col.setAttribute('data-i', i);
      col.setAttribute('aria-label', 'Day ' + (i + 1) + ': ' + fmt(v) + ' interactions');

      // --h lives on the column so the bar and its direct label share one source
      col.style.setProperty('--h', (v / Y_MAX * 100) + '%');
      var bar = document.createElement('span');
      bar.className = 'mbar';
      bar.style.setProperty('--d', (i * 45) + 'ms');
      col.appendChild(bar);

      if (i === peak) {
        var tag = document.createElement('span');
        tag.className = 'mpeak';
        tag.textContent = fmt(v);
        col.appendChild(tag);
      }
      bars.appendChild(col);
    });
    plot.appendChild(bars);
    fig.appendChild(plot);

    // ---- x axis: three anchored labels. One span per column would overflow the
    // row (nowrap text in a ~25px slot) and give the card a nested scrollbar. ----
    var xax = document.createElement('div');
    xax.className = 'mchart-x';
    xax.setAttribute('aria-hidden', 'true');
    ['Day 1', 'Day 7', 'Day ' + VALUES.length].forEach(function (t) {
      var s = document.createElement('span');
      s.textContent = t;
      xax.appendChild(s);
    });
    fig.appendChild(xax);

    // ---- tooltip ----
    var tip = document.createElement('div');
    tip.className = 'mchart-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    fig.appendChild(tip);

    // ---- table twin (values are never gated behind hover) ----
    var tbl = document.createElement('table');
    tbl.className = 'mchart-table';
    tbl.hidden = true;
    tbl.innerHTML = '<caption>' + LABEL + ' — illustrative figures</caption>' +
      '<thead><tr><th scope="col">Day</th><th scope="col">Interactions</th><th scope="col">Change</th></tr></thead>';
    var tb = document.createElement('tbody');
    VALUES.forEach(function (v, i) {
      var d = i ? v - VALUES[i - 1] : null;
      tb.innerHTML += '<tr><th scope="row">Day ' + (i + 1) + '</th><td>' + fmt(v) + '</td><td>' +
        (d === null ? '—' : (d > 0 ? '+' : '') + fmt(d)) + '</td></tr>';
    });
    tbl.appendChild(tb);
    fig.appendChild(tbl);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mchart-toggle';
    toggle.textContent = 'View as table';
    toggle.setAttribute('aria-expanded', 'false');
    fig.appendChild(toggle);

    var note = document.createElement('figcaption');
    note.className = 'mchart-note';
    note.textContent = 'Illustrative sample — not client data.';
    fig.appendChild(note);

    /* ---------- interaction ---------- */
    function showTip(col) {
      var i = +col.getAttribute('data-i');
      var v = VALUES[i], prev = i ? VALUES[i - 1] : null;
      var delta = prev === null ? null : v - prev;
      var pct = prev ? Math.round((delta / prev) * 100) : null;

      tip.innerHTML = '';
      var d1 = document.createElement('div');
      d1.className = 'tip-day';
      d1.textContent = 'Day ' + (i + 1);
      var d2 = document.createElement('div');
      d2.className = 'tip-val';
      d2.textContent = fmt(v) + ' interactions';
      tip.appendChild(d1); tip.appendChild(d2);
      if (delta !== null) {
        var d3 = document.createElement('div');
        d3.className = 'tip-delta ' + (delta > 0 ? 'up' : delta < 0 ? 'down' : '');
        d3.textContent = (delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '') + fmt(delta) +
          (pct !== null ? ' (' + (delta > 0 ? '+' : '') + pct + '%)' : '') + ' vs previous day';
        tip.appendChild(d3);
      }

      tip.hidden = false;
      // Anchor to the BAR CAP, not the column: the column is full plot height, so
      // anchoring to it floats the tooltip over the card's title row.
      var fr = fig.getBoundingClientRect();
      var cr = col.getBoundingClientRect();
      var br = col.querySelector('.mbar').getBoundingClientRect();

      var x = cr.left - fr.left + cr.width / 2 - tip.offsetWidth / 2;
      x = Math.max(4, Math.min(x, fr.width - tip.offsetWidth - 4));
      tip.style.left = x + 'px';

      // prefer above the cap; if that would clear the figure's top, sit below it
      var above = fr.bottom - br.top + 8;
      var topIfAbove = fr.bottom - above - tip.offsetHeight;
      if (topIfAbove < fr.top + 2) above = fr.bottom - br.top - tip.offsetHeight - 8;
      tip.style.bottom = above + 'px';
      bars.querySelectorAll('.mcol').forEach(function (c) { c.classList.toggle('is-dim', c !== col); });
    }
    function hideTip() {
      tip.hidden = true;
      bars.querySelectorAll('.mcol').forEach(function (c) { c.classList.remove('is-dim'); });
    }

    bars.addEventListener('mouseover', function (e) {
      var c = e.target.closest('.mcol'); if (c) showTip(c);
    });
    bars.addEventListener('mouseleave', hideTip);
    bars.addEventListener('focusin', function (e) {
      var c = e.target.closest('.mcol'); if (c) showTip(c);
    });
    bars.addEventListener('focusout', hideTip);
    bars.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var cols = [].slice.call(bars.querySelectorAll('.mcol'));
      var i = cols.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = e.key === 'ArrowRight' ? Math.min(i + 1, cols.length - 1) : Math.max(i - 1, 0);
      cols[n].focus();
    });

    toggle.addEventListener('click', function () {
      var showTable = tbl.hidden;
      tbl.hidden = !showTable;
      plot.hidden = showTable;
      xax.hidden = showTable;
      if (showTable) hideTip();
      toggle.textContent = showTable ? 'View as chart' : 'View as table';
      toggle.setAttribute('aria-expanded', String(showTable));
    });

    return fig;
  }

  function mount() {
    // the original bar row: a flex row of 14 divs each with a "Day N · X" title
    var rows = document.querySelectorAll('div[style*="align-items: flex-end"]');
    rows.forEach(function (row) {
      if (row.getAttribute('data-manara-chart-done')) return;
      var kids = row.children;
      if (kids.length !== 14 || !kids[0].getAttribute('title')) return;
      if (!/interactions/i.test(kids[0].getAttribute('title'))) return;
      row.setAttribute('data-manara-chart-done', '1');
      row.style.display = 'none';
      var fig = build(row);
      if (row.nextSibling) row.parentNode.insertBefore(fig, row.nextSibling);
      else row.parentNode.appendChild(fig);
    });
  }

  var raf = null;
  var mo = new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = null; mount(); });
  });

  function arm() {
    mount();
    // Observe `document`, not `documentElement`: the template runtime swaps the
    // whole <html> element out, which would silently detach an observer bound to
    // the old node (and did — the chart never mounted).
    mo.observe(document, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm);
  else arm();
  window.addEventListener('load', mount);
  // belt-and-braces: the runtime renders asynchronously after load
  [500, 1500, 3000, 6000].forEach(function (ms) { setTimeout(mount, ms); });
})();
