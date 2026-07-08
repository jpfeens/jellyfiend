# Jelly Fiend — Travel Journal

Landing on a splash screen with one card per location (Alaska, World, New
Zealand) — pick one and it drops you into an interactive map of trips there,
with photo galleries, trip reports, and recommendations, filterable by layer
(Road Trip, Weekend Warrior, Hunt, Extended Vacation, Hiking/Biking
recommendations, Fishing, Food & Local recommendations). A "← All locations"
link in the header takes you back to the splash screen, and the region
buttons let you jump directly between locations without going back.

It's a plain static site: HTML, CSS, and JavaScript, no build step, no
server required, no framework. It uses:

- **[Leaflet.js](https://leafletjs.com/)** for the map (loaded from a CDN)
- **[Mapbox](https://www.mapbox.com/)** for the basemap tiles — requires a free
  Mapbox account and a public access token (already set up — see `MAP_CONFIG`
  in `js/trips-data.js`; free tier is generous for a personal site)
- A single JavaScript file (`js/trips-data.js`) as the entire "database"

### About the Mapbox token

`MAP_CONFIG.mapboxToken` in `trips-data.js` holds a Mapbox *public* token —
these are designed to be embedded in front-end code (that's the whole point
of the "public" vs. "secret" token distinction), so committing it to this
public repo is expected and fine. Two things worth doing once the site is
live, from your Mapbox account's token settings:

- **Restrict the token to your domain** (`jpfeens.github.io`) so nobody else
  can use it and burn through your free tier.
- **Keep an eye on usage** on your Mapbox dashboard if you're ever curious —
  a personal site like this is nowhere near the free tier limits.

To change the whole map's look, edit `mapboxStyle` in `MAP_CONFIG` — see the
comment above it in `trips-data.js` for a few built-in options (streets,
outdoors/terrain, satellite).

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
3. Fill in `title`, `date`, `region`, `location`, `tags`, `coords`
   (`[latitude, longitude]` — right-click a spot on Google Maps to copy
   these), `summary`, and `body` (your full write-up).
4. Put your photos in `images/trips/<id>/` and list them under `photos`.
5. Save and refresh the page.

No build step, no compiling — it's just a JavaScript array.

### Tags / hashtags

There's no fixed list to maintain — `tags` on a trip is just an array of
whatever freeform hashtags make sense (lowercase, hyphenate multi-word
ones: `"roadtrip"`, `"bear-encounter"`, `"alaska2019"`). A trip can have
as many as you want (e.g. a road trip that included a great hike:
`["roadtrip", "hiking-biking"]`). Every unique tag used across all trips
automatically shows up as a clickable `#tag` chip in the hashtag bar
above the map — add a brand-new tag to any trip and it just appears
there next time you load the page, no separate config to touch.

### Recommendations vs. trip reports

Set `"kind": "trip"` for a full narrative trip report, or `"kind":
"recommendation"` for a shorter "here's a spot I'd send you to" entry
(a recommended hike, restaurant, etc). Recommendation entries can include
an optional `recommendation` object with free-form fields like
`difficulty`, `distance`, `bestTime`, `tips` — whatever's relevant.

### Regions / splash-screen cards

Defined in the `REGIONS` object in `trips-data.js` (currently `Alaska`,
`World`, `New Zealand`). Each one becomes a card on the splash screen —
`blurb` is the one-line teaser text, `color` is the card's accent color,
and `center`/`zoom` control where the map lands when that card is picked.
The "entries" count on each card is computed automatically from how many
trips in `TRIPS` have that `region`. To add a new location (say you start
traveling somewhere new), add an entry to `REGIONS` and start tagging
trips with that region — a new card appears automatically, no HTML/CSS
changes needed.

### Color theme

The palette is black / gray / sage / salmon, defined as CSS custom
properties at the top of `css/style.css`: `--accent` (salmon, the primary
interactive color — active hashtags, buttons, links), `--sage` (secondary
accent), and `--gray-warm` (used for the World card). Change any of these
in one place to retheme the whole site.

### The "Life is for..." splash words

Defined in `LIFE_HERO` near the top of `trips-data.js` — a `words` pool,
how many show at once (`visibleCount`), how often one rotates out
(`rotateMs`), and which image the text is "cut out" of (`montageImage`).
Add as many words to the pool as you want, any time — nothing else needs
to change. If the pool is bigger than `visibleCount`, the extra words
rotate in and out on their own.

The words are filled with a photo montage using a CSS trick
(`background-clip: text`) — the montage image shows through the letter
shapes. `images/montage.jpg` is a grid collage built from whatever
photos currently exist under `images/trips/`. Once you've uploaded real
trip photos, rebuild it with:

```
node scripts/build-montage.js
```

(You'll need Node installed locally for this one script — everything
else about the site needs zero tooling.) It grabs one photo from each
trip folder by default; edit `scripts/build-montage.js` to hand-pick
specific photos instead if you'd rather choose exactly which ones go
into the collage.

### Fonts

Google Fonts (Anton, Fraunces, Inter, Poppins) are loaded via the
`<link>` tag in `index.html` — free for any use, no setup needed.

The "Life is for..." lead text uses **Chandrawinata**, a script font
that's self-hosted from `fonts/` (via `@font-face` in `style.css`)
instead of Google Fonts, because it isn't distributed there. It's the
**free, personal-use-only** version from
[dafont.com](https://www.dafont.com/chandrawinata.font) — fine for a
personal, non-monetized site like this one, but if this site ever adds
ads, sponsorships, or anything commercial, a commercial license would
need to be purchased (available via Font Bundles or Creative Market)
and the files in `fonts/` swapped for the licensed versions.

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
css/style.css           all styling (color theme, splash hero, dark theme, responsive)
js/trips-data.js        your trip/recommendation data, tags, regions, life-hero words
js/app.js                map, hashtag filtering, sidebar, splash hero, lightbox logic
images/trips/<id>/       photos, one folder per trip
images/montage.jpg       collage behind the splash-screen words — rebuild with the script below
fonts/                   self-hosted Chandrawinata font (personal-use license, see Fonts section)
scripts/generate-placeholders.js  one-off helper that made the placeholder photos
scripts/build-montage.js         rebuilds images/montage.jpg from current trip photos
```

## Ideas for later

- A "recommendations only" toggle across the whole site
- A search box (filter by title/location text)
- A print-friendly trip report view
- Marker clustering if the number of pins gets large (the
  `leaflet.markercluster` plugin drops in easily)
