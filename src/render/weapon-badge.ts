import {
  EVOL_AEGIS, EVOL_CANNON, EVOL_STORM, UNION_BELLOWS, UNION_BRIAR, UNION_CALLIOPE,
  UNION_CROWN, UNION_HALO, UNION_HEART, UNION_HOWITZER, UPG_DMG, UPG_FIRE, UPG_MORTAR,
  UPG_SAWS, UPG_SHOTGUN, UPG_TESLA, UPG_VENT, type World,
} from "../sim/types";

export function weaponBadge(w: World): { name: string; pips: number; kind: number } {
  const storm = w.upgrades[EVOL_STORM] ?? 0;
  const cannon = w.upgrades[EVOL_CANNON] ?? 0;
  const aegis = w.upgrades[EVOL_AEGIS] ?? 0;
  const saws = w.upgrades[UPG_SAWS] ?? 0;
  const tesla = w.upgrades[UPG_TESLA] ?? 0;
  const shot = w.upgrades[UPG_SHOTGUN] ?? 0;
  const fire = w.upgrades[UPG_FIRE] ?? 0;
  const mortar = w.upgrades[UPG_MORTAR] ?? 0;
  const vent = w.upgrades[UPG_VENT] ?? 0;
  if ((w.upgrades[UNION_CROWN] ?? 0) > 0) return { name: "CROWN", pips: 1, kind: UNION_CROWN };
  if ((w.upgrades[UNION_BELLOWS] ?? 0) > 0) return { name: "GATLING", pips: 1, kind: UNION_BELLOWS };
  if ((w.upgrades[UNION_HALO] ?? 0) > 0) return { name: "HALO", pips: 1, kind: UNION_HALO };
  if ((w.upgrades[UNION_HEART] ?? 0) > 0) return { name: "HEART", pips: 1, kind: UNION_HEART };
  if ((w.upgrades[UNION_BRIAR] ?? 0) > 0) return { name: "BRIAR", pips: 1, kind: UNION_BRIAR };
  if ((w.upgrades[UNION_HOWITZER] ?? 0) > 0) return { name: "HOWITZER", pips: 1, kind: UNION_HOWITZER };
  if ((w.upgrades[UNION_CALLIOPE] ?? 0) > 0) return { name: "CALLIOPE", pips: 1, kind: UNION_CALLIOPE };
  if (storm > 0) return { name: "STORM", pips: storm, kind: EVOL_STORM };
  if (cannon > 0) return { name: "CANNON", pips: cannon, kind: EVOL_CANNON };
  if (aegis > 0) return { name: "AEGIS", pips: aegis, kind: EVOL_AEGIS };
  if (saws > 0 && saws >= tesla && saws >= shot) return { name: "SAWSTORM", pips: saws, kind: UPG_SAWS };
  if (tesla > 0 && tesla >= shot) return { name: "TESLA", pips: tesla, kind: UPG_TESLA };
  if (shot > 0) return { name: "SCATTER", pips: shot, kind: UPG_SHOTGUN };
  if (mortar > 0) return { name: "MORTAR", pips: mortar, kind: UPG_MORTAR };
  if (vent > 0) return { name: "VENT", pips: vent, kind: UPG_VENT };
  if (fire > 0) return { name: "OVERDRIVE", pips: fire, kind: UPG_FIRE };
  return { name: "RIVETER", pips: Math.max(1, w.upgrades[UPG_DMG] ?? 0), kind: -1 };
}
