/* Header name → Bengali on touch screens.
   With a mouse, hovering the name does this (CSS in site-header.html).
   Touch screens have no hover, so a tap on the name switches it to Bengali
   (instead of following the link) and a tap anywhere else, or on the name
   again, switches it back. The header is injected later, so use delegation. */
(function () {
  "use strict";
  var mouse = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)");
  document.addEventListener("click", function (e) {
    var name = e.target.closest && e.target.closest(".name-morph");
    var shown = document.querySelector(".name-morph.is-bn");
    if (name && mouse && !mouse.matches) {
      e.preventDefault();
      name.classList.toggle("is-bn");
      return;
    }
    if (shown) shown.classList.remove("is-bn");
  }, true);
})();
