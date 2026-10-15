# SPECIAL ROUND — topology combat

The arena is an independent page at `/special/index.html`. The combat revision
continues the existing SPECIAL ROUND and reuses the existing character rigs.
Only files under `special/` affect runtime behavior. Levels 1–3, root UI,
learning content, shared characters and all existing photo files are unchanged.

## Player flow and victory rule

1. The opponent holds the round's reference model.
2. Select one offered model. The player's left hand immediately holds it.
3. Start the fight. Both fighters approach, exchange four punches and recoil.
4. A **homeomorphic choice wins**. A non-homeomorphic choice **loses**. The
   winner delivers the fifth, decisive strike; the loser staggers back.
5. Read the explanation, then advance to the next reference. Four rounds record
   wins and losses. Restart also works during a fight and cancels its result.

There are no true/false claims, correct-rejection wins, shared round victories,
second-player answers or timing-based outcomes. Health bars visualize the
already determined result; extra clicks and animation speed cannot change it.

## Files

- `rules.js`: existing finite catalogue and homeomorphism classification;
  select → fighting → result → complete state, exactly-once scoring.
- `combat.js`: deterministic approach, alternating strikes, recoil, charge,
  decisive contact, defeat and celebration. Pure time sampling is testable.
- `scene.js`: existing 3D rig plus arena-only gloves, poses, held models,
  lighting, ring, impact rays and camera. Shared rig/dress sources are untouched.
- `controller.js`: selection cards, locked combat input, health/results, round
  progression and cancellation. No production test hooks or global game state.
- `icons.js`, `index.html`, `special.css`: catalogue previews and responsive HUD.
- `rules.test.js`, `integration.test.js`: exhaustive offered-choice outcomes,
  state/timing regressions and byte preservation of the main game.
- `browser-smoke.mjs`: actual Chrome/WebGL UI flows and reproducible contact
  screenshots. It controls browser time for contact captures and separately
  plays one mobile reduced-motion fight in real time.

## Existing portraits

The red fighter uses `hood.png`; the yellow fighter uses
`avatar-cat-head.png`, matching the main game's existing characters. Neither
texture is cropped or changed. All four original face files and the earlier
`special/assets/` uploads remain intact. Faces remain attached to the same
head/torso hierarchy and use the existing camera-facing photo convention.

## Mathematical scope

This is a finite catalogue, not a general mesh classifier. Surfaces mean their
whole boundary, not the filled solid. They are connected, closed, orientable
2-manifolds: sphere/egg have genus 0; torus/elongated torus have genus 1.
Curves have no interior or thickness: circle/ellipse are simple closed curves;
segment/bent segment are compact intervals including both endpoints.
Surfaces and curves differ in dimension and are not homeomorphic. The tube
thickness and endpoint markers are visual aids, not part of the classified
space. Do not classify arbitrary meshes by their silhouettes alone.

## Motion and lifecycle

Optional camera drift, hit shake and victory jumping default off under
`prefers-reduced-motion`. The meaningful fight poses still play. There are no
strobe effects. Hiding the tab pauses fight time; returning resumes it. Restart
clears the current animation mode and cannot award a stale point. Page exit
cancels animation, disconnects resize/visibility listeners and releases WebGL
resources. No API keys, remote assets or new runtime dependencies are needed.

## Validation

Run `npm test` for 31 Node checks. The existing GitHub Actions workflow runs
`node special/browser-smoke.mjs` and the unchanged main-game Chrome suite.
Screenshots are saved to the workflow's `game-test-screenshots` artifact.

Verified code: `6d65327661182faec892cd9c905e017b6de32efc`.
[Chrome/WebGL CI run](https://github.com/hodo-12/flex-math/actions/runs/38688157591)
passed on 2026-10-15: all 31 Node checks, SPECIAL ROUND interactions including
mobile automatic arena scrolling, and the unchanged main-game browser suite
(level 3 wrong/correct/completion, level 1/2 entry, atlas and quiz).

Actual browser screenshots, not mockups:

- [Opponent counterpunch](special-combat-preview/rival-counter.png)
- [Player's decisive contact](special-combat-preview/finishing-hit.png)
- [Homeomorphic choice: victory](special-combat-preview/win.png)
- [Non-homeomorphic choice: mobile defeat](special-combat-preview/mobile-loss.png)
