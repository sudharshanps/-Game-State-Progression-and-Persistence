# Edge-Case Test Checklist — Milestone 3

**Test scope:** pure rule tests via Node.js and browser UI smoke tests with desktop (1440×900) and mobile (375×812) layouts. Screens were captured after interacting with the prototype in a headless browser. This is **self-test evidence**, not an external-user playtest.

## Automated checks (observed passed)

- [x] `ready → playing`, `playing ↔ paused`, `paused → restarting → playing` are accepted.
- [x] `ready → paused` and `lost → paused` are refused.
- [x] Scoring a packet in `ready` is blocked.
- [x] Correct SAFE/ALLOW scores +10 and increases hits/streak.
- [x] Wrong SAFE/BLOCK removes one life, resets streak and earns 0 points.
- [x] Unknown packet type is ignored.
- [x] Level-up boundary: 7 hits = level 1, 8 hits = level 2, 16 hits = level 3, 32 hits = max level 5.
- [x] High difficulty is faster than normal, which is faster than easy.
- [x] Timeout with 29 correct = lose; 30 correct + remaining life = win; 30 correct + 0 lives = lose.
- [x] New run resets score/hits/timer/lives without deleting saved preferences.
- [x] Invalid difficulty, negative best score, invalid best score use safe defaults.

To reproduce: `node --test tests/core.test.cjs` from the repository root.

## Browser smoke tests (observed passed)

- [x] Initial screen is READY; Start changes state to PLAYING.
- [x] Press P pauses; displayed timer remains unchanged during the pause.
- [x] Press P again resumes; restart reinitializes the correct-match count.
- [x] Game loads without JavaScript page errors on both desktop and mobile.
- [x] No horizontal overflow at 1440px or 375px viewport widths.

## Additional manual checks for reviewer (not claimed as executed)

- [ ] Choose Hard, refresh same origin; verify difficulty remains Hard (real browser `localStorage` persistence).
- [ ] Win or lose with a new personal best, refresh; verify the high score remains while active run resets.
- [ ] Clear browser site data; verify defaults return to Normal, best 0.
- [ ] Disable browser storage; verify the game remains playable and displays a storage warning.
- [ ] Switch tabs while playing; verify automatic pause, then manual resume without a large clock jump.
- [ ] Reach 0 lives mid-round; verify the game ends once and does not count new packets.
- [ ] Hit the 8th correct match; verify level label/speed increases, no double count.
- [ ] Press R repeatedly while paused/after win/after loss; verify no overlapping packets or timers.
- [ ] On a touchscreen, verify the switch button and arena tap each toggle only once.

## Known limitations

- The 3-minute timer is driven by browser animation frames and is intentionally frozen when the tab is hidden, not synchronized to wall-clock time.
- There is no cloud sync, leaderboard, account, or saved game-in-progress (by design).
- Some browsers block `localStorage` on restricted pages; the game continues without saving between sessions.
- Automated rule tests exercise end-state logic, but they do not replace a full three-minute interactive playthrough.
