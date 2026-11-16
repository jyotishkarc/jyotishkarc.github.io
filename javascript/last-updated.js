/* Adds "Last updated: <date>" to the footer, using the date of the latest
   commit that changed this page on GitHub. Cached for the browser session;
   if GitHub can't be reached, nothing is shown. */
(function () {
  "use strict";
  var REPO = "jyotishkarc/jyotishkarc.github.io";
  var path = location.pathname.replace(/^\/+/, "");
  if (!path || path.slice(-1) === "/") path += "index.html";
  var KEY = "last-updated:" + path;

  function show(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return;
    var text = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    var tries = 0;
    (function place() {
      var footer = document.querySelector("footer");
      if (!footer) { if (tries++ < 40) setTimeout(place, 150); return; }
      if (footer.querySelector(".last-updated")) return;
      var el = document.createElement("small");
      el.className = "last-updated";
      el.innerHTML = 'Last updated: <time datetime="' + d.toISOString().slice(0, 10) + '">' + text + "</time>";
      footer.appendChild(el);
    })();
  }

  var cached = null;
  try { cached = sessionStorage.getItem(KEY); } catch (e) {}
  if (cached) { show(cached); return; }

  fetch("https://api.github.com/repos/" + REPO + "/commits?per_page=1&path=" + encodeURIComponent(path))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (list) {
      var iso = list && list[0] && list[0].commit && list[0].commit.committer && list[0].commit.committer.date;
      if (!iso) return;
      try { sessionStorage.setItem(KEY, iso); } catch (e) {}
      show(iso);
    })
    .catch(function () {});
})();
