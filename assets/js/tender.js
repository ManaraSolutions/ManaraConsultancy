/* Manara — tender & bid support brief.
   Same model as the consultation page: the form builds a printable "sheet",
   rendered to PDF and POSTed (base64) to the Cloudflare Worker that emails it.
   If the PDF or the worker fails, we fall back to a pre-filled mailto so a brief
   with a live deadline on it is never silently lost.

   html2pdf is ~900KB, so it is fetched lazily on first use. */
(function () {
  'use strict';

  var ENDPOINT = 'https://manara-quote.mya-moubarak.workers.dev/';
  var PDF_LIB = 'assets/js/html2pdf.bundle.min.js';
  var TO = 'hello@manaraconsultancy.online';

  var form = document.getElementById('tform');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $('status');
  var countrySel = $('country');
  var implSel = $('impl');
  var reachSel = $('reach');
  var emailWrap = $('wrap-email');
  var phoneWrap = $('wrap-phone');
  var emailIn = $('email');
  var phoneIn = $('phone');
  var dialEl = $('dial');
  var bondSel = $('bidbond');
  var bondWrap = $('wrap-bond');
  var bondIn = $('bondamt');
  var deadlineIn = $('deadline');
  var clockEl = $('clock');

  /* ---------- reference number: TN-YYYYMM-XXXX, stable for the session ---------- */
  var now = new Date();
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  var REF = 'TN-' + now.getFullYear() + pad(now.getMonth() + 1, 2) + '-' +
    pad(Math.floor(Math.random() * 10000), 4);
  $('sRef').textContent = REF;
  var DATE_FMT = { day: 'numeric', month: 'long', year: 'numeric' };
  $('sDate').textContent = now.toLocaleDateString('en-GB', DATE_FMT);

  // a tender deadline in the past is a data-entry error, not a valid brief
  deadlineIn.min = now.toISOString().slice(0, 10);

  /* ---------- country lists (implementation + your location) ---------- */
  function fillCountries() {
    var list = window.MANARA_COUNTRIES;
    if (!list || !list.length) return false;
    [countrySel, implSel].forEach(function (sel) {
      var frag = document.createDocumentFragment();
      list.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.n;
        o.setAttribute('data-dial', c.d);
        o.textContent = c.n + (c.f ? '  ' + c.f : '') + (sel === countrySel ? '  (' + c.d + ')' : '');
        frag.appendChild(o);
      });
      sel.appendChild(frag);
    });
    return true;
  }
  // countries.js is deferred like this file; order isn't guaranteed when one is
  // cached, so retry briefly rather than rendering an empty <select>.
  if (!fillCountries()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (fillCountries() || ++tries > 40) clearInterval(iv);
    }, 50);
  }

  function currentDial() {
    var o = countrySel.selectedOptions[0];
    return (o && o.getAttribute('data-dial')) || '';
  }
  function syncDial() {
    var d = currentDial();
    dialEl.textContent = d || '—';
    phoneIn.disabled = !d;
    phoneIn.placeholder = d ? '70 123 456' : 'Select a country first';
  }

  function syncReach() {
    var byPhone = reachSel.value === 'Phone';
    phoneWrap.hidden = !byPhone;
    emailWrap.hidden = byPhone;
    emailIn.required = !byPhone;
    phoneIn.required = byPhone;
    if (byPhone) syncDial();
    render();
  }

  function syncBond() {
    var required = bondSel.value === 'Required';
    bondWrap.hidden = !required;
    bondIn.required = required;
    if (!required) bondIn.value = '';
    render();
  }

  /* ---------- read state ---------- */
  function checked(name) {
    return [].slice.call(form.querySelectorAll('input[name=' + name + ']:checked'))
      .map(function (i) { return i.value; });
  }
  function val(n) { var e = form.elements[n]; return e ? String(e.value || '').trim() : ''; }
  function radio(n) { var e = form.querySelector('input[name=' + n + ']:checked'); return e ? e.value : ''; }

  function contactValue() {
    if (reachSel.value === 'Phone') {
      var p = val('phone');
      return p ? (currentDial() + ' ' + p) : '';
    }
    return val('email');
  }

  /* ---------- the deadline clock ----------
     Everything in a tender hangs off this number, so it is computed once and
     reused by the sheet, the warning banner and the email body. Dates are parsed
     as local midnight (the <input type=date> value is calendar-only). */
  function deadlineInfo() {
    var raw = val('deadline');
    if (!raw) return null;
    var parts = raw.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2], 23, 59, 59);
    if (isNaN(d.getTime())) return null;
    var midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var days = Math.round((new Date(+parts[0], +parts[1] - 1, +parts[2]) - midnightToday) / 86400000);
    return { date: d, days: days, label: d.toLocaleDateString('en-GB', DATE_FMT) };
  }

  function renderClock() {
    var info = deadlineInfo();
    if (!info) { clockEl.className = 'clock'; clockEl.textContent = ''; return; }
    var t = val('dltime');
    if (info.days < 0) {
      clockEl.className = 'clock on tight';
      clockEl.innerHTML = '<b>This deadline has passed.</b> Check the date, or ask us about the next round.';
      return;
    }
    var word = info.days === 0 ? 'Today' : info.days === 1 ? '1 day' : info.days + ' days';
    var tight = info.days <= 7;
    clockEl.className = 'clock on' + (tight ? ' tight' : '');
    clockEl.innerHTML = '<b>' + word + '</b> until submission' + (t ? ' at ' + t : '') +
      (tight
        ? '. That is tight. Tell us today and we will triage the compliance list first.'
        : '. Enough runway to build a compliant, competitive bid.');
  }

  /* ---------- live sheet ---------- */
  function setText(id, text, dimIfEmpty) {
    var el = $(id);
    var empty = !text;
    el.textContent = empty ? (dimIfEmpty || '—') : text;
    el.classList.toggle('dim', empty);
  }

  function setPills(id, arr, emptyText) {
    var cell = $(id);
    cell.innerHTML = '';
    if (!arr.length) {
      cell.textContent = emptyText;
      cell.classList.add('dim');
      return;
    }
    cell.classList.remove('dim');
    var wrap = document.createElement('span');
    wrap.className = 'pills';
    arr.forEach(function (s) {
      var p = document.createElement('span');
      p.className = 'pill';
      p.textContent = s;
      wrap.appendChild(p);
    });
    cell.appendChild(wrap);
  }

  function bondText() {
    if (bondSel.value !== 'Required') return bondSel.value;
    var a = val('bondamt');
    return a ? 'Required — ' + a : 'Required';
  }

  function valueText() {
    var v = val('value');
    return v ? v + ' ' + val('currency') : '';
  }

  function render() {
    setText('sTitle', val('title'));
    setText('sTref', val('tref'));
    setText('sIssuer', val('issuer'));
    setText('sImpl', val('impl'));
    setText('sSector', radio('sector'));

    var info = deadlineInfo();
    setText('sDeadline', info ? info.label + (val('dltime') ? ', ' + val('dltime') : '') : '');
    var rem = $('sRemaining');
    if (!info) {
      rem.textContent = '—'; rem.className = 'dim';
    } else if (info.days < 0) {
      rem.textContent = 'Deadline has passed'; rem.className = 'flag';
    } else {
      rem.textContent = info.days === 0 ? 'Due today' : info.days + ' day' + (info.days === 1 ? '' : 's') + ' remaining';
      rem.className = info.days <= 7 ? 'flag' : '';
    }
    var q = val('qdeadline');
    setText('sQdeadline', q ? new Date(q).toLocaleDateString('en-GB', DATE_FMT) : '');

    setText('sMethod', val('method'));
    setText('sSitevisit', val('sitevisit'));
    setText('sLang', val('lang'));
    setText('sCopies', val('copies'));

    setText('sValue', valueText());
    setText('sValidity', val('validity'));
    setText('sBond', bondText());
    setText('sPerf', val('perfguarantee'));
    setText('sEval', val('evaluation'));
    setText('sDelivery', val('delivery'));
    setText('sPayterms', val('payterms'));
    setText('sIncoterms', val('incoterms'));
    setText('sEntity', val('entity'));

    setPills('sDocs', checked('doc'), 'None flagged yet');
    setPills('sSupport', checked('support'), 'None selected yet');

    setText('sName', val('name'));
    setText('sOrg', val('org'));
    setText('sCountry', val('country'));
    setText('sReach', reachSel.value === 'Phone' ? 'Phone / WhatsApp' : 'Email');
    setText('sContact', contactValue());
    setText('sNotes', val('notes'));

    renderClock();
  }

  /* ---------- validation ---------- */
  function showErr(id, on, field) {
    $(id).classList.toggle('on', on);
    if (field) field.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  function validate() {
    var ok = true;

    var titleOk = !!val('title');
    showErr('e-title', !titleOk, form.elements.title);
    if (!titleOk) ok = false;

    var issuerOk = !!val('issuer');
    showErr('e-issuer', !issuerOk, form.elements.issuer);
    if (!issuerOk) ok = false;

    var info = deadlineInfo();
    var dlOk = !!info && info.days >= 0;
    showErr('e-deadline', !dlOk, deadlineIn);
    if (!dlOk) ok = false;

    var bondOk = bondSel.value !== 'Required' || !!val('bondamt');
    showErr('e-bond', !bondOk, bondIn);
    if (!bondOk) ok = false;

    var supOk = checked('support').length > 0;
    showErr('e-support', !supOk);
    if (!supOk) ok = false;

    var nameOk = !!val('name');
    showErr('e-name', !nameOk, form.elements.name);
    if (!nameOk) ok = false;

    var orgOk = !!val('org');
    showErr('e-org', !orgOk, form.elements.org);
    if (!orgOk) ok = false;

    var cOk = !!val('country');
    showErr('e-country', !cOk, countrySel);
    if (!cOk) ok = false;

    var contactOk;
    if (reachSel.value === 'Phone') {
      var digits = val('phone').replace(/[^\d]/g, '');
      contactOk = digits.length >= 6 && !!currentDial();
      $('e-contact').textContent = currentDial()
        ? 'Enter a valid phone number (at least 6 digits).'
        : 'Select your country so we can add the dialling code.';
    } else {
      contactOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'));
      $('e-contact').textContent = 'Enter a valid email address.';
    }
    showErr('e-contact', !contactOk, reachSel.value === 'Phone' ? phoneIn : emailIn);
    if (!contactOk) ok = false;

    if (!ok) {
      var firstErr = form.querySelector('.err.on');
      if (firstErr) firstErr.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return ok;
  }

  /* ---------- warm cover note: the email body itself (the PDF carries the full
     brief, so the message stays short, human and on-brand) ---------- */
  function coverNote() {
    var name = val('name'), org = val('org'), info = deadlineInfo(), title = val('title');
    var line = function (label, v) { return v ? label + ': ' + v : null; };
    var dl = info ? info.label + (info.days < 0 ? ' (passed)' : info.days <= 30 ? ' (' + info.days + ' days)' : '') : null;
    return [
      'Thank you — we have received your tender support request and it is now with our team.',
      '',
      'Your full brief is attached to this email as a PDF. A Manara adviser will review it in confidence and reply within one business day.',
      '',
      'Reference: ' + REF,
      line('Tender', title),
      line('Submission deadline', dl),
      line('From', name + (org ? ', ' + org : '')),
      'Submitted: ' + now.toLocaleDateString('en-GB', DATE_FMT),
      '',
      'If anything changes in the meantime, simply reply to this email.',
      '',
      'Manara Consultancy — a fixed point in changing waters.',
      'manaraconsultancy.online · +961 76 952 134 · hello@manaraconsultancy.online'
    ].filter(function (x) { return x !== null; }).join('\n').replace(/\n{3,}/g, '\n\n');
  }

  /* ---------- full detail: used ONLY for the mailto fallback, where no PDF can
     be attached. No ASCII rules; blank fields are omitted, not dashed. ---------- */
  function bodyText() {
    var info = deadlineInfo();
    var docs = checked('doc');
    var sup = checked('support');
    var line = function (label, v) { return v ? label + ': ' + v : null; };
    return [
      'TENDER SUPPORT BRIEF ' + REF,
      'Submitted ' + now.toLocaleDateString('en-GB', DATE_FMT),
      '',
      'THE TENDER',
      line('Title', val('title')),
      line('Reference', val('tref')),
      line('Issuing authority', val('issuer')),
      line('Country of implementation', val('impl')),
      line('Procurement type', radio('sector')),
      '',
      'DEADLINES & SUBMISSION',
      line('Submission deadline', info ? info.label + (val('dltime') ? ', ' + val('dltime') : '') : null),
      line('Time remaining', info ? (info.days < 0 ? 'passed' : info.days + ' days') : null),
      line('Clarifications close', val('qdeadline')),
      line('Submission method', val('method')),
      line('Pre-bid / site visit', val('sitevisit')),
      line('Language', val('lang')),
      line('Copies required', val('copies')),
      '',
      'COMMERCIAL & GUARANTEES',
      line('Estimated value', valueText()),
      line('Bid validity', val('validity')),
      line('Bid security', bondText()),
      line('Performance guarantee', val('perfguarantee')),
      line('Evaluation method', val('evaluation')),
      line('Delivery period', val('delivery')),
      line('Payment terms', val('payterms')),
      line('Incoterms', val('incoterms')),
      line('Bidding as', val('entity')),
      '',
      line('Documents required', docs.length ? docs.join(', ') : null),
      line('Support requested', sup.length ? sup.join(', ') : null),
      '',
      'CONTACT',
      line('Name', val('name')),
      line('Company', val('org')),
      line('Location', val('country')),
      'Reach by: ' + reachSel.value,
      line('Contact', contactValue()),
      val('notes') ? '' : null,
      val('notes') ? 'Notes:' : null,
      val('notes') || null,
      '',
      'manaraconsultancy.online · +961 76 952 134 · hello@manaraconsultancy.online'
    ].filter(function (x) { return x !== null; }).join('\n').replace(/\n{3,}/g, '\n\n');
  }

  function subject() {
    var info = deadlineInfo();
    var urgency = info && info.days >= 0 && info.days <= 7 ? ' [closes in ' + info.days + 'd]' : '';
    return 'Tender brief ' + REF + urgency + ' - ' + (val('org') || val('title') || 'New tender');
  }

  /* ---------- lazy html2pdf ---------- */
  var libPromise = null;
  function loadPdfLib() {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    if (libPromise) return libPromise;
    libPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PDF_LIB;
      s.onload = function () { resolve(window.html2pdf); };
      s.onerror = function () { libPromise = null; reject(new Error('pdf lib failed to load')); };
      document.head.appendChild(s);
    });
    return libPromise;
  }

  /* html2canvas offsets its capture by the live page's scroll position, so once
     the reader has scrolled down to the buttons the sheet is painted outside the
     canvas bounds and the PDF arrives as an empty navy rectangle. Pinning
     scrollX/scrollY and stating the window size makes the capture independent of
     where the page happens to be scrolled. */
  function pdfOptions(el) {
    return {
      margin: 0,
      filename: 'Manara-Tender-' + REF + '.pdf',
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: 2,
        backgroundColor: '#0C1A2A',
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      },
      jsPDF: { unit: 'px', format: [816, Math.max(el.scrollHeight + 80, 1056)], orientation: 'portrait' }
    };
  }

  function say(msg, kind) {
    statusEl.textContent = msg || '';
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  /* ---------- save as PDF ---------- */
  var btnPdf = $('btnPdf');
  btnPdf.addEventListener('click', function () {
    if (!validate()) { say('Please complete the highlighted fields.', 'bad'); return; }
    btnPdf.disabled = true;
    say('Building your brief…');
    var el = $('sheet');
    loadPdfLib()
      .then(function (h2p) { return h2p().set(pdfOptions(el)).from(el).save(); })
      .then(function () { say('Saved. Check your downloads folder.', 'ok'); })
      .catch(function () {
        say('PDF export is unavailable on this device. Opening your print dialog instead.', 'bad');
        window.print();
      })
      .then(function () { btnPdf.disabled = false; });
  });

  /* ---------- send (PDF attached), with mailto fallback ---------- */
  function mailtoFallback(reason) {
    var href = 'mailto:' + TO +
      '?subject=' + encodeURIComponent(subject()) +
      (reachSel.value === 'Email' && val('email') ? '&cc=' + encodeURIComponent(val('email')) : '') +
      '&body=' + encodeURIComponent(bodyText());
    say((reason ? reason + ' ' : '') + 'Opening your email app with the brief pre-filled…', 'bad');
    try { window.location.href = href; } catch (e) { /* nothing more we can do */ }
  }

  var btnSend = $('btnSend');
  btnSend.addEventListener('click', function () {
    if (!validate()) { say('Please complete the highlighted fields.', 'bad'); return; }
    btnSend.disabled = true;
    say('Preparing your brief…');

    var el = $('sheet');
    loadPdfLib()
      .then(function (h2p) { return h2p().set(pdfOptions(el)).from(el).outputPdf('datauristring'); })
      .then(function (uri) {
        if (!uri) throw new Error('no pdf');
        var b64 = uri.indexOf('base64,') >= 0 ? uri.substring(uri.indexOf('base64,') + 7) : uri;
        say('Sending…');
        return fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: 'Manara-Tender-' + REF + '.pdf',
            pdfBase64: b64,
            clientName: val('name'),
            clientEmail: reachSel.value === 'Email' ? val('email') : '',
            subject: subject(),
            bodyText: bodyText(),
            coverText: coverNote()
          })
        });
      })
      .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, text: t }; }); })
      .then(function (res) {
        var j = {};
        try { j = JSON.parse(res.text); } catch (e) { /* non-JSON reply */ }
        if (res.ok && j && j.success) {
          var info = deadlineInfo();
          var soon = info && info.days <= 7;
          say('Brief sent. ' + (soon ? 'We will come back to you today.' : 'We reply within one business day.') +
            ' Reference ' + REF + '.', 'ok');
          btnSend.textContent = 'Brief sent ✓';
          return;
        }
        mailtoFallback('We could not send it automatically.');
        btnSend.disabled = false;
      })
      .catch(function () {
        mailtoFallback('We could not send it automatically.');
        btnSend.disabled = false;
      });
  });

  /* ---------- wiring ---------- */
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  countrySel.addEventListener('change', function () { syncDial(); render(); });
  reachSel.addEventListener('change', syncReach);
  bondSel.addEventListener('change', syncBond);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  syncReach();
  syncBond();
  render();
})();
