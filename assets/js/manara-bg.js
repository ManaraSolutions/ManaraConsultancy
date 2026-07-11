/* Manara — WebGL atmosphere.
 * A single full-screen fragment shader: warm gold caustic light drifting over
 * deep navy (light on "changing waters"), a soft sweeping beam and a lamp glow
 * — the lighthouse evoked, not drawn — finished with film grain and an ordered
 * dither so the navy never bands. Mood is set per page via data attributes
 * (data-warm 0..1, data-tempo, data-flicker).
 *
 * Senior-build hygiene: GPU-only, ~30fps cap, DPR clamped to 1.5, pointer
 * parallax smoothed, requestAnimationFrame self-throttles in background tabs,
 * a single still frame is rendered for prefers-reduced-motion, and if WebGL is
 * unavailable the canvas's own CSS gradient shows instead. */
(function () {
  'use strict';
  var canvas = document.getElementById('mnrbg');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' })
        || canvas.getContext('experimental-webgl');
  if (!gl) return; // graceful: the CSS gradient on the canvas remains

  var warm = parseFloat(canvas.getAttribute('data-warm') || '1');
  var tempo = parseFloat(canvas.getAttribute('data-tempo') || '1');
  var flicker = parseFloat(canvas.getAttribute('data-flicker') || '0.12');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Phones/tablets: the fbm shader is fragment-heavy, so cap the backing store
  // at 1.0 DPR (≈ half the fragments of 1.5) and pace to ~24fps to spare the GPU.
  var mobile = (window.matchMedia && matchMedia('(max-width:820px),(pointer:coarse)').matches);
  var DPR_CAP = mobile ? 1.0 : 1.5;
  var FRAME_MS = mobile ? 40 : 32;

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';

  var FS = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;',
    'uniform float uWarm; uniform float uTempo; uniform float uFlicker;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));vec2 u=f*f*(3.-2.*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.3,-0.7);a*=.5;}return v;}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/uRes.xy;',
    '  vec2 p=(gl_FragCoord.xy-.5*uRes.xy)/uRes.y;',
    '  p+=uMouse*0.03;',
    '  float t=uTime*0.04*uTempo;',
    '  vec2 q=vec2(fbm(p*2.2+t),fbm(p*2.2+vec2(5.2,1.3)-t));',
    '  vec2 r=vec2(fbm(p*2.2+1.6*q+t*0.7+vec2(1.7,9.2)),fbm(p*2.2+1.6*q-t*0.7+vec2(8.3,2.8)));',
    '  float c=fbm(p*3.4+2.2*r+t*1.1);',
    '  float caustic=pow(smoothstep(0.34,0.96,c),2.0);',
    '  vec3 navy=mix(vec3(0.020,0.050,0.082),vec3(0.047,0.105,0.163),clamp(uv.y*0.7+0.15,0.,1.));',
    '  vec3 gold=mix(vec3(0.84,0.72,0.48),vec3(0.98,0.80,0.42),uWarm);',
    '  vec3 col=navy+gold*caustic*(0.5+0.2*uWarm);',
    '  vec2 bo=vec2(uMouse.x*0.05,-0.7);',
    '  vec2 dir=p-bo; float ang=atan(dir.x,dir.y);',
    '  float sweep=0.45*sin(t*1.6);',
    '  float beam=smoothstep(0.42,0.0,abs(ang-sweep));',
    '  beam*=exp(-length(dir)*0.55);',
    '  float fl=1.0-uFlicker*(0.4+0.35*sin(uTime*6.0)+0.25*noise(vec2(uTime*3.3,7.0)));',
    '  col+=gold*beam*0.42*fl;',
    '  col+=gold*exp(-length(p-vec2(0.,-0.55))*3.0)*0.22*fl;',
    '  float vig=smoothstep(1.5,0.25,length(p));',
    '  col*=0.72+0.28*vig;',
    '  col+=(hash(gl_FragCoord.xy+fract(uTime)*vec2(37.,17.))-0.5)*0.028;',
    '  col+=(hash(gl_FragCoord.xy*1.7)-0.5)/220.0;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
    return s;
  }
  var vsh = compile(gl.VERTEX_SHADER, VS), fsh = compile(gl.FRAGMENT_SHADER, FS);
  if (!vsh || !fsh) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var pl = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(pl);
  gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes'),
      uTime = gl.getUniformLocation(prog, 'uTime'),
      uMouse = gl.getUniformLocation(prog, 'uMouse'),
      uWarm = gl.getUniformLocation(prog, 'uWarm'),
      uTempo = gl.getUniformLocation(prog, 'uTempo'),
      uFlick = gl.getUniformLocation(prog, 'uFlicker');
  gl.uniform1f(uWarm, warm); gl.uniform1f(uTempo, tempo); gl.uniform1f(uFlick, flicker);

  var mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var w = Math.max(2, (window.innerWidth * dpr) | 0), h = Math.max(2, (window.innerHeight * dpr) | 0);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(uRes, w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  var t0 = performance.now(), last = 0, raf = 0, running = false, lost = false;
  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (lost) return;
    if (now - last < FRAME_MS) return;
    last = now;
    mx += (tx - mx) * 0.045; my += (ty - my) * 0.045;
    resize();
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function start() { if (!running && !lost) { running = true; raf = requestAnimationFrame(draw); } }
  function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  // Fully halt the loop when the tab is hidden (saves battery on mobile);
  // rAF alone only throttles, it doesn't stop.
  document.addEventListener('visibilitychange', function () {
    if (reduce) return;
    if (document.hidden) stop(); else start();
  });

  // If the GPU drops the context (common on mobile under memory pressure),
  // stop drawing and try to restore rather than leaving a black canvas.
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; stop(); }, false);
  canvas.addEventListener('webglcontextrestored', function () { lost = false; resize(); start(); }, false);

  if (reduce) {
    resize();
    gl.uniform1f(uTime, 14.0); gl.uniform2f(uMouse, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3); // one graded still frame
  } else {
    start();
  }
})();
