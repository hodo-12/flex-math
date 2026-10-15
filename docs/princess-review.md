# Princess wardrobe — development review only

Continues `feature/realistic-character-rig-no-deploy` at `d7eaa63` (the final rig of already merged PR #3). The new review is PR #4. Do not merge or deploy without a new user request.

| Original character | Dress | Details |
|---|---|---|
| hood | Ruby red | Gold edging, open front overskirt, rear ribbon, small bodice jewel |
| smile | Sapphire blue | Pale blue overskirt, scalloped lace-style edging, pearl neckline, side ribbon |
| cat | Sunshine yellow | Petal-shaped overskirt, waist flowers, rounded puff sleeves |
| cap | Rose pink | Two frill tiers, front ribbon, small heart detail |

All wear matching rounded Mary Jane shoes and ivory glove/stocking accents. Original photo textures and the camera-facing head convention are retained.

## Scope

- `character-dress.js`: independent costume module; shaped bodice, puff sleeves, layered pleated skirt, details, shoes, bounded hem motion.
- `character-rig.js`: attaches the costume to the existing torso, hides old outer clothing, preserves head/IK/walking/jump logic. Arms rest slightly wider to clear the skirt.
- `character-style.css`, `index.html`: original selection layout and controls; only costume drawings and outfit labels change.
- `character-rig.test.js`: additional costume colour, fixed waist seam, bounded deformation, ground-clearance and texture identity checks.
- `character-preview.mjs`, `tests/character-studio.html`: actual Chrome screenshots of all four gowns in idle, walk, turn, rear, cheer and landing poses, plus desktop/mobile selection and game views.

`app.js`, `state.js`, `learning.js`, main UI styles, level layouts and all four photo files remain byte-for-byte unchanged. No new runtime libraries, API keys or image generation. No Pages workflow or hosting change.

## Cloth behavior and limits

This is procedural secondary motion, not physical cloth simulation. All panels and trim share the same displacement function: the waist stays fixed, while hem sway and expansion are bounded. The skirt follows the existing torso's orientation so it cannot detach during turns or jumps. The wide hem encloses the leg cycle; shoes may appear below the hem by design.

The retained face is a frontal 2D photograph that faces the camera, including from a rear orbit. No synthetic profile or rear face is created. This remains the existing game's 2.5D presentation.

## Checks

- 17 Node tests pass: 8 existing mission tests and 9 rig/costume tests.
- Tested waist seam displacement: zero; maximum sampled fabric displacement: 0.038 world units.
- Minimum sampled hem ground clearance across walk, turn, jump and landing: 0.133 world units.
- Browser results and review screenshots are linked in PR #4 and the GitHub Actions artifact. Browser smoke covers level 3 wrong answer / three correct discoveries / completion, level 1 and 2 startup, atlas and quiz. It does not claim an exhaustive playthrough of every possible object combination.
