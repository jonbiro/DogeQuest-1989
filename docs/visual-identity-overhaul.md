# Visual identity overhaul — hazard cast and destination kits

Design spec. 2026-09-17. Approved in outline; not yet implemented.

Goal: the six destinations should feel like distinct places worth traveling
through, and the obstacles should have character — a pound officer sweeping a
net, not a rock.

## Diagnosis

Two different problems wear the same complaint.

**Hazards really are one shape recolored.** `render.js` resolves a hazard's
appearance with a single ternary:

```js
const renderType = object.type === 'rock' && object.courseRegion === 2 ? 'crystal-rock' : object.type;
item = pools[renderType].pop() || templates[renderType].clone();
themeHazard(item, renderType, object.at, mat);
```

One geometry per type, recolored from a six-entry palette table in
`hazard-palette.js`. `crystal-rock` is the only exception and it is a ternary,
not a system. A hazard's rule and its appearance are the same string, which is
why a new character cannot be added without touching eleven modules.

**Scenery is not recolored — it is thin.** All six areas already have bespoke
geometry in all five scenery slots (`render.js` chains at lines 410, 488, 562,
632, 779; areas 0–4 explicit, area 5 via `else`). The "generic round trees"
comment is historical. The actual problem is that each slot builds *one* shape
with small random jitter, and every slot plays the same structural role: a
vertical object at the roadside. Six good silhouettes, each repeated for 225
units, all standing in the same place doing the same job. Nothing overhead,
nothing on the ground, nothing in the middle distance, and no evidence that
anyone has ever been there.

So the fix is not "make the areas differ" — that work is done. It is depth of
vocabulary and variety of role.

## Decisions taken

- **Procedural now, painted art later.** Obstacle appearance is swappable by
  design. Characters ship as procedural meshes; the registry is the seam where
  sprite-backed art replaces them without gameplay changing.
- **Tone: mildly menacing.** A pantomime villain, non-violent and stylized. The
  game keeps its warmth — hearts, unlimited retries, "every good dog gets
  another go."
- **One spec covering both subsystems**, because the obstacles and the places
  should be designed to fit each other.
- **No new textures.** Gameplay measured at ten small static canvases against
  the ten budgeted (re-baselined with measurement 2026-09-18; the route-label
  atlas and pickup badge upload on first gameplay render), so the procedural
  decision remains a constraint, not a preference.

## Section 1 — The hazard cast

Split the rule from the appearance.

**`HAZARD_CAST`** — the gameplay contract. One entry per type: clearing rule
(`jump` / `slide`), collision box, and personality copy for cues, mistakes and
HUD labels. `SOLID_HAZARDS` and the clearing branch in `world.js` derive from
this instead of being hand-listed in five places. Gameplay keeps referring to
types exactly as it does now; nothing about fairness or collision changes shape.

**`appearanceFor(type, area)`** — the visual contract, replacing the ternary.
Returns a render key, so `dogcatcher` resolves to `catcher-warden` in Sunleaf
and `catcher-lantern-keeper` in Bamboo: same silhouette, same slide rule,
different dress. `crystal-rock` becomes one row of data.

**The cast** — four characters sharing two silhouette families so pooling stays
cheap. Only two are new hazard *types*; the other two are re-dresses routed
through `appearanceFor`, costing no taxonomy change and no fairness risk.

| Character | Rule | New type? | Read |
| --- | --- | --- | --- |
| Pound officer | slide | New type | Sweeps a net at dog height; duck under it |
| Wheeled crate cart | jump | New type | A low trolley of empty cages shoved across the lane |
| Warden's gate | slide | Re-dress of `gate` | Pound fence and pole instead of a stone arch |
| Feed sacks | jump | Re-dress of `rock` | Stacked, tied and tumbling instead of a boulder |

That split matters: `CLEARED_BY_JUMP` / `CLEARED_BY_SLIDE` and the fairness
probe gain exactly two entries, while two of the four visible changes carry no
gameplay risk whatsoever.

The officer is a **slide** obstacle deliberately. The trail currently has far
more jump obstacles than slides, so the most threatening thing teaches the
least-practiced move. That is the mechanical reason he is worth adding, not
just the visual one.

**Cost:** two new geometry families (officer, cart). Geometries 26 → ~30 of 37.
No new textures. Draw calls unchanged — these replace rocks rather than adding
to the scene.

**Touches:** `world.js`, `hazard-palette.js`, `guidance.js`, `mistakes.js`,
`practice.js`, `courses.js`, `areas.js`, `render.js`, and the
`CLEARED_BY_JUMP` / `CLEARED_BY_SLIDE` sets in `test/trail-fairness.test.js`.

## Section 2 — Destination identity

**Four roles instead of one.** Alongside the existing shoulder object:

- *Overhead* — canopy, lantern wires, rock arches.
- *Ground clutter* — low scatter near the verge.
- *Far silhouette band* — a second depth layer behind the shoulder.
- *Built layer* — fences, signs, a shelter, a parked cart, lamp posts.

The built layer is what answers "no sense of place or story," and it is where
the cast and the world meet: the officer's crate cart, his fence, his notice
board.

**Variety from parameters, not new meshes.** Each role gets a small shared
geometry set. Areas differ by parameters — scale, tilt, color, spacing, count,
arrangement — drawn from a per-area kit. Three or four distinct variants per
slot without six times the geometry.

**The road stops being one ribbon.** Surface treatment and edge trim move into
the kit: boardwalk in Oasis, cut stone in Redrock.

**Budget.** Ground clutter and the far band go through the existing
`createInstanceBatch`, the same path bones already use, so density costs draw
calls sublinearly and geometry not at all.

| Metric | Now | Ceiling | Budget |
| --- | --- | --- | --- |
| geometries | 26 | 36 | 37 |
| draw calls | 139 | 210 | 260 |
| objects | 26 | — | 200 |
| textures | 9 | 9 | 9 |

If it will not fit, the kit sheds the far band first.

## Section 3 — Validation and rollout

**Testing.** Three existing guards become the safety net, each updated
deliberately rather than quietly relaxed:

- `trail-fairness.test.js` — the clearing sets gain the new cast, so the
  perfect-player probe proves 40 seeds stay survivable *with* the officer in
  the mix. Its sensitivity test (a passive player must lose hearts on every
  seed) keeps that honest. This is the main reason adding a hazard type is safe.
- `runner-resource-budget` — measured with the QA fixture before and after, in
  camp and in game. Numbers recorded here. Any budget increase ships with the
  measurement attached, never silently.
- `runner-contrast` / `bone-contrast` — the new cast and clutter must not make
  bones or hazards harder to read. Density is where playability quietly erodes.

New coverage: a cast-registry test that every type has a clearing rule,
collision box and copy; and a kit test that all six destinations populate every
role, so a half-authored area fails CI instead of shipping empty.

**Rollout**, each step independently green and committable:

1. `HAZARD_CAST` + `appearanceFor`, with today's obstacles moved onto them
   unchanged. Pure refactor, no visible difference.
2. The four-character cast, procedural.
3. Destination kits, with today's scenery moved onto them. Pure refactor.
4. The new roles and the built layer, area by area.

Steps 1 and 3 carry risk without reward, so they land first and alone.

**Risks.**

- *iPhone.* More geometry on a device that already evicts WebGL contexts. The
  budget ceiling is the guard, but emulation will not prove it — only the phone
  will. This remains the standing validation gate for the project.
- *Tone drift.* Four menacing characters plus fences and notice boards could tip
  "cozy with a villain" into "grim." Review partway through step 2, not at the
  end.
- *Texture cap.* Painted art is capped at 640px on mobile; a future sprite atlas
  must respect it.

**Blocker.** At time of writing the working tree has uncommitted changes to
`areas.js`, `render.js`, `world.js`, `trail-palette.js`, `corner-road.js` and
`impact-color.js` — every file steps 1 and 3 rewrite. That work must be
committed or parked before implementation starts.

## Open questions

- Which destination hosts the pound officer first? A staged introduction reads
  better than all four characters appearing at once.
- Does the officer need an idle animation, or is a static sweep pose enough at
  chase distance? Animation costs no textures but does cost per-frame work.

## Implementation status (2026-09-18)

- Steps 1–3 shipped as pure refactors: `hazard-cast.js` (rules/appearance
  split), the cast registry consumed by world/palette/cues/practice/fairness,
  and `destination-kit.js` with today's scenery moved onto it byte-identical.
- Step 2 shipped the four-character cast procedurally: `pound-officer`
  (slide) and `crate-cart` (jump) rotate through staged shelter beats, with
  `warden-gate` (Sunleaf) and `feed-sacks` (Oasis) as zero-taxonomy re-dresses.
  Staging is by encounter order (worker, officer, then the trio rotates).
  The officer keeps the crew uniform and a translucent net; tone stays
  pantomime. A 40-seed live probe to 3,200m proves survivability with the
  full cast in the mix.
- Step 4 shipped all four roles for all six destinations: overhead (tall,
  outward-leaning), ground clutter (below knee height, muted), far band
  (second depth layer) and built storytelling pieces (three per destination:
  fences, signs, shrines, stalls, cairns, tents). All reuse shared geometry
  through the existing instanced batches: zero new geometries, textures or
  draw calls. Road-surface treatments (Oasis boardwalk, Redrock cut stone)
  shipped as a follow-up: area-filtered instanced strips that hide like road
  slabs at corners, gaps and bridges but keep authored wood/stone colors.
- Open questions resolved: the officer joined second by encounter order with
  a small net-sway animation (frozen under reduced motion).
