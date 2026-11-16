/* ==========================================================================
   Night sky (dark mode only)
   A faint, slowly twinkling field of stars behind the page, a quiet nod to
   "Jyotiṣka" (a luminary). Invisible in light mode. Stars drift very slightly
   as you scroll. Static (no twinkle, no drift) for visitors who prefer reduced
   motion; paused when the tab is hidden.
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

  // Deterministic random numbers, so the sky looks the same on every page.
  var seed = 1729;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function makeStars() {
    seed = 1729;
    var n = Math.round(W * H * FIELD / 7000);
    stars = [];
    for (var i = 0; i < n; i++) {
      var bright = rand() < 0.035;                     // a few slightly brighter stars
      var tint = rand();
      stars.push({
        x: rand() * W,
        y: rand() * H * FIELD,
        r: bright ? 0.9 + rand() * 0.5 : 0.35 + rand() * 0.55,
        a: bright ? 0.55 + rand() * 0.25 : 0.12 + rand() * 0.33,
        // mostly white, some faintly blue or warm
        c: tint < 0.15 ? "200,214,255" : tint < 0.25 ? "255,230,205" : "236,234,248",
        tw: 0.25 + rand() * 0.45,                        // twinkle depth
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

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var off = reduce ? 0 : (window.scrollY * DRIFT) % (H * FIELD);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var y = s.y - off;
      if (y < -2) y += H * FIELD;
      if (y > H + 2) continue;
      var a = reduce ? s.a : s.a * (1 - s.tw * (0.5 + 0.5 * Math.sin(now * s.sp + s.ph)));
      ctx.fillStyle = "rgba(" + s.c + "," + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, 2 * Math.PI);
      ctx.fill();
      if (s.r > 0.9) {                                   // soft halo on the brighter ones
        ctx.fillStyle = "rgba(" + s.c + "," + (a * 0.12).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * 3.2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  function loop(now) {
    raf = 0;
    if (now - last > 40) { draw(now); last = now; }      // ~25 fps is plenty for a twinkle
    schedule();
  }
  function schedule() {
    if (!raf && !reduce && active() && !document.hidden) raf = requestAnimationFrame(loop);
  }
  function active() { return root.getAttribute("data-theme") === "dark"; }

  function update() {
    var on = active();
    canvas.classList.toggle("is-on", on);
    if (on) { if (!W) resize(); else draw(performance.now()); schedule(); }
  }

  function init() {
    document.body.insertBefore(canvas, document.body.firstChild);
    window.addEventListener("resize", function () { if (W) resize(); });
    window.addEventListener("scroll", function () { if (active() && reduce) return; if (active() && !raf) draw(performance.now()); }, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    document.addEventListener("themechange", update);
    update();
  }

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
