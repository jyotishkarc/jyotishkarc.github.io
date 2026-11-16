/* ==========================================================================
   Gentle, weighted page scrolling for mouse wheels and trackpads.
   Each wheel movement sets a target position; the page then closes a fraction
   of the remaining distance every frame, so it starts promptly, glides, and
   settles softly (a little "weight" instead of jumps).

   Left alone (native scrolling): touch screens, keyboard, scrollbar dragging,
   links to #anchors, pinch/ctrl-zoom, horizontal scrolling, anything inside a
   box that can scroll itself (e.g. the News box), pages with scrolling locked
   (e.g. the photo viewer), and visitors who prefer reduced motion.
   ========================================================================== */
(function () {
  "use strict";

  var EASE = 0.1;        // share of the remaining distance covered per frame (at 60 fps); lower = heavier
  var SPEED = 1;         // multiplier on the wheel distance
  var LINE = 40;         // px per "line" (Firefox reports wheel steps in lines)

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;
  var target = 0, current = 0, raf = 0, last = 0, written = -1;

  function maxY() { return Math.max(0, root.scrollHeight - window.innerHeight); }
  function clamp(y) { return Math.max(0, Math.min(maxY(), y)); }
  function set(y) {
    written = Math.round(y);
    window.scrollTo({ top: y, behavior: "instant" });
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    target = current = window.scrollY;
  }

  function frame(now) {
    var dt = last ? Math.min(now - last, 64) : 16.7;
    last = now;
    target = clamp(target);
    var k = 1 - Math.pow(1 - EASE, dt / 16.7);          // same feel at any frame rate
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.5) {
      current = target; set(current); raf = 0; last = 0;
      return;
    }
    set(current);
    raf = requestAnimationFrame(frame);
  }

  // Can this element (or one of its ancestors below <body>) scroll further in this direction?
  function innerScroller(el, dy) {
    for (; el && el !== document.body && el !== root; el = el.parentElement) {
      if (el.nodeType !== 1) continue;
      var oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
        // at its end: let the box contain the scroll (as it does natively) rather than jump the page
        if (getComputedStyle(el).overscrollBehaviorY === "contain") return true;
      }
    }
    return false;
  }
  function locked() {
    return getComputedStyle(root).overflowY === "hidden" || getComputedStyle(document.body).overflowY === "hidden";
  }

  window.addEventListener("wheel", function (e) {
    if (reduce && reduce.matches) return;
    if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (locked() || innerScroller(e.target, e.deltaY)) return;

    var dy = e.deltaY * (e.deltaMode === 1 ? LINE : e.deltaMode === 2 ? window.innerHeight : 1) * SPEED;
    if (!dy) return;
    e.preventDefault();
    if (!raf) { current = window.scrollY; target = current; }
    target = clamp(target + dy);
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }, { passive: false });

  // Someone else moved the page (keyboard, scrollbar, a link): follow it.
  window.addEventListener("scroll", function () {
    if (Math.abs(window.scrollY - written) > 2) stop();
  }, { passive: true });
  window.addEventListener("keydown", stop);
  window.addEventListener("mousedown", function (e) { if (e.button === 1) stop(); });
  window.addEventListener("resize", function () { target = clamp(target); });
})();
