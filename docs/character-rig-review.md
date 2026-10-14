# Character rig review — PR #3, not deployed

Continues the existing `feature/realistic-character-rig-no-deploy` rig at `6c6ed9b`.
No change to main, Pages, levels, mission data, atlas, quiz, badges, controls or UI.
The four face files remain byte-for-byte unchanged. No generated facial images or external model/API dependencies.

## What changed

- Retained the procedural rig API and materials; replaced the cylinder torso with a shaped, elliptical shoulder–chest–waist garment. Rounded overlapping sleeves and knees hide disconnected joints.
- Shoulders inherit torso movement; hips inherit pelvis movement. Four body proportions and garment silhouettes: olive zip hoodie, charcoal bomber, coral pullover hoodie, teal windbreaker. Collars, cuffs, seams, pocket openings, zipper pull, drawstrings, tapered trousers, rounded soles and laces.
- Existing click-to-walk now accelerates/brakes at 4.5 world units/s², up to 1.65 units/s. No control changes. Gait advances by measured horizontal travel, not elapsed time.
- Two-bone inverse kinematics places ankles at world-space contacts during stance; raised swing trajectories and sequential settling steps reduce sliding. Pelvis and chest counter-rotate with smoothed direction changes.
- Breathing moves the torso slightly, not the planted feet. Celebration has anticipation, flight, arm raise, landing compression and recovery; existing fireworks and result dialogs are unchanged.
- Face remains the original camera-facing photo on a head parented to the torso, centred over the neck. This deliberately uses a 2.5D portrait convention even from behind; it does not invent missing profile/rear facial detail. The face material remains unlit and has depth testing disabled, as in the existing branch, to prioritise visibility. This can draw the photo over nearby scenery.

## Verification

`node --test mission.test.js character-rig.test.js` checks all three levels' mission logic plus all four rigs' face identity, hierarchy, finite transforms, stance contact error, stopping, celebration and reset.

The existing GitHub Actions workflow runs the existing game smoke test, then `character-preview.mjs` in Chrome with software WebGL. It captures the four-character studio in idle/walk/turn/rear/cheer/landing poses; each character inside the game in idle/walk/turn; and actual completion of levels 1, 2 and 3 after a wrong answer. Screenshots are uploaded in the `game-test-screenshots` artifact under `character-previews/`.

`tests/character-studio.html` is a development-only review fixture, not linked from the game's UI. Its lighting is a neutral review setup; game lighting is unchanged. Browser assertions test runtime behavior, not aesthetic quality. Review the screenshots before merging. This branch has no deploy job and must not be merged/published without the user's explicit request.
