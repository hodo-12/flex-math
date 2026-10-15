# BONUS ROUND — topology b-boy battle

Open `/bonus/index.html` from the new lobby entry. Existing levels and the
SPECIAL ROUND remain unchanged. The red princess is the player; the yellow
princess is the opponent. Select a model, then start the dance battle.

The unchanged `special/rules.js` supplies the finite topology catalogue,
classification, explanations and exactly-once round scoring. A homeomorphic
choice always wins; any other choice loses. The four rounds are independent
from every other game's state. Dance timing and the optional beat cannot
change the result.

Both original characters perform top-rock, floor footwork and one-hand freezes.
The winner performs a final two-turn power spin, holds a freeze, recovers and
celebrates. The other dancer yields the floor. Selected models move to stage
plinths during the routine so both hands can dance. Face image bytes, common
rig and common dress code are untouched. The bonus-only pose adapter gathers
the skirt at the same waist seam for floorwork and restores it on exit/reset.

`choreography.js` samples the dance timeline. `dance-rig.js` applies poses to
the existing hierarchy and anchors the supporting hand to the floor.
`scene.js` owns the renderer/stage and pauses the timeline when hidden.
`beat.js` synthesizes an optional original 108 BPM loop with Web Audio. Sound
is off until explicitly enabled. Reduced motion removes power-spin rotation,
camera drift and repeated victory jumping while keeping meaningful poses.

No new dependencies, external assets, API keys, models or face generation.
The only main-page change is one BONUS link. Shared CSS and catalogue modules
are imported read-only. The old preservation test now allows that exact link;
`baseline.json` also verifies byte-for-byte preservation of existing runtime
files, SPECIAL ROUND and original face photos.

Checks: `npm test`, `node --test bonus/bonus.test.js`.
The existing GitHub Actions workflow also executes `node bonus/browser-smoke.mjs`
with Chrome/WebGL and stores `bonus-previews/` in its screenshot artifact.
The screenshot harness preserves WebGL's drawing buffer while its clock is
paused; a separate mobile test uses normal rendering and real time.

## Verified version and real browser previews

Runtime commit: `e9a92925615b2ca85e193f3be9f7a097385df0f3`.
[CI run 38696725418](https://github.com/hodo-12/flex-math/actions/runs/38696725418)
passed on 2026-10-15: 31 existing Node checks, 7 bonus checks, the bonus
Chrome/WebGL suite, unchanged SPECIAL ROUND browser suite, and the unchanged
main-game browser suite (level 3 incorrect/correct/completion, levels 1/2 entry,
atlas and quiz).

Actual rendered screenshots:

- [Red princess power spin](previews/power-spin.png)
- [Yellow princess one-hand freeze](previews/yellow-freeze.png)
- [Homeomorphic choice wins](previews/win.png)
- [Other structure loses on mobile](previews/mobile-loss.png)
