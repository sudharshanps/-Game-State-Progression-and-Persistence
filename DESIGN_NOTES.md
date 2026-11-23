# Design Notes: From Milestone 2 to Milestone 3

## Objective

Upgrade **Packet Pulse: Firewall Shift** from one playable core loop to a robust, inspectable game with state management, meaningful progression, and selective persistence.

## Before → after

| Milestone 2 | Milestone 3 |
| --- | --- |
| Game state logic mixed into display loop | Explicit transition rules in `core.js` |
| Fixed packet speed | Five levels, every 8 successful matches increases speed |
| Fixed normal difficulty | Easy / Normal / Hard set before a mission |
| Score resets after each playthrough | Local personal-best score saved after finish |
| Only runtime state | Runtime separate from persistent preferences |
| Basic ad hoc checks | Automated unit tests and named edge-case checklist |

## Why these persistence choices?

Saved: `difficulty`, `bestScore`. These are small, non-sensitive preferences meaningful across browser sessions.

Not saved: ongoing game phase, timer, packet position/type, lives, streak, or runtime score. These are tied to animation timing and would produce inconsistent sessions after page reload; every new load starts in READY.

A read or write failure is caught. Storage cannot prevent the game from starting. The key is versioned to avoid colliding with the older milestone.

## Progression balancing

- Base speeds: Easy 160 px/s (8 lives), Normal 205 px/s (6 lives), Hard 250 px/s (4 lives).
- Every eighth correct packet raises the level by one, up to level 5.
- Each level adds 28 px/s of packet speed and slightly reduces the idle spawn gap.
- 180-second clock and 30-match target are unchanged, so existing players understand the rules.
- Score remains +10 per correct packet for transparency and predictability.

## Test strategy

Unit tests cover logic independently of rendering and local storage. UI smoke tests cover keyboard actions, timer freeze, restart, and small-screen overflow. Remaining manual scenarios are listed, not overstated, in `EDGE_CASE_TESTS.md`.
