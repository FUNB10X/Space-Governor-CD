# Code Structure — Space Governor CD.

## Load Order (index.html)

```
core.js → entities.js → ui.js → screens.js → gameplay.js → boot.js
```

---

## 1. `js/core.js` — Core Systems
| Section | Lines | Description |
|---------|-------|-------------|
| Config constants | 1-29 | Canvas size (1100×720), MARS_BG, HOLO color palette |
| `SETTINGS` | 30-45 | Mutable settings object: language, music/sfx volume |
| `COLORS` | 46-52 | Named color constants (RED_ALERT, GOLD, HOLO_BLUE, etc.) |
| `LANG` | 53-57 | Language state object |
| `TR` translations | 58-199 | Thai/English dictionary, `tr()` / `trStrict()` lookup |
| `localStorage` helpers | 200-250 | `saveProfile()`, `loadProfile()`, `saveCity()`, `loadCity()`, `persistCity()` |
| `AudioSys` | 251-350 | Procedural SFX generator via Web Audio API (place, click, shoot, explosion, etc.) |
| `MusicPlayer` | 351-400 | HTML5 Audio wrapper for `mainsong.mp3`, loop + volume control |

---

## 2. `js/entities.js` — Game Objects
| Class | Lines | Description |
|-------|-------|-------------|
| `Particle` | 4-24 | Small animated particles (explosions, dust) |
| `FloatingText` | 26-41 | Floating damage/heal numbers |
| `Structure` | 52-125 | Buildings (House, Iron/Coal Mine, Park, Medical Bay, Wall). Draw method uses `this.stype` to select visual |
| `Turret` | 133-280 | Defense turrets (Normal, Heavy, Rapid). Stats from `TURRET_STATS`. Target acquisition, projectile firing |
| `Enemy` | 282-375 | Enemy units (types A/B/C/D). Stats from `ENEMY_STATS`. Pathfinding toward dome, attack logic |
| `Projectile` | 377-410 | Bullet/laser projectiles fired by turrets |
| `Dome` | 412-460 | Central colony dome, draw with HP-based glow |

---

## 3. `js/ui.js` — UI Drawing Library
| Function/Class | Lines | Description |
|----------------|-------|-------------|
| `FONT_FAMILY` / `FONTS` | 4-13 | Kanit font stack, predefined sizes |
| `dtxt()` | 19-44 | Draw text with alignment + optional drop shadow |
| `dtxtBg()` | 46-62 | Draw text on background pill |
| `circle()`, `rectFill()`, `rectStroke()`, `lineSeg()`, `polygonFill()`, `arcStroke()` | 63-115 | Canvas 2D drawing primitives |
| `wrapTextToWidth()`, `fitFontKey()` | 69-113 | Text wrapping and font size fitting |
| `Button` class | 117-165 | Clickable button widget with hover/locked states |
| `dist()`, `clamp()`, `makeRect()`, `pointInRect()`, `lerp()` | 166-195 | Math helpers |
| `shuffleInPlace()`, `sampleWithoutReplacement()` | 196-210 | Array utilities |
| `drawHud()` | 212-290 | Top HUD bar: dome HP, resources, wave counter, combat info |
| `drawBuildBar()` | 291-345 | Bottom build bar: category tabs, item grid with costs, locked states |
| `drawPopupCards()` | 346-428 | Card selection overlay (enemy selector + upgrade cards). Shows costs + affordability |

---

## 4. `js/screens.js` — Menu & Overlay Screens
| Section | Lines | Description |
|---------|-------|-------------|
| `UIState` | 4 | Global slider drag state |
| `settingsBoxOrigin()` / `settingsClickRects()` | 5-45 | Settings panel layout |
| `handleSettingsClick()` | 46-70 | Settings interactions (language toggle, sliders, reset) |
| `drawSettings()` | 71-130 | Settings panel drawing |
| `pauseMenuLayout()` / `drawPauseMenu()` | 131-200 | Pause overlay with Resume/Settings/Menu buttons |
| `HubScene` | 201-360 | Main menu: city slots, create/delete/continue |
| `NameScene` | 361-430 | City naming screen with Thai IME input |
| `CitySelectScene` | 431-530 | Starting loadout selection |

---

## 5. `js/gameplay.js` — Main Game Logic (~980 lines)
| Section | Lines | Description |
|---------|-------|-------------|
| **Map & Placement** | 1-170 | `buildStaticMap()`, `getPlacementZone()`, `UPGRADE_POOL`, `generateEnemyOptions()` |
| **Game class: init** | 205-270 | State initialization from saved city, `this.gamePhase = 'SELECTOR'`, `this.moveTarget = null` |
| **Game class: utilities** | 270-340 | `recalcMultipliers()`, `resourceYield()`, `domedmgMult()`, event listeners |
| **Input handling** | 341-490 | ESC/right-click, pause, build bar clicks, NEXT WAVE, building placement, **move placement**, entity selection |
| **Selector phase** | 491-500 | Enemy group selection overlay → BUILD phase |
| **Upgrade phase** | 501-540 | Upgrade card selection with money costs ($100 select / $75 reroll) |
| **Combat phase** | 541-590 | Enemy spawning, wave end rewards, wave increment → UPGRADE phase |
| **Update loop** | 591-650 | Turret update, projectile update, enemy movement/attack, structure/turret destruction, passive resources |
| **Draw loop** | 651-920 | Map, dome, entities (sorted by Y), projectiles, particles, floating texts |
| **Move ghost** | 699-720 | Semi-transparent entity following cursor with validity marker |
| **Placement marker** | 721-735 | Ghost preview when placing a new building/turret |
| **HUD + Build bar** | 736-800 | State label, resource display, build bar + NEXT WAVE button (BUILD phase only) |
| **Entity panel** | 801-880 | Selected entity panel with **Move**, **Upgrade** (turrets only: Normal→Heavy/Rapid), **Sell** buttons |
| **Phase overlays** | 881-920 | Selector/Upgrade card overlay, pause button, autosave alert |
| **State label** | 921-980 | Phase label, combat break timer |

### Game Flow
```
SELECTOR (เลือกข้าศึก) → BUILD (สร้าง/อัปเกรด) → NEXT WAVE → COMBAT (สู้)
  ↑                                                         ↓
  └────────────────── UPGRADE (เลือกการ์ด) ←──────────────────┘
```

- **Build bar** available during both BUILD and COMBAT phases
- **Entity panel** (Move / Upgrade / Sell) available during both BUILD and COMBAT
- **Move**: Click entity → "Move" button → ghost follows cursor → click to place (ESC/right-click to cancel)
- **Upgrade** (turrets): Normal → Heavy ($130 + 30I) or Normal → Rapid ($40 + 10I)
- **Sell**: Refund 50% (80% with Recycling Plant upgrade)

---

## 6. `js/boot.js` — Entry Point
| Section | Lines | Description |
|---------|-------|-------------|
| Canvas setup | 1-40 | Get canvas, apply HiDPI scaling, set up input element |
| Input handlers | 41-120 | Mouse, touch, keyboard, text input event listeners |
| `Game` class | 121-180 | Screen manager: `goto()`, `register()`, `run()`, `currentScreen` |
| `requestAnimationFrame` loop | 181-220 | Main loop: clear → currentScreen.tick() → draw |
| Audio unlock | 221-250 | `AudioSys.unlock()` / `MusicPlayer.unlock()` on first user gesture |
| Scene registration | 251-280 | Register HubScene, NameScene, CitySelectScene, Game (from gameplay.js), GameOverScene |
