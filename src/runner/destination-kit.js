// Destination kits: one record per landscape, owning its look.
//
// Step 3 of the visual identity overhaul moved today's destination scenery
// onto kits as a pure refactor; step 4 populates the overhead,
// ground-clutter, far-band and built roles below. Builders take a helpers
// object with the shared geometry/material closures (and the seeded random
// where today's families use it), so no new geometries or textures are added.
// The renderer keeps placement; the kit owns per-destination parameters.
import {AREAS} from './areas.js';

// Role vocabulary for destination kits. All five roles are populated: the
// shoulder family below plus the overhead, ground-clutter, far-band and
// built layers added area by area.
export const KIT_ROLES = Object.freeze(['shoulder', 'overhead', 'ground', 'far', 'built']);

export const DESTINATION_KITS = Object.freeze(AREAS.map((area, index) => Object.freeze({
  area: index,
  name: area.name,
  roles: Object.freeze({
    shoulder: Object.freeze({count: 12, spacing: 8.4, offset: index * 17}),
    overhead: Object.freeze({count: 3, spacing: 61, offset: index * 41 + 7, variant: 6}),
    ground: Object.freeze({count: 8, spacing: 23, offset: index * 17 + 5, variant: 7}),
    far: Object.freeze({count: 3, spacing: 61, offset: index * 53 + 11, variant: 8}),
    built: Object.freeze({count: 3, spacing: 59, offset: index * 47 + 29, variant: 9}),
  }),
})));

export function kitFor(area) {
  return DESTINATION_KITS[area] ?? null;
}

// Which roadside a kit instance stands on. Shared by the renderer loops and
// the builders so leans and arrangements stay on the outward side.
export function sideFor(area, index) {
  return (index + area) % 2 ? 1 : -1;
}

// Today's shoulder landmark family (pooled variant 2). Moved verbatim from
// the renderer; helpers carry the shared geometry/material closures and the
// seeded random, so call order preserves the established stream.
export function buildShoulderFamily(area, group, helpers) {
  const {box, ball, cone, mesh, trunkGeometry, palmFrondGeometry, featheredPalmGeometry, mushroomCapGeometry, addBambooLeaves, random} = helpers;
    if (area === 0) {
      // Sunleaf: a broad tree with two warm firefly beacons in its crown.
      const height = 4.6 + random() * 2.8;
      mesh(group, trunkGeometry, '#5d5c3e', 0, height / 2, 0, .42, height, .42);
      ball(group, '#36775a', -.7, height, 0, 1.55, 1.18, 1.4);
      ball(group, '#5a9860', .75, height + .3, .1, 1.45, 1.12, 1.3);
      for (const x of [-.65, .62]) ball(group, '#ffe49a', x, height + .08, -.95, .12, .12, .12);
    } else if (area === 1) {
      // Bamboo: three slim stalks and a single lantern that reads at distance.
      for (let stalk = 0; stalk < 3; stalk++) {
        const x = (stalk - 1) * .62;
        const height = 4.5 + random() * 2.4;
        mesh(group, trunkGeometry, '#718f55', x, height / 2, 0, .16, height, .16);
        for (let y = 1.1; y < height - .2; y += 1.35) box(group, '#a7b56a', x, y, 0, .27, .1, .27);
        addBambooLeaves(group, palmFrondGeometry, mesh, x, height);
      }
      box(group, '#c49a59', 0, 2.55, -.78, .5, .72, .32);
      ball(group, '#ffe09a', 0, 2.55, -1.02, .15, .18, .15);
    } else if (area === 2) {
      // Redrock: layered buttes replace the generic round trees at the edge.
      for (let mesa = 0; mesa < 3; mesa++) {
        const x = (mesa - 1) * 1.15;
        const height = 2.2 + random() * 2.9;
        cone(group, mesa === 1 ? '#c8734f' : '#a6533b', x, height / 2, 0, .75 + random() * .3, height, .82);
        box(group, '#e1a36e', x, height + .12, 0, .75, .14, .8);
      }
      ball(group, '#eab27b', 0, .26, .1, 1.9, .28, 1.25);
    } else if (area === 3) {
      // Oasis: a readable fan palm and a low crescent of warm fruit.
      const height = 4.8 + random() * 2.2;
      mesh(group, trunkGeometry, '#8b6c43', 0, height / 2, 0, .28, height, .28);
      for (let frond = 0; frond < 7; frond++) {
        const angle = frond * Math.PI * 2 / 7;
        const leaf = mesh(group, featheredPalmGeometry, frond % 2 ? '#4f8051' : '#6da05d',
          Math.cos(angle) * 1.5, height, Math.sin(angle) * 1.5, 1.65, 1.08, 1.1);
        leaf.rotation.y = -angle;
      }
      for (const x of [-.5, 0, .5]) ball(group, '#e7bd69', x, .32, -.55, .16, .16, .16);
    } else if (area === 4) {
      // Crystal Reach: three translucent-looking color families of shard.
      for (let shard = 0; shard < 4; shard++) {
        const height = 2.4 + random() * 3.2;
        const x = (shard - 1.5) * .68;
        const crystal = cone(group, ['#79c5d8', '#9b8de4', '#b9e5ee', '#777fc4'][shard],
          x, height / 2, 0, .43, height, .48);
        crystal.rotation.z = (shard - 1.5) * .16;
      }
      ball(group, '#a9d5e0', 0, .28, .12, 1.8, .3, 1.2);
    } else {
      // Mooncap: a crescent of mushroom caps gives the night area a clear
      // silhouette without putting glowing geometry in the runner's lane.
      for (let mushroom = 0; mushroom < 3; mushroom++) {
        const x = (mushroom - 1) * 1.05;
        const height = 1.7 + mushroom * .65;
        mesh(group, trunkGeometry, '#8c7897', x, height / 2, 0, .22, height, .22);
        mesh(group, mushroomCapGeometry, ['#9278b1', '#b89bc9', '#7775ad'][mushroom], x, height, 0, 1.12, .72, 1.02);
        ball(group, '#e2d1e7', x, height - .17, -.72, .1, .1, .1);
      }
    }
}

// Today's destination signature (pooled variant 3), moved verbatim.
export function buildSignature(area, group, variant, helpers) {
  const {box, ball, cone, mesh, trunkGeometry, featheredPalmGeometry, mushroomCapGeometry} = helpers;
    if (area === 0) {
      // Sunleaf: a forked root arch with a pair of warm firefly lamps.
      box(group, '#5a5036', -.82, 1.65, 0, .42, 3.3, .44).rotation.z = -.18;
      box(group, '#5a5036', .82, 1.65, 0, .42, 3.3, .44).rotation.z = .18;
      box(group, '#6f6340', 0, 3.15, 0, 1.82, .38, .46);
      ball(group, variant % 2 ? '#4e9864' : '#3f855a', 0, 4.05, 0, 1.55, 1.05, 1.25);
      ball(group, '#ffe49a', -.62, 3.35, -.52, .12, .12, .12);
      ball(group, '#fff0b0', .62, 3.35, -.52, .12, .12, .12);
    } else if (area === 1) {
      // Bamboo: a compact lantern gate; the open centre keeps the road visible.
      for (const x of [-.7, .7]) {
        mesh(group, trunkGeometry, '#6f8f53', x, 2.25, 0, .2, 4.5, .2);
        for (let y = 1; y < 4.3; y += 1.1) box(group, '#a8b86e', x, y, 0, .29, .08, .29);
      }
      box(group, '#7a5c3f', 0, 4.35, 0, 1.72, .22, .25);
      box(group, '#c89154', 0, 2.65, -.36, .42, .62, .3);
      ball(group, '#ffe49a', 0, 2.65, -.57, .12, .15, .12);
    } else if (area === 2) {
      // Redrock: a warm split butte with a bright cap that reads in silhouette.
      cone(group, '#a9513b', -.82, 2.05, 0, 1.05, 4.1, .92);
      cone(group, '#c16b4c', .78, 2.7, 0, 1.18, 5.4, 1.02);
      box(group, '#e2a16b', .78, 5.42, 0, .78, .16, .8);
      ball(group, '#e9b27b', 0, .3, .1, 1.55, .26, 1.05);
    } else if (area === 3) {
      // Oasis: fan palm, shallow pool and a few bright stepping stones.
      const height = 4.5 + (variant % 2) * .55;
      mesh(group, trunkGeometry, '#8a6741', 0, height / 2, 0, .3, height, .3);
      for (let frond = 0; frond < 6; frond++) {
        const angle = frond * Math.PI * 2 / 6;
        const leaf = mesh(group, featheredPalmGeometry, frond % 2 ? '#4d8052' : '#6d9f5c',
          Math.cos(angle) * 1.35, height, Math.sin(angle) * 1.35, 1.45, .95, 1.05);
        leaf.rotation.y = -angle;
      }
      ball(group, '#9ed7c7', 0, .18, -.42, 1.8, .12, .88);
      for (const x of [-.55, 0, .55]) ball(group, '#e9c477', x, .32, -.72, .14, .14, .14);
    } else if (area === 4) {
      // Crystal Reach: an unmistakable three-spire prism cluster.
      for (let shard = 0; shard < 3; shard++) {
        const height = 3 + shard * .85 + (variant % 2) * .35;
        const crystal = cone(group, ['#66c6d8', '#9e91e6', '#b9e6ee'][shard],
          (shard - 1) * .72, height / 2, 0, .54, height, .58);
        crystal.rotation.z = (shard - 1) * .14;
      }
      ball(group, '#7ba5c0', 0, .3, .12, 1.65, .25, 1.08);
    } else {
      // Mooncap: a crescent of luminous caps gives the night run its own icon.
      for (let mushroom = 0; mushroom < 3; mushroom++) {
        const x = (mushroom - 1) * .92;
        const height = 1.8 + mushroom * .7;
        mesh(group, trunkGeometry, '#806d91', x, height / 2, 0, .2, height, .2);
        mesh(group, mushroomCapGeometry, ['#846cab', '#b799ce', '#6c72a8'][mushroom], x, height, 0, 1.05, .68, .96);
        ball(group, '#e8d8ee', x, height - .16, -.66, .11, .11, .11);
      }
      ball(group, '#595a82', 0, .22, .08, 1.7, .23, 1.15);
    }
}

// Today's low trail motif (pooled variant 4), moved verbatim.
export function buildTrailMotif(area, group, helpers) {
  const {box, ball, cone, mesh, trunkGeometry, palmFrondGeometry, mushroomCapGeometry} = helpers;
    if (area === 0) {
      // Sunleaf: a small fern fan and a warm seed-stone.
      mesh(group, trunkGeometry, '#4e6f49', 0, .38, 0, .10, .76, .10);
      for (let leaf = 0; leaf < 3; leaf++) {
        const frond = mesh(group, palmFrondGeometry, leaf % 2 ? '#6e9b5b' : '#8ab56a',
          (leaf - 1) * .24, .75 + leaf * .08, -.06, .52, .34, .45);
        frond.rotation.z = (leaf - 1) * .24;
      }
      ball(group, '#e4c979', 0, .14, -.12, .38, .10, .28);
    } else if (area === 1) {
      // Bamboo: paired shoots with a tiny lantern stripe as a visual beat.
      for (const x of [-.26, .26]) {
        mesh(group, trunkGeometry, '#68884f', x, .66, 0, .09, 1.32, .09);
        for (const y of [.38, .83, 1.25]) box(group, '#a4b56d', x, y, 0, .14, .045, .14);
      }
      box(group, '#c79152', 0, .62, -.16, .24, .32, .18);
      ball(group, '#ffe49a', 0, .62, -.29, .07, .08, .07);
    } else if (area === 2) {
      // Redrock: three warm pebbles read as a cairn at the road edge.
      for (let rock = 0; rock < 3; rock++) {
        const pebble = cone(group, rock === 1 ? '#d28157' : '#a9573f',
          (rock - 1) * .28, .18 + rock * .18, -.04, .32 - rock * .035,
          .36 + rock * .13, .28);
        pebble.rotation.z = (rock - 1) * .15;
      }
    } else if (area === 3) {
      // Oasis: three stepping stones catch a pale highlight beside the road.
      for (let stone = 0; stone < 3; stone++) {
        ball(group, stone === 1 ? '#f0cf80' : '#c5ae6f', (stone - 1) * .34,
          .12, -.10 - stone * .04, .25, .09, .18);
      }
      ball(group, '#8fcfc0', 0, .075, .22, .48, .035, .22);
    } else if (area === 4) {
      // Crystal Reach: two low shards make the cool palette legible even when
      // the horizon is hazy.
      for (let shard = 0; shard < 2; shard++) {
        const crystal = cone(group, shard ? '#9d91e3' : '#6ec6d8',
          (shard - .5) * .35, .52, 0, .20, .98 + shard * .18, .24);
        crystal.rotation.z = shard ? .12 : -.12;
      }
      ball(group, '#c5efff', 0, .12, -.18, .27, .055, .20);
    } else {
      // Mooncap: a pair of tiny caps makes the night trail feel alive without
      // adding a bright HUD-like glow to the playable corridor.
      for (let mushroom = 0; mushroom < 2; mushroom++) {
        const x = (mushroom - .5) * .46;
        const height = .52 + mushroom * .20;
        mesh(group, trunkGeometry, '#77678b', x, height / 2, 0, .10, height, .10);
        mesh(group, mushroomCapGeometry, mushroom ? '#ae91c4' : '#7d78b0',
          x, height, 0, .44, .25, .38);
      }
      ball(group, '#d8cae8', 0, .09, -.18, .22, .045, .16);
    }
}

// Today's set-piece postcard (pooled variant 5), moved verbatim.
export function buildSetPiece(area, group, helpers) {
  const {box, ball, cone, mesh, trunkGeometry, mushroomCapGeometry} = helpers;
    if (area === 0) {
      // Sunleaf: a tiny paw-shelter hut with a bright sign and leafy roof.
      box(group, '#315968', 0, .92, 0, 1.15, 1.55, .72);
      cone(group, '#e08a58', 0, 1.95, 0, .98, .72, .74).rotation.y = Math.PI / 5;
      box(group, '#ffe09a', 0, 1.02, .39, .38, .52, .05);
      box(group, '#2a5360', 0, 1.02, .43, .06, .34, .035);
      box(group, '#2a5360', 0, 1.02, .43, .26, .06, .035);
      ball(group, '#ffe49a', -.72, 1.75, -.18, .12, .12, .12);
      ball(group, '#fff0b0', .72, 1.75, -.18, .12, .12, .12);
    } else if (area === 1) {
      // Bamboo: a small torii-style lantern shrine, open in the middle.
      for (const x of [-.72, .72]) {
        mesh(group, trunkGeometry, '#6f8f53', x, 1.45, 0, .18, 2.9, .18);
        box(group, '#a8b86e', x, .7, 0, .26, .08, .26);
      }
      box(group, '#7a5c3f', 0, 2.72, 0, 1.82, .2, .26);
      box(group, '#c89154', 0, 1.82, -.34, .42, .56, .3);
      ball(group, '#ffe49a', 0, 1.82, -.56, .13, .16, .13);
    } else if (area === 2) {
      // Redrock: a ranger flag and a three-stone cairn give the pass a
      // distinctive vertical marker without becoming another road hazard.
      mesh(group, trunkGeometry, '#59423d', 0, 1.6, 0, .1, 3.2, .1);
      box(group, '#f0b15e', .42, 2.45, 0, .72, .42, .06).rotation.z = -.12;
      for (let rock = 0; rock < 3; rock++)
        cone(group, rock === 1 ? '#d28157' : '#a9573f', 0, .22 + rock * .28, 0,
          .42 - rock * .05, .42 + rock * .12, .36);
    } else if (area === 3) {
      // Oasis: a waterwheel built from chunky spokes and a striped market awning.
      ball(group, '#d8b26c', 0, 1.12, .08, .72, .72, .16);
      for (let spoke = 0; spoke < 4; spoke++) {
        const arm = box(group, '#a87343', 0, 1.12, .2, .13, 1.35, .12);
        arm.rotation.z = spoke * Math.PI / 4;
      }
      box(group, '#4c815d', 0, 2.28, 0, 1.55, .16, .72);
      box(group, '#e8c476', 0, 2.05, .34, 1.62, .1, .05);
    } else if (area === 4) {
      // Crystal Reach: a little prism observatory with a three-shard crown.
      for (const x of [-.62, .62])
        box(group, '#4a7185', x, 1.12, 0, .11, 2.25, .11);
      box(group, '#6d94a6', 0, 2.18, 0, 1.52, .12, .14);
      for (let shard = 0; shard < 3; shard++) {
        const crystal = cone(group, ['#79c5d8', '#9b8de4', '#b9e5ee'][shard],
          (shard - 1) * .42, 2.65 + shard * .16, 0, .32, 1.2 + shard * .18, .32);
        crystal.rotation.z = (shard - 1) * .16;
      }
    } else {
      // Mooncap: a cozy tent and paired firefly lamps establish a clear night
      // chapter silhouette while leaving the road itself quiet.
      cone(group, '#6d5f91', 0, 1.28, 0, 1.1, 2.15, .9).rotation.y = Math.PI / 4;
      box(group, '#e1c77a', 0, 1.1, .64, .34, .5, .05);
      for (const x of [-.85, .85]) {
        mesh(group, trunkGeometry, '#806d91', x, 1.25, 0, .08, 2.5, .08);
        ball(group, '#e8d8ee', x, 2.35, -.08, .16, .16, .16);
      }
      mesh(group, mushroomCapGeometry, '#ae91c4', 0, .32, -.16, .42, .25, .38);
    }
}

// Overhead role: tall pieces rooted at the shoulder with interest up high,
// leaning outward so nothing crosses the lane window. Fixed variants keep the
// recycled instances deterministic; frond/cap pieces sway through the
// existing motion path.
export function buildOverhead(area, group, index, helpers) {
  const {box, ball, cone, mesh, trunkGeometry, featheredPalmGeometry, mushroomCapGeometry} = helpers;
  const side = sideFor(area, index);
  if (area === 0) {
    // Sunleaf: a tall trunk with its crown pushed out over the verge.
    mesh(group, trunkGeometry, '#4e5a38', 0, 2.75, 0, .34, 5.5, .34);
    ball(group, '#2c6b4c', side * 1.1, 5.6, 0, 1.5, 1.1, 1.3);
    ball(group, '#41805a', side * 1.9, 5.0, .2, 1.1, .85, 1.0);
    ball(group, '#ffe49a', side * .6, 4.6, -.6, .11, .11, .11);
  } else if (area === 1) {
    // Bamboo: a lantern post with a short crossarm and a hanging lantern.
    mesh(group, trunkGeometry, '#5f7f47', 0, 3.1, 0, .16, 6.2, .16);
    box(group, '#6b5a41', side * .45, 5.3, 0, 1.5, .14, .16);
    box(group, '#8a6a45', side * .45, 5.3, 0, 1.54, .05, .2);
    box(group, '#c08a4e', side * .9, 4.75, 0, .1, .5, .1);
    box(group, '#c89154', side * .9, 4.35, 0, .3, .42, .26);
    ball(group, '#ffe09a', side * .9, 4.35, -.2, .1, .12, .1);
  } else if (area === 2) {
    // Redrock: a stone leg with a cap band leaning away from the road.
    box(group, '#8e443b', 0, 2.25, 0, .55, 4.5, .6);
    const cap = box(group, '#df9562', side * .3, 4.7, 0, 2.3, .26, .7);
    cap.rotation.z = side * .1;
    box(group, '#f2bd77', side * .3, 4.35, 0, 1.7, .08, .5);
  } else if (area === 3) {
    // Oasis: a palm leaning out over the verge, crown held high.
    const trunk = mesh(group, trunkGeometry, '#7a5c3e', side * .45, 2.6, 0, .26, 5.2, .26);
    trunk.rotation.z = side * .17;
    for (let frond = 0; frond < 4; frond++) {
      const angle = frond * Math.PI * 2 / 4 + .4;
      const leaf = mesh(group, featheredPalmGeometry, frond % 2 ? '#4d8458' : '#75aa68',
        side * .9 + Math.cos(angle) * 1.1, 5.2, Math.sin(angle) * 1.1, 1.5, .95, 1.0);
      leaf.rotation.y = -angle;
    }
  } else if (area === 4) {
    // Crystal Reach: twin shards branching up and outward.
    const tall = cone(group, '#5fc5d9', side * .2, 2.6, 0, .5, 5.2, .55);
    tall.rotation.z = side * .1;
    const short = cone(group, '#8e82d9', side * .9, 1.9, 0, .4, 3.8, .45);
    short.rotation.z = side * .22;
    ball(group, '#b9eaff', 0, .35, -.3, .5, .3, .3);
  } else {
    // Mooncap: a tall stem with its cap tipped toward the verge.
    mesh(group, trunkGeometry, '#5d5170', 0, 2.1, 0, .26, 4.2, .26);
    mesh(group, mushroomCapGeometry, '#745fa0', side * .5, 4.35, 0, 1.7, .95, 1.4);
    ball(group, '#d8cae8', side * .5, 3.9, -.85, .13, .13, .13);
  }
}

// Ground role: low scatter hugging the verge, never above knee height so it
// cannot read as a hazard. Muted tones only — no bone cream, no clearance
// mint, nothing that competes with pickups or cues.
export function buildGround(area, group, helpers) {
  const {box, ball, cone, mesh, trunkGeometry, palmFrondGeometry, mushroomCapGeometry} = helpers;
  if (area === 0) {
    // Sunleaf: fern tufts and a pebble.
    for (const tuft of [-.3, .1, .42]) {
      const frond = mesh(group, palmFrondGeometry, tuft > .3 ? '#6e9b5b' : '#557f49',
        tuft, .22, .05, .3, .3, .35);
      frond.rotation.z = tuft * .8;
    }
    ball(group, '#8a8a6a', -.15, .08, .3, .22, .12, .18);
  } else if (area === 1) {
    // Bamboo: reed shoots.
    for (const shoot of [-.28, 0, .3]) {
      mesh(group, trunkGeometry, '#68884f', shoot, .26, 0, .07, .52, .07);
      box(group, '#a4b56d', shoot, .3, 0, .1, .04, .1);
    }
  } else if (area === 2) {
    // Redrock: dust pebbles.
    for (let rock = 0; rock < 3; rock++) {
      const pebble = cone(group, rock === 1 ? '#c07a4e' : '#96502f',
        (rock - 1) * .3, .12 + rock * .1, .05, .3 - rock * .04, .24 + rock * .1, .26);
      pebble.rotation.z = (rock - 1) * .18;
    }
  } else if (area === 3) {
    // Oasis: shells and a grass tuft.
    ball(group, '#d9c08a', -.25, .07, .1, .16, .09, .13);
    ball(group, '#c8a878', .05, .06, -.15, .13, .08, .11);
    const tuft = cone(group, '#6da05d', .32, .2, .1, .16, .4, .16);
    tuft.rotation.z = .2;
  } else if (area === 4) {
    // Crystal Reach: glimmer stones in cool muted tones.
    const shard = cone(group, '#6ea8bd', -.2, .2, 0, .16, .4, .18);
    shard.rotation.z = -.14;
    ball(group, '#8fa9bd', .18, .09, .1, .2, .11, .16);
  } else {
    // Mooncap: a tiny cap and a night pebble.
    mesh(group, trunkGeometry, '#665a7d', -.15, .15, 0, .07, .3, .07);
    mesh(group, mushroomCapGeometry, '#7d78b0', -.15, .32, 0, .3, .17, .26);
    ball(group, '#5c5878', .25, .07, .1, .18, .1, .15);
  }
}

// Far role: a second depth layer far behind the shoulder. Big simple shapes
// in muted destination tones; the existing haze and narrow portrait frustum
// keep them as backdrop, never as lane clutter.
export function buildFar(area, group, helpers) {
  const {box, ball, cone, mesh, trunkGeometry, featheredPalmGeometry, mushroomCapGeometry} = helpers;
  if (area === 0) {
    // Sunleaf: a giant tree.
    mesh(group, trunkGeometry, '#3d4c30', 0, 4.5, 0, .9, 9, .9);
    ball(group, '#234f38', -.8, 9.2, 0, 2.6, 2.1, 2.3);
    ball(group, '#356b4b', 1.1, 8.4, .3, 2.1, 1.7, 1.9);
    ball(group, '#2c5f43', 0, 10.2, -.3, 1.8, 1.5, 1.6);
  } else if (area === 1) {
    // Bamboo: a tall cluster.
    for (const stalk of [-1.2, -.4, .4, 1.2]) {
      const height = 8 + ((stalk + 1.2) % 2) * 1.6;
      mesh(group, trunkGeometry, '#4e7040', stalk, height / 2, 0, .3, height, .3);
    }
    ball(group, '#5d8148', -.6, 9.4, 0, 1.1, .7, .9);
    ball(group, '#6d9155', .7, 8.8, .2, .9, .6, .8);
  } else if (area === 2) {
    // Redrock: a far mesa.
    cone(group, '#8e443b', 0, 4.5, 0, 3.1, 9, 2.6);
    box(group, '#df9562', 0, 9.1, 0, 2.1, .4, 1.7);
    ball(group, '#c07a52', -2.2, .6, .4, 1.6, .7, 1.2);
  } else if (area === 3) {
    // Oasis: leaning palms and a dune.
    for (const lean of [-1, 1]) {
      const trunk = mesh(group, trunkGeometry, '#6b5138', lean * 1.4, 3.2, 0, .4, 6.4, .4);
      trunk.rotation.z = lean * .14;
      for (let frond = 0; frond < 3; frond++) {
        const angle = frond * Math.PI * 2 / 3;
        const leaf = mesh(group, featheredPalmGeometry, frond % 2 ? '#4d8458' : '#69965c',
          lean * 1.4 + Math.cos(angle) * 1.6 + lean * .9, 6.4, Math.sin(angle) * 1.6, 1.9, 1.2, 1.4);
        leaf.rotation.y = -angle;
      }
    }
    ball(group, '#c2a05e', 0, .1, 1.6, 2.6, .8, 1.8);
  } else if (area === 4) {
    // Crystal Reach: a distant spire cluster.
    for (let shard = 0; shard < 3; shard++) {
      const height = 7 + shard * 1.1;
      const crystal = cone(group, ['#4e9db4', '#7a6fc0', '#93c9d8'][shard],
        (shard - 1) * 1.1, height / 2, 0, .8, height, .85);
      crystal.rotation.z = (shard - 1) * .08;
    }
    ball(group, '#7ba5c0', 0, .4, .4, 1.7, .5, 1.3);
  } else {
    // Mooncap: giant rings on the horizon.
    for (const ring of [-1, 1]) {
      mesh(group, trunkGeometry, '#524a68', ring * 1.2, 2.6, 0, .5, 5.2, .5);
      mesh(group, mushroomCapGeometry, ring < 0 ? '#6a5f96' : '#8f7fb8',
        ring * 1.2, 5.4, 0, 2.1, 1.2, 1.8);
    }
  }
}

// Built role: the storytelling layer, where the cast and the world meet.
// Small fences, signs, shelters and markers at the shoulder — compact pieces
// in wood, canvas and muted paint, never in pickup or hazard colors, and low
// enough to stay out of the cue sightlines. Three pieces per destination,
// dealt out by index.
export function buildBuilt(area, group, index, helpers) {
  const {box, ball, cone, mesh, trunkGeometry} = helpers;
  const piece = index % 3;
  if (area === 0) {
    // Sunleaf: shelter fence, notice board, hitch rail with lantern.
    if (piece === 0) {
      for (const post of [-.8, 0, .8]) box(group, '#6b543a', post, .6, 0, .12, 1.2, .12);
      for (const rail of [.45, .85]) box(group, '#8a6c48', 0, rail, 0, 1.75, .09, .09);
    } else if (piece === 1) {
      for (const post of [-.45, .45]) box(group, '#5d4a34', post, .8, 0, .12, 1.6, .12);
      box(group, '#cdbb92', 0, 1.15, 0, 1.05, .68, .08);
      box(group, '#b45f45', 0, 1.15, .06, .6, .1, .03);
    } else {
      for (const post of [-.6, .6]) box(group, '#5d4a34', post, .55, 0, .12, 1.1, .12);
      box(group, '#8a6c48', 0, 1.05, 0, 1.35, .09, .09);
      box(group, '#7a5c3f', 0, .82, .1, .22, .3, .18);
      ball(group, '#ffe09a', 0, .82, -.06, .09, .1, .09);
    }
  } else if (area === 1) {
    // Bamboo: mini torii, stone lantern, pole rack.
    if (piece === 0) {
      for (const post of [-.7, .7]) mesh(group, trunkGeometry, '#67784a', post, 1.1, 0, .16, 2.2, .16);
      box(group, '#6b5a41', 0, 2.25, 0, 1.75, .18, .2);
      box(group, '#c08a4e', 0, 1.5, -.2, .3, .42, .2);
    } else if (piece === 1) {
      box(group, '#8b8d7d', 0, .15, 0, .5, .3, .5);
      box(group, '#9a9c8b', 0, .65, 0, .24, .7, .24);
      box(group, '#c8a05e', 0, 1.1, 0, .3, .32, .3);
      box(group, '#7d7f72', 0, 1.42, 0, .48, .12, .48);
    } else {
      for (const post of [-.8, .8]) mesh(group, trunkGeometry, '#67784a', post, .8, 0, .14, 1.6, .14);
      mesh(group, trunkGeometry, '#7d8b58', 0, 1.55, 0, .1, 1.9, .1).rotation.z = Math.PI / 2;
    }
  } else if (area === 2) {
    // Redrock: trail cairn, ranger flag, supply crates.
    if (piece === 0) {
      for (let rock = 0; rock < 3; rock++) {
        const cairn = cone(group, rock === 1 ? '#c07a4e' : '#96502f',
          0, .3 + rock * .42, 0, .55 - rock * .09, .55 + rock * .1, .5);
        cairn.rotation.y = rock * 1.1;
      }
      box(group, '#e8b478', 0, 1.75, 0, .4, .1, .34);
    } else if (piece === 1) {
      mesh(group, trunkGeometry, '#59423d', 0, 1.5, 0, .09, 3, .09);
      const pennant = box(group, '#d88a4e', .42, 2.6, 0, .68, .36, .05);
      pennant.rotation.z = -.1;
    } else {
      box(group, '#8a6844', 0, .35, 0, .7, .7, .7);
      box(group, '#75593a', .08, .95, 0, .55, .55, .55);
      box(group, '#5d4a34', 0, .62, .36, .6, .08, .03);
    }
  } else if (area === 3) {
    // Oasis: market awning, water jar, mooring post.
    if (piece === 0) {
      for (const post of [-.7, -.23, .23, .7]) box(group, '#6b5138', post, 1, 0, .11, 2, .11);
      for (const stripe of [-.55, 0, .55]) {
        box(group, stripe === 0 ? '#c8b183' : '#b45f45', stripe, 2.05, 0, .62, .1, 1.0);
      }
      box(group, '#6b5138', 0, 1.92, 0, 1.85, .08, 1.0);
    } else if (piece === 1) {
      ball(group, '#b08954', 0, .5, 0, .62, .72, .55);
      mesh(group, trunkGeometry, '#8a6844', 0, 1.0, 0, .2, .3, .2);
      ball(group, '#7ec2b2', 0, 1.12, 0, .16, .08, .16);
    } else {
      mesh(group, trunkGeometry, '#6b5138', 0, .7, 0, .14, 1.4, .14);
      box(group, '#8a6c48', 0, 1.28, 0, .3, .12, .3);
      ball(group, '#d9c08a', 0, 1.05, .2, .14, .16, .14);
    }
  } else if (area === 4) {
    // Crystal Reach: survey plinth, shard marker, beacon post.
    if (piece === 0) {
      mesh(group, trunkGeometry, '#5a6b8c', 0, .6, 0, .4, 1.2, .4);
      box(group, '#7c8dab', 0, 1.28, 0, .9, .14, .9);
      ball(group, '#b9eaff', 0, 1.5, 0, .14, .14, .14);
    } else if (piece === 1) {
      ball(group, '#5f6f96', 0, .15, 0, .7, .3, .6);
      const shard = cone(group, '#6ec6d8', .1, .9, 0, .34, 1.4, .36);
      shard.rotation.z = .14;
    } else {
      mesh(group, trunkGeometry, '#5a6b8c', 0, 1.1, 0, .12, 2.2, .12);
      ball(group, '#cfe8ef', 0, 2.3, 0, .17, .2, .17);
      cone(group, '#7c8dab', 0, 2.55, 0, .24, .3, .24);
    }
  } else {
    // Mooncap: trail tent, lamp post, log bench.
    if (piece === 0) {
      cone(group, '#5d557f', 0, .8, 0, .95, 1.6, .85).rotation.y = Math.PI / 4;
      box(group, '#3c3752', 0, .45, .72, .4, .6, .06);
      ball(group, '#e4c77d', 0, 1.15, .3, .16, .2, .12);
    } else if (piece === 1) {
      mesh(group, trunkGeometry, '#564e70', 0, 1.1, 0, .11, 2.2, .11);
      ball(group, '#cbb8e8', 0, 2.3, 0, .2, .22, .2);
      ball(group, '#564e70', 0, 2.52, 0, .24, .08, .24);
    } else {
      const bench = mesh(group, trunkGeometry, '#5d4f42', 0, .4, 0, .28, 1.6, .28);
      bench.rotation.z = Math.PI / 2;
      for (const leg of [-.55, .55]) box(group, '#4c4136', leg, .18, 0, .24, .36, .24);
    }
  }
}
