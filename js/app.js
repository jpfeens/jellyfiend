/*
 * app.js — map init, hashtag filtering, sidebar rendering.
 * Reads KIND_STYLES / MAP_CONFIG / REGIONS / TRIPS from js/trips-data.js.
 */
(function () {
  "use strict";

  var FILTER_STORAGE_KEY = "jellyfiend:activeTags";

  var map = null; // created lazily — see initMap() — Leaflet can't measure
                  // a container that's still display:none on the splash screen
  var markerRecords = []; // { trip, marker, tags }
  var allTags = collectAllTags();
  var activeTags = loadActiveTags();
  var currentRegion = null;

  function collectAllTags() {
    var set = new Set();
    TRIPS.forEach(function (trip) {
      (trip.tags || []).forEach(function (t) { set.add(t); });
    });
    return Array.from(set).sort();
  }

  // ---------------------------------------------------------------
  // "Life is for..." stacked words (splash hero, photo-fill text)
  // ---------------------------------------------------------------
  (function initLifeWords() {
    var container = document.getElementById("life-words");
    if (!container || typeof LIFE_HERO === "undefined") return;

    var pool = LIFE_HERO.words.slice();
    var visibleCount = Math.min(LIFE_HERO.visibleCount || 5, pool.length);
    var montage = LIFE_HERO.montageImage;

    // Shuffle a copy, take the first N as the initial visible set.
    var shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
    var visibleWords = shuffled.slice(0, visibleCount);

    var wordEls = visibleWords.map(function (word, i) {
      var el = document.createElement("span");
      el.className = "life-word";
      applyWord(el, word, i);
      container.appendChild(el);
      return el;
    });

    function applyWord(el, word, slotIndex) {
      el.textContent = word;
      if (montage) {
        el.style.backgroundImage = "url('" + montage + "')";
        // Give each slot/word a different pan position into the montage
        // so the stacked words don't all show the exact same crop.
        var seed = hashString(word + slotIndex);
        el.style.backgroundPosition = (seed % 100) + "% " + ((seed * 7) % 100) + "%";
      }
    }

    function hashString(str) {
      var h = 0;
      for (var i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
      }
      return h;
    }

    // Only rotate if there are more words in the pool than we're
    // showing — otherwise there's nothing to swap in.
    if (pool.length > visibleCount) {
      setInterval(function () {
        var slotIndex = Math.floor(Math.random() * wordEls.length);
        var hidden = pool.filter(function (w) { return visibleWords.indexOf(w) === -1; });
        if (!hidden.length) return;
        var nextWord = hidden[Math.floor(Math.random() * hidden.length)];
        var el = wordEls[slotIndex];

        el.classList.add("is-fading");
        setTimeout(function () {
          visibleWords[slotIndex] = nextWord;
          applyWord(el, nextWord, slotIndex);
          el.classList.remove("is-fading");
        }, 400); // matches the .life-word opacity transition duration
      }, LIFE_HERO.rotateMs || 4000);
    }
  })();

  // ---------------------------------------------------------------
  // Map init (called once, the first time a location card is picked)
  // ---------------------------------------------------------------
  function initMap() {
    if (map) return;

    map = L.map("map", { zoomControl: true, worldCopyJump: true });

    L.tileLayer(
      "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}{r}?access_token=" + MAP_CONFIG.mapboxToken,
      {
        attribution:
          '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        id: MAP_CONFIG.mapboxStyle,
        tileSize: 512,
        zoomOffset: -1,
        detectRetina: true,
        maxZoom: 22
      }
    ).addTo(map);

    TRIPS.forEach(function (trip) {
      var style = KIND_STYLES[trip.kind] || KIND_STYLES.trip;

      var icon = L.divIcon({
        className: "",
        html: '<div class="trip-marker">' + style.icon + "</div>",
        iconSize: [30, 30],
        popupAnchor: [0, -12]
      });

      var marker = L.marker(trip.coords, { icon: icon, title: trip.title });
      marker.bindTooltip(trip.title, { direction: "top", offset: [0, -10] });
      marker.on("click", function () {
        openSidebar(trip);
      });

      var record = { trip: trip, marker: marker, tags: trip.tags || [], routeLayers: [] };
      markerRecords.push(record);

      if (trip.route && trip.route.length) {
        buildRouteLayers(trip, style, record);
      }

      if (trip.stops && trip.stops.length) {
        buildStopMarkers(trip, record);
      }
    });
  }

  // ---------------------------------------------------------------
  // Stop markers — small pins for individual stops along a trip's
  // route (camps, viewpoints, towns...). Clicking one opens a
  // lightweight Leaflet popup right at that pin (blurb + photos, if
  // any) rather than the full trip sidebar. Tracked in the same
  // record.routeLayers list so they show/hide with region & tag
  // filters exactly like everything else for the trip.
  // ---------------------------------------------------------------
  function buildStopMarkers(trip, record) {
    trip.stops.forEach(function (stop) {
      var icon = L.divIcon({
        className: "",
        html: '<div class="stop-marker"></div>',
        iconSize: [14, 14]
      });

      var stopMarker = L.marker(stop.coords, { icon: icon, title: stop.label });
      stopMarker.bindTooltip(stop.label, { direction: "top", offset: [0, -6] });
      stopMarker.bindPopup(renderStopPopup(stop), { maxWidth: 260 });
      stopMarker.on("popupopen", function (e) {
        e.popup.getElement().querySelectorAll("[data-photo-src]").forEach(function (img) {
          img.addEventListener("click", function () {
            openLightbox(img.dataset.photoSrc, img.dataset.photoCaption || "");
          });
        });
      });

      addRouteLayer(record, stopMarker);
    });
  }

  function renderStopPopup(stop) {
    var photos = (stop.photos || [])
      .map(function (p) {
        return (
          '<img src="' + p.src + '" alt="' + escapeHtml(p.caption || stop.label) +
          '" loading="lazy" data-photo-src="' + p.src +
          '" data-photo-caption="' + escapeHtml(p.caption || "") + '">'
        );
      })
      .join("");

    return (
      '<div class="stop-popup">' +
      "<h3>" + escapeHtml(stop.label) + "</h3>" +
      (stop.blurb ? "<p>" + escapeHtml(stop.blurb) + "</p>" : "") +
      (photos ? '<div class="stop-popup__photos">' + photos + "</div>" : "") +
      "</div>"
    );
  }

  // ---------------------------------------------------------------
  // Trip routes — each trip's `route` is a list of "legs":
  //   { mode: "drive", through: [[lat,lng], ...] } — snapped to real
  //     roads via the Mapbox Directions API (falls back to a straight
  //     dashed line while that loads, or if the request fails)
  //   { mode: "ferry", through: [[lat,lng], [lat,lng]] } — drawn as a
  //     dashed line with a boat marker at the midpoint, since there's
  //     no road for a sea crossing
  // Layers are tracked per-trip in record.routeLayers so they can be
  // shown/hidden by applyFilters() exactly like markers are.
  // ---------------------------------------------------------------
  function buildRouteLayers(trip, style, record) {
    trip.route.forEach(function (leg) {
      if (leg.mode === "ferry") {
        addRouteLayer(record, L.polyline(leg.through, {
          color: "#5aa7e0",
          weight: 3,
          opacity: 0.85,
          dashArray: "2 10"
        }));

        var start = leg.through[0];
        var end = leg.through[leg.through.length - 1];
        var mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
        var boatIcon = L.divIcon({
          className: "",
          html: '<div class="ferry-marker">⛴️</div>',
          iconSize: [26, 26]
        });
        var boatMarker = L.marker(mid, { icon: boatIcon, title: "Ferry crossing" });
        boatMarker.bindTooltip("Ferry crossing", { direction: "top", offset: [0, -8] });
        addRouteLayer(record, boatMarker);
        return;
      }

      // Drive leg — show a straight dashed line immediately, then swap
      // in the real road-snapped path once (if) the Directions API
      // responds. Keeps the map useful even if the request fails.
      var fallback = L.polyline(leg.through, {
        color: style.color,
        weight: 3,
        opacity: 0.5,
        dashArray: "6 6"
      });
      addRouteLayer(record, fallback);

      fetchDrivingRoute(leg.through)
        .then(function (roadCoords) {
          removeRouteLayer(record, fallback);
          addRouteLayer(record, L.polyline(roadCoords, {
            color: style.color,
            weight: 3,
            opacity: 0.8
          }));
        })
        .catch(function () {
          /* keep the straight-line fallback already on the map */
        });
    });
  }

  // Mapbox Directions API — snaps a chain of waypoints to real roads.
  // Accepts up to 25 coordinates per request (driving profile).
  function fetchDrivingRoute(waypoints) {
    var coordStr = waypoints
      .map(function (c) { return c[1] + "," + c[0]; }) // Mapbox wants lng,lat
      .join(";");
    var url =
      "https://api.mapbox.com/directions/v5/mapbox/driving/" +
      coordStr +
      "?geometries=geojson&overview=full&access_token=" +
      MAP_CONFIG.mapboxToken;

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Directions API error " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data.routes || !data.routes.length) throw new Error("No route returned");
        return data.routes[0].geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
      });
  }

  function addRouteLayer(record, layer) {
    record.routeLayers.push(layer);
    if (isVisible(record)) layer.addTo(map);
  }

  function removeRouteLayer(record, layer) {
    var idx = record.routeLayers.indexOf(layer);
    if (idx !== -1) record.routeLayers.splice(idx, 1);
    if (map.hasLayer(layer)) map.removeLayer(layer);
  }

  function isVisible(record) {
    var matchesRegion = !currentRegion || record.trip.region === currentRegion;
    var matchesTags = record.tags.some(function (t) { return activeTags.has(t); });
    return matchesRegion && matchesTags;
  }

  // ---------------------------------------------------------------
  // Splash screen — one card per region in REGIONS
  // ---------------------------------------------------------------
  var splashCards = document.getElementById("splash-cards");

  Object.keys(REGIONS).forEach(function (regionName) {
    var region = REGIONS[regionName];
    var count = TRIPS.filter(function (t) { return t.region === regionName; }).length;

    var card = document.createElement("button");
    card.type = "button";
    card.className = "location-card";
    card.style.setProperty("--card-accent", region.color || "var(--accent)");
    card.innerHTML =
      '<span class="location-card__accent"></span>' +
      "<h3>" + escapeHtml(regionName) + "</h3>" +
      "<p>" + escapeHtml(region.blurb || "") + "</p>" +
      '<span class="location-card__count">' + count + (count === 1 ? " entry" : " entries") + "</span>";

    card.addEventListener("click", function () {
      goToRegion(regionName);
    });

    splashCards.appendChild(card);
  });

  function goToRegion(regionName) {
    var region = REGIONS[regionName];
    if (!region) return;

    initMap();
    currentRegion = regionName;
    document.body.classList.remove("view-splash");
    document.body.classList.add("view-map");

    // The map container was hidden (display:none) until now, so Leaflet
    // needs both a resize check and an explicit view set.
    map.invalidateSize();
    map.setView(region.center, region.zoom);
    applyFilters();
  }

  document.getElementById("back-to-splash").addEventListener("click", function () {
    document.body.classList.remove("view-map");
    document.body.classList.add("view-splash");
    closeSidebar();
  });

  // ---------------------------------------------------------------
  // Hashtag bar — one chip per unique tag used across all trips.
  // Freeform: there's no fixed list to maintain, it's derived from
  // whatever tags show up in trips-data.js.
  // ---------------------------------------------------------------
  var tagBar = document.getElementById("tag-bar");

  function renderTagBar() {
    tagBar.innerHTML = "";

    allTags.forEach(function (tag) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "hashtag hashtag--toggle";
      chip.textContent = "#" + tag;
      chip.setAttribute("aria-pressed", activeTags.has(tag) ? "true" : "false");
      chip.classList.toggle("is-active", activeTags.has(tag));

      chip.addEventListener("click", function () {
        if (activeTags.has(tag)) {
          activeTags.delete(tag);
        } else {
          activeTags.add(tag);
        }
        saveActiveTags();
        chip.classList.toggle("is-active", activeTags.has(tag));
        chip.setAttribute("aria-pressed", activeTags.has(tag) ? "true" : "false");
        applyFilters();
      });

      tagBar.appendChild(chip);
    });

    var allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "tag-bar__action";
    allBtn.textContent = "All";
    allBtn.addEventListener("click", function () {
      allTags.forEach(function (t) { activeTags.add(t); });
      saveActiveTags();
      renderTagBar();
      applyFilters();
    });

    var noneBtn = document.createElement("button");
    noneBtn.type = "button";
    noneBtn.className = "tag-bar__action";
    noneBtn.textContent = "None";
    noneBtn.addEventListener("click", function () {
      activeTags.clear();
      saveActiveTags();
      renderTagBar();
      applyFilters();
    });

    tagBar.appendChild(allBtn);
    tagBar.appendChild(noneBtn);
  }

  renderTagBar();

  function applyFilters() {
    if (!map) return;
    markerRecords.forEach(function (rec) {
      var visible = isVisible(rec);

      var onMap = map.hasLayer(rec.marker);
      if (visible && !onMap) rec.marker.addTo(map);
      if (!visible && onMap) map.removeLayer(rec.marker);

      rec.routeLayers.forEach(function (layer) {
        var layerOnMap = map.hasLayer(layer);
        if (visible && !layerOnMap) layer.addTo(map);
        if (!visible && layerOnMap) map.removeLayer(layer);
      });
    });
  }

  function loadActiveTags() {
    try {
      var raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (raw) {
        // Only keep tags that still actually exist (data may have changed).
        var saved = JSON.parse(raw).filter(function (t) { return allTags.indexOf(t) !== -1; });
        return new Set(saved);
      }
    } catch (e) { /* ignore, e.g. storage disabled */ }
    return new Set(allTags);
  }

  function saveActiveTags() {
    try {
      window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(Array.from(activeTags)));
    } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------
  // Region quick-nav (visible once already in map view, for switching
  // between locations without going back to the splash screen)
  // ---------------------------------------------------------------
  document.querySelectorAll(".region-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      goToRegion(btn.dataset.region);
    });
  });

  // ---------------------------------------------------------------
  // Sidebar
  // ---------------------------------------------------------------
  var sidebar = document.getElementById("sidebar");
  var sidebarContent = document.getElementById("sidebar-content");

  document.getElementById("sidebar-close").addEventListener("click", closeSidebar);

  function closeSidebar() {
    sidebar.classList.remove("is-open");
  }

  function openSidebar(trip) {
    sidebarContent.innerHTML = renderTrip(trip);
    sidebar.classList.add("is-open");

    sidebarContent.querySelectorAll("[data-photo-src]").forEach(function (img) {
      img.addEventListener("click", function () {
        openLightbox(img.dataset.photoSrc, img.dataset.photoCaption || "");
      });
    });
  }

  function renderTrip(trip) {
    var badges = (trip.tags || [])
      .map(function (tag) {
        return '<span class="hashtag hashtag--static">#' + escapeHtml(tag) + "</span>";
      })
      .join("");

    var metaLine = [trip.location, trip.date].filter(Boolean).join(" · ");

    var recFacts = "";
    if (trip.kind === "recommendation" && trip.recommendation) {
      var rows = "";
      Object.keys(trip.recommendation).forEach(function (key) {
        var label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
        rows +=
          "<dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(trip.recommendation[key]) + "</dd>";
      });
      recFacts = '<dl class="rec-facts">' + rows + "</dl>";
    }

    var photos = (trip.photos || [])
      .map(function (p) {
        return (
          '<img src="' +
          p.src +
          '" alt="' +
          escapeHtml(p.caption || trip.title) +
          '" loading="lazy" data-photo-src="' +
          p.src +
          '" data-photo-caption="' +
          escapeHtml(p.caption || "") +
          '">'
        );
      })
      .join("");

    return (
      "<h2>" +
      escapeHtml(trip.title) +
      "</h2>" +
      '<p class="sidebar__meta">' +
      escapeHtml(metaLine) +
      "</p>" +
      '<div class="sidebar__badges">' +
      badges +
      "</div>" +
      (trip.summary ? '<p class="sidebar__summary">' + escapeHtml(trip.summary) + "</p>" : "") +
      recFacts +
      (photos ? '<div class="sidebar__photos">' + photos + "</div>" : "") +
      '<div class="sidebar__body">' +
      miniMarkdown(trip.body || "") +
      "</div>"
    );
  }

  // ---------------------------------------------------------------
  // Lightbox
  // ---------------------------------------------------------------
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCaption = document.getElementById("lightbox-caption");

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeLightbox();
      closeSidebar();
    }
  });

  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxCaption.textContent = caption || "";
    lightbox.hidden = false;
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
  }

  // ---------------------------------------------------------------
  // Tiny markdown-ish renderer: **bold**, *italic*, blank-line
  // paragraphs, and "- " bullet lists. No external dependency.
  // ---------------------------------------------------------------
  function miniMarkdown(text) {
    var escaped = escapeHtml(text);
    var blocks = escaped.split(/\n\s*\n/);

    return blocks
      .map(function (block) {
        var lines = block.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
        var isList = lines.length > 0 && lines.every(function (l) { return l.indexOf("- ") === 0; });

        if (isList) {
          var items = lines.map(function (l) { return "<li>" + inline(l.slice(2)) + "</li>"; }).join("");
          return "<ul>" + items + "</ul>";
        }
        return "<p>" + inline(lines.join("<br>")) + "</p>";
      })
      .join("");
  }

  function inline(str) {
    return str
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
