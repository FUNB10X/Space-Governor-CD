# AGENTS.md

## Project

Space Governor CD. (ผู้ว่าอวกาศ 2067) — single-canvas HTML5/JS game, ported from a Pygame project. No build system, no bundler, no npm. Open `index.html` directly in a browser.

## Files

- `game.js` — entire game logic in one file (~2850 lines), organized by section markers (`/* ===== 1. CORE ===== */`, etc.)
- `index.html` — minimal shell: canvas, text input for Thai IME, fullscreen button
- `mainsong.mp3` — background music, loaded by `MusicPlayer` via `new Audio('mainsong.mp3')`

## Architecture (game.js sections)

1. **CORE** — config constants, colors, `SETTINGS`, Thai/English translations (`TR`), `localStorage` save/load, `AudioSys` (procedural SFX via Web Audio API), `MusicPlayer` (HTML5 Audio for mainsong.mp3)
2. **CANVAS DRAW HELPERS** — low-level drawing primitives (`circle`, `rectFill`, `dtxt`, etc.)
3. **ENTITIES** — game objects (Dome, Structure, Turret, Enemy, Projectile, Particle, FloatingText)
4. **CARDS** — policy/defense/trade card system for between-wave choices
5. **SCREENS** — UI overlays: settings panel, pause menu, card selection
6. **GAME CLASS** — main `Game` class with state machine (menu → name → city select → gameplay → pause)
7. **BOOT** — canvas init, input handlers, `requestAnimationFrame` loop, `AudioSys.unlock()` / `MusicPlayer.unlock()` on first user interaction

## Key conventions

- All text displayed to users goes through `tr()` / `trStrict()` for Thai/English translation
- `SETTINGS` persists to `localStorage` via `saveProfile()` / `loadProfile()`
- Audio must be unlocked by user gesture (mousedown/touchstart) due to browser autoplay policy
- Canvas is 1100×720, scaled to fit viewport with `object-fit: contain` equivalent
- No comments in code — follow existing style, do not add comments unless asked

## Verification

No automated tests or linter. Verify changes by opening `index.html` in a browser and testing manually.
