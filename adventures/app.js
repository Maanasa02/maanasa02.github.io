/* ============================================================
   Adventures — viewer logic.
   Reads ADVENTURES + SETTINGS from adventures.js. You should
   never need to edit this file to add or change an adventure.
   ============================================================ */

(function () {
  "use strict";

  var settings = window.SETTINGS || {};
  var all = (window.ADVENTURES || []).slice();

  var els = {
    intro:      document.getElementById("intro"),
    introOpen:  document.getElementById("intro-open"),
    app:        document.getElementById("app"),
    replay:     document.getElementById("replay-intro"),
    tally:      document.getElementById("tally"),
    filters:    document.getElementById("filters"),
    timeline:   document.getElementById("timeline"),
    empty:      document.getElementById("empty"),
    viewer:     document.getElementById("viewer"),
    stage:      document.getElementById("stage-media"),
    vWhen:      document.getElementById("viewer-when"),
    vTitle:     document.getElementById("viewer-title"),
    vWhere:     document.getElementById("viewer-where"),
    vNote:      document.getElementById("viewer-note"),
    vTags:      document.getElementById("viewer-tags"),
    clipstrip:  document.getElementById("clipstrip"),
    close:      document.getElementById("viewer-close"),
    prev:       document.getElementById("viewer-prev"),
    next:       document.getElementById("viewer-next")
  };

  var activeTag = null;   // null == "everything"
  var visible = [];       // adventures currently rendered, in display order
  var openIndex = -1;     // index into `visible` of the open adventure

  /* ---------------- helpers ---------------- */

  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

  // Parse "YYYY", "YYYY-MM" or "YYYY-MM-DD" without timezone drift.
  function parseDate(str) {
    var parts = String(str || "").split("-");
    var y = parseInt(parts[0], 10);
    if (isNaN(y)) return null;
    return {
      year: y,
      month: parts.length > 1 ? parseInt(parts[1], 10) : null,
      day: parts.length > 2 ? parseInt(parts[2], 10) : null,
      sort: y * 10000 + (parts.length > 1 ? parseInt(parts[1], 10) : 0) * 100
                      + (parts.length > 2 ? parseInt(parts[2], 10) : 0)
    };
  }

  function formatDate(str, opts) {
    var d = parseDate(str);
    if (!d) return "";
    if (!d.month) return String(d.year);
    var m = MONTHS[d.month - 1] || "";
    if (opts && opts.short) m = m.slice(0, 3);
    if (!d.day) return m + " " + d.year;
    return m + " " + d.day + ", " + d.year;
  }

  // A single adventure may hold one clip or many.
  function clipsOf(adv) {
    if (Array.isArray(adv.src)) return adv.src.slice();
    if (adv.src) return [adv.src];
    if (adv.embed) return [];
    return [];
  }

  function isEmbed(adv) { return !!adv.embed; }

  function text(el, value) {
    el.textContent = value || "";
    el.hidden = !value;
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  /* ---------------- static copy ---------------- */

  function applySettings() {
    document.querySelectorAll("[data-field]").forEach(function (el) {
      var key = el.getAttribute("data-field");
      if (settings[key]) el.textContent = settings[key];
    });
    if (settings.title) document.title = settings.title;
  }

  /* ---------------- ordering + grouping ---------------- */

  function sorted(list) {
    var newestFirst = settings.order !== "oldest";
    return list.slice().sort(function (a, b) {
      var av = (parseDate(a.date) || {}).sort || 0;
      var bv = (parseDate(b.date) || {}).sort || 0;
      if (av === bv) return String(a.title).localeCompare(String(b.title));
      return newestFirst ? bv - av : av - bv;
    });
  }

  function groupByYear(list) {
    var groups = [];
    var index = {};
    list.forEach(function (adv) {
      var d = parseDate(adv.date);
      var year = d ? String(d.year) : "Undated";
      if (!index[year]) {
        index[year] = { year: year, items: [] };
        groups.push(index[year]);
      }
      index[year].items.push(adv);
    });
    return groups;
  }

  /* ---------------- tally + filters ---------------- */

  function renderTally() {
    var years = {}, places = {}, clips = 0;
    all.forEach(function (adv) {
      var d = parseDate(adv.date);
      if (d) years[d.year] = 1;
      if (adv.place) places[adv.place] = 1;
      clips += Math.max(clipsOf(adv).length, isEmbed(adv) ? 1 : 0);
    });
    var bits = [];
    bits.push(all.length + (all.length === 1 ? " adventure" : " adventures"));
    if (clips) bits.push(clips + (clips === 1 ? " clip" : " clips"));
    var yc = Object.keys(years).length;
    if (yc) bits.push(yc + (yc === 1 ? " year" : " years"));
    var pc = Object.keys(places).length;
    if (pc) bits.push(pc + (pc === 1 ? " place" : " places"));
    els.tally.textContent = bits.join("  ·  ");
  }

  function renderFilters() {
    var tags = [];
    var seen = {};
    all.forEach(function (adv) {
      (adv.tags || []).forEach(function (t) {
        if (!seen[t]) { seen[t] = 1; tags.push(t); }
      });
    });
    els.filters.innerHTML = "";
    if (!tags.length) { els.filters.hidden = true; return; }
    els.filters.hidden = false;

    makeChip("Everything", null);
    tags.sort().forEach(function (t) { makeChip(t, t); });

    function makeChip(label, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = label;
      b.setAttribute("aria-pressed", String(activeTag === value));
      b.addEventListener("click", function () {
        activeTag = value;
        renderFilters();
        renderTimeline();
      });
      els.filters.appendChild(b);
    }
  }

  /* ---------------- cards ---------------- */

  function buildCard(adv, indexInVisible) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.setAttribute("aria-label", "Open: " + (adv.title || "Untitled"));

    var media = document.createElement("div");
    media.className = "card-media";

    var clips = clipsOf(adv);
    var poster = adv.poster;
    var thumbTime = typeof adv.thumbAt === "number" ? adv.thumbAt : 1;

    if (poster) {
      var img = document.createElement("img");
      img.src = poster;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", function () { fallback(media, adv); });
      media.appendChild(img);
    } else if (clips.length) {
      // No poster given: let the browser show a frame from the clip itself
      // via a media fragment, and play it muted on hover.
      var v = document.createElement("video");
      v.src = clips[0] + "#t=" + thumbTime;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.preload = "metadata";
      v.addEventListener("error", function () { fallback(media, adv); });
      // Belt and braces: if the media fragment didn't take, seek by hand once
      // the metadata lands so the card shows a frame instead of a blank box.
      v.addEventListener("loadedmetadata", function () {
        if (v.currentTime < 0.01 && v.duration > thumbTime) {
          try { v.currentTime = thumbTime; } catch (e) {}
        }
      });
      media.appendChild(v);

      btn.addEventListener("mouseenter", function () {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      });
      btn.addEventListener("mouseleave", function () {
        v.pause();
        try { v.currentTime = thumbTime; } catch (e) {}
      });
    } else {
      fallback(media, adv);
    }

    var play = document.createElement("div");
    play.className = "card-play";
    play.innerHTML = "<span>&#9654;</span>";
    media.appendChild(play);

    if (clips.length > 1) {
      var count = document.createElement("span");
      count.className = "card-count";
      count.textContent = clips.length + " clips";
      media.appendChild(count);
    }

    var body = document.createElement("div");
    body.className = "card-body";

    var h = document.createElement("h3");
    h.className = "card-title";
    h.textContent = adv.title || "Untitled";
    body.appendChild(h);

    var metaBits = [];
    if (adv.date) metaBits.push(formatDate(adv.date, { short: true }));
    if (adv.place) metaBits.push(adv.place);
    if (metaBits.length) {
      var m = document.createElement("p");
      m.className = "card-meta";
      m.textContent = metaBits.join("  ·  ");
      body.appendChild(m);
    }

    btn.appendChild(media);
    btn.appendChild(body);
    btn.addEventListener("click", function () { open(indexInVisible); });
    return btn;
  }

  function fallback(media, adv) {
    if (media.querySelector(".card-fallback")) return;
    var f = document.createElement("div");
    f.className = "card-fallback";
    f.textContent = (adv.title || "?").trim().charAt(0).toUpperCase();
    media.appendChild(f);
  }

  /* ---------------- timeline ---------------- */

  function renderTimeline() {
    var list = all.filter(function (adv) {
      return !activeTag || (adv.tags || []).indexOf(activeTag) !== -1;
    });
    visible = sorted(list);

    els.timeline.innerHTML = "";
    els.empty.hidden = visible.length > 0;

    var counter = 0;
    groupByYear(visible).forEach(function (group) {
      var section = document.createElement("section");
      section.className = "year";

      var label = document.createElement("h2");
      label.className = "year-label";
      label.textContent = group.year;
      section.appendChild(label);

      var grid = document.createElement("div");
      grid.className = "grid";
      group.items.forEach(function (adv) {
        grid.appendChild(buildCard(adv, counter));
        counter++;
      });

      section.appendChild(grid);
      els.timeline.appendChild(section);
    });
  }

  /* ---------------- viewer ---------------- */

  function open(index) {
    if (index < 0 || index >= visible.length) return;
    openIndex = index;
    var adv = visible[index];

    text(els.vWhen, formatDate(adv.date));
    els.vTitle.textContent = adv.title || "Untitled";
    text(els.vWhere, adv.place);
    text(els.vNote, adv.note);
    text(els.vTags, (adv.tags || []).join("   ·   "));

    renderStage(adv, 0);
    renderClipstrip(adv);

    els.prev.disabled = index === 0;
    els.next.disabled = index === visible.length - 1;

    els.viewer.hidden = false;
    document.body.classList.add("locked");
    els.close.focus();

    if (adv.id) history.replaceState(null, "", "#" + adv.id);
  }

  function renderStage(adv, clipIndex) {
    els.stage.innerHTML = "";

    if (isEmbed(adv)) {
      var frame = document.createElement("iframe");
      frame.src = adv.embed;
      frame.allow = "autoplay; fullscreen; picture-in-picture";
      frame.allowFullscreen = true;
      frame.title = adv.title || "Video";
      els.stage.appendChild(frame);
      return;
    }

    var clips = clipsOf(adv);
    if (!clips.length) {
      missing(adv, "No video linked to this one yet.");
      return;
    }

    var v = document.createElement("video");
    v.src = clips[clipIndex] || clips[0];
    v.controls = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.preload = "metadata";
    if (adv.poster) v.poster = adv.poster;
    v.addEventListener("error", function () {
      missing(adv, "Couldn't load " + (clips[clipIndex] || clips[0]));
    });
    els.stage.appendChild(v);

    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; controls are there */ });
  }

  function missing(adv, why) {
    els.stage.innerHTML = "";
    var d = document.createElement("div");
    d.className = "stage-missing";
    d.innerHTML = "<p>" + why + "</p><p>Drop the file into <code>adventures/videos/</code> " +
                  "and point <code>src</code> at it in <code>adventures.js</code>.</p>";
    els.stage.appendChild(d);
  }

  function renderClipstrip(adv) {
    var clips = clipsOf(adv);
    els.clipstrip.innerHTML = "";
    if (clips.length < 2) { els.clipstrip.hidden = true; return; }
    els.clipstrip.hidden = false;

    var labels = adv.clipTitles || [];
    clips.forEach(function (clip, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = labels[i] || ("Clip " + (i + 1));
      b.setAttribute("aria-pressed", String(i === 0));
      b.addEventListener("click", function () {
        renderStage(adv, i);
        Array.prototype.forEach.call(els.clipstrip.children, function (c, ci) {
          c.setAttribute("aria-pressed", String(ci === i));
        });
      });
      els.clipstrip.appendChild(b);
    });
  }

  function close() {
    els.stage.innerHTML = "";   // stops playback and frees the file handle
    els.viewer.hidden = true;
    document.body.classList.remove("locked");
    openIndex = -1;
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function step(delta) {
    var target = openIndex + delta;
    if (target < 0 || target >= visible.length) return;
    open(target);
  }

  /* ---------------- intro ---------------- */

  function showApp(remember) {
    els.intro.classList.add("gone");
    els.app.hidden = false;
    if (remember) {
      try { sessionStorage.setItem("adventures:opened", "1"); } catch (e) {}
    }
  }

  function showIntro() {
    els.intro.classList.remove("gone");
    try { sessionStorage.removeItem("adventures:opened"); } catch (e) {}
    window.scrollTo(0, 0);
  }

  /* ---------------- wiring ---------------- */

  els.introOpen.addEventListener("click", function () { showApp(true); });
  els.replay.addEventListener("click", showIntro);
  els.close.addEventListener("click", close);
  els.prev.addEventListener("click", function () { step(-1); });
  els.next.addEventListener("click", function () { step(1); });

  els.viewer.addEventListener("click", function (e) {
    if (e.target === els.viewer) close();
  });

  window.addEventListener("hashchange", function () {
    var id = window.location.hash.replace(/^#/, "");
    if (!id) { if (!els.viewer.hidden) close(); return; }
    var i = visible.findIndex(function (a) { return a.id === id; });
    if (i !== -1) { showApp(true); open(i); }
  });

  document.addEventListener("keydown", function (e) {
    if (els.viewer.hidden) return;
    if (e.key === "Escape") { close(); }
    else if (e.key === "ArrowLeft") { step(-1); }
    else if (e.key === "ArrowRight") { step(1); }
  });

  /* ---------------- boot ---------------- */

  applySettings();
  renderTally();
  renderFilters();
  renderTimeline();

  var opened = false;
  try { opened = sessionStorage.getItem("adventures:opened") === "1"; } catch (e) {}

  // A shared deep link (#some-adventure) should skip the title card.
  var hash = window.location.hash.replace(/^#/, "");
  if (hash) {
    var i = visible.findIndex(function (a) { return a.id === hash; });
    if (i !== -1) { showApp(true); open(i); opened = true; }
  }
  if (opened) showApp(false);
})();
