/* ==========================================================================
   Night sky (dark mode only)
   A faint, slowly twinkling field of stars behind the page, a quiet nod to
   "Jyotiṣka" (a luminary). Invisible in light mode. Stars drift very slightly
   as you scroll. Static (no twinkle, no drift) for visitors who prefer reduced
   motion; paused when the tab is hidden. Once in a while (every 30–70 s) a
   faint shooting star crosses the header bar; none for visitors who prefer
   reduced motion.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.id = "night-sky";
  canvas.setAttribute("aria-hidden", "true");
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var W = 0, H = 0, dpr = 1, stars = [], raf = 0, last = 0;
  var FIELD = 1.6;            // star field is taller than the screen, for the scroll drift
  var DRIFT = 0.04;           // how far stars move per pixel scrolled
  var METEOR_FIRST = [15000, 35000];   // first shooting star after 15–35 s
  var METEOR_GAP = [30000, 70000];     // then one every 30–70 s
  var meteor = null, nextMeteor = 0;

  // Deterministic random numbers, so the sky looks the same on every page.
  var seed = 1729;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function makeStars() {
    seed = 1729;
    var n = Math.round(W * H * FIELD / 8000);
    var k = dpr < 1.5 ? 1.35 : 1;                     // ordinary (1x) screens: slightly larger, or they vanish
    stars = [];
    for (var i = 0; i < n; i++) {
      var tier = rand();                               // ~3% bright, ~11% medium, the rest dim
      var bright = tier < 0.03, medium = !bright && tier < 0.14;
      var tint = rand();
      stars.push({
        x: rand() * W,
        y: rand() * H * FIELD,
        r: k * (bright ? 1.3 + rand() * 0.55 : medium ? 0.9 + rand() * 0.35 : 0.5 + rand() * 0.5),
        a: bright ? 0.92 + rand() * 0.08 : medium ? 0.6 + rand() * 0.2 : 0.22 + rand() * 0.4,
        kind: bright ? 2 : medium ? 1 : 0,
        // mostly white, some faintly blue or warm
        c: tint < 0.15 ? "200,214,255" : tint < 0.25 ? "255,230,205" : "236,234,248",
        tw: bright ? 0.12 + rand() * 0.18 : 0.2 + rand() * 0.35,   // twinkle depth (bright ones stay bright)
        sp: (2 * Math.PI) / (4000 + rand() * 7000),      // 4–11 s per twinkle
        ph: rand() * 2 * Math.PI
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    makeStars();
    draw(performance.now());
  }

  // Star sprites: a pin-sharp core fading into a soft glow (no hard edge);
  // the bright ones also get faint four-point diffraction spikes.
  var sprites = {};
  function sprite(c, kind) {
    var key = c + "|" + kind;
    if (sprites[key]) return sprites[key];
    var S = 96, m = S / 2, sc = document.createElement("canvas");
    sc.width = sc.height = S;
    var g = sc.getContext("2d");
    var core = kind === 2 ? 0.07 : kind === 1 ? 0.1 : 0.16;   // share of the sprite that is solid core
    var rg = g.createRadialGradient(m, m, 0, m, m, m);
    rg.addColorStop(0, "rgba(" + c + ",1)");
    rg.addColorStop(core, "rgba(" + c + ",0.85)");
    rg.addColorStop(core * 2.4, "rgba(" + c + ",0.22)");
    rg.addColorStop(0.55, "rgba(" + c + ",0.04)");
    rg.addColorStop(1, "rgba(" + c + ",0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, S, S);
    if (kind === 2) {
      ["h", "v"].forEach(function (d) {
        var lg = d === "h" ? g.createLinearGradient(0, m, S, m) : g.createLinearGradient(m, 0, m, S);
        lg.addColorStop(0, "rgba(" + c + ",0)");
        lg.addColorStop(0.5, "rgba(" + c + ",0.55)");
        lg.addColorStop(1, "rgba(" + c + ",0)");
        g.fillStyle = lg;
        if (d === "h") g.fillRect(0, m - 0.9, S, 1.8); else g.fillRect(m - 0.9, 0, 1.8, S);
      });
    }
    return (sprites[key] = sc);
  }
  var SPRITE_SIZE = [4.5, 7, 13];   // drawn size relative to the star's radius, per kind

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var off = reduce ? 0 : (window.scrollY * DRIFT) % (H * FIELD);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var y = s.y - off;
      if (y < -12) y += H * FIELD;
      if (y > H + 12) continue;
      var a = reduce ? s.a : s.a * (1 - s.tw * (0.5 + 0.5 * Math.sin(now * s.sp + s.ph)));
      var D = s.r * SPRITE_SIZE[s.kind];
      ctx.globalAlpha = a;
      ctx.drawImage(sprite(s.c, s.kind), s.x - D / 2, y - D / 2, D, D);
    }
    ctx.globalAlpha = 1;
  }

  function between(r) { return r[0] + Math.random() * (r[1] - r[0]); }

  // Shooting stars live only in the header bar, on a small clipped canvas
  // behind the name and links (the header is injected later, so find it lazily).
  var hc = null, hctx = null, HW = 0, HH = 0;
  function headerCanvas() {
    var hdr = document.querySelector(".site-header");
    if (!hdr) return false;
    if (!hc || !hdr.contains(hc)) {
      var wrap = document.createElement("span");
      wrap.className = "header-sky";
      wrap.setAttribute("aria-hidden", "true");
      hc = document.createElement("canvas");
      wrap.appendChild(hc);
      hdr.insertBefore(wrap, hdr.firstChild);
      hctx = hc.getContext("2d");
    }
    HW = hc.parentNode.clientWidth; HH = hc.parentNode.clientHeight;
    if (!HW || !HH || !hctx) return false;
    hc.width = Math.round(HW * dpr); hc.height = Math.round(HH * dpr);
    return true;
  }

  function spawnMeteor(now) {
    if (!headerCanvas()) { nextMeteor = now + between(METEOR_GAP); return; }
    var ang = (5 + Math.random() * 9) * Math.PI / 180;    // shallow: 5–14° below horizontal
    var dir = Math.random() < 0.5 ? -1 : 1;
    var dist = Math.min(HW * 0.45, 170 + Math.random() * 150);
    meteor = {
      x: dir > 0 ? HW * (0.04 + Math.random() * 0.45) : HW * (0.51 + Math.random() * 0.45),
      y: HH * (0.08 + Math.random() * 0.3),
      dx: dir * Math.cos(ang), dy: Math.sin(ang),
      dist: dist,                                          // px travelled
      len: Math.min(dist * 0.45, 55 + Math.random() * 45), // tail length
      t0: now, dur: 1700 + Math.random() * 700           // a leisurely 1.7–2.4 s
    };
  }

  function drawMeteor(now) {
    var ctx = hctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, HW, HH);
    var t = (now - meteor.t0) / meteor.dur;
    if (t >= 1) { meteor = null; nextMeteor = now + between(METEOR_GAP); return; }
    var e = 1 - Math.pow(1 - t, 1.6);                      // eases out gently
    var hx = meteor.x + meteor.dx * meteor.dist * e;
    var hy = meteor.y + meteor.dy * meteor.dist * e;
    var len = meteor.len * Math.min(1, t * 3);             // tail grows, then fades
    var tx = hx - meteor.dx * len, ty = hy - meteor.dy * len;
    var a = 0.75 * Math.sin(Math.PI * t);
    var g = ctx.createLinearGradient(hx, hy, tx, ty);
    g.addColorStop(0, "rgba(242,240,255," + a.toFixed(3) + ")");
    g.addColorStop(1, "rgba(242,240,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.1;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
  }

  function loop(now) {
    raf = 0;
    if (!meteor && nextMeteor && now >= nextMeteor) spawnMeteor(now);
    // ~25 fps is plenty for a twinkle; full frame rate only while a star is falling
    if (meteor || now - last > 40) { draw(now); if (meteor) drawMeteor(now); last = now; }
    schedule();
  }
  function schedule() {
    if (!raf && !reduce && active() && !document.hidden) raf = requestAnimationFrame(loop);
  }
  function active() { return root.getAttribute("data-theme") === "dark"; }

  // Restart the shooting-star clock whenever the sky (re)appears, so one never
  // fires the instant a visitor switches to dark mode or comes back to the tab.
  function resetMeteors() {
    if (meteor && hctx) hctx.clearRect(0, 0, hc.width, hc.height);
    meteor = null;
    nextMeteor = reduce ? 0 : performance.now() + between(METEOR_FIRST);
  }

  function update() {
    var on = active();
    canvas.classList.toggle("is-on", on);
    if (on) { resetMeteors(); if (!W) resize(); else draw(performance.now()); schedule(); }
  }

  function init() {
    document.body.insertBefore(canvas, document.body.firstChild);
    window.addEventListener("resize", function () { if (W) resize(); });
    window.addEventListener("scroll", function () { if (active() && reduce) return; if (active() && !raf) draw(performance.now()); }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && active()) resetMeteors();
      schedule();
    });
    document.addEventListener("themechange", update);
    update();
  }

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
