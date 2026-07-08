/* Manara — consultation request page.
   Mirrors the quotation page's model: the form builds a printable "sheet",
   which is rendered to a PDF and POSTed (base64) to the same Cloudflare Worker
   that emails the quotation. If the PDF or the worker fails, we fall back to a
   pre-filled mailto so the request is never lost.

   html2pdf is ~900KB, so it is fetched lazily on first use rather than on load. */
(function () {
  'use strict';

  var ENDPOINT = 'https://manara-quote.mya-moubarak.workers.dev/';
  var PDF_LIB = 'assets/js/html2pdf.bundle.min.js';
  var TO = 'hello@manaraconsultancy.online';

  var form = document.getElementById('cform');
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

  /* ---------- reference number: CR-YYYYMM-XXXX, stable for the session ---------- */
  var now = new Date();
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  var REF = 'CR-' + now.getFullYear() + pad(now.getMonth() + 1, 2) + '-' +
    pad(Math.floor(Math.random() * 10000), 4);
  $('sRef').textContent = REF;
  $('sDate').textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  /* ---------- country list + dial codes ---------- */
  function fillCountries() {
    var list = window.MANARA_COUNTRIES;
    if (!list || !list.length) return false;
    var frag = document.createDocumentFragment();
    list.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.n;
      o.setAttribute('data-dial', c.d);
      o.textContent = (c.f ? c.f + '  ' : '') + c.n + ' (' + c.d + ')';
      frag.appendChild(o);
    });
    countrySel.appendChild(frag);
    return true;
  }
  // countries.js is deferred like this file, but order isn't guaranteed across
  // browsers when one is cached; retry briefly rather than silently rendering
  // an empty <select>.
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

  /* ---------- contact method toggle ---------- */
  function syncReach() {
    var byPhone = reachSel.value === 'Phone';
    phoneWrap.hidden = !byPhone;
    emailWrap.hidden = byPhone;
    // keep required-ness honest for assistive tech
    emailIn.required = !byPhone;
    phoneIn.required = byPhone;
    if (byPhone) syncDial();
    render();
  }

  /* ---------- read state ---------- */
  function services() {
    return [].slice.call(form.querySelectorAll('input[name=service]:checked'))
      .map(function (i) { return i.value; });
  }
  function val(n) { var e = form.elements[n]; return e ? String(e.value || '').trim() : ''; }

  function contactValue() {
    if (reachSel.value === 'Phone') {
      var p = val('phone');
      return p ? (currentDial() + ' ' + p) : '';
    }
    return val('email');
  }

  /* ---------- live sheet ---------- */
  function setText(id, text, dimIfEmpty) {
    var el = $(id);
    var empty = !text;
    el.textContent = empty ? (dimIfEmpty || '—') : text;
    el.classList.toggle('dim', empty);
  }

  function render() {
    setText('sPractice', val('practice'));
    setText('sName', val('name'));
    setText('sOrg', val('org'));
    setText('sCountry', val('country'));
    setText('sReach', reachSel.value === 'Phone' ? 'Phone / WhatsApp' : 'Email');
    setText('sContact', contactValue());
    setText('sTimeline', val('timeline'));
    setText('sBudget', val('budget'));
    setText('sNotes', val('notes'));

    var sv = services();
    var cell = $('sServices');
    cell.innerHTML = '';
    if (!sv.length) {
      cell.textContent = 'None selected yet';
      cell.classList.add('dim');
    } else {
      cell.classList.remove('dim');
      var wrap = document.createElement('span');
      wrap.className = 'pills';
      sv.forEach(function (s) {
        var p = document.createElement('span');
        p.className = 'pill';
        p.textContent = s;
        wrap.appendChild(p);
      });
      cell.appendChild(wrap);
    }
  }

  /* ---------- validation ---------- */
  function showErr(id, on, field) {
    $(id).classList.toggle('on', on);
    if (field) field.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  function validate() {
    var ok = true;
    var nameOk = !!val('name');
    showErr('e-name', !nameOk, form.elements.name);
    if (!nameOk) ok = false;

    var svOk = services().length > 0;
    showErr('e-service', !svOk);
    if (!svOk) ok = false;

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
      showErr('e-contact', !contactOk, phoneIn);
    } else {
      contactOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'));
      $('e-contact').textContent = 'Enter a valid email address.';
      showErr('e-contact', !contactOk, emailIn);
    }
    if (!contactOk) ok = false;

    if (!ok) {
      var firstErr = form.querySelector('.err.on');
      if (firstErr) firstErr.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return ok;
  }

  /* ---------- plain-text body (mailto fallback + email preamble) ---------- */
  function bodyText() {
    var sv = services();
    return [
      'CONSULTATION REQUEST ' + REF,
      'Submitted ' + now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      '',
      'Preferred practice: ' + val('practice'),
      'Services of interest: ' + (sv.length ? sv.join(', ') : '—'),
      '',
      'Name: ' + (val('name') || '—'),
      val('org') ? 'Organisation: ' + val('org') : '',
      'Location: ' + (val('country') || '—'),
      'Best way to reach me: ' + reachSel.value,
      'Contact: ' + (contactValue() || '—'),
      '',
      'Timeline: ' + val('timeline'),
      'Indicative budget: ' + val('budget'),
      '',
      'Situation:',
      val('notes') || '—',
      '',
      'manaraconsultancy.online · +961 76 952 134 · hello@manaraconsultancy.online'
    ].filter(Boolean).join('\n');
  }

  function subject() {
    return 'Consultation request ' + REF + ' — ' + (val('name') || 'New enquiry');
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
      filename: 'Manara-Consultation-' + REF + '.pdf',
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, backgroundColor: '#0C1A2A', useCORS: true },
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
    say('Building your PDF…');
    var el = $('sheet');
    loadPdfLib()
      .then(function (h2p) { return h2p().set(pdfOptions(el)).from(el).save(); })
      .then(function () { say('Saved. Check your downloads folder.', 'ok'); })
      .catch(function () {
        say('PDF export is unavailable on this device — opening your print dialog instead.', 'bad');
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
    say((reason ? reason + ' ' : '') + 'Opening your email app with the request pre-filled…', 'bad');
    try { window.location.href = href; } catch (e) { /* nothing more we can do */ }
  }

  var btnSend = $('btnSend');
  btnSend.addEventListener('click', function () {
    if (!validate()) { say('Please complete the highlighted fields.', 'bad'); return; }
    btnSend.disabled = true;
    say('Preparing your request…');

    var el = $('sheet');
    loadPdfLib()
      .then(function (h2p) {
        return h2p().set(pdfOptions(el)).from(el).outputPdf('datauristring');
      })
      .then(function (uri) {
        if (!uri) throw new Error('no pdf');
        var b64 = uri.indexOf('base64,') >= 0 ? uri.substring(uri.indexOf('base64,') + 7) : uri;
        say('Sending…');
        return fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: 'Manara-Consultation-' + REF + '.pdf',
            pdfBase64: b64,
            clientName: val('name'),
            clientEmail: reachSel.value === 'Email' ? val('email') : '',
            subject: subject(),
            bodyText: bodyText()
          })
        });
      })
      .then(function (r) {
        return r.text().then(function (t) { return { ok: r.ok, text: t }; });
      })
      .then(function (res) {
        var j = {};
        try { j = JSON.parse(res.text); } catch (e) { /* non-JSON reply */ }
        if (res.ok && j && j.success) {
          say('Request sent. We reply within one business day — reference ' + REF + '.', 'ok');
          btnSend.textContent = 'Request sent ✓';
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
  // don't let Enter submit (there is no server-side action)
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  syncReach();
  render();
})();
