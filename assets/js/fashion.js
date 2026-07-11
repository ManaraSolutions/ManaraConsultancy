/* Manara — fashion styling quotation brief.
   Same model as the tender, consultation and legal pages: the form builds a
   printable "sheet", rendered to PDF and POSTed (base64) to the Cloudflare Worker
   that emails it. If the PDF or the worker fails, we fall back to a pre-filled
   mailto so a styling brief is never silently lost. */
(function () {
  'use strict';

  var ENDPOINT = 'https://manara-quote.mya-moubarak.workers.dev/';
  var PDF_LIB = 'assets/js/html2pdf.bundle.min.js';
  var TO = 'hello@manaraconsultancy.online';

  var form = document.getElementById('fform');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $('status');
  var countrySel = $('country');
  var reachSel = $('reach');
  var emailWrap = $('wrap-email');
  var phoneWrap = $('wrap-phone');
  var emailIn = $('email');
  var phoneIn = $('phone');
  var dialEl = $('dial');

  /* ---------- reference: FS-YYYYMM-XXXX, stable for the session ---------- */
  var now = new Date();
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  var REF = 'FS-' + now.getFullYear() + pad(now.getMonth() + 1, 2) + '-' +
    pad(Math.floor(Math.random() * 10000), 4);
  $('sRef').textContent = REF;
  var DATE_FMT = { day: 'numeric', month: 'long', year: 'numeric' };
  $('sDate').textContent = now.toLocaleDateString('en-GB', DATE_FMT);

  /* ---------- country list (your location) ---------- */
  function fillCountries() {
    var list = window.MANARA_COUNTRIES;
    if (!list || !list.length) return false;
    var frag = document.createDocumentFragment();
    list.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.n;
      o.setAttribute('data-dial', c.d);
      o.textContent = c.n + (c.f ? '  ' + c.f : '') + '  (' + c.d + ')';
      frag.appendChild(o);
    });
    countrySel.appendChild(frag);
    return true;
  }
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

  /* ---------- read state ---------- */
  function decode(s) { var t = document.createElement('textarea'); t.innerHTML = s; return t.value; }
  function checked(name) {
    return [].slice.call(form.querySelectorAll('input[name=' + name + ']:checked'))
      .map(function (i) { return decode(i.value); });
  }
  function val(n) { var e = form.elements[n]; if (!e) return ''; return String(e.value || '').trim(); }
  function radio(n) { var e = form.querySelector('input[name=' + n + ']:checked'); return e ? e.value : ''; }

  function contactValue() {
    if (reachSel.value === 'Phone') {
      var p = val('phone');
      return p ? (currentDial() + ' ' + p) : '';
    }
    return val('email');
  }

  function eventDateLabel() {
    var raw = val('eventdate');
    if (!raw) return '';
    var parts = raw.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (isNaN(d.getTime())) return '';
    var midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var days = Math.round((d - midnightToday) / 86400000);
    var label = d.toLocaleDateString('en-GB', DATE_FMT);
    if (days >= 0 && days <= 21) label += ' (' + (days === 0 ? 'today' : days + ' days') + ')';
    return label;
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
    if (!arr.length) { cell.textContent = emptyText; cell.classList.add('dim'); return; }
    cell.classList.remove('dim');
    var wrap = document.createElement('span');
    wrap.className = 'pills';
    arr.forEach(function (s) {
      var p = document.createElement('span'); p.className = 'pill'; p.textContent = s; wrap.appendChild(p);
    });
    cell.appendChild(wrap);
  }

  function render() {
    setPills('sServices', checked('service'), 'None selected yet');
    setText('sWho', radio('who'));
    setText('sFormat', val('format'));
    setText('sSession', val('session'));

    setPills('sOccasion', checked('occasion'), 'None selected yet');
    setText('sEventDate', eventDateLabel());
    setText('sSizes', val('sizes'));

    setText('sCity', val('city'));
    setText('sTimeline', val('timeline'));
    setText('sBudget', val('budget'));

    setText('sName', val('name'));
    setText('sCountry', val('country'));
    setText('sReach', reachSel.value === 'Phone' ? 'Phone / WhatsApp' : 'Email');
    setText('sContact', contactValue());
    setText('sNotes', val('notes'));
  }

  /* ---------- validation ---------- */
  function showErr(id, on, field) {
    $(id).classList.toggle('on', on);
    if (field) field.setAttribute('aria-invalid', on ? 'true' : 'false');
  }
  function validate() {
    var ok = true;

    var svcOk = checked('service').length > 0;
    showErr('e-service', !svcOk);
    if (!svcOk) ok = false;

    var nameOk = !!val('name');
    showErr('e-name', !nameOk, form.elements.name);
    if (!nameOk) ok = false;

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
    var name = val('name'), svc = checked('service'), who = radio('who');
    var line = function (label, v) { return v ? label + ': ' + v : null; };
    return [
      'Thank you — we have received your styling request and it is now with our team.',
      '',
      'Your full brief is attached to this email as a PDF. A Manara stylist will review it and reply within one business day.',
      '',
      'Reference: ' + REF,
      line('Styling for', who),
      line('Services', svc.length ? svc.join(', ') : null),
      line('From', name),
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
    var svc = checked('service');
    var occ = checked('occasion');
    var line = function (label, v) { return v ? label + ': ' + v : null; };
    return [
      'FASHION STYLING BRIEF ' + REF,
      'Submitted ' + now.toLocaleDateString('en-GB', DATE_FMT),
      '',
      'WHAT YOU NEED',
      line('Services', svc.length ? svc.join(', ') : null),
      line('Styling for', radio('who')),
      line('Format', val('format')),
      line('Engagement', val('session')),
      '',
      'OCCASION & CONTEXT',
      line('Occasion', occ.length ? occ.join(', ') : null),
      line('Event / target date', eventDateLabel()),
      line('Sizes', val('sizes')),
      '',
      'PRACTICALITIES',
      line('City / location', val('city')),
      line('Timeline', val('timeline')),
      line('Budget', val('budget')),
      '',
      'CONTACT',
      line('Name', val('name')),
      line('Location', val('country')),
      'Reach by: ' + reachSel.value,
      line('Contact', contactValue()),
      val('notes') ? '' : null,
      val('notes') ? 'Style goals:' : null,
      val('notes') || null,
      '',
      'manaraconsultancy.online · +961 76 952 134 · hello@manaraconsultancy.online'
    ].filter(function (x) { return x !== null; }).join('\n').replace(/\n{3,}/g, '\n\n');
  }

  function subject() {
    var svc = checked('service');
    return 'Styling brief ' + REF + ' - ' + (val('name') || svc[0] || 'New styling request');
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

  function pdfOptions(el) {
    return {
      margin: 0,
      filename: 'Manara-Fashion-' + REF + '.pdf',
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: 2, backgroundColor: '#0C1A2A', useCORS: true,
        scrollX: 0, scrollY: 0,
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
            filename: 'Manara-Fashion-' + REF + '.pdf',
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
          say('Brief sent. We reply within one business day with a styling proposal. Reference ' + REF + '.', 'ok');
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
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  syncReach();
  render();
})();
