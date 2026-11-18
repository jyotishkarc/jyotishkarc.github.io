/* Social icons: which button is open.
   On devices with a mouse, the button under the pointer opens into a labelled
   tile (css/styling.css). The open button is remembered here rather than left
   to :hover, so it stays open while the pointer crosses the small gap to the
   next button: the row changes only when the pointer reaches another button
   or leaves the row, and never shifts under a pointer that is standing still.
   It also splits each name into letters for the cascade in css/styling.css. */
(function () {
  "use strict";
  var row = document.querySelector(".social-icons");
  if (!row || !window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var links = Array.prototype.slice.call(row.querySelectorAll("a"));
  var closing = 0;

  // split each name into letters, so they can rise in one after another
  Array.prototype.forEach.call(row.querySelectorAll(".soc-label"), function (label) {
    var i = 0;
    Array.prototype.slice.call(label.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;               // keep the <br> in "Google / Scholar"
      var frag = document.createDocumentFragment();
      node.textContent.split("").forEach(function (ch) {
        var span = document.createElement("span");
        span.className = "soc-ch";
        span.style.setProperty("--i", i++);
        span.textContent = ch === " " ? "\u00a0" : ch;
        frag.appendChild(span);
      });
      label.replaceChild(frag, node);
    });
  });

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
