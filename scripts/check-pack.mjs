import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync("src/art/packed/pack.json", "utf8"));
const need = [
  "hero_idle", "hero_walk_1", "hero_walk_2", "hero_walk_3", "hero_walk_4",
  "zombie_worker", "zombie_crawler", "zombie_tubes", "zombie_bloater", "brute",
  "pipes_blue_tank", "valve_steam", "conveyor", "crate", "barrel",
  "building_wall_door", "lamp", "window_lit",
  "breakable_boiler", "breakable_gear_pylon",
  "decal_hazard", "decal_vent", "decal_grate",
  "tile_stone_seamless", "tile_metal_seamless",
  "heart_ring", "power_slot", "ultimate_button",
  "objectives_panel", "minimap_frame", "xp_bar_frame",
  "steam_1", "steam_2", "steam_3", "steam_4", "blue_glow",
];
const missing = need.filter((id) => !pack.sprites[id]);
if (missing.length) {
  console.error(missing.join("\n"));
  process.exit(1);
}
if (pack.hero_px !== 64) {
  console.error("hero_px");
  process.exit(1);
}
console.log(`pack ok (${need.length} sprites)`);
