# Jelly Fiend — Travel Journal

An interactive map of trips — Alaska, world travel, and New Zealand — with
photo galleries, trip reports, and recommendations, filterable by layer
(Road Trip, Weekend Warrior, Hunt, Extended Vacation, Hiking/Biking
recommendations, Fishing, Food & Local recommendations).

It's a plain static site: HTML, CSS, and JavaScript, no build step, no
server required, no framework, no API keys. It uses:

- **[Leaflet.js](https://leafletjs.com/)** for the map (loaded from a CDN)
- **[CARTO dark tiles](https://carto.com/basemaps)** for the basemap (free, no key)
- A single JavaScript file (`js/trips-data.js`) as the entire "database"

## Previewing it locally

Just open `index.html` in a browser — double-click it, or drag it into a
browser tab. There's no build step and no local server needed.

(The only exception: if you ever switch to loading trip write-ups from
separate files instead of the `trips-data.js` array, browsers block that
kind of `fetch()` on `file://` pages, and you'd need to run a tiny local
server, e.g. `npx serve` or `python3 -m http.server`, from this folder.
The template as shipped doesn't need this.)

## Adding a new trip or recommendation

Open `js/trips-data.js`. Read the comment at the top of the file — it
walks through the fields. In short:

1. Copy one of the existing objects in the `TRIPS` array.
2. Give it a unique `id`.
3. Fill in `title`, `date`, `region`, `location`, `categories`, `coords`
   (`[latitude, longitude]` — right-click a spot on Google Maps to copy
   these), `summary`, and `body` (your full write-up).
4. Put your photos in `images/trips/<id>/` and list them under `photos`.
5. Save and refresh the page.

No build step, no compiling — it's just a JavaScript array.

### Categories / layers

Defined in the `CATEGORIES` object near the top of `trips-data.js`:
`roadtrip`, `weekend-warrior`, `hunt`, `extended-vacation`,
`hiking-biking`, `fishing`, `food-local`. A trip can belong to more than
one (e.g. a road trip that included a great hike: `["roadtrip",
"hiking-biking"]`). To add a brand-new layer, add an entry to
`CATEGORIES` with a `label`, `icon` (an emoji works fine), and `color`,
then use its key in a trip's `categories` array.

### Recommendations vs. trip reports

Set `"kind": "trip"` for a full narrative trip report, or `"kind":
"recommendation"` for a shorter "here's a spot I'd send you to" entry
(a recommended hike, restaurant, etc). Recommendation entries can include
an optional `recommendation` object with free-form fields like
`difficulty`, `distance`, `bestTime`, `tips` — whatever's relevant.

## Removing the sample trips

Everything currently in `trips-data.js` is placeholder content so you can
see the site working end to end. Delete the sample entries from `TRIPS`
and the matching folders under `images/trips/` whenever you're ready to
replace them with your real trips. `scripts/generate-placeholders.js` was
only used to generate the placeholder photos — you can delete the whole
`scripts/` folder too.

## Publishing with GitHub Pages

This repo is already public, so GitHub Pages hosting is free:

1. Push this project to the `jellyfiend` repo (see below).
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a
   branch," pick the `main` branch and the `/ (root)` folder, then **Save**.
4. GitHub will give you a URL, typically
   `https://jpfeens.github.io/jellyfiend/` — it can take a minute or two
   to go live the first time.

Every time you push a change (a new trip, a new photo) to `main`, the
live site updates automatically within a minute or so.

## Pushing this to GitHub

From this folder, on your own machine, with your existing `jellyfiend`
GitHub repo as the remote:

```bash
git add .
git commit -m "Initial travel journal site"
git branch -M main
git remote add origin https://github.com/jpfeens/jellyfiend.git
git push -u origin main
```

(If the remote already has commits — e.g. an auto-created README — pull
first with `git pull origin main --allow-unrelated-histories`, resolve
anything, then push.)

## File structure

```
index.html              the whole page shell
css/style.css           all styling (dark theme, responsive)
js/trips-data.js        your trip/recommendation data — edit this to add content
js/app.js                map, filtering, sidebar, lightbox logic
images/trips/<id>/       photos, one folder per trip
scripts/                 one-off helper that generated the placeholder photos
```

## Ideas for later

- A "recommendations only" toggle across the whole site
- A search box (filter by title/location text)
- A print-friendly trip report view
- Marker clustering if the number of pins gets large (the
  `leaflet.markercluster` plugin drops in easily)
