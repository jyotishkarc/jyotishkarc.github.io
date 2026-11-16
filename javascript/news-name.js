/* Homepage: "What's in my name?" dropdown, optional name recording, News "Show older". */
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

  /* ---- recording: the Listen button appears only once assets/audio/name.mp3 exists ---- */
  var audio = document.querySelector(".name-audio");
  var play = document.querySelector(".name-play");
  if (audio && play) {
    fetch(audio.getAttribute("src"), { method: "HEAD" })
      .then(function (r) { if (r.ok) play.hidden = false; })
      .catch(function () {});
    play.addEventListener("click", function () {
      audio.currentTime = 0;
      audio.play();
    });
    audio.addEventListener("play", function () { play.classList.add("is-playing"); });
    audio.addEventListener("ended", function () { play.classList.remove("is-playing"); });
    audio.addEventListener("pause", function () { play.classList.remove("is-playing"); });
  }


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
