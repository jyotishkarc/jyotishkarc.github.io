/* Light/dark theme toggle.
   The initial theme is set by a tiny inline script in each page's <head>
   (light, unless the visitor chose dark) so the page never flashes.
   The toggle button lives in the injected header, so we use delegation.
   In light mode the toggle's moon shows tonight's actual phase (as seen from
   the northern hemisphere), with the phase named in its tooltip. */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "theme";

  /* ---- tonight's moon --------------------------------------------------
     Phase angle from Meeus, "Astronomical Algorithms", ch. 48 (low-precision
     terms); the lit fraction is good to well under 1%. */
  var moon = (function (t) {
    var R = Math.PI / 180, T = (t / 864e5 + 2440587.5 - 2451545) / 36525;
    var D = 297.8501921 + 445267.1114034 * T, M = 357.5291092 + 35999.0502909 * T,
        Mp = 134.9633964 + 477198.8675055 * T;
    var i = 180 - D - 6.289 * Math.sin(Mp * R) + 2.1 * Math.sin(M * R) -
            1.274 * Math.sin((2 * D - Mp) * R) - 0.658 * Math.sin(2 * D * R) -
            0.214 * Math.sin(2 * Mp * R) - 0.11 * Math.sin(D * R);
    var k = (1 + Math.cos(i * R)) / 2, waxing = Math.sin(i * R) > 0;
    var name = k < 0.02 ? "new moon" : k > 0.98 ? "full moon" :
      Math.abs(k - 0.5) < 0.035 ? (waxing ? "first quarter" : "last quarter") :
      (waxing ? "waxing " : "waning ") + (k < 0.5 ? "crescent" : "gibbous");
    // The shadow, on a disc of radius 9 at (12,12): a half circle on the dark
    // side closed by the terminator, a half ellipse of width 9|1-2k|.
    var rx = (9 * Math.abs(1 - 2 * k)).toFixed(2);
    var d = waxing   // lit on the right, shadow on the left
      ? "M12 3A9 9 0 0 0 12 21A" + rx + " 9 0 0 " + (k < 0.5 ? 0 : 1) + " 12 3Z"
      : "M12 3A9 9 0 0 1 12 21A" + rx + " 9 0 0 " + (k < 0.5 ? 1 : 0) + " 12 3Z";
    return { d: d, side: waxing ? -14 : 14,
             label: name + ", " + Math.round(k * 100) + "% lit" };
  })(Date.now());

  function apply(theme, animate) {
    if (animate) {
      root.classList.add("theme-anim");
      setTimeout(function () { root.classList.remove("theme-anim"); }, 400);
    }
    root.setAttribute("data-theme", theme);
    var dark = theme === "dark";
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.title = dark ? "Light mode" : "Dark mode \u00b7 Tonight\u2019s moon: " + moon.label;
      var svg = btn.querySelector(".ti-orb");
      if (svg) {
        svg.style.setProperty("--cut-x", moon.side + "px");
        var cut = svg.querySelector(".ti-cut");
        if (cut) cut.setAttribute("d", moon.d);
      }
      btn.setAttribute("data-synced", "");
      var label = btn.querySelector(".theme-toggle-label");
      if (label) label.textContent = dark ? "Light mode" : "Dark mode";
    });
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".theme-toggle")) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, next); } catch (err) {}
    apply(next, true);
  });


  // Sync the buttons (label, moon) whenever the header is injected, including
  // when a cached header is later replaced by a freshly fetched one.
  var sync = function () { apply(root.getAttribute("data-theme") || "light", false); };
  if (document.querySelector(".theme-toggle")) sync();
  new MutationObserver(function () {
    if (document.querySelector(".theme-toggle:not([data-synced])")) sync();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
