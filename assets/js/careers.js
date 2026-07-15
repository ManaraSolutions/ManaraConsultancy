/* Manara — careers application.
   The CV is read in the browser, base64-encoded and POSTed (with the file as an
   attachment) to the same Cloudflare Worker the quotation forms use, so it lands
   in Manara's inbox directly — no mailto, no "please attach it yourself". A
   mailto is kept only as a last-resort fallback if the send fails outright. */
(function () {
  'use strict';

  var ENDPOINT = 'https://manara-quote.mya-moubarak.workers.dev/';
  var TO = 'hello@manaraconsultancy.online';
  var MAX_BYTES = 8 * 1024 * 1024; // 8 MB

  var $ = function (id) { return document.getElementById(id); };
  var form = $('apform');
  if (!form) return;

  var roleEl = $('role'), nameEl = $('name'), emailEl = $('email'),
      phoneEl = $('phone'), linkedinEl = $('linkedin'), msgEl = $('msg'),
      cvEl = $('cv'), drop = $('drop'), dropText = $('dropText'), cvName = $('cvName'),
      eCv = $('e-cv'), btn = $('send'), statusEl = $('status'),
      doneEl = $('done'), doneMsg = $('doneMsg');

  var chosen = null;

  /* ---- prefill from query (?role=&name=&email=&msg=) so the homepage can hand off ---- */
  (function prefill() {
    var q = new URLSearchParams(location.search);
    var r = q.get('role');
    if (r) {
      var opts = [].slice.call(roleEl.options);
      var match = opts.filter(function (o) { return o.value; })
        .find(function (o) { return o.value.toLowerCase().indexOf(r.toLowerCase()) >= 0 || r.toLowerCase().indexOf(o.value.toLowerCase()) >= 0; });
      if (match) roleEl.value = match.value;
    }
    if (q.get('name')) nameEl.value = q.get('name');
    if (q.get('email')) emailEl.value = q.get('email');
    if (q.get('msg')) msgEl.value = q.get('msg');
  })();

  /* ---- file selection: click, browse, drag & drop ---- */
  function pretty(bytes) {
    return bytes < 1024 * 1024 ? Math.round(bytes / 1024) + ' KB'
      : (bytes / 1048576).toFixed(1) + ' MB';
  }
  function setFile(file) {
    if (!file) return;
    var ok = /\.(pdf|docx?|DOCX?|PDF)$/i.test(file.name);
    if (!ok) { fail('Please upload a PDF, DOC or DOCX file.'); return; }
    if (file.size > MAX_BYTES) { fail('That file is over 8 MB — please compress it and try again.'); return; }
    chosen = file;
    eCv.classList.remove('on'); drop.removeAttribute('aria-invalid');
    dropText.textContent = 'CV attached:';
    cvName.hidden = false;
    cvName.textContent = file.name + '  ·  ' + pretty(file.size);
  }
  function fail(m) { eCv.textContent = m; eCv.classList.add('on'); drop.setAttribute('aria-invalid', 'true'); }

  drop.addEventListener('click', function () { cvEl.click(); });
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cvEl.click(); } });
  cvEl.addEventListener('change', function () { setFile(cvEl.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'dragend', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function () { drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  });

  /* ---- helpers ---- */
  function say(m, kind) { statusEl.textContent = m || ''; statusEl.className = 'status' + (kind ? ' ' + kind : ''); }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function bodyText() {
    return [
      'JOB APPLICATION',
      '',
      'Role: ' + roleEl.value,
      'Name: ' + nameEl.value.trim(),
      'Email: ' + emailEl.value.trim(),
      phoneEl.value.trim() ? 'Phone: ' + phoneEl.value.trim() : null,
      linkedinEl.value.trim() ? 'LinkedIn / portfolio: ' + linkedinEl.value.trim() : null,
      '',
      'Why Manara:',
      msgEl.value.trim() || '—',
      '',
      'CV attached: ' + (chosen ? chosen.name : '(none)')
    ].filter(function (x) { return x !== null; }).join('\n');
  }

  function readBase64(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result);
        resolve(s.indexOf('base64,') >= 0 ? s.substring(s.indexOf('base64,') + 7) : s);
      };
      fr.onerror = function () { reject(new Error('read failed')); };
      fr.readAsDataURL(file);
    });
  }

  function mailtoFallback() {
    var href = 'mailto:' + TO +
      '?subject=' + encodeURIComponent('Manara application — ' + roleEl.value + ' — ' + nameEl.value.trim()) +
      '&body=' + encodeURIComponent(bodyText() + '\n\n(Please attach your CV to this email before sending.)');
    say('We could not upload automatically — opening your email app instead. Please attach your CV and send.', 'bad');
    try { window.location.href = href; } catch (e) { /* nothing more */ }
  }

  /* ---- submit ---- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var okName = !!nameEl.value.trim();
    var okEmail = validEmail(emailEl.value.trim());
    nameEl.setAttribute('aria-invalid', okName ? 'false' : 'true');
    emailEl.setAttribute('aria-invalid', okEmail ? 'false' : 'true');
    if (!chosen) fail('Please attach your CV (PDF, DOC or DOCX, under 8 MB).');

    if (!okName || !okEmail || !chosen) {
      say('Please complete the highlighted fields.', 'bad');
      (!okName ? nameEl : !okEmail ? emailEl : drop).scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    btn.disabled = true;
    say('Uploading your application…');

    readBase64(chosen)
      .then(function (b64) {
        return fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: chosen.name,
            pdfBase64: b64,                 // the CV, sent as the email attachment
            clientName: nameEl.value.trim(),
            clientEmail: emailEl.value.trim(),
            subject: 'Manara application — ' + roleEl.value + ' — ' + nameEl.value.trim(),
            bodyText: bodyText()
          })
        });
      })
      .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, text: t }; }); })
      .then(function (res) {
        var j = {}; try { j = JSON.parse(res.text); } catch (e) { /* non-JSON */ }
        if (res.ok && j && j.success) {
          form.style.display = 'none';
          doneEl.classList.add('on');
          doneEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
        mailtoFallback(); btn.disabled = false;
      })
      .catch(function () { mailtoFallback(); btn.disabled = false; });
  });
})();
