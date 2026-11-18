/* Light that follows the pointer: on devices with a mouse, publication cards
   and the News box catch a soft glow where the cursor is, mostly along the
   border with a faint wash inside (css/styling.css). This only tells the CSS
   where the pointer is. Off on touch screens and for reduced motion. */
(function () {
  "use strict";
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var SEL = ".publication-card, .news-box";
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    var el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty("--sx", (e.clientX - r.left).toFixed(1) + "px");
    el.style.setProperty("--sy", (e.clientY - r.top).toFixed(1) + "px");
  }, { passive: true });
})();
