/* ==========================================================================
   Math typesetting (KaTeX)
   Renders LaTeX written as $...$ or \(...\) (inline) and $$...$$ or \[...\]
   (display) inside the page's main content. KaTeX is fetched only when the
   page actually contains math, so pages without any pay nothing.
   Files are pinned to one version and checked against integrity hashes.
   ========================================================================== */
(function () {
  "use strict";

  var CDN = "https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/";
  var FILES = {
    css:  ["katex.min.css", "sha384-WwGtaC6ywCHxA5cstpj/3+xIZvTez8dq2IcBQaXRkenHZ7FVVq1ZROtURwfbtTlG"],
    core: ["katex.min.js", "sha384-a1WQdjRj162i159OYq041X6I4K8NenkrI09LlPmiHg0YOb7CR+wJOraXwK9abpnE"],
    auto: ["contrib/auto-render.min.js", "sha384-bjyGPfbij8/NDKJhSGZNP/khQVgtHUE5exjm4Ydllo42FwIgYsdLO2lXGmRBf5Mz"]
  };
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, PRE: 1, CODE: 1 };
  var MATH = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/;

  function hasMath(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        for (var p = n.parentNode; p && p !== root; p = p.parentNode) if (SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    for (var n = w.nextNode(); n; n = w.nextNode()) if (MATH.test(n.nodeValue)) return true;
    return false;
  }

  function load(tag, f) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement(tag);
      if (tag === "link") { el.rel = "stylesheet"; el.href = CDN + f[0]; }
      else { el.src = CDN + f[0]; el.async = false; }
      el.integrity = f[1];
      el.crossOrigin = "anonymous";
      el.onload = resolve; el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  function run() {
    var root = document.querySelector("main") || document.body;
    if (!hasMath(root)) return;
    load("link", FILES.css);
    var st = document.createElement("style");             // KaTeX's default (1.21em) runs large beside body text
    st.textContent = ".katex { font-size: 1.08em; }";
    document.head.appendChild(st);
    load("script", FILES.core)
      .then(function () { return load("script", FILES.auto); })
      .then(function () {
        window.renderMathInElement(root, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false }
          ],
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
          throwOnError: false
        });
      })
      .catch(function () { /* offline or blocked: the LaTeX source stays readable */ });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
