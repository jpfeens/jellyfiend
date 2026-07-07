/*
 * trips-data.js
 * ---------------------------------------------------------------------
 * This file is the entire "database" for the site. There is no build
 * step and no server — the map just reads this array directly.
 *
 * TO ADD A NEW TRIP OR RECOMMENDATION:
 *   1. Copy one of the objects below (pick one of the same "kind").
 *   2. Give it a unique `id` (lowercase, hyphens, no spaces).
 *   3. Fill in the fields. `coords` is [latitude, longitude] — the
 *      easiest way to get this is to right-click the spot on
 *      google maps and copy the two numbers it shows you.
 *   4. Drop your photos in images/trips/<id>/ and list them under `photos`.
 *   5. Save the file and refresh index.html — that's it, no build step.
 *
 * TAGS are freeform — just type whatever hashtags make sense for the
 * trip in the `tags` array (lowercase, hyphenate multi-word tags: e.g.
 * "roadtrip", "bear-encounter", "alaska2019"). There's no fixed list to
 * maintain anywhere — every unique tag used across all trips
 * automatically shows up as a clickable "#tag" chip in the hashtag bar
 * above the map, and a trip can have as many tags as you want. A road
 * trip that included a great hike can just be tagged
 * ["roadtrip", "hiking-biking"].
 *
 * KIND:
 *   "trip"           - a narrative trip report (date, story, photos)
 *   "recommendation" - a shorter "here's a spot I recommend" entry
 *                       (uses the optional `recommendation` block below)
 *   Unlike tags, `kind` is one of these two fixed values — it drives the
 *   marker icon/color on the map (see KIND_STYLES) and which fields the
 *   sidebar renders.
 * ---------------------------------------------------------------------
 */

// Fixed, 2-value styling for map markers — deliberately NOT tied to tags
// (tags are freeform and unbounded, so they can't carry a reliable color
// identity; `kind` is a small fixed set, so it's what markers encode).
const KIND_STYLES = {
  "trip": {
    icon: "📍",
    color: "#3987e5"
  },
  "recommendation": {
    icon: "★",
    color: "#9085e9"
  }
};

// Map appearance. `mapboxStyle` can be swapped for any Mapbox style ID
// to change the whole map's look — some good options:
//   mapbox/dark-v11               (current — dark, clean roads)
//   mapbox/streets-v12            (classic bright street map)
//   mapbox/outdoors-v12           (hiking/terrain-focused, contour lines)
//   mapbox/satellite-streets-v12  (satellite imagery + roads/labels)
// The token is a Mapbox *public* token — meant to be embedded in
// front-end code like this (restrict it to your domain in your Mapbox
// account's token settings once the site is live, so nobody else can
// use it and eat into your free tier).
const MAP_CONFIG = {
  mapboxToken: "pk.eyJ1IjoiamVsbHlmaWVuZCIsImEiOiJjbXI5bXU2dngwNHFwMnpwb2gzNWFpM3EzIn0.salWyGs0oGcd1sjojCyhAQ",
  mapboxStyle: "mapbox/dark-v11"
};

// Regions — each one is a "location option" card on the splash screen,
// and defines where the map centers/zooms when that card is picked.
// `color` is used for the card accent; `blurb` is the one-line teaser.
const REGIONS = {
  "Alaska": {
    center: [63.5, -152.0],
    zoom: 5,
    blurb: "Where it all started — road trips, hunts, and weekend cabins.",
    color: "#d9705a" // salmon
  },
  "World": {
    center: [15, 10],
    zoom: 2,
    blurb: "Everywhere else — backpacking, big trips, far-flung trails.",
    color: "#a8a08e" // warm gray
  },
  "New Zealand": {
    center: [-41.3, 172.6],
    zoom: 5.3,
    blurb: "Home base now — hikes, fishing spots, and local favorites.",
    color: "#7c9468" // sage
  }
};

// The big stacked "Life is for..." words on the splash screen.
//   words        - the full pool. Add as many as you want any time —
//                  you don't need to touch anything else.
//   visibleCount - how many show at once (stacked vertically).
//   rotateMs     - how often one visible word gets swapped for one
//                  from the rest of the pool. If the pool is the same
//                  size as (or smaller than) visibleCount, everything
//                  just shows statically with no rotation.
//   montageImage - path to the collage image the words are "cut out"
//                  of. Regenerate it from your real trip photos any
//                  time with: node scripts/build-montage.js
const LIFE_HERO = {
  words: ["EXPLORING", "LAUGHING", "LOVING", "SEEKING", "LIVING", "INVENTING"],
  visibleCount: 5,
  rotateMs: 4000,
  montageImage: "images/montage.jpg"
};

const TRIPS = [
  {
    id: "denali-ring-road-trip",
    kind: "trip",
    title: "The Denali Ring: A Two-Week Alaska Road Trip",
    date: "July 2019",
    region: "Alaska",
    location: "Anchorage → Denali → Fairbanks → Valdez",
    tags: ["roadtrip", "extended-vacation"],
    coords: [63.1148, -151.1926],
    route: [
      [61.2181, -149.9003],
      [63.1148, -151.1926],
      [64.8378, -147.7164],
      [61.1308, -146.3483]
    ],
    summary: "Two weeks, one rental truck, and a loop through the best of the interior — this is the trip that started it all.",
    body: "Replace this with your real trip report. A few notes on formatting:\n\nYou can use **bold text**, *italic text*, and line breaks like this.\n\n- Bullet points work too\n- Just start a line with a dash\n- Great for gear lists or day-by-day notes\n\nWrite as much as you want here — the sidebar scrolls.",
    photos: [
      { src: "images/trips/denali-ring-road-trip/1.svg", caption: "Replace with a real photo caption" },
      { src: "images/trips/denali-ring-road-trip/2.svg", caption: "Replace with a real photo caption" },
      { src: "images/trips/denali-ring-road-trip/3.svg", caption: "Replace with a real photo caption" }
    ]
  },
  {
    id: "kenai-weekend-cabin",
    kind: "trip",
    title: "Kenai Peninsula Weekend Cabin Trip",
    date: "August 2018",
    region: "Alaska",
    location: "Kenai Peninsula, Alaska",
    tags: ["weekend-warrior"],
    coords: [60.4708, -150.9317],
    summary: "A quick 48-hour escape to a lakeside cabin — proof you don't need two weeks off to get somewhere incredible.",
    body: "Replace this with your real trip report.\n\nGood spot for: quick logistics notes, what you'd do differently, whether you'd go back.",
    photos: [
      { src: "images/trips/kenai-weekend-cabin/1.svg", caption: "Replace with a real photo caption" },
      { src: "images/trips/kenai-weekend-cabin/2.svg", caption: "Replace with a real photo caption" }
    ]
  },
  {
    id: "alaska-range-dall-sheep-hunt",
    kind: "trip",
    title: "Dall Sheep Hunt, Alaska Range",
    date: "September 2017",
    region: "Alaska",
    location: "Alaska Range",
    tags: ["hunt", "extended-vacation"],
    coords: [63.35, -147.1],
    summary: "A ten-day backcountry sheep hunt — glassing ridgelines, bad weather days, and the pack-out that followed.",
    body: "Replace this with your real trip report.\n\nGood spot for: unit/area notes (as much or as little as you want to make public), gear that worked, gear that didn't, physical prep.",
    photos: [
      { src: "images/trips/alaska-range-dall-sheep-hunt/1.svg", caption: "Replace with a real photo caption" }
    ]
  },
  {
    id: "patagonia-torres-del-paine",
    kind: "trip",
    title: "Torres del Paine, Patagonia",
    date: "November 2021",
    region: "World",
    location: "Torres del Paine National Park, Chile",
    tags: ["extended-vacation", "hiking-biking"],
    coords: [-50.9423, -73.4068],
    summary: "The W Trek, five days, and some of the best mountain scenery on earth.",
    body: "Replace this with your real trip report.",
    photos: [
      { src: "images/trips/patagonia-torres-del-paine/1.svg", caption: "Replace with a real photo caption" },
      { src: "images/trips/patagonia-torres-del-paine/2.svg", caption: "Replace with a real photo caption" }
    ]
  },
  {
    id: "southeast-asia-backpacking",
    kind: "trip",
    title: "Six Weeks Backpacking Southeast Asia",
    date: "January–February 2020",
    region: "World",
    location: "Thailand, Vietnam, Cambodia",
    tags: ["extended-vacation"],
    coords: [13.4125, 103.8667],
    summary: "Three countries, one backpack, and a lot of overnight buses.",
    body: "Replace this with your real trip report.",
    photos: [
      { src: "images/trips/southeast-asia-backpacking/1.svg", caption: "Replace with a real photo caption" }
    ]
  },
  {
    id: "tongariro-alpine-crossing",
    kind: "recommendation",
    title: "Tongariro Alpine Crossing",
    date: "",
    region: "New Zealand",
    location: "Tongariro National Park, NZ",
    tags: ["hiking-biking"],
    coords: [-39.1378, 175.6420],
    summary: "One of the best single-day hikes in the world — volcanic craters, emerald lakes, the works.",
    recommendation: {
      difficulty: "Hard (long day, some exposure)",
      distance: "19.4 km one-way",
      bestTime: "Nov–Apr (check DOC alerts before going)",
      tips: "Replace with your own tips — e.g. start early to beat the crowds and the wind, book the shuttle in advance, bring layers even in summer."
    },
    body: "Replace this with your own writeup of why you'd recommend it.",
    photos: [
      { src: "images/trips/tongariro-alpine-crossing/1.svg", caption: "Replace with a real photo caption" }
    ]
  },
  {
    id: "queenstown-trout-fishing",
    kind: "trip",
    title: "Trout Fishing near Queenstown",
    date: "March 2023",
    region: "New Zealand",
    location: "Lake Wakatipu / Kawarau River, NZ",
    tags: ["fishing"],
    coords: [-45.0312, 168.6626],
    summary: "Chasing brown trout in some of the clearest water you'll ever fish.",
    body: "Replace this with your real trip report.",
    photos: [
      { src: "images/trips/queenstown-trout-fishing/1.svg", caption: "Replace with a real photo caption" }
    ]
  },
  {
    id: "wanaka-lakeside-cafe",
    kind: "recommendation",
    title: "Wanaka Lakeside Cafe",
    date: "",
    region: "New Zealand",
    location: "Wanaka, NZ",
    tags: ["food-local"],
    coords: [-44.7000, 169.1500],
    summary: "Replace with why you'd send someone here — the dish to order, the view from the table, whatever sold you.",
    recommendation: {
      tips: "Replace with practical notes — busy hours, booking needed?, price range."
    },
    body: "Replace this with your own writeup.",
    photos: [
      { src: "images/trips/wanaka-lakeside-cafe/1.svg", caption: "Replace with a real photo caption" }
    ]
  },
  {
    id: "roys-peak-weekend-hike",
    kind: "trip",
    title: "Roy's Peak Weekend Hike",
    date: "October 2023",
    region: "New Zealand",
    location: "Wanaka, NZ",
    tags: ["weekend-warrior", "hiking-biking"],
    coords: [-44.7583, 169.0631],
    summary: "That view. Early start, steep climb, worth every step.",
    body: "Replace this with your real trip report.",
    photos: [
      { src: "images/trips/roys-peak-weekend-hike/1.svg", caption: "Replace with a real photo caption" }
    ]
  }
];
