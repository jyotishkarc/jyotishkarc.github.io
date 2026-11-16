/* ==========================================================================
   Citation counts on the research page, from Semantic Scholar's free API.
   Each .publication-card with data-paper-id="DOI:… ARXIV:… CorpusId:…" gets a
   small "Cited by N" label after its venue line (only when N > 0). Several IDs
   on one card (e.g. journal + arXiv versions) use the larger count.
   Results are cached in the visitor's browser for a day; if the API is busy or
   unreachable the labels simply don't appear.
   ========================================================================== */
(function () {
  "use strict";

  var cards = Array.prototype.slice.call(document.querySelectorAll(".publication-card[data-paper-id]"));
  if (!cards.length) return;

  var ids = [];
  cards.forEach(function (c) {
    c.getAttribute("data-paper-id").split(/[\s,]+/).forEach(function (id) {
      if (id && ids.indexOf(id) < 0) ids.push(id);
    });
  });

  var CACHE_KEY = "citation-counts-v1", DAY = 24 * 3600 * 1000;

  function render(counts) {
    cards.forEach(function (c) {
      var n = 0;
      c.getAttribute("data-paper-id").split(/[\s,]+/).forEach(function (id) {
        if (counts[id] > n) n = counts[id];
      });
      var venue = c.querySelector(".publication-venue");
      if (!n || !venue || venue.querySelector(".cite-count")) return;
      var tag = document.createElement("span");
      tag.className = "cite-count";
      tag.title = "Citations according to Semantic Scholar";
      tag.innerHTML = '<i class="fa-solid fa-quote-left" aria-hidden="true"></i> Cited by ' + n;
      venue.appendChild(document.createTextNode(" "));
      venue.appendChild(tag);
    });
  }

  try {
    var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.t < DAY && cached.ids === ids.join(" ")) {
      render(cached.counts);
      return;
    }
  } catch (e) {}

  function request(attempt) {
    fetch("https://api.semanticscholar.org/graph/v1/paper/batch?fields=citationCount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ids })
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) {
        var counts = {};
        ids.forEach(function (id, i) { counts[id] = (list[i] && list[i].citationCount) || 0; });
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), ids: ids.join(" "), counts: counts }));
        } catch (e) {}
        render(counts);
      })
      .catch(function () {
        if (attempt < 1) setTimeout(function () { request(attempt + 1); }, 2500);
      });
  }
  request(0);
})();
