// One-off helper used to generate placeholder photo SVGs for the sample
// trips shipped with the template. Not needed once you add real photos —
// safe to delete this whole scripts/ folder at that point.
const fs = require("fs");
const path = require("path");

const placeholders = [
  { file: "images/trips/denali-ring-road-trip/1.svg", label: "Denali Ring Road Trip", color: "#3987e5" },
  { file: "images/trips/denali-ring-road-trip/2.svg", label: "Denali Ring Road Trip", color: "#3987e5" },
  { file: "images/trips/denali-ring-road-trip/3.svg", label: "Denali Ring Road Trip", color: "#3987e5" },
  { file: "images/trips/kenai-weekend-cabin/1.svg", label: "Kenai Weekend Cabin", color: "#199e70" },
  { file: "images/trips/kenai-weekend-cabin/2.svg", label: "Kenai Weekend Cabin", color: "#199e70" },
  { file: "images/trips/alaska-range-dall-sheep-hunt/1.svg", label: "Alaska Range Sheep Hunt", color: "#c98500" },
  { file: "images/trips/patagonia-torres-del-paine/1.svg", label: "Torres del Paine", color: "#008300" },
  { file: "images/trips/patagonia-torres-del-paine/2.svg", label: "Torres del Paine", color: "#008300" },
  { file: "images/trips/southeast-asia-backpacking/1.svg", label: "Southeast Asia Backpacking", color: "#008300" },
  { file: "images/trips/tongariro-alpine-crossing/1.svg", label: "Tongariro Alpine Crossing", color: "#9085e9" },
  { file: "images/trips/queenstown-trout-fishing/1.svg", label: "Queenstown Trout Fishing", color: "#e66767" },
  { file: "images/trips/wanaka-lakeside-cafe/1.svg", label: "Wanaka Lakeside Cafe", color: "#d55181" },
  { file: "images/trips/roys-peak-weekend-hike/1.svg", label: "Roy's Peak Weekend Hike", color: "#199e70" }
];

function svgFor(label, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="533" viewBox="0 0 800 533">
  <rect width="800" height="533" fill="${color}"/>
  <rect width="800" height="533" fill="#000" opacity="0.35"/>
  <text x="400" y="255" font-family="system-ui, sans-serif" font-size="28" fill="#ffffff" text-anchor="middle">${escapeXml(label)}</text>
  <text x="400" y="295" font-family="system-ui, sans-serif" font-size="17" fill="#ffffffcc" text-anchor="middle">Placeholder photo — replace me</text>
</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

placeholders.forEach((p) => {
  const full = path.join(__dirname, "..", p.file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, svgFor(p.label, p.color));
  console.log("wrote", p.file);
});
