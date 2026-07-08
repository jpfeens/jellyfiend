// Builds images/montage.jpg — a grid collage of trip photos used as the
// photo-fill for the big stacked words on the splash screen ("EXPLORING",
// "LAUGHING", etc — see LIFE_HERO in js/trips-data.js).
//
// Re-run this any time you want the montage to reflect your real photos:
//   node scripts/build-montage.js
//
// By default it grabs one photo from each trip folder under images/trips/.
// Feel free to edit the `photoPaths` list below to hand-pick specific
// photos instead once you have real ones — a mix of wide, colorful shots
// tends to read best once it's behind bold text.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const TRIPS_DIR = path.join(__dirname, "..", "images", "trips");
const OUTPUT = path.join(__dirname, "..", "images", "montage.jpg");

const TILE = 360; // px, each grid cell is square
const COLUMNS = 5;

function findPhotos() {
  const photos = [];
  fs.readdirSync(TRIPS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .forEach((dir) => {
      const folder = path.join(TRIPS_DIR, dir.name);
      const files = fs.readdirSync(folder).filter((f) => /\.(jpe?g|png|svg|webp)$/i.test(f));
      if (files.length) photos.push(path.join(folder, files[0]));
    });
  return photos;
}

async function build() {
  const photoPaths = findPhotos();
  if (!photoPaths.length) {
    console.error("No photos found under images/trips/ — nothing to build.");
    process.exit(1);
  }

  const rows = Math.ceil(photoPaths.length / COLUMNS);
  const canvasWidth = COLUMNS * TILE;
  const canvasHeight = rows * TILE;

  const tiles = await Promise.all(
    photoPaths.map((p) =>
      sharp(p).resize(TILE, TILE, { fit: "cover" }).jpeg().toBuffer()
    )
  );

  const composites = tiles.map((buffer, i) => ({
    input: buffer,
    left: (i % COLUMNS) * TILE,
    top: Math.floor(i / COLUMNS) * TILE
  }));

  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: { r: 20, g: 20, b: 20 }
    }
  })
    .composite(composites)
    .jpeg({ quality: 85 })
    .toFile(OUTPUT);

  console.log(`Wrote ${OUTPUT} (${canvasWidth}x${canvasHeight}, ${photoPaths.length} photos)`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
