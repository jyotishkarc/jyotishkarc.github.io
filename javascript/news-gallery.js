/* ==========================================================================
   News photos.
   - A .news-photos-btn opens the .news-gallery it controls (aria-controls):
     a row of thumbnails right under the news item. Clicking anywhere else
     (or Esc) closes it.
   - Clicking a thumbnail opens a full-size viewer with ‹ › arrows, keyboard
     arrows, swipe on phones, and a counter. Clicking outside the photo, the
     × button or Esc closes the viewer.
   ========================================================================== */
(function () {
  "use strict";

  var openGallery = null; // { box, btn }

  function setGallery(box, btn, open) {
    box.classList.toggle("is-open", open);
    box.setAttribute("aria-hidden", String(!open));
    box.inert = !open;
    btn.setAttribute("aria-expanded", String(open));
    openGallery = open ? { box: box, btn: btn } : null;
    if (open) {
      setTimeout(function () { box.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 360);
    }
  }

  /* ---- viewer (built once) ---- */
  var ICON = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };
  var viewer = document.createElement("div");
  viewer.className = "photo-viewer";
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Photo viewer");
  viewer.innerHTML =
    '<button type="button" class="pv-btn pv-close" aria-label="Close">' + ICON.close + "</button>" +
    '<button type="button" class="pv-btn pv-prev" aria-label="Previous photo">' + ICON.prev + "</button>" +
    "<figure><img alt=\"\"><figcaption></figcaption></figure>" +
    '<button type="button" class="pv-btn pv-next" aria-label="Next photo">' + ICON.next + "</button>";
  document.body.appendChild(viewer);
  var vImg = viewer.querySelector("img");
  var vCap = viewer.querySelector("figcaption");
  var list = [], idx = 0, returnFocus = null;

  function show(i) {
    idx = (i + list.length) % list.length;
    vImg.src = list[idx].src;
    vImg.alt = list[idx].alt;
    vCap.textContent = list.length > 1 ? (idx + 1) + " / " + list.length : "";
  }
  function openViewer(imgs, i, from) {
    list = imgs; returnFocus = from;
    viewer.classList.toggle("single", imgs.length < 2);
    show(i);
    viewer.classList.add("is-open");
    document.documentElement.classList.add("pv-lock");
    viewer.querySelector(".pv-close").focus();
  }
  function closeViewer() {
    if (!viewer.classList.contains("is-open")) return;
    viewer.classList.remove("is-open");
    document.documentElement.classList.remove("pv-lock");
    if (returnFocus) returnFocus.focus();
  }

  viewer.addEventListener("click", function (e) {
    if (e.target.closest(".pv-prev")) return show(idx - 1);
    if (e.target.closest(".pv-next")) return show(idx + 1);
    if (e.target.closest(".pv-close")) return closeViewer();
    if (e.target === vImg) return;            // clicking the photo itself does nothing
    closeViewer();                             // anywhere else closes
  });

  var touchX = null;
  viewer.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---- wire galleries ---- */
  document.querySelectorAll(".news-photos-btn").forEach(function (btn) {
    var box = document.getElementById(btn.getAttribute("aria-controls"));
    if (!box) return;
    btn.addEventListener("click", function () {
      setGallery(box, btn, !box.classList.contains("is-open"));
    });
    var thumbs = Array.prototype.slice.call(box.querySelectorAll(".news-thumb"));
    var imgs = thumbs.map(function (t) {
      var im = t.querySelector("img");
      return { src: t.getAttribute("data-full") || im.getAttribute("src"), alt: im.alt };
    });
    thumbs.forEach(function (t, i) {
      t.setAttribute("aria-label", "Open photo " + (i + 1) + " of " + thumbs.length);
      t.addEventListener("click", function () { openViewer(imgs, i, t); });
    });
  });

  // Close the dropdown on clicks outside it (but not while using the viewer).
  document.addEventListener("click", function (e) {
    if (!openGallery || viewer.contains(e.target)) return;
    if (openGallery.box.contains(e.target) || openGallery.btn.contains(e.target)) return;
    setGallery(openGallery.box, openGallery.btn, false);
  }, true);

  document.addEventListener("keydown", function (e) {
    if (viewer.classList.contains("is-open")) {
      if (e.key === "Escape") closeViewer();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      return;
    }
    if (e.key === "Escape" && openGallery) {
      var b = openGallery.btn;
      setGallery(openGallery.box, b, false);
      b.focus();
    }
  });
})();
