/* The photo, with depth: on devices with a mouse, the photo tilts very
   slightly toward the cursor (at most 3 degrees) and a band of light slides
   across it (css/styling.css). Eases back when the pointer leaves.
   Off on touch screens and for reduced motion. */
(function () {
  "use strict";
  var MAX = 3;   // degrees
  var photo = document.querySelector(".photo"), img = photo && photo.querySelector(".profile_image");
  if (!img || !window.matchMedia) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // the light: an overlay laid exactly over the picture (its untransformed layout box)
  var sheen = document.createElement("span");
  sheen.className = "photo-sheen";
  sheen.setAttribute("aria-hidden", "true");
  photo.appendChild(sheen);
  function fit() {
    sheen.style.left = img.offsetLeft + "px";
    sheen.style.top = img.offsetTop + "px";
    sheen.style.width = img.offsetWidth + "px";
    sheen.style.height = img.offsetHeight + "px";
  }
  fit();
  window.addEventListener("resize", fit, { passive: true });
  if (!img.complete) img.addEventListener("load", fit);

  var settle = 0;
  function move(e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    var r = img.getBoundingClientRect();
    var nx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1));
    var ny = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1));
    photo.style.setProperty("--ry", (nx * MAX).toFixed(2) + "deg");       // left/right
    photo.style.setProperty("--rx", (-ny * MAX).toFixed(2) + "deg");      // up/down
    photo.style.setProperty("--sheen", (100 - (nx + 1) * 50).toFixed(1) + "%");   // the light band follows
  }
  photo.addEventListener("pointerenter", function (e) {
    clearTimeout(settle); fit();
    photo.classList.remove("is-settling"); photo.classList.add("is-tilting"); move(e);
  });
  photo.addEventListener("pointermove", move, { passive: true });
  photo.addEventListener("pointerleave", function () {
    photo.classList.remove("is-tilting"); photo.classList.add("is-settling");
    photo.style.setProperty("--rx", "0deg"); photo.style.setProperty("--ry", "0deg");
    settle = setTimeout(function () { photo.classList.remove("is-settling"); }, 750);
  });
})();
