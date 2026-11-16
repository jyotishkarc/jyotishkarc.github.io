/* ==========================================================================
   Quick search (⌘K / Ctrl+K, or "/")
   A small command palette: jump to pages and sections, find a paper (by
   title, coauthor, venue or year) and open it or copy its BibTeX, open the
   CV and profiles, or switch light/dark mode.
   Papers are read from research.html itself, so new papers show up here
   automatically. Self-contained: brings its own styles and adds a search
   button next to the light/dark toggle (inside the menu on phones).
   ========================================================================== */
(function () {
  "use strict";

  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var KEY_HINT = isMac ? "⌘K" : "Ctrl K";
  var onResearch = /\/research(\.html)?$/.test(location.pathname);

  var ICON_SEARCH = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M15.4 15.4 20.5 20.5" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>';

  /* ---------------- styles ---------------- */
  var css = [
    ".qs-trigger{all:unset;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;cursor:pointer;color:#4a2fb0;transition:background-color .2s ease,color .2s ease}",
    ".qs-trigger:hover{background:rgba(90,60,200,.1);color:#3a1f9e}",
    ".qs-trigger:focus-visible{outline:2px solid #6a4fd6;outline-offset:2px}",
    ".qs-trigger svg{display:block;width:21px;height:21px}",
    ".qs-trigger--bar{position:relative;top:-3px;margin-right:-38px}",
    ".qs-trigger--menu{width:26px;height:30px}",
    ".qs-trigger--menu svg{width:18px;height:18px}",
    "@media (max-width:1000px){.site-header .theme-menu-item:has(.qs-trigger--menu){display:inline-flex!important;align-items:center}}",
    /* very small phones (≤360px): tighten the one-row menu a little to fit the extra icon */
    "@media (max-width:360px){.qs-trigger--menu{width:22px}.qs-trigger--menu svg{width:16px;height:16px}.site-header .theme-toggle--menu{width:26px}.site-header #navLinks ul li:not(:last-child)::after{margin-left:7px;margin-right:7px}}",
    "@media (max-width:1000px){.qs-trigger--bar{display:none}}",
    "@media (min-width:1001px){.qs-trigger--menu{display:none}}",
    "html[data-theme=dark] .qs-trigger{color:#b9a8ff}",
    "html[data-theme=dark] .qs-trigger:hover{background:rgba(185,168,255,.12);color:#d4c9ff}",

    ".qs-backdrop{position:fixed;inset:0;z-index:5000;background:rgba(18,14,36,.32);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;justify-content:center;align-items:flex-start;padding:14vh 16px 16px;box-sizing:border-box;opacity:0;transition:opacity .14s ease}",
    ".qs-backdrop.is-open{opacity:1}",
    ".qs-backdrop[hidden]{display:none}",
    ".qs-panel{width:100%;max-width:580px;max-height:min(560px,74vh);display:flex;flex-direction:column;background:#fff;color:#1b1730;border:1px solid #e4e0ee;border-radius:14px;box-shadow:0 24px 64px rgba(25,12,70,.24),0 2px 8px rgba(25,12,70,.08);overflow:hidden;transform:translateY(-6px) scale(.985);transition:transform .16s ease;font-size:15px}",
    ".qs-backdrop.is-open .qs-panel{transform:none}",
    ".qs-inputrow{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #ece9f3;color:#7a7590}",
    ".qs-inputrow svg{flex:none;width:19px;height:19px}",
    ".qs-input{all:unset;flex:1;min-width:0;font:inherit;font-size:16px;color:#1b1730}",
    ".qs-input::placeholder{color:#9a96ab}",
    ".qs-kbd{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;padding:4px 6px;border:1px solid #dcd8e6;border-bottom-width:2px;border-radius:5px;color:#6f6a84;background:#faf9fc}",
    ".qs-list{list-style:none;margin:0;padding:6px;overflow-y:auto;overscroll-behavior:contain}",
    ".qs-group{padding:10px 10px 4px;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#8d88a0}",
    ".qs-item{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:9px;cursor:pointer;position:relative}",
    ".qs-item.is-active{background:#f2eefd}",
    ".qs-item .qs-text{flex:1;min-width:0}",
    ".qs-title{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;color:#1b1730;line-height:1.35;overflow:hidden}",
    ".qs-sub{display:block;font-size:12.5px;color:#7a7590;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".qs-item mark{background:none;color:#4a2fb0;font-weight:700}",
    ".qs-bib{all:unset;flex:none;font-size:12px;font-weight:600;padding:4px 9px;border-radius:999px;color:#4a2fb0;background:#ebe5fd;cursor:pointer;opacity:0;transition:opacity .12s ease}",
    ".qs-item.is-active .qs-bib,.qs-item:hover .qs-bib,.qs-bib:focus-visible{opacity:1}",
    ".qs-bib:hover{background:#ddd3fc}",
    ".qs-empty{padding:28px 12px;text-align:center;color:#8d88a0}",
    ".qs-foot{display:flex;gap:16px;flex-wrap:wrap;align-items:center;padding:9px 16px;border-top:1px solid #ece9f3;font-size:12px;color:#8d88a0}",
    ".qs-foot .qs-kbd{padding:2px 5px;font-size:10.5px;margin-right:3px}",
    ".qs-toast{margin-left:auto;color:#2f7d4f;font-weight:600;opacity:0;transition:opacity .15s ease}",
    ".qs-toast.is-on{opacity:1}",
    "@media (max-width:640px){.qs-backdrop{padding:10px}.qs-panel{max-height:72vh}.qs-foot{display:none}}",
    "@media (prefers-reduced-motion:reduce){.qs-backdrop,.qs-panel{transition:none}}",

    "html[data-theme=dark] .qs-backdrop{background:rgba(5,4,12,.55)}",
    "html[data-theme=dark] .qs-panel{background:#1a1923;color:#e6e3ef;border-color:#2e2b3c;box-shadow:0 24px 64px rgba(0,0,0,.55)}",
    "html[data-theme=dark] .qs-inputrow,html[data-theme=dark] .qs-foot{border-color:#2e2b3c;color:#8e8aa2}",
    "html[data-theme=dark] .qs-input,html[data-theme=dark] .qs-title{color:#ece9f5}",
    "html[data-theme=dark] .qs-input::placeholder{color:#77738c}",
    "html[data-theme=dark] .qs-sub,html[data-theme=dark] .qs-group,html[data-theme=dark] .qs-empty{color:#9a96ad}",
    "html[data-theme=dark] .qs-item.is-active{background:#2a2445}",
    "html[data-theme=dark] .qs-item mark{color:#c9bcff}",
    "html[data-theme=dark] .qs-kbd{background:#22202d;border-color:#3a3749;color:#a9a5ba}",
    "html[data-theme=dark] .qs-bib{background:#352d5c;color:#d4c9ff}",
    "html[data-theme=dark] .qs-bib:hover{background:#41376e}",
    "html[data-theme=dark] .qs-toast{color:#7fd6a0}",

    /* brief highlight when jumping to a paper */
    "@keyframes qs-flash{0%,30%{box-shadow:0 0 0 3px rgba(106,79,214,.45)}100%{box-shadow:0 0 0 3px rgba(106,79,214,0)}}",
    ".qs-flash{animation:qs-flash 1.8s ease-out}",
    ".publication-card{scroll-margin-top:110px}"
  ].join("\n");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------------- data ---------------- */
  function cvHref() {
    var a = document.getElementById("nav-cv");
    return (a && a.getAttribute("href")) || "/assets/cv/CV_JRC_2026_08_19.pdf";
  }
  function staticItems() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    return [
      { g: "Pages", t: "Home", s: "About me, education and news", k: "about bio", href: "/" },
      { g: "Pages", t: "Research", s: "Publications, preprints and notes", k: "papers publications", href: "/research.html" },
      { g: "Pages", t: "Curriculum Vitae", s: "PDF", k: "cv resume", href: cvHref(), blank: true },
      { g: "Pages", t: "Miscellanea", s: "", k: "misc", href: "/miscellanea.html" },
      { g: "Pages", t: "Education", s: "Home", k: "degrees isi georgia tech phd mstat bstat", href: "/#education-heading" },
      { g: "Pages", t: "News", s: "Home", k: "updates awards talks", href: "/#news-heading" },
      { g: "Pages", t: "Published articles", s: "Research", k: "papers journals conferences", href: "/research.html#published" },
      { g: "Pages", t: "Preprints", s: "Research", k: "submitted unpublished", href: "/research.html#unpublished" },
      { g: "Pages", t: "Technical notes", s: "Research", k: "notes", href: "/research.html#technical_notes" },
      { g: "Links", t: "Google Scholar", s: "scholar.google.com", k: "citations", href: "https://scholar.google.com/citations?user=NhTxu3MAAAAJ", blank: true },
      { g: "Links", t: "GitHub", s: "github.com/jyotishkarc", k: "code", href: "https://github.com/jyotishkarc", blank: true },
      { g: "Links", t: "LinkedIn", s: "linkedin.com/in/jyotishkarc", k: "", href: "https://www.linkedin.com/in/jyotishkarc", blank: true },
      { g: "Settings", t: dark ? "Switch to light mode" : "Switch to dark mode", s: "", k: "theme dark light night", act: "theme" }
    ];
  }

  function slugify(t) {
    return t.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }
  function dedent(text) {
    var lines = text.replace(/^\s*\n/, "").replace(/\s+$/, "").split("\n");
    var ind = Math.min.apply(null, lines.filter(function (l) { return l.trim(); }).map(function (l) { return l.match(/^ */)[0].length; }));
    return lines.map(function (l) { return l.slice(ind); }).join("\n");
  }
  function niceName(key) {
    return key.replace(/\*$/, "").split("_").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }
  // Title text as written in the HTML, even if KaTeX has already typeset it
  function rawTitle(h3) {
    if (h3.hasAttribute("data-qs-title")) return h3.getAttribute("data-qs-title");
    var c = h3.cloneNode(true);
    c.querySelectorAll(".katex").forEach(function (k) {
      var ann = k.querySelector("annotation");
      k.replaceWith(ann ? "$" + ann.textContent + "$" : k.textContent);
    });
    return c.textContent.replace(/\s+/g, " ").trim();
  }
  function paperSlug(li, title) {
    var abs = li.querySelector(".abstract-box[id^='abs-']");
    return abs ? abs.id.slice(4) : slugify(title);
  }

  // Parse the papers out of a research-page document (live or fetched).
  function parsePapers(doc) {
    var out = [];
    doc.querySelectorAll("section.publication-content").forEach(function (sec) {
      var kind = sec.id === "published" ? "Published" : sec.id === "unpublished" ? "Preprint" : "Technical note";
      sec.querySelectorAll("ol > li").forEach(function (li) {
        var card = li.querySelector(".publication-card");
        var h3 = card && card.querySelector("h3");
        if (!h3) return;
        var raw = rawTitle(h3);
        var title = raw.replace(/\$([^$]+)\$/g, "$1");
        var venueEl = card.querySelector(".publication-venue");
        var venue = venueEl ? venueEl.textContent.replace(/\s+/g, " ").trim() : "";
        var parts = venue.split("•").map(function (x) { return x.trim(); }).filter(Boolean);
        var year = (venue.match(/(19|20)\d\d(?!.*(19|20)\d\d)/) || [""])[0];
        var where = parts[0] || kind;
        var authors = (card.getAttribute("data-authors") || "").split(",").map(function (a) { return a.trim(); })
          .filter(function (a) { return a && a.replace(/\*$/, "") !== "jrc"; }).map(niceName);
        var links = card.querySelectorAll(".publication-access a");
        var arxiv = null;
        links.forEach(function (a) { if (!arxiv && /arxiv\.org/.test(a.href)) arxiv = a.getAttribute("href"); });
        var bibEl = li.querySelector("script.bibtex");
        out.push({
          g: "Papers",
          t: title,
          s: [where === kind ? kind : where, year && where.indexOf(year) < 0 ? year : ""].filter(Boolean).join(" · ") +
             (authors.length ? " · with " + authors.join(", ") : ""),
          k: [kind, venue, authors.join(" "), "paper"].join(" "),
          slug: paperSlug(li, title),
          arxiv: arxiv,
          bib: bibEl ? dedent(bibEl.textContent) : null
        });
      });
    });
    return out;
  }

  var papers = null, papersLoading = null;
  function loadPapers() {
    if (papers) return Promise.resolve(papers);
    if (papersLoading) return papersLoading;
    if (onResearch) { papers = parsePapers(document); return Promise.resolve(papers); }
    papersLoading = fetch("/research.html")
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (html) {
        papers = html ? parsePapers(new DOMParser().parseFromString(html, "text/html")) : [];
        return papers;
      })
      .catch(function () { papers = []; return papers; });
    return papersLoading;
  }

  /* ---------------- research page: ids + jump-to-paper ---------------- */
  function tagResearchCards() {
    document.querySelectorAll("section.publication-content ol > li").forEach(function (li) {
      var card = li.querySelector(".publication-card"), h3 = card && card.querySelector("h3");
      if (!h3) return;
      // keep the raw title (before any math typesetting rewrites the heading)
      var t = rawTitle(h3);
      if (!h3.hasAttribute("data-qs-title")) h3.setAttribute("data-qs-title", t);
      if (!card.id) card.id = "paper-" + paperSlug(li, t);
    });
  }
  function flashPaper(id) {
    var el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    el.classList.remove("qs-flash"); void el.offsetWidth; el.classList.add("qs-flash");
    return true;
  }
  if (onResearch) {
    tagResearchCards();
    if (/^#paper-/.test(location.hash)) {
      var target = location.hash.slice(1);
      window.addEventListener("load", function () { setTimeout(function () { flashPaper(target); }, 150); });
    }
  }

  /* ---------------- UI ---------------- */
  var ui = null, items = [], active = 0, lastFocus = null, toastTimer = 0;

  function build() {
    var bd = document.createElement("div");
    bd.className = "qs-backdrop";
    bd.hidden = true;
    bd.innerHTML =
      '<div class="qs-panel" role="dialog" aria-modal="true" aria-label="Quick search">' +
        '<div class="qs-inputrow">' + ICON_SEARCH +
          '<input class="qs-input" type="text" role="combobox" aria-expanded="true" aria-controls="qs-list" aria-autocomplete="list" ' +
          'placeholder="Search pages, papers, coauthors…" autocomplete="off" autocapitalize="off" spellcheck="false">' +
          '<span class="qs-kbd" aria-hidden="true">esc</span>' +
        '</div>' +
        '<ul class="qs-list" id="qs-list" role="listbox" aria-label="Results"></ul>' +
        '<div class="qs-foot" aria-hidden="true">' +
          '<span><span class="qs-kbd">↑</span><span class="qs-kbd">↓</span> navigate</span>' +
          '<span><span class="qs-kbd">↵</span> open</span>' +
          '<span><span class="qs-kbd">⇧</span><span class="qs-kbd">↵</span> copy BibTeX</span>' +
          '<span class="qs-toast" role="status"></span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bd);
    ui = { bd: bd, input: bd.querySelector(".qs-input"), list: bd.querySelector(".qs-list"), toast: bd.querySelector(".qs-toast") };

    bd.addEventListener("mousedown", function (e) { if (e.target === bd) close(); });
    ui.input.addEventListener("input", function () { active = 0; render(); });
    ui.input.addEventListener("keydown", onKey);
    ui.list.addEventListener("mousemove", function (e) {
      var li = e.target.closest(".qs-item");
      if (li && +li.dataset.i !== active) { active = +li.dataset.i; mark(); }
    });
    ui.list.addEventListener("click", function (e) {
      var bib = e.target.closest(".qs-bib");
      var li = e.target.closest(".qs-item");
      if (!li) return;
      if (bib) { e.stopPropagation(); copyBib(items[+li.dataset.i]); return; }
      choose(items[+li.dataset.i]);
    });
  }

  function hl(text, tokens) {
    // escape, then wrap the first match of each token in <mark>
    var esc = text.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    tokens.forEach(function (tk) {
      if (tk.length < 2) return;
      var i = esc.toLowerCase().indexOf(tk);
      if (i >= 0 && esc.lastIndexOf("<", i) <= esc.lastIndexOf(">", i)) {
        esc = esc.slice(0, i) + "<mark>" + esc.slice(i, i + tk.length) + "</mark>" + esc.slice(i + tk.length);
      }
    });
    return esc;
  }

  var GROUPS = { Pages: 0, Papers: 1, Links: 2, Settings: 3 };
  function results(q) {
    var all = staticItems().concat(papers || []);
    var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      // default view: main pages, all papers, links, theme
      return all.filter(function (it) { return it.g !== "Pages" || !it.s || it.s === "PDF" || it.t === "Home" || it.t === "Research"; })
        .map(function (it, i) { return { it: it, i: i }; })
        .sort(function (a, b) { return GROUPS[a.it.g] - GROUPS[b.it.g] || a.i - b.i; })
        .map(function (x) { return x.it; });
    }
    var scored = [];
    all.forEach(function (it, idx) {
      var title = it.t.toLowerCase();
      var hay = (it.t + " " + it.s + " " + it.k).toLowerCase();
      if (!tokens.every(function (tk) { return hay.indexOf(tk) >= 0; })) return;
      var q0 = tokens.join(" ");
      var score = title.indexOf(q0) === 0 ? 0 : title.indexOf(q0) > 0 ? 1 :
                  tokens.every(function (tk) { return title.indexOf(tk) >= 0; }) ? 2 : 3;
      scored.push({ it: it, score: score, idx: idx });
    });
    scored.sort(function (a, b) { return GROUPS[a.it.g] - GROUPS[b.it.g] || a.score - b.score || a.idx - b.idx; });
    return scored.map(function (x) { return x.it; });
  }

  function render() {
    var q = ui.input.value.trim();
    var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    items = results(q);
    var html = "", lastGroup = null;
    if (!items.length) {
      html = '<li class="qs-empty" role="presentation">No matches' + (papers ? "" : " yet…") + "</li>";
    }
    items.forEach(function (it, i) {
      if (it.g !== lastGroup) {
        html += '<li class="qs-group" role="presentation">' + it.g + "</li>";
        lastGroup = it.g;
      }
      html += '<li class="qs-item" role="option" id="qs-opt-' + i + '" data-i="' + i + '">' +
        '<span class="qs-text"><span class="qs-title">' + hl(it.t, tokens) + "</span>" +
        (it.s ? '<span class="qs-sub">' + hl(it.s, tokens) + "</span>" : "") + "</span>" +
        (it.bib ? '<button type="button" class="qs-bib" tabindex="-1" aria-label="Copy BibTeX">BibTeX</button>' : "") +
        "</li>";
    });
    ui.list.innerHTML = html;
    if (active >= items.length) active = Math.max(0, items.length - 1);
    mark();
  }

  function mark() {
    ui.list.querySelectorAll(".qs-item").forEach(function (li) {
      var on = +li.dataset.i === active;
      li.classList.toggle("is-active", on);
      li.setAttribute("aria-selected", String(on));
      if (on) {
        ui.input.setAttribute("aria-activedescendant", li.id);
        var r = li.getBoundingClientRect(), lr = ui.list.getBoundingClientRect();
        if (r.top < lr.top + 4 || r.bottom > lr.bottom - 4) li.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function onKey(e) {
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) { e.preventDefault(); if (items.length) { active = (active + 1) % items.length; mark(); } }
    else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) { e.preventDefault(); if (items.length) { active = (active - 1 + items.length) % items.length; mark(); } }
    else if (e.key === "Enter") {
      e.preventDefault();
      var it = items[active];
      if (!it) return;
      if (e.shiftKey && it.bib) copyBib(it); else choose(it, e.metaKey || e.ctrlKey);
    }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") { e.preventDefault(); }
  }

  function toast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { ui.toast.classList.remove("is-on"); }, 1600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (err) { reject(err); }
      ta.remove();
      ui.input.focus();
    });
  }
  function copyBib(it) {
    if (!it || !it.bib) return;
    copyText(it.bib).then(function () { toast("BibTeX copied"); }, function () { toast("Couldn’t copy"); });
    // phones have no footer, so confirm on the button itself
    var btn = ui.list.querySelector('.qs-item[data-i="' + items.indexOf(it) + '"] .qs-bib');
    if (btn) { btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = "BibTeX"; }, 1400); }
  }

  function choose(it, newTab) {
    if (it.act === "theme") {
      var t = document.querySelector(".theme-toggle");
      close();
      if (t) t.click();
      return;
    }
    if (it.g === "Papers") {
      if (onResearch) { close(); flashPaper("paper-" + it.slug); return; }
      go("/research.html#paper-" + it.slug, newTab);
      return;
    }
    go(it.href, newTab || it.blank);
  }
  function go(href, newTab) {
    close();
    if (newTab) { window.open(href, "_blank", "noopener"); return; }
    var here = location.pathname.replace(/index\.html$/, "");
    var url = new URL(href, location.href);
    if (url.pathname.replace(/index\.html$/, "") === here && url.hash) {
      var el = document.getElementById(url.hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); history.replaceState(null, "", url.hash); return; }
    }
    location.href = href;
  }

  function open() {
    if (!ui) build();
    if (!ui.bd.hidden) return;
    lastFocus = document.activeElement;
    ui.bd.hidden = false;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { ui.bd.classList.add("is-open"); });
    ui.input.value = "";
    active = 0;
    render();
    ui.input.focus();
    if (!papers) loadPapers().then(function () { if (!ui.bd.hidden) render(); });
    document.querySelectorAll(".qs-trigger").forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
  }
  function close() {
    if (!ui || ui.bd.hidden) return;
    ui.bd.classList.remove("is-open");
    ui.bd.hidden = true;
    document.documentElement.style.overflow = "";
    document.querySelectorAll(".qs-trigger").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------- shortcuts ---------------- */
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && k === "k") {
      e.preventDefault();
      if (ui && !ui.bd.hidden) close(); else open();
      return;
    }
    if (k === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      var t = e.target, tag = t && t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
      e.preventDefault();
      open();
    }
  });

  /* ---------------- header buttons (header arrives asynchronously) ---------------- */
  function addButtons() {
    var bar = document.querySelector(".site-header .theme-toggle--bar");
    if (bar && !bar.parentNode.querySelector(".qs-trigger--bar")) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "qs-trigger qs-trigger--bar";
      b.setAttribute("aria-label", "Search (" + KEY_HINT + ")");
      b.setAttribute("aria-haspopup", "dialog");
      b.setAttribute("aria-expanded", "false");
      b.title = "Search  " + KEY_HINT;
      b.innerHTML = ICON_SEARCH;
      bar.parentNode.insertBefore(b, bar);
    }
    var menuItem = document.querySelector(".site-header .theme-menu-item");
    if (menuItem && !menuItem.querySelector(".qs-trigger--menu")) {
      var m = document.createElement("button");
      m.type = "button";
      m.className = "qs-trigger qs-trigger--menu";
      m.setAttribute("aria-label", "Search");
      m.setAttribute("aria-haspopup", "dialog");
      m.setAttribute("aria-expanded", "false");
      m.innerHTML = ICON_SEARCH;
      menuItem.insertBefore(m, menuItem.firstChild);
    }
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest(".qs-trigger")) { e.preventDefault(); open(); }
  });
  addButtons();
  new MutationObserver(addButtons).observe(document.body, { childList: true, subtree: true });
})();
