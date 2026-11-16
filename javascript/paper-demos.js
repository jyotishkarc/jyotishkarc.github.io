/* ==========================================================================
   Tiny live demos for papers (research page)
   Adds a "Demo" button to a paper's Access row (after Abstract / Cite) that
   opens a small interactive panel below the card, styled like the abstract.
   Currently one demo: high-dimensional robust change-point detection.

   NOTE: the demo illustrates the paper's idea with a simplified statistic
   (a bounded, rank-based per-coordinate discrepancy averaged over
   coordinates), not the paper's exact angular-kernel statistic.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- tiny seeded RNG ---------- */
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) + 0.5) / 4294967296; };
  }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r()); }
  function cauchy(r) { return Math.tan(Math.PI * (r() - 0.5)); }

  /* ---------- change-point demo ---------- */
  var N = 120, D = 200, TAU = 70, FRAC = 0.2, SHOWN = 5, EDGE = 6;

  function simulate(seed, heavy, delta) {
    var r = rng(seed), X = [], changed = Math.round(D * FRAC);
    for (var j = 0; j < D; j++) {
      var col = new Float64Array(N);
      for (var t = 0; t < N; t++) {
        col[t] = (heavy ? cauchy(r) : gauss(r)) + (j < changed && t >= TAU ? delta : 0);
      }
      X.push(col);
    }
    return X;
  }

  // Both scans are standardized to have mean ~0 under "no change".
  function scans(X) {
    var robust = new Float64Array(N), mean = new Float64Array(N);
    for (var j = 0; j < D; j++) {
      var x = X[j];
      // ranks (no ties for continuous data)
      var idx = Array.prototype.map.call(x, function (_, i) { return i; }).sort(function (a, b) { return x[a] - x[b]; });
      var rank = new Float64Array(N);
      for (var k = 0; k < N; k++) rank[idx[k]] = k + 1;
      var tot = 0, tot2 = 0;
      for (var i = 0; i < N; i++) { tot += x[i]; tot2 += x[i] * x[i]; }
      var v = Math.max((tot2 - tot * tot / N) / (N - 1), 1e-12);
      var rs = 0, s = 0;
      for (var t = 1; t < N; t++) {
        rs += rank[t - 1]; s += x[t - 1];
        if (t < EDGE || t > N - EDGE) continue;
        var m = N - t;
        // Mann-Whitney: P(before < after); bounded, needs no moments
        var auc = 1 - (rs - t * (t + 1) / 2) / (t * m);
        robust[t] += 12 * t * m / (N + 1) * (auc - 0.5) * (auc - 0.5) - 1;
        var diff = s / t - (tot - s) / m;
        mean[t] += (t * m / N) * diff * diff / v - 1;
      }
    }
    for (var u = 0; u < N; u++) { robust[u] /= D; mean[u] /= D; }
    return { robust: robust, mean: mean };
  }
  function argmax(a) {
    var b = EDGE, i;
    for (i = EDGE; i <= N - EDGE; i++) if (a[i] > a[b]) b = i;
    return b;
  }

  function colors() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    return dark
      ? { data: "rgba(200,196,220,0.55)", robust: "#b9a8ff", mean: "#e8b27a", tau: "rgba(230,227,239,0.45)", axis: "rgba(230,227,239,0.18)", text: "#a9a5ba" }
      : { data: "rgba(70,64,96,0.45)", robust: "#4a2fb0", mean: "#c0782a", tau: "rgba(40,30,80,0.45)", axis: "rgba(40,30,80,0.15)", text: "#6f6a84" };
  }

  function setupCanvas(cv, h) {
    var w = cv.parentNode.clientWidth, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + "px"; cv.style.height = h + "px";
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  var PAD = { l: 8, r: 8 };
  function xOf(t, w) { return PAD.l + (w - PAD.l - PAD.r) * t / (N - 1); }

  function drawData(cv, X, heavy) {
    var c = colors(), g = setupCanvas(cv, 120), ctx = g.ctx, w = g.w, h = g.h;
    var lane = h / SHOWN, clip = heavy ? 4 : 3;
    // show 3 changed and 2 unchanged coordinates
    var rows = [0, 1, 2, D - 2, D - 1];
    rows.forEach(function (j, k) {
      var mid = lane * (k + 0.5), amp = lane * 0.42 / clip;
      ctx.strokeStyle = c.data; ctx.lineWidth = 1; ctx.beginPath();
      for (var t = 0; t < N; t++) {
        var y = mid - Math.max(-clip, Math.min(clip, X[j][t])) * amp;
        if (t) ctx.lineTo(xOf(t, w), y); else ctx.moveTo(xOf(t, w), y);
      }
      ctx.stroke();
    });
    tauLine(ctx, w, h, c);
  }

  function tauLine(ctx, w, h, c) {
    ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = c.tau; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xOf(TAU, w), 0); ctx.lineTo(xOf(TAU, w), h); ctx.stroke(); ctx.restore();
  }

  function drawScan(cv, S) {
    var c = colors(), g = setupCanvas(cv, 96), ctx = g.ctx, w = g.w, h = g.h;
    var top = 8, bot = h - 4;
    ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD.l, bot + 0.5); ctx.lineTo(w - PAD.r, bot + 0.5); ctx.stroke();
    tauLine(ctx, w, h, c);
    [["mean", c.mean, [5, 4]], ["robust", c.robust, []]].forEach(function (s) {
      var a = S[s[0]], lo = Infinity, hi = -Infinity, t;
      for (t = EDGE; t <= N - EDGE; t++) { lo = Math.min(lo, a[t]); hi = Math.max(hi, a[t]); }
      var span = hi - lo || 1;
      ctx.save(); ctx.setLineDash(s[2]); ctx.strokeStyle = s[1]; ctx.lineWidth = s[0] === "robust" ? 1.8 : 1.4;
      ctx.beginPath();
      for (t = EDGE; t <= N - EDGE; t++) {
        var y = bot - (a[t] - lo) / span * (bot - top);
        if (t === EDGE) ctx.moveTo(xOf(t, w), y); else ctx.lineTo(xOf(t, w), y);
      }
      ctx.stroke(); ctx.restore();
      var m = argmax(a), ym = bot - (a[m] - lo) / span * (bot - top);
      ctx.fillStyle = s[1]; ctx.beginPath(); ctx.arc(xOf(m, w), ym, 3.2, 0, 2 * Math.PI); ctx.fill();
    });
  }

  function buildChangePoint(box) {
    var state = { seed: 8, heavy: true, delta: 1 };
    var inner = box.querySelector(".demo");
    inner.innerHTML =
      '<span class="abs-label">Demo</span>' +
      '<p class="demo-lede">200 coordinates over 120 time points; at time 70 (dashed line) the level shifts in 20% of them. ' +
      'Each scan scores every possible split; its peak is the estimated change.</p>' +
      '<div class="demo-panel"><span class="demo-cap">Five of the 200 coordinates</span><canvas class="demo-data" aria-hidden="true"></canvas></div>' +
      '<div class="demo-panel"><span class="demo-cap">Scans over the split point</span><canvas class="demo-scan" aria-hidden="true"></canvas></div>' +
      '<p class="demo-legend"><span class="lg lg-robust"></span>bounded discrepancy, averaged over coordinates ' +
      '<span class="lg lg-mean"></span>mean-based CUSUM</p>' +
      '<div class="demo-controls">' +
        '<div class="demo-seg" role="group" aria-label="Noise">' +
          '<button type="button" data-noise="g" aria-pressed="false">Gaussian noise</button>' +
          '<button type="button" data-noise="h" aria-pressed="true">Heavy-tailed noise</button>' +
        "</div>" +
        '<label class="demo-slider">Shift <input type="range" min="0" max="2" step="0.1" value="1" aria-label="Shift size"><output>1.0</output></label>' +
        '<button type="button" class="demo-new">New sample</button>' +
      "</div>" +
      '<p class="demo-readout" aria-live="polite"></p>' +
      '<p class="demo-note">A simplified illustration of the idea, not the paper’s exact statistic (which uses angular-kernel discrepancies with exact calibration).</p>';

    var cvD = inner.querySelector(".demo-data"), cvS = inner.querySelector(".demo-scan");
    var out = inner.querySelector("output"), readout = inner.querySelector(".demo-readout");
    var X, S;
    function recompute() { X = simulate(state.seed, state.heavy, state.delta); S = scans(X); }
    function render() {
      if (!box.classList.contains("is-open")) return;
      drawData(cvD, X, state.heavy); drawScan(cvS, S);
      var r = argmax(S.robust), m = argmax(S.mean);
      readout.innerHTML = "Estimated change: <b>" + r + "</b> (bounded, averaged) &middot; <b>" + m + "</b> (mean-based) &middot; true change: 70";
    }
    inner.querySelectorAll(".demo-seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.heavy = b.getAttribute("data-noise") === "h";
        inner.querySelectorAll(".demo-seg button").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        recompute(); render();
      });
    });
    var slider = inner.querySelector("input[type=range]");
    slider.addEventListener("input", function () { state.delta = +slider.value; out.textContent = state.delta.toFixed(1); recompute(); render(); });
    inner.querySelector(".demo-new").addEventListener("click", function () { state.seed += 1; recompute(); render(); });
    document.addEventListener("themechange", render);
    var rt = 0;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(render, 120); });
    recompute();
    return render;
  }

  var DEMOS = { "abs-cpd": buildChangePoint };

  /* ---------- styles ---------- */
  var css = [
    ".demo-box .demo{padding:14px 18px}",
    ".demo-lede{margin:6px 0 10px!important;text-align:left!important;hyphens:manual!important}",
    ".demo-panel{margin:6px 0 2px}",
    ".demo-cap{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8d88a0;margin:0 0 3px}",
    ".demo-panel canvas{display:block;width:100%}",
    ".demo-legend{font-size:12.5px!important;color:#5f5b6b!important;margin:8px 0 10px!important;text-align:left!important}",
    ".demo-legend .lg{display:inline-block;width:18px;height:0;border-top:2px solid #4a2fb0;vertical-align:middle;margin:0 6px 0 0}",
    ".demo-legend .lg-mean{border-top:2px dashed #c0782a;margin-left:14px}",
    ".demo-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;margin:4px 0 8px}",
    ".demo-seg{display:inline-flex;border:1px solid #d9d2f2;border-radius:999px;overflow:hidden}",
    ".demo-seg button,.demo-new{all:unset;cursor:pointer;font-size:12.5px;padding:5px 12px;color:#4a2fb0}",
    ".demo-seg button[aria-pressed=true]{background:#ebe5fd;font-weight:600}",
    ".demo-seg button:focus-visible,.demo-new:focus-visible{outline:2px solid #6a4fd6;outline-offset:-2px}",
    ".demo-new{border:1px solid #d9d2f2;border-radius:999px}",
    ".demo-new:hover,.demo-seg button:hover{background:#f3effe}",
    ".demo-slider{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;color:#4b475c}",
    ".demo-slider input{accent-color:#6a4fd6;width:120px}",
    ".demo-slider output{min-width:2.2em;font-variant-numeric:tabular-nums}",
    ".demo-readout{font-size:13px!important;margin:0 0 6px!important;text-align:left!important}",
    ".demo-note{font-size:12px!important;color:#8d88a0!important;margin:0!important;text-align:left!important;hyphens:manual!important;font-style:italic}",
    "html[data-theme=dark] .demo-cap,html[data-theme=dark] .demo-note{color:#9a96ad!important}",
    "html[data-theme=dark] .demo-legend,html[data-theme=dark] .demo-slider{color:#b3afc4!important}",
    "html[data-theme=dark] .demo-legend .lg{border-top-color:#b9a8ff}",
    "html[data-theme=dark] .demo-legend .lg-mean{border-top-color:#e8b27a}",
    "html[data-theme=dark] .demo-seg,html[data-theme=dark] .demo-new{border-color:#3a3456}",
    "html[data-theme=dark] .demo-seg button,html[data-theme=dark] .demo-new{color:#c9bcff}",
    "html[data-theme=dark] .demo-seg button[aria-pressed=true]{background:#2f2852}",
    "html[data-theme=dark] .demo-new:hover,html[data-theme=dark] .demo-seg button:hover{background:#2a2445}",
    "@media (max-width:900px){.demo-box .demo{padding:10px 12px}}"
  ].join("\n");

  /* ---------- wiring (same open/close behaviour as Abstract and Cite) ---------- */
  var openBox = null;
  function closeDemo(focusBtn) {
    if (!openBox) return;
    openBox.box.classList.remove("is-open");
    openBox.box.setAttribute("aria-hidden", "true");
    openBox.box.inert = true;
    openBox.btn.setAttribute("aria-expanded", "false");
    if (focusBtn) openBox.btn.focus();
    openBox = null;
  }

  function init() {
    var made = false;
    Object.keys(DEMOS).forEach(function (absId) {
      var abs = document.getElementById(absId);
      var li = abs && abs.closest("li");
      var access = li && li.querySelector(".publication-access");
      if (!access) return;
      if (!made) { var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); made = true; }

      var box = document.createElement("div");
      box.className = "abstract-box demo-box";
      box.id = "demo-" + absId.replace(/^abs-/, "");
      box.setAttribute("role", "region");
      box.setAttribute("aria-label", "Interactive demo");
      box.setAttribute("aria-hidden", "true");
      box.inert = true;
      box.innerHTML = '<div class="abs-inner"><div class="demo"></div></div>';
      var boxes = li.querySelectorAll(".abstract-box");
      var after = boxes[boxes.length - 1];
      after.parentNode.insertBefore(box, after.nextSibling);
      var render = DEMOS[absId](box);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "abs-btn";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", box.id);
      btn.innerHTML = 'Demo <span class="abs-caret" aria-hidden="true">&#9662;</span>';
      access.appendChild(document.createTextNode(" "));
      access.appendChild(btn);

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (openBox && openBox.box === box) { closeDemo(false); return; }
        closeDemo(false);
        // let Abstract / Cite close themselves (they listen for outside clicks)
        document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        box.classList.add("is-open");
        box.setAttribute("aria-hidden", "false");
        box.inert = false;
        btn.setAttribute("aria-expanded", "true");
        openBox = { box: box, btn: btn };
        render();
        setTimeout(function () {
          var r = box.getBoundingClientRect();
          if (r.bottom > window.innerHeight) box.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 360);
      });
    });
    document.addEventListener("click", function (e) {
      if (openBox && !openBox.box.contains(e.target) && !e.target.closest(".abs-btn[aria-controls='" + openBox.box.id + "']")) closeDemo(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openBox) closeDemo(true); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
