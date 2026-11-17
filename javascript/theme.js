/* Light/dark theme toggle.
   The initial theme is set by a tiny inline script in each page's <head>
   (light, unless the visitor chose dark) so the page never flashes.
   The toggle button lives in the injected header, so we use delegation. */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "theme";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function apply(theme, animate) {
    if (animate) {
      root.classList.add("theme-anim");
      setTimeout(function () { root.classList.remove("theme-anim"); }, 550);
    }
    root.setAttribute("data-theme", theme);
    var dark = theme === "dark";
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.title = dark ? "Light mode" : "Dark mode";
      var label = btn.querySelector(".theme-toggle-label");
      if (label) label.textContent = dark ? "Light mode" : "Dark mode";
      btn.setAttribute("data-synced", "");
    });
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  // Switching: the whole page crossfades from the old look to the new one in a
  // single smooth dissolve (View Transitions API), while the toggle sits on top
  // so its moon/sun morph plays crisply. Browsers without the API, and visitors
  // who prefer reduced motion, get a gentle colour fade instead.
  var switching = false;
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".theme-toggle");
    if (!btn || switching) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, next); } catch (err) {}
    if (!document.startViewTransition || reduce || document.hidden) { apply(next, true); return; }
    switching = true;
    btn.style.viewTransitionName = "theme-toggle";
    root.classList.add("theme-vt");
    var done = function () {
      root.classList.remove("theme-vt");
      btn.style.viewTransitionName = "";
      switching = false;
    };
    try {
      document.startViewTransition(function () { apply(next, false); }).finished.then(done, done);
    } catch (err) { done(); apply(next, true); }
  });


  // Sync the buttons' labels whenever the header is injected, including when a
  // cached header is later replaced by a freshly fetched one.
  var sync = function () { apply(root.getAttribute("data-theme") || "light", false); };
  if (document.querySelector(".theme-toggle")) sync();
  new MutationObserver(function () {
    if (document.querySelector(".theme-toggle:not([data-synced])")) sync();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
