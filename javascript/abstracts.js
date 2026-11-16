/* ==========================================================================
   Abstract boxes on the research page.
   For every publication <li> that contains a .abstract-box, this adds an
   "Abstract" button to the card's "Access:" row. The box opens right below
   the card and closes when you click anywhere outside it, press Escape, or
   open another one.
   If the box's full-abstract paragraph is empty, that part is hidden and a
   link to the paper's page (the first link in "Access:") is shown instead.
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

    // If the box would end up below the fold, scroll it gently into view.
    setTimeout(function () {
      var r = box.getBoundingClientRect();
      if (r.bottom > window.innerHeight) {
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 360);
  }

  document.querySelectorAll(".abstract-box").forEach(function (box, i) {
    var li = box.closest("li");
    var card = li && li.querySelector(".publication-card");
    var access = card && card.querySelector(".publication-access");
    if (!access) return;

    if (!box.id) box.id = "abstract-" + (i + 1);
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Abstract");
    box.setAttribute("aria-hidden", "true");
    box.inert = true;

    // Empty full abstract -> replace with a link to the paper's page.
    var full = box.querySelector(".abs-full");
    var fullText = full && full.querySelector("p");
    if (full && (!fullText || !fullText.textContent.trim())) {
      var firstLink = access.querySelector("a[href]");
      if (firstLink) {
        full.innerHTML = "";
        var more = document.createElement("a");
        more.className = "abs-more";
        more.href = firstLink.href;
        more.target = "_blank";
        more.rel = "noopener";
        more.innerHTML = "Read the full abstract &rarr;";
        full.appendChild(more);
      } else {
        full.remove();
      }
    }

    // Button
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "abs-btn";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", box.id);
    btn.innerHTML = 'Abstract <span class="abs-caret" aria-hidden="true">&#9662;</span>';

    if (access.querySelector("a, span, button")) {
      var sep = document.createElement("strong");
      sep.textContent = " | ";
      access.appendChild(sep);
    } else {
      access.appendChild(document.createTextNode(" "));
    }
    access.appendChild(btn);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (open && open.box === box) close(false);
      else show(box, btn);
    });
  });

  // Click anywhere outside the open box closes it.
  document.addEventListener("click", function (e) {
    if (open && !open.box.contains(e.target)) close(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) close(true);
  });
})();
