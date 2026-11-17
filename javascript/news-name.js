/* Homepage: "What's in my name?" dropdown, name pronunciations, News "Show older". */
(function () {
  "use strict";

  /* ---- What's in my name? ---- */
  var btn = document.querySelector(".name-btn");
  var box = document.getElementById("name-box");
  if (btn && box) {
    var setOpen = function (open) {
      box.classList.toggle("is-open", open);
      box.setAttribute("aria-hidden", String(!open));
      box.inert = !open;
      btn.setAttribute("aria-expanded", String(open));
    };
    btn.addEventListener("click", function () {
      setOpen(!box.classList.contains("is-open"));
    });
    document.addEventListener("click", function (e) {
      if (box.classList.contains("is-open") && !box.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    }, true);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) { setOpen(false); btn.focus(); }
    });
  }

  /* ---- IPA beside the first name: slides out to the right (or wraps below if there's no room) ---- */
  var ipaBtn = document.querySelector(".ipa-btn");
  var ipa = ipaBtn && document.getElementById(ipaBtn.getAttribute("aria-controls"));
  if (ipaBtn && ipa) {
    ipaBtn.addEventListener("click", function () {
      var open = !ipa.classList.contains("is-open");
      ipa.classList.toggle("is-open", open);
      ipa.setAttribute("aria-hidden", String(!open));
      ipa.inert = !open;
      ipaBtn.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---- pronunciation: a "Listen" pill beside each name, playing the clip right after it ---- */
  var sayBtns = document.querySelectorAll(".say-btn");
  Array.prototype.forEach.call(sayBtns, function (sayBtn) {
    var say = sayBtn.nextElementSibling;
    if (!say || say.tagName !== "AUDIO") return;
    sayBtn.addEventListener("click", function () {
      if (!say.paused) { say.pause(); say.currentTime = 0; return; }
      // only one clip at a time
      document.querySelectorAll(".say-audio").forEach(function (other) {
        if (other !== say && !other.paused) { other.pause(); other.currentTime = 0; }
      });
      say.currentTime = 0;
      var p = say.play();
      if (p && p.catch) p.catch(function () {});
    });
    say.addEventListener("play", function () { sayBtn.classList.add("is-playing"); });
    say.addEventListener("ended", function () { sayBtn.classList.remove("is-playing"); });
    say.addEventListener("pause", function () { sayBtn.classList.remove("is-playing"); });
  });


  /* ---- News box: fade the bottom edge while there is more to scroll ---- */
  var news = document.querySelector(".news-list");
  if (news) {
    var update = function () {
      news.classList.toggle("has-more", news.scrollTop + news.clientHeight < news.scrollHeight - 4);
    };
    news.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }
})();
