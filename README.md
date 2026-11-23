# Packet Pulse V2 — Firewall Shift

**EdVyro Game Development · Milestone 3: Game State, Progression, and Persistence**  
**Developer:** Sudharshan P S · **Stack:** HTML5 + CSS3 + JavaScript (no dependencies)

> A continuation of my [Milestone 2 prototype](https://github.com/sudharshanps/EdVyro-Game-Development-Milestone-2). This version introduces a guarded finite state machine, five gameplay levels, and browser-local preference/high-score storage.

## 🎮 Play

- **Open `index.html`** in a browser (it loads `core.js` and `game.js` from the same folder).
- After enabling GitHub Pages from `Settings → Pages → Deploy from a branch → main / root`, the live URL will be: **https://sudharshanps.github.io/-Game-State-Progression-and-Persistence/**
- **[Download all files as a ZIP](https://github.com/sudharshanps/-Game-State-Progression-and-Persistence/archive/refs/heads/main.zip)** (automatically generated from the repository).

## Rules and controls

A packet is labeled **SAFE** or **THREAT**. Switch firewall mode to **ALLOW** for SAFE or **BLOCK** for THREAT before the packet reaches the gateway. A correct decision earns **+10 points**; a wrong decision costs **1 life** and resets the streak. Reach **30 correct packets**, survive **180 seconds**, and finish with at least one life to win. Losing all lives or missing the target when the timer expires is a loss.

| Control | Action |
| --- | --- |
| **Start mission** | Begin from ready state |
| **Space** or tap **Switch firewall mode** | Toggle ALLOW/BLOCK during gameplay |
| **P** or **Pause game** | Pause or resume; timer and traffic stop |
| **R** or **Restart mission** | Reset the run; starts fresh |
| **Difficulty selector** | Set Easy / Normal / Hard before starting or after game over |

## Milestone 3 features

| Requirement | Implementation |
| --- | --- |
| Explicit game states | `ready → playing ↔ paused → won/lost`, and `restarting → playing` |
| Guarded transitions | `core.nextPhase()` rejects impossible state transitions |
| Meaningful progression | Level 1→5, +1 level per 8 correct matches (capped at 5); packets get faster |
| Clear scoring | +10 per correct match, no points for a mistake |
| Difficulty settings | Easy 8 lives/160 px/s; Normal 6/205; Hard 4/250 |
| Persistence | `localStorage` saves **difficulty** and **best score** only |
| Resilience | Invalid storage data resets to safe defaults; blocked storage doesn't stop gameplay |
| Pause/restart | Paused clock stays frozen; restart resets all live counters and packet timing |
| Background tab | Automatically pauses when tab becomes hidden |
| Accessibility | Keyboard/touch inputs, visible focus, readable non-color labels |

**Timing:** Packet speed = difficulty's base speed + `28 × (level − 1)` pixels per second. Spawn gap shortens from 0.65 s toward a 0.29 s minimum at level 5. There is no paid service or backend.

## Files for reviewer

| File | Purpose |
| --- | --- |
| [`index.html`](index.html) | Updated playable build and UI |
| [`core.js`](core.js) | Testable state/progression rules |
| [`game.js`](game.js) | Rendering, event loop, UI, persistence integration |
| [`STATE_DIAGRAM.md`](STATE_DIAGRAM.md) | Mermaid state diagram and transition table |
| [`EDGE_CASE_TESTS.md`](EDGE_CASE_TESTS.md) | Edge cases and observed test results |
| [`tests/core.test.cjs`](tests/core.test.cjs) | Automated regression tests using Node's built-in test runner |
| [`DESIGN_NOTES.md`](DESIGN_NOTES.md) | Progression and persistence decisions |

## Test locally

Run `node --test tests/core.test.cjs`. It uses Node.js built-in test runner, with **no `npm install`**. For UI testing, open `index.html` and use the verification steps in `EDGE_CASE_TESTS.md`.

## Data and privacy

Only this browser's local difficulty and best score are saved under `packet-pulse-v2-prefs`. No player identity, gameplay history, scores in progress, cookies, or network data is collected. Clearing site data resets saved preferences. Storage may be unavailable in restricted browser environments; the game still works, with session-only preferences.

## Submission

Submit **this public GitHub repository URL** in EdVyro's Project URL field:  
**https://github.com/sudharshanps/-Game-State-Progression-and-Persistence**

*No claim is made that EdVyro has reviewed or approved the project yet.*
