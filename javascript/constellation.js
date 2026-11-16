/* ==========================================================================
   Collaborator constellation (research page)
   A small star map of coauthors, built from the author lists already on the
   page (data-authors + the `collaborators` table), so it stays current.
   You sit at the centre; each coauthor is a star. Lines join people who have
   written a paper together; lines to the centre thicken with more joint papers.
   Hover or focus a name to light up its lines; click to open their page.
   ========================================================================== */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var ME = "jrc";

  function svg(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  // name + link from the collaborators table, e.g. '<a href="…">Yao Xie</a>'
  function person(key) {
    // `collaborators` is a top-level const in research.html (a global binding, not window.*)
    var table = typeof collaborators !== "undefined" ? collaborators : {};
    var raw = table[key] || "";
    var tmp = document.createElement("div");
    tmp.innerHTML = raw;
    var a = tmp.querySelector("a");
    var name = tmp.textContent.trim() || key.split("_").map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join(" ");
    return { key: key, name: name, href: a ? a.getAttribute("href") : null };
  }

  // Title as plain text, even if KaTeX has already typeset its math
  function titleOf(h3) {
    var c = h3.cloneNode(true);
    c.querySelectorAll(".katex").forEach(function (k) {
      var ann = k.querySelector("annotation");
      k.replaceWith(ann ? ann.textContent : k.textContent);
    });
    return c.textContent.replace(/\$/g, "").replace(/\s+/g, " ").trim();
  }

  function collect() {
    var papers = [];
    document.querySelectorAll(".publication-card[data-authors]").forEach(function (card) {
      var keys = card.getAttribute("data-authors").split(",").map(function (k) { return k.trim().replace(/\*$/, ""); }).filter(Boolean);
      var h3 = card.querySelector("h3");
      papers.push({ keys: keys, title: h3 ? titleOf(h3) : "" });
    });
    var nodes = {}, order = [], pairs = {};
    papers.forEach(function (p) {
      var co = p.keys.filter(function (k) { return k !== ME; });
      co.forEach(function (k) {
        if (!nodes[k]) { nodes[k] = person(k); nodes[k].papers = []; order.push(k); }
        nodes[k].papers.push(p.title);
      });
      for (var i = 0; i < co.length; i++) for (var j = i + 1; j < co.length; j++) {
        var id = [co[i], co[j]].sort().join("|");
        pairs[id] = (pairs[id] || 0) + 1;
      }
    });
    // keep people who wrote together next to each other around the circle
    var placed = [], seen = {};
    order.forEach(function (k) {
      if (seen[k]) return;
      var group = [k]; seen[k] = true;
      for (var q = 0; q < group.length; q++) {
        order.forEach(function (o) {
          if (!seen[o] && pairs[[group[q], o].sort().join("|")]) { group.push(o); seen[o] = true; }
        });
      }
      placed.push(group);
    });
    return { nodes: nodes, groups: placed, pairs: pairs };
  }

  // small deterministic jitter, so it reads as a constellation, not a clock face
  function jitter(i) { var x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); }

  function draw(fig, data) {
    var box = fig.querySelector(".cst-sky");
    box.innerHTML = "";
    var narrow = box.clientWidth < 620;
    var W = narrow ? 420 : 820, H = narrow ? 500 : 310, cx = W / 2, cy = H / 2;
    var rx = narrow ? 64 : 300, ry = narrow ? 200 : 118;   // phones: tall and narrow, so names fit on both sides
    var root = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Map of coauthors" }, box);
    var gLinks = svg("g", { class: "cst-links" }, root);
    var gStars = svg("g", { class: "cst-stars" }, root);

    // angles: groups spread evenly, with a little extra space between groups
    var total = 0; data.groups.forEach(function (g) { total += g.length + 0.8; });
    var step = 2 * Math.PI / total, a = -Math.PI / 2 + step * 0.4, idx = 0, pos = {};
    data.groups.forEach(function (g) {
      g.forEach(function (k) {
        var r = 0.86 + 0.24 * jitter(idx);
        var ang = a + (jitter(idx + 7) - 0.5) * step * 0.35;
        pos[k] = { x: cx + Math.cos(ang) * rx * r, y: cy + Math.sin(ang) * ry * r, ang: ang };
        a += step; idx++;
      });
      a += step * 0.8;
    });

    var links = [];
    Object.keys(data.nodes).forEach(function (k) {
      var n = data.nodes[k], p = pos[k];
      var l = svg("line", { x1: cx, y1: cy, x2: p.x, y2: p.y, class: "cst-link cst-me", "stroke-width": (0.9 + 0.7 * (n.papers.length - 1)).toFixed(2) }, gLinks);
      links.push({ el: l, a: ME, b: k });
    });
    Object.keys(data.pairs).forEach(function (id) {
      var ab = id.split("|"), p = pos[ab[0]], q = pos[ab[1]];
      var l = svg("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: "cst-link cst-co", "stroke-width": "0.8" }, gLinks);
      links.push({ el: l, a: ab[0], b: ab[1] });
    });

    // centre
    svg("circle", { cx: cx, cy: cy, r: 11, class: "cst-halo" }, gStars);
    svg("circle", { cx: cx, cy: cy, r: 4.2, class: "cst-dot cst-centre" }, gStars);
    var me = svg("text", { x: cx, y: cy + 22, class: "cst-label cst-me-label", "text-anchor": "middle" }, gStars);
    me.textContent = "Jyotishka";

    Object.keys(data.nodes).forEach(function (k) {
      var n = data.nodes[k], p = pos[k];
      var g = svg(n.href ? "a" : "g", { class: "cst-node", tabindex: "0" }, gStars);
      if (n.href) { g.setAttribute("href", n.href); g.setAttribute("target", "_blank"); g.setAttribute("rel", "noopener"); }
      var count = n.papers.length;
      g.setAttribute("aria-label", n.name + ": " + count + (count > 1 ? " papers" : " paper") + " together");
      var tip = svg("title", {}, g);
      tip.textContent = n.name + " — " + n.papers.join("; ");
      svg("circle", { cx: p.x, cy: p.y, r: 14, class: "cst-hit" }, g);
      svg("circle", { cx: p.x, cy: p.y, r: 7, class: "cst-halo" }, g);
      svg("circle", { cx: p.x, cy: p.y, r: 2.6 + 0.6 * Math.min(count - 1, 2), class: "cst-dot" }, g);
      var right = Math.cos(p.ang) >= -0.05;
      var lbl = svg("text", { x: p.x + (right ? 10 : -10), y: p.y + 4, class: "cst-label", "text-anchor": right ? "start" : "end" }, g);
      lbl.textContent = n.name;

      function on() {
        fig.classList.add("is-focus");
        g.classList.add("is-on");
        links.forEach(function (L) { if (L.a === k || L.b === k) L.el.classList.add("is-on"); });
      }
      function off() {
        fig.classList.remove("is-focus");
        g.classList.remove("is-on");
        links.forEach(function (L) { L.el.classList.remove("is-on"); });
      }
      g.addEventListener("mouseenter", on); g.addEventListener("mouseleave", off);
      g.addEventListener("focus", on); g.addEventListener("blur", off);
    });
  }

  var css = [
    "#collaborators .cst-figure{margin:18px 0 8px}",
    "#collaborators .cst-sky svg{display:block;width:100%;height:auto;overflow:visible}",
    "#collaborators .cst-note{font-size:13px;color:#77738a;margin:4px 0 0;text-align:center}",
    ".cst-link{stroke:#5b4bb0;opacity:.28;transition:opacity .25s ease,stroke .25s ease}",
    ".cst-co{opacity:.16;stroke-dasharray:2 3}",
    ".cst-dot{fill:#3d2a9a}",
    ".cst-centre{fill:#4a2fb0}",
    ".cst-halo{fill:#6a4fd6;opacity:.1}",
    ".cst-hit{fill:transparent}",
    ".cst-label{font-size:12.5px;fill:#4b475c;transition:fill .25s ease,opacity .25s ease}",
    ".cst-me-label{font-weight:700;fill:#3d2a9a;font-size:12px;letter-spacing:.02em}",
    ".cst-node{cursor:pointer;outline:none}",
    ".cst-node .cst-dot,.cst-node .cst-halo{transition:opacity .25s ease,transform .25s ease;transform-box:fill-box;transform-origin:center}",
    ".cst-figure.is-focus .cst-link{opacity:.07}",
    ".cst-figure.is-focus .cst-link.is-on{opacity:.75}",
    ".cst-figure.is-focus .cst-node:not(.is-on) .cst-label{opacity:.45}",
    ".cst-node.is-on .cst-label{fill:#2a1a80;font-weight:600}",
    ".cst-node.is-on .cst-halo{opacity:.22;transform:scale(1.5)}",
    ".cst-node:focus-visible .cst-label{text-decoration:underline dotted;text-underline-offset:3px}",
    "html[data-theme=dark] .cst-link{stroke:#c9bcff;opacity:.22}",
    "html[data-theme=dark] .cst-co{opacity:.13}",
    "html[data-theme=dark] .cst-figure.is-focus .cst-link{opacity:.05}",
    "html[data-theme=dark] .cst-figure.is-focus .cst-link.is-on{opacity:.7}",
    "html[data-theme=dark] .cst-dot,html[data-theme=dark] .cst-centre{fill:#f4f1ff}",
    "html[data-theme=dark] .cst-halo{fill:#b9a8ff;opacity:.16}",
    "html[data-theme=dark] .cst-label{fill:#b3afc4}",
    "html[data-theme=dark] .cst-me-label{fill:#d4c9ff}",
    "html[data-theme=dark] .cst-node.is-on .cst-label{fill:#fff}",
    "html[data-theme=dark] #collaborators .cst-note{color:#9a96ad}",
    "@media (prefers-reduced-motion:reduce){.cst-link,.cst-label,.cst-node .cst-dot,.cst-node .cst-halo{transition:none}}"
  ].join("\n");

  function init() {
    var main = document.querySelector("main");
    if (!main || !document.querySelector(".publication-card[data-authors]")) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

    var sec = document.createElement("section");
    sec.className = "publication-content";
    sec.id = "collaborators";
    sec.innerHTML =
      '<div class="pub-header"><h2><i class="fa-solid fa-user-group"></i> &nbsp;Collaborators</h2></div>' +
      '<figure class="cst-figure"><div class="cst-sky"></div>' +
      '<figcaption class="cst-note">Lines join people who have written a paper together.</figcaption></figure>';
    main.appendChild(sec);

    var fig = sec.querySelector(".cst-figure");
    var data = collect();
    draw(fig, data);
    var lastNarrow = fig.querySelector(".cst-sky").clientWidth < 620, t = 0;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var n = fig.querySelector(".cst-sky").clientWidth < 620;
        if (n !== lastNarrow) { lastNarrow = n; draw(fig, data); }
      }, 150);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
