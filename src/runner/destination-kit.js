// Destination kits: one record per landscape, owning its look.
//
// Step 3 of the visual identity overhaul. Today's destination scenery moves
// onto kits as a pure refactor: the four builders below are the renderer's
// former per-area branches, relocated verbatim and parameterized only by a
// helpers object, so the seeded random stream and every mesh are unchanged.
// The renderer keeps placement (counts, offsets, shoulder zones); the kit
// owns the per-destination parameters for the shoulder family plus reserved
// slots for the overhead, ground-clutter, far-band and built roles that the
// next slice fills area by area. Textures stay at zero new; no geometry is
// added or removed here.
import {AREAS} from './areas.js';

// Role vocabulary for destination kits. Only `shoulder` is populated in
// this slice; the rest are explicitly reserved (null) so a half-authored
// area fails the kit test instead of shipping an empty destination.
export const KIT_ROLES = Object.freeze(['shoulder', 'overhead', 'ground', 'far', 'built']);

export const DESTINATION_KITS = Object.freeze(AREAS.map((area, index) => Object.freeze({
  area: index,
  name: area.name,
  roles: Object.freeze({
    shoulder: Object.freeze({count: 12, spacing: 8.4, offset: index * 17}),
    overhead: null,
    ground: null,
    far: null,
    built: null,
  }),
})));

export function kitFor(area) {
  return DESTINATION_KITS[area] ?? null;
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
