/* Social icons: which button is open.
   On devices with a mouse, the button under the pointer opens into a labelled
   tile (css/styling.css). The open button is remembered here rather than left
   to :hover, so it stays open while the pointer crosses the small gap to the
   next button: the row changes only when the pointer reaches another button
   or leaves the row, and never shifts under a pointer that is standing still. */
(function () {
  "use strict";
  var row = document.querySelector(".social-icons");
  if (!row || !window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var links = Array.prototype.slice.call(row.querySelectorAll("a"));
  var closing = 0;

  function open(a) {
    clearTimeout(closing);
    links.forEach(function (l) { l.classList.toggle("is-open", l === a); });
    row.classList.add("has-open");
  }
  function close() {
    links.forEach(function (l) { l.classList.remove("is-open"); });
    row.classList.remove("has-open");
  }

  links.forEach(function (a) {
    a.addEventListener("pointerenter", function () { open(a); });
    // keyboard: open the focused button, close when focus leaves the row
    a.addEventListener("focus", function () { if (a.matches(":focus-visible")) open(a); });
    a.addEventListener("blur", function () {
      setTimeout(function () { if (!row.contains(document.activeElement) && !row.matches(":hover")) close(); }, 0);
    });
  });
  row.addEventListener("pointerleave", function () { closing = setTimeout(close, 60); });
})();
