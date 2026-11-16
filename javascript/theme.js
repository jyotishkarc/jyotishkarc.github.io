/* Light/dark theme toggle.
   The initial theme is set by a tiny inline script in each page's <head>
   (saved choice, else the system setting) so the page never flashes.
   The toggle button lives in the injected header, so we use delegation. */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "theme";

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
      btn.title = dark ? "Light mode" : "Dark mode";
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

  // Follow the system setting until the visitor picks one themselves.
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function (ev) {
      var saved = null;
      try { saved = localStorage.getItem(KEY); } catch (err) {}
      if (!saved) apply(ev.matches ? "dark" : "light", true);
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  // Sync the button's label once the header has been injected.
  var sync = function () { apply(root.getAttribute("data-theme") || "light", false); };
  if (document.querySelector(".theme-toggle")) sync();
  else {
    var obs = new MutationObserver(function () {
      if (document.querySelector(".theme-toggle")) { obs.disconnect(); sync(); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
