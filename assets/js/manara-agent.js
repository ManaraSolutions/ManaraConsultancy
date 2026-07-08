/* Manara — "Marsa", the harbour beacon.
 *
 * The compiled page ships the AI agent as a small sailboat glyph and a plain
 * chat box. This upgrades it in place, without touching the app's logic:
 *
 *   - the launcher and the panel header become a live Fresnel lighthouse optic:
 *     a rotating beam, prism rings, a lamp core that flickers, ripples at the base
 *   - the panel gets a light-sweep as it opens, a live "on watch" status, and
 *     glowing message bubbles
 *   - suggested prompts are injected above the composer. This is the point of a
 *     proof of concept: a visitor should be able to see the agent answer without
 *     having to think of a question first.
 *
 * Everything is additive and idempotent — the template runtime re-renders freely
 * and the MutationObserver simply re-applies. React owns the input, so prompts are
 * written with the native value setter (otherwise React never sees the change) and
 * then dispatched through the app's own send button.
 */
(function () {
  'use strict';

  var PROMPTS = [
    { label: 'What do you do?', text: 'What does Manara actually do?' },
    { label: 'Cost of an AI agent', text: 'What does an AI agent like you cost to build?' },
    { label: 'Were you built by Manara?', text: 'Were you built by Manara, and how?' }
  ];

  /* The optic. viewBox 0 0 48 48. Drawn back-to-front: sweep, housing, glass,
     prisms, core, then the water it stands in. */
  var BEACON =
    '<defs>' +
    '<radialGradient id="mbGlass" cx="42%" cy="36%" r="66%">' +
    '<stop offset="0" stop-color="rgba(255,246,214,.95)"/>' +
    '<stop offset="55%" stop-color="rgba(230,204,140,.42)"/>' +
    '<stop offset="100%" stop-color="rgba(199,161,78,.16)"/></radialGradient>' +
    '<radialGradient id="mbHalo">' +
    '<stop offset="0" stop-color="rgba(255,232,168,.55)"/>' +
    '<stop offset="60%" stop-color="rgba(255,208,120,.14)"/>' +
    '<stop offset="100%" stop-color="rgba(255,205,110,0)"/></radialGradient>' +
    '<linearGradient id="mbBase" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#E6CC8C"/><stop offset="1" stop-color="#8a6d2b"/></linearGradient>' +
    // the beams fade with distance, so they read as light rather than as a shape
    '<radialGradient id="mbBeam" gradientUnits="userSpaceOnUse" cx="24" cy="23" r="24">' +
    '<stop offset="0" stop-color="rgba(255,231,163,.34)"/>' +
    '<stop offset="55%" stop-color="rgba(255,226,150,.12)"/>' +
    '<stop offset="100%" stop-color="rgba(255,226,150,0)"/></radialGradient>' +
    '</defs>' +

    // the halo the whole thing sits inside
    '<circle class="b-halo" cx="24" cy="23" r="22" fill="url(#mbHalo)"/>' +

    // two opposed beams, sweeping. Kept narrow: wide wedges met the viewBox
    // corners and read as a diamond rather than as light.
    '<g class="b-sweep">' +
    '<path d="M24 23 L46 17.5 L46 28.5 Z" fill="url(#mbBeam)"/>' +
    '<path d="M24 23 L2 17.5 L2 28.5 Z" fill="url(#mbBeam)" opacity=".7"/>' +
    '</g>' +

    // slow orbit ring: reads as "listening"
    '<circle class="b-orbit" cx="24" cy="23" r="19.5" fill="none" ' +
    'stroke="rgba(199,161,78,.4)" stroke-width="1" stroke-dasharray="2.5 5"/>' +

    // roof + finial
    '<path d="M15.5 15.5 L24 7.5 L32.5 15.5 Z" fill="#16283c" stroke="#C7A14E" stroke-width="1"/>' +
    '<circle cx="24" cy="6.6" r="1.35" fill="#E6CC8C"/>' +

    // lantern room: glass, prism rings, core
    '<circle cx="24" cy="23" r="8.6" fill="url(#mbGlass)" stroke="rgba(230,204,140,.55)" stroke-width=".9"/>' +
    '<g class="b-prisms" stroke="rgba(255,240,200,.5)" stroke-width=".7" fill="none">' +
    '<path d="M15.6 20 h16.8 M15.4 23 h17.2 M15.6 26 h16.8"/>' +
    '</g>' +
    '<circle class="b-core" cx="24" cy="23" r="3.3" fill="rgba(255,248,222,.98)"/>' +

    // gallery + plinth
    '<rect x="14" y="31.4" width="20" height="1.9" rx=".9" fill="url(#mbBase)"/>' +
    '<path d="M17 33.3 L16 39.5 M31 33.3 L32 39.5" stroke="#C7A14E" stroke-width="1.5" stroke-linecap="round"/>' +
    '<rect x="14.6" y="39" width="18.8" height="2.4" rx="1.1" fill="url(#mbBase)"/>' +

    // the sea it stands in: one wave only. Two read as noise at 38px.
    '<g class="b-water" stroke="rgba(199,161,78,.55)" stroke-width="1.2" fill="none" stroke-linecap="round">' +
    '<path class="b-ripple b-r1" d="M9 44.6 q3.75 -2 7.5 0 q3.75 2 7.5 0 q3.75 -2 7.5 0 q3.75 2 7.5 0"/>' +
    '</g>';

  function beaconSvg(cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 48 48');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', 'mnr-beacon ' + (cls || ''));
    s.innerHTML = BEACON;
    return s;
  }

  /* ---------- launcher ----------
     Idempotent by presence check, not by a flag on the node: the runtime can
     re-render the button's children at any time, and a flag would tell us the
     work was done while the DOM says otherwise. */
  function upgradeLauncher() {
    var btn = document.querySelector('button.scpf[aria-label="Ask Manara"]');
    if (!btn) return;
    btn.classList.add('mnr-launch');

    if (!btn.querySelector('.mnr-beacon')) {
      var old = btn.querySelector('svg');
      if (old) old.remove();
      btn.appendChild(beaconSvg('mnr-beacon-lg'));
    }

    // the invitation shows until the visitor opens the panel for the first time
    if (!window.__mnrAsked && !btn.querySelector('.mnr-hint')) {
      var hint = document.createElement('span');
      hint.className = 'mnr-hint';
      hint.textContent = 'Ask me anything';
      btn.appendChild(hint);
    }
    if (!btn.__mnrHintBound) {
      btn.__mnrHintBound = true;
      btn.addEventListener('click', function () {
        window.__mnrAsked = true;
        var h = btn.querySelector('.mnr-hint');
        if (h) h.remove();
      });
    }
  }

  /* ---------- panel ---------- */
  function upgradePanel() {
    var panel = document.querySelector('.chat-panel');
    if (!panel) return;

    if (!panel.classList.contains('mnr-agent')) {
      panel.classList.add('mnr-agent');
    }

    /* Identify the header and the message list by structure, never by child
       index: we insert .mnr-sweep at the front and .mnr-prompts before the form,
       which shifts every index. (An earlier version did use indices and tagged
       the header as the message list.) */
    var own = [].slice.call(panel.children).filter(function (el) {
      return !el.classList.contains('mnr-sweep') && !el.classList.contains('mnr-prompts');
    });
    var head = own[0];
    var msgs = own[1];
    var form = panel.querySelector('form');
    if (!head || !msgs || !form) return;

    // clear any mis-assignment from a previous pass, then label the real nodes
    panel.querySelectorAll('.mnr-head, .mnr-msgs').forEach(function (el) {
      el.classList.remove('mnr-head', 'mnr-msgs');
    });
    head.classList.add('mnr-head');
    msgs.classList.add('mnr-msgs');
    form.classList.add('mnr-form');

    // swap the header glyph for a small live optic (presence check, not a flag)
    if (!head.querySelector('.mnr-beacon')) {
      var oldIcon = head.querySelector('svg');
      if (oldIcon) oldIcon.parentNode.replaceChild(beaconSvg('mnr-beacon-sm'), oldIcon);
    }

    // a live status line: the beacon is "on watch"
    var sub = head.querySelector('div[style*="font-size: 12px"]');
    if (sub && !sub.querySelector('.mnr-status')) {
      var dot = document.createElement('span');
      dot.className = 'mnr-status';
      sub.insertBefore(dot, sub.firstChild);
    }

    // the light sweep that runs across the panel head
    if (!panel.querySelector('.mnr-sweep')) {
      var sweep = document.createElement('div');
      sweep.className = 'mnr-sweep';
      sweep.setAttribute('aria-hidden', 'true');
      panel.insertBefore(sweep, panel.firstChild);
    }

    injectPrompts(panel, msgs, form);
  }

  /* ---------- suggested prompts ----------
     React owns the <input>, so assigning .value directly is invisible to it:
     the value must go through the native setter and an input event, exactly as a
     keystroke would. Then we press the app's own Send button rather than
     re-implementing the send. */
  function setReactValue(input, value) {
    var proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (proto && proto.set) proto.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function injectPrompts(panel, msgs, form) {
    var bar = panel.querySelector('.mnr-prompts');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'mnr-prompts';
      bar.setAttribute('aria-label', 'Suggested questions');
      PROMPTS.forEach(function (p) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'mnr-chip';
        chip.textContent = p.label;
        chip.setAttribute('data-prompt', p.text);   // the question travels with the node
        bar.appendChild(chip);
      });
      form.parentNode.insertBefore(bar, form);
    }

    /* Derive visibility from the conversation, never from a persisted class.
       The template runtime snapshots the panel's markup and restores it later,
       which resurrects this bar with whatever class it last had — a stale
       `is-spent` would hide the prompts on a fresh visit. Suggestions belong to
       an unstarted conversation: greeting only, nothing asked yet. */
    var fresh = msgs.children.length <= 1;
    bar.classList.toggle('is-spent', !fresh);

    armChipDelegate();
  }

  /* One delegated listener on the document, bound once.
     Per-chip listeners were lost whenever the template runtime restored the
     panel's markup: the chips came back but their handlers did not. Delegation
     survives that, and resolving the input/send button at click time avoids
     holding references to nodes React has since replaced. */
  function armChipDelegate() {
    if (window.__mnrChipDelegate) return;
    window.__mnrChipDelegate = true;

    document.addEventListener('click', function (e) {
      var chip = e.target && e.target.closest ? e.target.closest('.mnr-chip') : null;
      if (!chip) return;

      var panel = chip.closest('.chat-panel');
      var form = panel && panel.querySelector('form');
      var input = form && form.querySelector('input');
      var send = form && form.querySelector('button');
      if (!input || !send) return;

      setReactValue(input, chip.getAttribute('data-prompt') || chip.textContent);

      /* Let React flush its state before the app's Send reads the value.
         A timer, not requestAnimationFrame: rAF is suspended while the tab is
         in the background, which silently swallowed the send. */
      setTimeout(function () {
        send.click();
        var bar = chip.closest('.mnr-prompts');
        if (bar) bar.classList.add('is-spent');   // one nudge is enough
      }, 0);
    });
  }

  function tick() {
    upgradeLauncher();
    upgradePanel();
  }

  var raf = null;
  var mo = new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = null; tick(); });
  });

  function arm() {
    tick();
    // observe `document`: the runtime swaps <html> out and would detach an
    // observer bound to documentElement
    mo.observe(document, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm);
  else arm();
  window.addEventListener('load', tick);
  [600, 1800, 3500].forEach(function (ms) { setTimeout(tick, ms); });
})();
