/* ==========================================================================
   "Cite" boxes on the research page.
   Every publication <li> holding a <script type="text/x-bibtex" class="bibtex">
   gets a "Cite" button in its Access row. It opens a box below the card with
   the BibTeX entry and a copy button. Clicking anywhere outside, pressing Esc,
   or opening another box (Cite or Abstract) closes it.
   Uses the same look as the abstract boxes (css/abstracts.css + css/cite.css).
   ========================================================================== */
(function () {
  "use strict";

  var open = null; // { box, btn }

  function close(returnFocus) {
    if (!open) return;
    open.box.classList.remove("is-open");
    open.box.setAttribute("aria-hidden", "true");
    open.box.inert = true;
    open.btn.setAttribute("aria-expanded", "false");
    if (returnFocus) open.btn.focus();
    open = null;
  }

  function show(box, btn) {
    close(false);
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    box.inert = false;
    btn.setAttribute("aria-expanded", "true");
    open = { box: box, btn: btn };
    setTimeout(function () {
      if (box.getBoundingClientRect().bottom > window.innerHeight) {
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 360);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  document.querySelectorAll("script.bibtex").forEach(function (src, i) {
    var li = src.closest("li");
    var card = li && li.querySelector(".publication-card");
    var access = card && card.querySelector(".publication-access");
    if (!access) return;

    // dedent the BibTeX as written in the HTML
    var lines = src.textContent.replace(/^\s*\n/, "").replace(/\s+$/, "").split("\n");
    var indent = Math.min.apply(null, lines.filter(function (l) { return l.trim(); })
      .map(function (l) { return l.match(/^ */)[0].length; }));
    var bib = lines.map(function (l) { return l.slice(indent); }).join("\n");

    // box
    var box = document.createElement("div");
    box.className = "abstract-box cite-box";
    box.id = "cite-" + (i + 1);
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "BibTeX citation");
    box.setAttribute("aria-hidden", "true");
    box.inert = true;
    box.innerHTML =
      '<div class="abs-inner">' +
        '<div class="cite-head">' +
          '<span class="abs-label">BibTeX</span>' +
          '<button type="button" class="cite-copy">Copy</button>' +
        '</div>' +
        '<pre class="cite-code"><code></code></pre>' +
      '</div>';
    box.querySelector("code").textContent = bib;
    var anchor = li.querySelector(".abstract-box") || card;
    anchor.insertAdjacentElement("afterend", box);

    var copyBtn = box.querySelector(".cite-copy");
    copyBtn.addEventListener("click", function () {
      copyText(bib).then(function () {
        copyBtn.textContent = "Copied ✓";
        copyBtn.classList.add("is-done");
        setTimeout(function () {
          copyBtn.textContent = "Copy";
          copyBtn.classList.remove("is-done");
        }, 1800);
      }, function () { copyBtn.textContent = "Press ⌘/Ctrl+C"; });
    });

    // button
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "abs-btn cite-btn";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", box.id);
    btn.innerHTML = 'Cite <span class="abs-caret" aria-hidden="true">&#9662;</span>';
    // No separator between the Abstract and Cite buttons; if there is no
    // Abstract button, use the same dot that abstracts.js puts before it.
    if (!access.querySelector(".abs-btn") && access.querySelector("a")) {
      var dot = document.createElement("span");
      dot.className = "access-dot";
      dot.setAttribute("aria-hidden", "true");
      dot.textContent = "\u2022";
      access.appendChild(dot);
    }
    access.appendChild(btn);

    btn.addEventListener("click", function () {
      if (open && open.box === box) close(false);
      else show(box, btn);
    });
  });

  // Capture phase, so it also runs when another button stops propagation.
  document.addEventListener("click", function (e) {
    if (!open) return;
    if (open.box.contains(e.target) || e.target.closest(".cite-btn") === open.btn) return;
    close(false);
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) close(true);
  });
})();
