/* ==========================================================================
   Visitor globe
   Idea and look inspired by Bo Dai's homepage (https://bo-dai.github.io/).
   A line-drawn orthographic globe that turns continuously and marks the
   cities visitors have opened the site from.

   Data: the <figure id="visitor-globe" data-stats="..."> attribute holds the
   base URL of the Cloudflare Worker in worker/visitor-globe.js.
     POST {base}/hit    counts this visit (once per browser session)
     GET  {base}/stats  -> { points: [{ city, country, lat, lon, count }] }
   With data-stats empty the globe still turns, just without markers.

   Coastlines come from javascript/globe-land.js (window.__GLOBE_LAND__),
   country borders from javascript/globe-borders.js (window.__GLOBE_BORDERS__).
   ========================================================================== */
(function () {
  "use strict";

  var mount = document.getElementById("visitor-globe");
  var LAND = window.__GLOBE_LAND__;
  if (!mount || !LAND) return;
  var canvas = mount.querySelector("canvas");
  var caption = mount.querySelector("figcaption");
  var tip = mount.querySelector(".globe-tip");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var BORDERS = window.__GLOBE_BORDERS__ || [];   // optional: country borders (globe-borders.js)

  var LIGHT = {
    orbHi: "rgba(255,255,255,0.98)",
    orbMid: "rgba(246,244,252,0.9)",
    orbLo: "rgba(222,216,240,0.95)",
    rim: "rgba(40,30,80,0.55)",
    graticule: "rgba(70,60,120,0.12)",
    equator: "rgba(91,60,196,0.35)",
    coastHalo: "rgba(40,30,80,0.07)",
    coast: "rgba(29,27,41,0.72)",
    border: "rgba(29,27,41,0.26)",
    marker: "#5b3cc4",
    markerHalo: "rgba(91,60,196,0.34)",
    night: [52, 40, 112, 0.15],        // rgb + max alpha of the night side
    lights: "#d08a1e",                 // visitor markers that are in darkness
    lightsHalo: "rgba(232,160,48,0.3)"
  };
  var DARK = {
    orbHi: "rgba(52,47,82,0.98)",
    orbMid: "rgba(33,30,52,0.96)",
    orbLo: "rgba(20,18,32,0.98)",
    rim: "rgba(190,178,240,0.55)",
    graticule: "rgba(190,178,240,0.10)",
    equator: "rgba(185,168,255,0.38)",
    coastHalo: "rgba(185,168,255,0.10)",
    coast: "rgba(232,228,245,0.78)",
    border: "rgba(232,228,245,0.26)",
    marker: "#c4b5ff",
    markerHalo: "rgba(196,181,255,0.32)",
    night: [4, 3, 12, 0.5],
    lights: "#ffd27f",
    lightsHalo: "rgba(255,200,110,0.32)"
  };
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }
  var C = isDark() ? DARK : LIGHT;
  document.addEventListener("themechange", function () {
    C = isDark() ? DARK : LIGHT;
    draw(performance.now());
  });

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var D2R = Math.PI / 180;
  var SPIN = reduceMotion ? 0 : -6;   // degrees per second, always on
  var state = {
    lon0: -40, lat0: 20,              // opens on the Atlantic, both coasts in view
    vel: 0,                           // extra spin from a drag flick (deg/s)
    dragging: false,
    visible: true,
    size: 0, dpr: 1
  };
  var points = [], maxCount = 1, screenPts = [];

  /* ---- projection ----------------------------------------------------- */
  function rot(lon, lat) {
    var l = (lon - state.lon0) * D2R, p = lat * D2R, p0 = state.lat0 * D2R;
    var cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    return {
      x: cp * Math.sin(l),
      y: Math.cos(p0) * sp - Math.sin(p0) * cp * cl,
      z: Math.sin(p0) * sp + Math.cos(p0) * cp * cl
    };
  }

  function strokeVisible(n, getPt) {
    var drawing = false;
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var q = getPt(i);
      if (q.z > 0) {
        if (drawing) ctx.lineTo(q.sx, q.sy); else ctx.moveTo(q.sx, q.sy);
        drawing = true;
      } else drawing = false;
    }
    ctx.stroke();
  }

  /* ---- day and night --------------------------------------------------- */
  // Where the sun is overhead right now (accurate to a fraction of a degree).
  var sun = { lon: 0, lat: 0, t: -1 };
  function updateSun() {
    var d = new Date(), t = d.getTime();
    if (t - sun.t < 60000) return;
    sun.t = t;
    var N = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
             Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
    var B = 2 * Math.PI * (N - 81) / 365;
    var eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);   // minutes
    var h = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    sun.lat = -23.44 * Math.cos(2 * Math.PI * (N + 10) / 365);
    sun.lon = ((-15 * (h - 12 + eot / 60)) + 540) % 360 - 180;
  }
  // How dark it is at a point, 0 (day) to 1 (night), with a soft twilight band.
  function darkness(dot) {
    var u = Math.min(1, Math.max(0, (0.06 - dot) / 0.26));
    return u * u * (3 - 2 * u);
  }
  // The night side is shaded on a small canvas and scaled up, which keeps the
  // terminator soft and costs very little per frame.
  var shade = document.createElement("canvas"), sctx = shade.getContext("2d"), SH = 90, simg = null;
  shade.width = shade.height = SH;
  function drawNight(cx, cy, R) {
    var sv = rot(sun.lon, sun.lat), col = C.night;
    if (!simg) simg = sctx.createImageData(SH, SH);
    var px = simg.data, half = SH / 2;
    for (var yy = 0; yy < SH; yy++) {
      var y = (half - yy - 0.5) / half;
      for (var xx = 0; xx < SH; xx++) {
        var x = (xx + 0.5 - half) / half, rr = x * x + y * y, o = 4 * (yy * SH + xx);
        // pixels just past the rim reuse the rim value, so scaling leaves no seam
        var z = rr < 1 ? Math.sqrt(1 - rr) : 0, f = rr < 1 ? 1 : 1 / Math.sqrt(rr);
        var a = darkness(sv.x * x * f + sv.y * y * f + sv.z * z) * col[3];
        px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = Math.round(a * 255);
      }
    }
    sctx.putImageData(simg, 0, 0);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(shade, cx - R, cy - R, 2 * R, 2 * R);
    ctx.restore();
    return sv;
  }

  /* ---- drawing -------------------------------------------------------- */
  function draw(now) {
    var S = state.size, R = S / 2 - 6, cx = S / 2, cy = S / 2;
    if (!S) return;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);
    // atmosphere: a faint glow just outside the rim
    var dk = isDark(), atm = ctx.createRadialGradient(cx, cy, R * 0.985, cx, cy, R + 5.5);
    atm.addColorStop(0, dk ? "rgba(170,150,255,0.24)" : "rgba(120,95,220,0.16)");
    atm.addColorStop(1, "rgba(120,95,220,0)");
    ctx.fillStyle = atm;
    ctx.beginPath(); ctx.arc(cx, cy, R + 5.5, 0, 2 * Math.PI); ctx.fill();
    function scr(o) { o.sx = cx + R * o.x; o.sy = cy - R * o.y; return o; }

    var g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, C.orbHi); g.addColorStop(0.55, C.orbMid); g.addColorStop(1, C.orbLo);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();

    // night side, under the grid and coastlines
    updateSun();
    var sv = drawNight(cx, cy, R);

    ctx.lineWidth = 0.6; ctx.strokeStyle = C.graticule;
    var k;
    for (k = -180; k < 180; k += 30) (function (lon) {
      strokeVisible(61, function (i) { return scr(rot(lon, -90 + i * 3)); });
    })(k);
    for (k = -60; k <= 60; k += 30) if (k) (function (lat) {
      strokeVisible(121, function (i) { return scr(rot(-180 + i * 3, lat)); });
    })(k);
    ctx.strokeStyle = C.equator; ctx.lineWidth = 0.9;
    strokeVisible(121, function (i) { return scr(rot(-180 + i * 3, 0)); });

    ctx.lineJoin = "round";
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? C.coast : C.coastHalo;
      ctx.lineWidth = pass ? 0.75 : 2.6;
      for (var r = 0; r < LAND.length; r++) (function (ring) {
        strokeVisible(ring.length / 2, function (i) { return scr(rot(ring[2 * i], ring[2 * i + 1])); });
      })(LAND[r]);
    }

    // country borders: hairlines, lighter than the coasts
    ctx.strokeStyle = C.border; ctx.lineWidth = 0.5;
    for (var bi = 0; bi < BORDERS.length; bi++) (function (line) {
      strokeVisible(line.length / 2, function (i) { return scr(rot(line[2 * i], line[2 * i + 1])); });
    })(BORDERS[bi]);

    ctx.strokeStyle = C.rim; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    // limb: very light shading toward the edge, for a sense of depth
    var limb = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
    limb.addColorStop(0, "rgba(0,0,0,0)");
    limb.addColorStop(1, dk ? "rgba(0,0,0,0.22)" : "rgba(60,40,130,0.07)");
    ctx.fillStyle = limb;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();

    // visitor markers: small diamonds with a soft, steady glow, sized by sqrt(count)
    screenPts = [];
    for (var j = 0; j < points.length; j++) {
      var pt = points[j], o = scr(rot(pt.lon, pt.lat));
      if (o.z <= 0.04) continue;
      var a = Math.min(1, o.z * 4), s = 2.2 + 2.6 * Math.sqrt(pt.count / maxCount);
      // after dark, a visitor's city glows warm, like city lights
      var lit = darkness(sv.x * o.x + sv.y * o.y + sv.z * o.z) > 0.5;
      var gr = s * 2.7, glow = ctx.createRadialGradient(o.sx, o.sy, 0, o.sx, o.sy, gr);
      var hc = lit ? C.lightsHalo : C.markerHalo;
      glow.addColorStop(0, hc);
      glow.addColorStop(1, hc.replace(/[\d.]+\)$/, "0)"));   // same colour, fully clear
      ctx.globalAlpha = a;
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(o.sx, o.sy, gr, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = lit ? C.lights : C.marker;
      ctx.beginPath();
      ctx.moveTo(o.sx, o.sy - s); ctx.lineTo(o.sx + s, o.sy);
      ctx.lineTo(o.sx, o.sy + s); ctx.lineTo(o.sx - s, o.sy);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      screenPts.push({ x: o.sx, y: o.sy, r: Math.max(s + 3, 6), pt: pt });
    }
  }

  /* ---- loop: always turning ------------------------------------------- */
  var last = 0, rafId = 0;
  function frame(now) {
    rafId = 0;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!state.dragging) {
      state.lon0 += (SPIN + state.vel) * dt;
      state.vel *= Math.pow(0.06, dt);          // flick decays in about a second
      if (Math.abs(state.vel) < 0.05) state.vel = 0;
    }
    state.lon0 = ((state.lon0 + 540) % 360) - 180;
    draw(now);
    if (SPIN || state.vel || state.dragging) schedule();
  }
  function schedule() { if (!rafId && state.visible) rafId = requestAnimationFrame(frame); }
  function redraw() { last = 0; draw(performance.now()); schedule(); }

  function resize() {
    var w = Math.round(canvas.clientWidth);
    if (!w || w === state.size) return;
    state.size = w;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * state.dpr);
    canvas.height = Math.round(w * state.dpr);
    redraw();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  window.addEventListener("resize", resize);
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (e) {
      state.visible = e[0].isIntersecting;
      if (state.visible) redraw();
    }).observe(canvas);
  }

  /* ---- drag to turn (keeps spinning afterwards) ----------------------- */
  var drag = null;
  canvas.addEventListener("pointerdown", function (e) {
    drag = { x: e.clientX, y: e.clientY, lon: state.lon0, lat: state.lat0, t: performance.now(), lastX: e.clientX };
    state.dragging = true; state.vel = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-dragging");
    hideTip();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (drag) {
      var k = 180 / state.size, now = performance.now();
      state.lon0 = drag.lon - (e.clientX - drag.x) * k;
      state.lat0 = Math.max(-60, Math.min(60, drag.lat + (e.clientY - drag.y) * k));
      var dtm = Math.max(1, now - drag.t);
      state.vel = -((e.clientX - drag.lastX) * k) / (dtm / 1000) * 0.5;
      drag.t = now; drag.lastX = e.clientX;
      schedule();
    } else {
      hover(e);
    }
  });
  function endDrag() {
    if (!drag) return;
    drag = null; state.dragging = false;
    state.vel = Math.max(-240, Math.min(240, state.vel));
    canvas.classList.remove("is-dragging");
    schedule();
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", hideTip);

  /* ---- tooltip -------------------------------------------------------- */
  function hover(e) {
    if (!tip || !screenPts.length) return;
    var b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    var best = null, bd = Infinity;
    screenPts.forEach(function (m) {
      var d = Math.hypot(m.x - x, m.y - y);
      if (d < m.r + 3 && d < bd) { bd = d; best = m; }
    });
    if (!best) return hideTip();
    var n = best.pt.count;
    tip.textContent = best.pt.label + " · " + n + (n === 1 ? " visit" : " visits");
    tip.hidden = false;
    var half = tip.offsetWidth / 2, w = state.size;   // keep the label over the globe
    tip.style.left = Math.max(half, Math.min(w - half, best.x)) + "px";
    tip.style.top = best.y + "px";
  }
  function hideTip() { if (tip) tip.hidden = true; }

  /* ---- data ----------------------------------------------------------- */
  var regionName = (function () {
    try {
      var dn = new Intl.DisplayNames(["en"], { type: "region" });
      return function (c) { try { return dn.of(c) || c; } catch (e) { return c; } };
    } catch (e) { return function (c) { return c; }; }
  })();

  function setPoints(list) {
    points = (list || []).filter(function (p) {
      return isFinite(p.lat) && isFinite(p.lon) && p.count > 0;
    }).map(function (p) {
      var country = p.country ? regionName(p.country) : "";
      return { lat: +p.lat, lon: +p.lon, count: +p.count,
               label: p.city ? p.city + (country ? ", " + country : "") : (country || "Somewhere") };
    });
    maxCount = points.reduce(function (m, p) { return Math.max(m, p.count); }, 1);
    if (caption && points.length) {
      var visits = points.reduce(function (s, p) { return s + p.count; }, 0);
      var countries = {};
      (list || []).forEach(function (p) { if (p.country) countries[p.country] = 1; });
      var nc = Object.keys(countries).length;
      caption.textContent = visits.toLocaleString("en-US") + (visits === 1 ? " visit" : " visits") +
        " from " + nc + (nc === 1 ? " country" : " countries");
      caption.hidden = false;
    }
    redraw();
  }

  var base = (mount.getAttribute("data-stats") || "").replace(/\/+$/, "");
  if (base) {
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    var counted = false;
    try { counted = sessionStorage.getItem("visitor-globe-hit") === "1"; } catch (e) {}
    var hit = (local || counted) ? Promise.resolve() :
      fetch(base + "/hit", { method: "POST", keepalive: true })
        .then(function () { try { sessionStorage.setItem("visitor-globe-hit", "1"); } catch (e) {} })
        .catch(function () {});
    hit.then(function () { return fetch(base + "/stats"); })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) setPoints(d.points); })
      .catch(function () {});
  }

  /* ---- phones: move the globe to the bottom of the page, behind a button ---- */
  var slot = document.querySelector(".visitor-slot");
  var panel = document.getElementById("visitor-panel");
  var vbtn = document.querySelector(".visitor-btn");
  if (slot && panel && vbtn && window.matchMedia) {
    var home = mount.parentNode, homeNext = mount.nextSibling;
    var phone = window.matchMedia("(max-width: 1000px)");
    var place = function () {
      if (phone.matches) { if (mount.parentNode !== slot) slot.appendChild(mount); }
      else if (mount.parentNode !== home) home.insertBefore(mount, homeNext);
      resize();
    };
    if (phone.addEventListener) phone.addEventListener("change", place); else phone.addListener(place);
    place();
    vbtn.addEventListener("click", function () {
      var open = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", String(!open));
      panel.inert = !open;
      vbtn.setAttribute("aria-expanded", String(open));
      if (open) setTimeout(function () {
        var r = panel.getBoundingClientRect();
        if (r.bottom > window.innerHeight) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 420);
    });
  }

  resize();
  redraw();
})();
