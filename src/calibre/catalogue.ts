/**
 * The part catalogue: data only, no Three.js. Copy and mechanism must agree —
 * the teeth, the beat and the direction are read from the calibre, and each
 * entry's targets name the pick group registered by the scene.
 */
export type PartCategory = 'Power' | 'Transmission' | 'Regulation' | 'Display' | 'Winding' | 'Structure' | 'Case';

export type AssemblyLayer =
  | 'keyless'
  | 'plate'
  | 'train'
  | 'escapement'
  | 'motion'
  | 'bridges'
  | 'hands'
  | 'chapter'
  | 'case';

export interface PartCatalogueEntry {
  readonly id: string;
  readonly name: string;
  readonly category: PartCategory;
  readonly layer: AssemblyLayer;
  /** One plain-language sentence: what it is for. */
  readonly job: string;
  /** Two or three sentences of mechanism, for the reader who wants more. */
  readonly detail: string;
  /** Technical line: material, counts, rate. */
  readonly spec: string;
  /** Extra separation beyond the layer shift, so a stack reads as a stack. */
  readonly explodeBias: number;
  /** Pick-group names that resolve to this entry. */
  readonly targets: readonly string[];
}

export const PART_CATEGORIES: readonly PartCategory[] = [
  'Power',
  'Transmission',
  'Regulation',
  'Display',
  'Winding',
  'Structure',
  'Case',
];

export const PART_LAYERS: readonly AssemblyLayer[] = [
  'keyless',
  'plate',
  'train',
  'escapement',
  'motion',
  'bridges',
  'hands',
  'chapter',
  'case',
];

export const CATALOGUE: readonly PartCatalogueEntry[] = [
  {
    id: 'main-plate',
    name: 'Main plate',
    category: 'Structure',
    layer: 'plate',
    job: 'The foundation of the movement: every wheel, bridge and jewel is mounted on it.',
    detail:
      'MW-01 cuts the plate away between its bearing points so the train stays visible from the dial side. The surface carries perlage — overlapping circles of fine graining that catch the studio light and give oil somewhere to sit away from a pivot.',
    spec: 'Anthracite rhodium · 30.1 mm · 12 jewels',
    explodeBias: 0,
    targets: ['main-plate'],
  },
  {
    id: 'jewels',
    name: 'Jewel bearings',
    category: 'Structure',
    layer: 'plate',
    job: 'Synthetic ruby bearings that let an arbor turn with almost no friction.',
    detail:
      'Each pivot runs in a polished ruby bore, often inside a gold chaton. Ruby is used because it is hard enough to hold an oil film and smooth enough to outlast the brass it sits in; a jewelled movement is a movement that will still run in fifty years.',
    spec: 'Synthetic corundum · 12 jewels · olive bore',
    explodeBias: 0.3,
    targets: ['jewels'],
  },
  {
    id: 'screws',
    name: 'Blued screws',
    category: 'Structure',
    layer: 'bridges',
    job: 'They hold the bridges down, and their colour is a heat treatment rather than paint.',
    detail:
      'Steel screws are polished, then heated until a thin oxide film turns the exact peacock blue a watchmaker wants. That film is only a few hundred nanometres thick, so the slot and the bevel change colour as the light moves across them.',
    spec: 'Blued steel · slot-head · 0.96–2.7 mm heads',
    explodeBias: 1.5,
    targets: ['screws'],
  },
  {
    id: 'barrel-bridge',
    name: 'Barrel bridge',
    category: 'Structure',
    layer: 'bridges',
    job: 'It carries the top pivot of the barrel arbor and holds the mainspring drum in place.',
    detail:
      'The bridge is cut from a single piece, bevelled by hand along every exposed edge and finished with Côtes de Genève. Its jewel is set in a gold chaton so the pivot has a hard, replaceable seat.',
    spec: 'Rhodium-plated brass · Côtes de Genève · anglage',
    explodeBias: 0,
    targets: ['barrel-bridge'],
  },
  {
    id: 'center-bridge',
    name: 'Center bridge',
    category: 'Structure',
    layer: 'bridges',
    job: 'It steadies the center wheel and carries the cannon pinion under the hands.',
    detail:
      'Because the center arbor also drives the motion works, this bridge has to leave room for the cannon pinion to pass through it. The opening is chamfered so the pinion never rubs on a raw edge.',
    spec: 'Rhodium-plated brass · anglage · 1.6 mm',
    explodeBias: 0.5,
    targets: ['center-bridge'],
  },
  {
    id: 'train-bridge',
    name: 'Train bridge',
    category: 'Structure',
    layer: 'bridges',
    job: 'One bridge holds the third and fourth wheel pivots, keeping the train in mesh.',
    detail:
      'A single bridge over two arbors fixes their centre distance, which is what keeps the teeth in mesh without pressure. Cutaways remove metal that carries no load, leaving a silhouette you can read the train through.',
    spec: 'Rhodium-plated brass · Côtes de Genève · 2 jewels',
    explodeBias: 1,
    targets: ['train-bridge'],
  },
  {
    id: 'balance-cock',
    name: 'Balance cock',
    category: 'Structure',
    layer: 'bridges',
    job: 'The cantilevered bridge that holds the balance and hairspring above the escapement.',
    detail:
      'A cock has one fixed end and one free end, so its shape is a spring as much as a bracket. The free end carries the shock setting and the regulator; the whole part is bevelled and grained so it reads as a single piece of worked metal.',
    spec: 'Rhodium-plated brass · anglage · shock setting',
    explodeBias: 1.2,
    targets: ['balance-cock'],
  },
  {
    id: 'barrel',
    name: 'Barrel',
    category: 'Power',
    layer: 'train',
    job: 'The drum that houses the mainspring and carries the wheel that starts the train.',
    detail:
      'The spring is coiled inside the drum; one end is hooked to the drum wall, the other to the arbor. As the spring unwinds it turns the drum, whose 72 teeth drive the center pinion. Seven turns of the barrel is a full 42-hour wind.',
    spec: '72 teeth · 1 rev / 6 h · 7.2 mm drum',
    explodeBias: 0,
    targets: ['barrel'],
  },
  {
    id: 'mainspring',
    name: 'Mainspring',
    category: 'Power',
    layer: 'train',
    job: 'The coiled steel ribbon that stores all the energy the watch will ever use.',
    detail:
      'Winding packs the spring tighter against the arbor; running lets it push outward against the drum wall. Its torque is not perfectly constant, which is why a watch is adjusted in several positions rather than one.',
    spec: 'Blued steel ribbon · 0.09 mm · 7 turns at full wind',
    explodeBias: 0.2,
    targets: ['mainspring'],
  },
  {
    id: 'barrel-arbor',
    name: 'Barrel arbor',
    category: 'Power',
    layer: 'train',
    job: 'The axle the mainspring grips and the ratchet wheel turns to wind it.',
    detail:
      'The arbor is fixed at its base and free at the top, where the ratchet wheel is squared on. Winding turns the arbor, not the drum; the spring is charged between the two, which is why the barrel itself only turns as the watch runs.',
    spec: 'Polished steel · squared ratchet seat',
    explodeBias: 0.4,
    targets: ['barrel-arbor'],
  },
  {
    id: 'ratchet-wheel',
    name: 'Ratchet wheel',
    category: 'Winding',
    layer: 'keyless',
    job: 'The toothed wheel on the barrel arbor that the crown wheel drives when you wind.',
    detail:
      'Its saw-tooth profile is shaped so the crown wheel can push it one way and the click can stop it going back. Every wind you feel is a series of these teeth passing under the click.',
    spec: 'Blued steel · 22 teeth · sits on the barrel arbor',
    explodeBias: 0.2,
    targets: ['ratchet-wheel'],
  },
  {
    id: 'click',
    name: 'Click',
    category: 'Winding',
    layer: 'keyless',
    job: 'The spring-loaded pawl that stops the ratchet wheel from unwinding.',
    detail:
      'The click drops into the gap between two ratchet teeth after each wind; the click spring keeps it pressed there. Without it the mainspring would give its energy back through the crown instead of through the train.',
    spec: 'Blued steel · spring-loaded pawl',
    explodeBias: 0.35,
    targets: ['click'],
  },
  {
    id: 'click-spring',
    name: 'Click spring',
    category: 'Winding',
    layer: 'keyless',
    job: 'A small flat spring that keeps the click pressed against the ratchet teeth.',
    detail:
      'It is deliberately weak: strong enough to hold the click in a tooth, light enough that winding does not fight it. A broken click spring is one of the few failures that lets a watch run backwards.',
    spec: 'Blued steel · flat leaf spring',
    explodeBias: 0.45,
    targets: ['click-spring'],
  },
  {
    id: 'crown-wheel',
    name: 'Crown wheel',
    category: 'Winding',
    layer: 'keyless',
    job: 'It turns the winding force through ninety degrees from the stem to the ratchet.',
    detail:
      'The stem ends in a pinion whose teeth meet the crown wheel. The crown wheel then drives the ratchet on the barrel arbor, so the motion of your fingers reaches the mainspring through two meshes.',
    spec: 'Blued steel · 22 teeth · 1:1 to ratchet',
    explodeBias: 0.05,
    targets: ['crown-wheel'],
  },
  {
    id: 'winding-stem',
    name: 'Winding stem',
    category: 'Winding',
    layer: 'keyless',
    job: 'The shaft that carries the crown’s turn into the movement.',
    detail:
      'The stem passes through the case band and ends in a square that engages the winding pinion. In a keyless works it also slides to select winding or hand-setting, which is why a crown can be pulled as well as turned.',
    spec: 'Steel · square drive · 0.9 mm',
    explodeBias: 0,
    targets: ['winding-stem'],
  },
  {
    id: 'setting-lever',
    name: 'Setting lever',
    category: 'Winding',
    layer: 'keyless',
    job: 'It locks the stem in its winding position and releases it when the crown is pulled.',
    detail:
      'The lever drops into a groove in the stem. Pulling the crown swings the lever, which lets the yoke move the clutch pinion from winding to setting — the click you feel at the first crown position.',
    spec: 'Steel · pivoted detent · 1.2 mm',
    explodeBias: 0.55,
    targets: ['setting-lever'],
  },
  {
    id: 'yoke',
    name: 'Yoke',
    category: 'Winding',
    layer: 'keyless',
    job: 'The swinging arm that shifts the winding pinion between winding and setting.',
    detail:
      'The yoke is pushed by the setting lever and carries the clutch pinion along the stem. Its arc is short but it decides whether the crown winds the spring or moves the hands.',
    spec: 'Steel · 1.4 mm · pivots on the plate',
    explodeBias: 0.7,
    targets: ['yoke'],
  },
  {
    id: 'center-wheel',
    name: 'Center wheel',
    category: 'Transmission',
    layer: 'train',
    job: 'The first wheel of the train proper: one turn per hour, and the arbor the hands are stacked on.',
    detail:
      'Its 64 teeth drive the third pinion, and its arbor carries the cannon pinion that moves the minute hand. Because it turns exactly once an hour, the whole train can be derived from it.',
    spec: '64 teeth · 1 rev / hour · 8-leaf third pinion',
    explodeBias: 0.6,
    targets: ['center-wheel'],
  },
  {
    id: 'third-wheel',
    name: 'Third wheel',
    category: 'Transmission',
    layer: 'train',
    job: 'The intermediate wheel that steps the train speed up by eight.',
    detail:
      'Nothing is displayed from the third wheel — its job is ratio. Sixty teeth driving an eight-leaf pinion turn the fourth wheel sixty times for each turn of the center wheel.',
    spec: '60 teeth · 8 rev / hour · 8-leaf fourth pinion',
    explodeBias: 0.8,
    targets: ['third-wheel'],
  },
  {
    id: 'fourth-wheel',
    name: 'Fourth wheel',
    category: 'Transmission',
    layer: 'train',
    job: 'It turns once a minute and carries the small-seconds hand.',
    detail:
      'The fourth wheel is the train’s clock face: one turn per minute is exactly what a seconds hand needs. Its 72 teeth also drive the escape pinion, stepping the speed up twelvefold again.',
    spec: '72 teeth · 1 rev / minute · small seconds',
    explodeBias: 1,
    targets: ['fourth-wheel'],
  },
  {
    id: 'escape-wheel',
    name: 'Escape wheel',
    category: 'Regulation',
    layer: 'escapement',
    job: 'The last wheel of the train, released one half-tooth at a time by the pallet fork.',
    detail:
      'Twenty pointed teeth stand in the way of the train’s energy. Each beat lets one tooth escape, so the wheel turns once every five seconds while the train tries to run freely. Its rim is lightened so the wheel accelerates quickly between beats.',
    spec: '20 teeth · 9° per beat · 1 rev / 5 s',
    explodeBias: 0,
    targets: ['escape-wheel'],
  },
  {
    id: 'pallet-fork',
    name: 'Pallet fork',
    category: 'Regulation',
    layer: 'escapement',
    job: 'The lever that locks the escape wheel, then releases it and pushes the balance.',
    detail:
      'One end carries two ruby stones into the escape wheel; the other forks around a pin on the balance. It snaps between two banking pins at each beat, which is the tick you hear.',
    spec: 'Steel · 2 banking pins · ±10° travel',
    explodeBias: 0.5,
    targets: ['pallet-fork'],
  },
  {
    id: 'pallet-stones',
    name: 'Pallet stones',
    category: 'Regulation',
    layer: 'escapement',
    job: 'Two ruby blocks that lock the escape wheel and take its impulse without wearing.',
    detail:
      'Their angled faces are the heart of the escapement: one face locks a tooth, the other slides along it to give the fork its push. Ruby is used because the contact is repeated eight times a second for decades.',
    spec: 'Synthetic ruby · entry and exit stones · 0.4 mm',
    explodeBias: 0.7,
    targets: ['pallet-stones'],
  },
  {
    id: 'balance-wheel',
    name: 'Balance wheel',
    category: 'Regulation',
    layer: 'escapement',
    job: 'The weighted wheel that swings back and forth and divides time into equal beats.',
    detail:
      'Its inertia and the hairspring’s stiffness set the rate. MW-01 swings through 270° at 4 Hz, which is eight beats a second, and the escapement releases once at each turning point.',
    spec: 'Gilt brass · 270° swing · 4 Hz',
    explodeBias: 1.1,
    targets: ['balance-wheel'],
  },
  {
    id: 'hairspring',
    name: 'Hairspring',
    category: 'Regulation',
    layer: 'escapement',
    job: 'The flat spiral spring that returns the balance and sets the watch’s frequency.',
    detail:
      'It is thinner than a human hair and coils and uncoils with every swing, breathing evenly because its outer end is pinned while its inner end turns with the balance. Lengthening it through the regulator slows the watch; shortening it speeds it up.',
    spec: 'Blued steel · 5 coils · 0.03 mm section',
    explodeBias: 1.4,
    targets: ['hairspring'],
  },
  {
    id: 'shock-spring',
    name: 'Shock spring',
    category: 'Regulation',
    layer: 'escapement',
    job: 'A small sprung cap that lets the balance pivot survive a knock.',
    detail:
      'The jewel sits in a setting that can move a fraction of a millimetre against a spring. A blow pushes the pivot aside instead of snapping it, and the spring centres it again.',
    spec: 'Blued steel · Incabloc-style · 0.6 mm',
    explodeBias: 1.6,
    targets: ['shock-spring'],
  },
  {
    id: 'cannon-pinion',
    name: 'Cannon pinion',
    category: 'Display',
    layer: 'motion',
    job: 'The friction-fit pinion on the center arbor that carries the minute hand.',
    detail:
      'It turns once an hour and drives the minute wheel, which is the first half of the 12:1 reduction. Its friction fit is deliberate: a hand-setting crown can slip the hands around without breaking the train.',
    spec: '12 teeth · 1 rev / hour · friction fit',
    explodeBias: 0,
    targets: ['cannon-pinion'],
  },
  {
    id: 'minute-wheel',
    name: 'Minute wheel',
    category: 'Display',
    layer: 'motion',
    job: 'It takes one turn every three hours and reverses direction for the hour train.',
    detail:
      'Thirty-six teeth driven by the cannon pinion’s twelve give a 3:1 reduction. Its own ten-leaf pinion then drives the forty-tooth hour wheel, so the two reductions multiply to twelve.',
    spec: '36 teeth · 1 rev / 3 h · 10-leaf pinion',
    explodeBias: 0.3,
    targets: ['minute-wheel'],
  },
  {
    id: 'hour-wheel',
    name: 'Hour wheel',
    category: 'Display',
    layer: 'motion',
    job: 'The last wheel of the motion works: one turn every twelve hours, carrying the hour hand.',
    detail:
      'It is a loose wheel around the cannon pinion, so the hour and minute hands can share an axis while turning at different rates. Forty teeth against a ten-leaf pinion finish the 12:1 reduction.',
    spec: '40 teeth · 1 rev / 12 h · 12:1 total',
    explodeBias: 0.6,
    targets: ['hour-wheel'],
  },
  {
    id: 'hour-hand',
    name: 'Hour hand',
    category: 'Display',
    layer: 'hands',
    job: 'It shows the hour, turning once every twelve hours.',
    detail:
      'The hand is a tapered blade with a polished bevel and a brushed top, so it changes from bright to dark as it crosses the chapter ring. It is friction-fitted to the hour wheel and can be set without moving the train.',
    spec: 'Gilt brass · 30° / hour · 9.0 mm',
    explodeBias: 0,
    targets: ['hour-hand'],
  },
  {
    id: 'minute-hand',
    name: 'Minute hand',
    category: 'Display',
    layer: 'hands',
    job: 'It shows the minute, turning once an hour.',
    detail:
      'Longer and thinner than the hour hand so the two cannot be confused at a glance. Its counterweight is sized to keep the hand balanced on its pipe as the watch changes position.',
    spec: 'Gilt brass · 6° / minute · 12.6 mm',
    explodeBias: 0.5,
    targets: ['minute-hand'],
  },
  {
    id: 'seconds-hand',
    name: 'Small-seconds hand',
    category: 'Display',
    layer: 'hands',
    job: 'It turns once a minute, driven directly by the fourth wheel.',
    detail:
      'A small seconds hand is the most honest display in a mechanical watch: it is the train itself, visible. Every beat of the escapement moves it one small step.',
    spec: 'Blued steel · 6° / second · 4.4 mm',
    explodeBias: 0.8,
    targets: ['seconds-hand'],
  },
  {
    id: 'chapter-ring',
    name: 'Chapter ring',
    category: 'Display',
    layer: 'chapter',
    job: 'The ring of applied markers that lets you read the hands without hiding the movement.',
    detail:
      'A skeleton watch cannot use a solid dial, so the hours live on a narrow dark-rhodium ring outside the mechanism. The applied gold indices are polished and bevelled, and the ring’s edges are finished with anglage so they catch the light.',
    spec: 'Dark rhodium · applied gold indices · 30 mm',
    explodeBias: 0,
    targets: ['chapter-ring'],
  },
  {
    id: 'case-band',
    name: 'Case band',
    category: 'Case',
    layer: 'case',
    job: 'The thin ring of polished metal that holds the movement and frames the dial.',
    detail:
      'MW-01 uses an open case with no bezel over the movement, so the band is a frame rather than a lid. Its inner lip carries the movement holder; its outer face is polished to a mirror and left unbrushed.',
    spec: 'Champagne gold · 34.0 mm · 1.45 mm band',
    explodeBias: 0,
    targets: ['case-band'],
  },
  {
    id: 'crystal',
    name: 'Crystal',
    category: 'Case',
    layer: 'case',
    job: 'The sapphire pane that keeps dust off the movement while staying almost invisible.',
    detail:
      'Sapphire is used for its scratch resistance, and it is anti-reflective coated so the movement is not veiled by a reflection. Its edge is polished rather than chamfered, which is why it catches a thin ring of light.',
    spec: 'Sapphire · 1.0 mm · anti-reflective',
    explodeBias: 1.5,
    targets: ['crystal'],
  },
  {
    id: 'lugs',
    name: 'Lugs',
    category: 'Case',
    layer: 'case',
    job: 'The four horns that would take a strap, left bare so the case reads as an object.',
    detail:
      'Each lug is machined with the case band and polished in the same pass, so the grain runs continuously from one into the other. Without a strap they become a compositional device: four points that tell you which way is up.',
    spec: 'Champagne gold · 11.4 mm between lugs',
    explodeBias: 0.6,
    targets: ['lugs'],
  },
  {
    id: 'crown',
    name: 'Crown',
    category: 'Winding',
    layer: 'keyless',
    job: 'The fluted button at three o’clock that you turn to wind the mainspring.',
    detail:
      'The flutes give your fingers something to grip against the spring’s resistance. Turning it clockwise winds; pulling it would let the keyless works switch to setting the hands.',
    spec: 'Champagne gold · fluted · 4.6 mm',
    explodeBias: 0.85,
    targets: ['crown'],
  },
];

const BY_ID = new Map(CATALOGUE.map((entry) => [entry.id, entry]));

export function partById(id: string): PartCatalogueEntry | undefined {
  return BY_ID.get(id);
}

export function requirePart(id: string): PartCatalogueEntry {
  const entry = BY_ID.get(id);
  if (!entry) throw new Error(`Unknown part: ${id}`);
  return entry;
}

/** Parts in catalogue order, used by the keyboard cycle and the fallback list. */
export const PART_IDS: readonly string[] = CATALOGUE.map((entry) => entry.id);

export function partName(id: string | null): string {
  return id === null ? '' : (BY_ID.get(id)?.name ?? '');
}
