/*
 * app.js — map init, filtering, sidebar rendering.
 * Reads CATEGORIES / REGIONS / TRIPS from js/trips-data.js.
 */
(function () {
  "use strict";

  var FILTER_STORAGE_KEY = "jellyfiend:activeCategories";

  // ---------------------------------------------------------------
  // Map init
  // ---------------------------------------------------------------
  var map = L.map("map", { zoomControl: true, worldCopyJump: true })
    .setView(REGIONS["New Zealand"].center, REGIONS["New Zealand"].zoom);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19
    }
  ).addTo(map);

  // ---------------------------------------------------------------
  // Build markers
  // ---------------------------------------------------------------
  var activeCategories = loadActiveCategories();
  var markerRecords = []; // { trip, marker, categories }

  TRIPS.forEach(function (trip) {
    var primaryCat = trip.categories[0];
    var meta = CATEGORIES[primaryCat] || { color: "#999", icon: "📍" };

    var icon = L.divIcon({
      className: "",
      html:
        '<div class="trip-marker" style="background:' +
        meta.color +
        '">' +
        meta.icon +
        "</div>",
      iconSize: [30, 30],
      popupAnchor: [0, -12]
    });

    var marker = L.marker(trip.coords, { icon: icon, title: trip.title });
    marker.bindTooltip(trip.title, { direction: "top", offset: [0, -10] });
    marker.on("click", function () {
      openSidebar(trip);
    });

    if (trip.route && trip.route.length > 1) {
      L.polyline(trip.route, {
        color: meta.color,
        weight: 3,
        opacity: 0.7,
        dashArray: "6 6"
      }).addTo(map);
    }

    markerRecords.push({ trip: trip, marker: marker, categories: trip.categories });
  });

  applyFilters();

  // ---------------------------------------------------------------
  // Legend
  // ---------------------------------------------------------------
  var legendList = document.getElementById("legend-list");

  Object.keys(CATEGORIES).forEach(function (catId) {
    var meta = CATEGORIES[catId];
    var li = document.createElement("li");
    li.className = "legend__item";

    var checked = activeCategories.has(catId) ? "checked" : "";
    li.innerHTML =
      '<input type="checkbox" id="cat-' +
      catId +
      '" ' +
      checked +
      ' />' +
      '<span class="legend__swatch" style="background:' +
      meta.color +
      '">' +
      meta.icon +
      "</span>" +
      '<label class="legend__label" for="cat-' +
      catId +
      '">' +
      meta.label +
      "</label>";

    legendList.appendChild(li);

    li.querySelector("input").addEventListener("change", function (e) {
      if (e.target.checked) {
        activeCategories.add(catId);
      } else {
        activeCategories.delete(catId);
      }
      saveActiveCategories();
      applyFilters();
    });
  });

  document.getElementById("legend-all").addEventListener("click", function () {
    Object.keys(CATEGORIES).forEach(function (c) { activeCategories.add(c); });
    syncLegendCheckboxes();
    saveActiveCategories();
    applyFilters();
  });

  document.getElementById("legend-none").addEventListener("click", function () {
    activeCategories.clear();
    syncLegendCheckboxes();
    saveActiveCategories();
    applyFilters();
  });

  function syncLegendCheckboxes() {
    Object.keys(CATEGORIES).forEach(function (catId) {
      var box = document.getElementById("cat-" + catId);
      if (box) box.checked = activeCategories.has(catId);
    });
  }

  function applyFilters() {
    markerRecords.forEach(function (rec) {
      var visible = rec.categories.some(function (c) { return activeCategories.has(c); });
      var onMap = map.hasLayer(rec.marker);
      if (visible && !onMap) rec.marker.addTo(map);
      if (!visible && onMap) map.removeLayer(rec.marker);
    });
  }

  function loadActiveCategories() {
    try {
      var raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) { /* ignore, e.g. storage disabled */ }
    return new Set(Object.keys(CATEGORIES));
  }

  function saveActiveCategories() {
    try {
      window.localStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(Array.from(activeCategories))
      );
    } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------
  // Region quick-nav
  // ---------------------------------------------------------------
  document.querySelectorAll(".region-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var region = REGIONS[btn.dataset.region];
      if (region) map.flyTo(region.center, region.zoom);
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
    var badges = trip.categories
      .map(function (catId) {
        var meta = CATEGORIES[catId];
        if (!meta) return "";
        return (
          '<span class="badge"><span class="badge__dot" style="background:' +
          meta.color +
          '"></span>' +
          meta.icon +
          " " +
          meta.label +
          "</span>"
        );
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
