/* ==========================================================
   5. SCREENS — shared overlay helpers (settings panel / pause menu)
   ========================================================== */
const UIState = { sliderDragging: null }; // null | 'mus' | 'sfx'

function settingsBoxOrigin() { return [SW / 2 - 270, SH / 2 - 215]; }

function settingsClickRects(boxX, boxY, showReset) {
  const sliderW = 300, sliderH = 24;
  const rects = {
    lang: makeRect(boxX + 200, boxY + 88, sliderW, 32),
    slider_mus: makeRect(boxX + 200, boxY + 150, sliderW, sliderH),
    slider_sfx: makeRect(boxX + 200, boxY + 215, sliderW, sliderH),
    close: makeRect(boxX + 506, boxY + 12, 24, 24),
  };
  if (showReset) rects.reset = makeRect(boxX + 40, boxY + 320, 460, 38);
  return rects;
}

function drawVolSlider(ctx, mx, my, track, vol, dragging) {
  const isHov = dragging || pointInRect(mx, my, track);
  rectFill(ctx, track.x, track.y, track.w, track.h, 'rgb(18,28,50)', track.h / 2);
  const fillW = Math.max(0, track.w * vol / 100);
  if (fillW > 0) {
    rectFill(ctx, track.x, track.y, fillW, track.h, isHov ? HOLO_BLUE : 'rgb(0,100,200)', track.h / 2);
  }
  rectStroke(ctx, track.x, track.y, track.w, track.h, isHov ? WHITE : 'rgb(60,90,140)', 1, track.h / 2);

  let hx = track.x + fillW;
  hx = clamp(hx, track.x + track.h / 2, track.x + track.w - track.h / 2);
  const knobR = isHov ? 11 : 9;
  circle(ctx, hx, track.y + track.h / 2, knobR + 2, 'rgb(15,20,35)');
  circle(ctx, hx, track.y + track.h / 2, knobR, WHITE);
  circle(ctx, hx, track.y + track.h / 2, knobR, HOLO_BLUE, 2);

  dtxt(ctx, `${vol}%`, 'xs', WHITE, track.x + track.w - 10, track.y + track.h / 2, 'midright', false);
}

function drawSettingsPanel(ctx, mx, my, showReset) {
  const [boxX, boxY] = settingsBoxOrigin();
  const boxW = 540, boxH = showReset ? 390 : 285;
  rectFill(ctx, boxX, boxY, boxW, boxH, DARK_GLASS, 12);
  rectStroke(ctx, boxX, boxY, boxW, boxH, HOLO_BLUE, 2, 12);

  dtxt(ctx, tr('Settings'), 'l', WHITE, boxX + boxW / 2, boxY + 32, 'center', true);

  const rects = settingsClickRects(boxX, boxY, showReset);

  const closeR = rects.close;
  const clHov = pointInRect(mx, my, closeR);
  rectFill(ctx, closeR.x, closeR.y, closeR.w, closeR.h, clHov ? RED_ALERT : 'rgb(50,15,15)', 4);
  dtxt(ctx, 'x', 'xs', WHITE, closeR.x + closeR.w / 2, closeR.y + closeR.h / 2, 'center', false);

  dtxt(ctx, tr('Language'), 's', WHITE, boxX + 40, boxY + 103, 'midleft', false);
  const langR = rects.lang;
  const langStr = LANG.v === 'th' ? 'ภาษาไทย' : 'English';
  const lHov = pointInRect(mx, my, langR);
  rectFill(ctx, langR.x, langR.y, langR.w, langR.h, lHov ? 'rgb(30,48,80)' : 'rgb(15,22,38)', 6);
  rectStroke(ctx, langR.x, langR.y, langR.w, langR.h, lHov ? HOLO_BLUE : 'rgb(40,60,100)', 1, 6);
  dtxt(ctx, langStr, 'xs', lHov ? GOLD : WHITE, langR.x + langR.w / 2, langR.y + langR.h / 2, 'center', false);

  const musVol = SETTINGS.music_vol;
  const musDrag = UIState.sliderDragging === 'mus';
  dtxt(ctx, tr('Music'), 's', WHITE, boxX + 40, boxY + 162, 'midleft', false);
  drawVolSlider(ctx, mx, my, rects.slider_mus, musVol, musDrag);

  const sfxVol = SETTINGS.sfx_vol;
  const sfxDrag = UIState.sliderDragging === 'sfx';
  dtxt(ctx, tr('Sound Effects'), 's', WHITE, boxX + 40, boxY + 227, 'midleft', false);
  drawVolSlider(ctx, mx, my, rects.slider_sfx, sfxVol, sfxDrag);

  if (showReset) {
    const resetR = rects.reset;
    const rHov = pointInRect(mx, my, resetR);
    rectFill(ctx, resetR.x, resetR.y, resetR.w, resetR.h, rHov ? RED_ALERT : 'rgb(60,15,15)', 6);
    rectStroke(ctx, resetR.x, resetR.y, resetR.w, resetR.h, rHov ? WHITE : RED_ALERT, rHov ? 2 : 1, 6);
    dtxt(ctx, tr('Reset All Data'), 's', WHITE, resetR.x + resetR.w / 2, resetR.y + resetR.h / 2, 'center', false);
  }

  return rects;
}

function updateSliderDrag(mx, mouseDown, showReset) {
  if (UIState.sliderDragging === null) return;
  if (!mouseDown) { UIState.sliderDragging = null; return; }
  const [boxX, boxY] = settingsBoxOrigin();
  const rects = settingsClickRects(boxX, boxY, showReset);
  const key = 'slider_' + UIState.sliderDragging;
  const r = rects[key];
  if (r) {
    const rel = (mx - r.x) / r.w;
    const vol = Math.floor(clamp(rel, 0, 1) * 100);
    if (UIState.sliderDragging === 'mus') {
      SETTINGS.music_vol = clamp(vol, 0, 100);
      saveProfile();
      MusicPlayer.sync();
    } else {
      SETTINGS.sfx_vol = clamp(vol, 0, 100);
      saveProfile();
    }
  }
}

function handleSettingsClick(mx, my, rects) {
  if (pointInRect(mx, my, rects.slider_mus)) {
    UIState.sliderDragging = 'mus';
    const rel = (mx - rects.slider_mus.x) / rects.slider_mus.w;
    SETTINGS.music_vol = clamp(Math.floor(clamp(rel, 0, 1) * 100), 0, 100);
    saveProfile();
    MusicPlayer.sync();
    return null;
  }
  if (pointInRect(mx, my, rects.slider_sfx)) {
    UIState.sliderDragging = 'sfx';
    const rel = (mx - rects.slider_sfx.x) / rects.slider_sfx.w;
    SETTINGS.sfx_vol = clamp(Math.floor(clamp(rel, 0, 1) * 100), 0, 100);
    saveProfile();
    playSfx('click');
    return null;
  }
  if (pointInRect(mx, my, rects.lang)) {
    playSfx('click');
    LANG.v = LANG.v === 'th' ? 'en' : 'th';
    saveProfile();
    return null;
  }
  if (rects.reset && pointInRect(mx, my, rects.reset)) {
    playSfx('click');
    return 'reset';
  }
  if (pointInRect(mx, my, rects.close)) {
    playSfx('click');
    UIState.sliderDragging = null;
    return 'closed';
  }
  return null;
}

function drawDimOverlay(ctx, alpha) {
  rectFill(ctx, 0, 0, SW, SH, `rgba(0,0,0,${(alpha !== undefined ? alpha : 140) / 255})`);
}

function pauseMenuLayout() {
  const boxW = 360, boxH = 300;
  const boxX = SW / 2 - boxW / 2, boxY = SH / 2 - boxH / 2;
  const btnW = 280, btnH = 44, gap = 16;
  const btnX = SW / 2 - btnW / 2;
  return {
    box: [boxX, boxY, boxW, boxH],
    resume: makeRect(btnX, boxY + 80, btnW, btnH),
    settings: makeRect(btnX, boxY + 80 + btnH + gap, btnW, btnH),
    menu: makeRect(btnX, boxY + 80 + (btnH + gap) * 2, btnW, btnH),
  };
}

function drawPauseMenu(ctx, mx, my) {
  const rects = pauseMenuLayout();
  const [boxX, boxY, boxW, boxH] = rects.box;
  rectFill(ctx, boxX, boxY, boxW, boxH, DARK_GLASS, 12);
  rectStroke(ctx, boxX, boxY, boxW, boxH, HOLO_BLUE, 2, 12);
  dtxt(ctx, tr('Pause'), 'l', WHITE, SW / 2, boxY + 36, 'center', true);

  const entries = [
    [rects.resume, tr('Resume Game'), HOLO_GREEN],
    [rects.settings, tr('Settings'), HOLO_BLUE],
    [rects.menu, tr('Back to Menu'), RED_ALERT],
  ];
  for (const [r, label, baseColHex] of entries) {
    const hov = pointInRect(mx, my, r);
    const baseTuple = rgbTuple(baseColHex);
    const bg = hov ? baseColHex : `rgb(${baseTuple.map(c => Math.max(10, Math.floor(c / 4))).join(',')})`;
    const border = hov ? WHITE : baseColHex;
    rectFill(ctx, r.x, r.y, r.w, r.h, bg, 8);
    rectStroke(ctx, r.x, r.y, r.w, r.h, border, hov ? 2 : 1, 8);
    dtxt(ctx, label, 'm', WHITE, r.x + r.w / 2, r.y + r.h / 2, 'center', false);
  }
  return rects;
}


/* ==========================================================
   6. SCREENS — Input system & Scene Manager
   ========================================================== */
const Input = {
  mx: 0, my: 0,
  mouseDown: false,    // current physical state of left button
  buffer: [],          // queued discrete events for current frame
};

const Game = {
  scene: null,
  scenes: {},
  register(name, obj) { this.scenes[name] = obj; },
  goto(name, params) {
    this.scene = name;
    const s = this.scenes[name];
    if (s && s.init) s.init(params || {});
  },
  current() { return this.scenes[this.scene]; },
};

function drainEvents() {
  const evs = Input.buffer;
  Input.buffer = [];
  return evs;
}

/* ==========================================================
   7. SCENE: MAIN MENU
   ========================================================== */
const SceneMenu = {
  init() {
    loadProfile();
    this.hasAccount = !!(SETTINGS.governor_name && SETTINGS.governor_name.trim());
    this.startLabel = this.hasAccount ? tr('Start Playing') : tr('Start New Game');

    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push([Math.random() * SW, Math.random() * SH, 0.5 + Math.random() * 1.5]);
    }
    this.shootingStars = [];

    const btnW = 240, btnH = 50;
    this.startBtn = new Button(SW / 2 - btnW / 2, SH / 2 + 20, btnW, btnH, this.startLabel, 'm', HOLO_BLUE, WHITE);
    this.settBtn = new Button(SW / 2 - btnW / 2, SH / 2 + 90, btnW, btnH, tr('Settings'), 'm', HOLO_BLUE, WHITE);

    this.tick = 0;
    this.settingsOpen = false;
  },
  frame(ctx, dt, events, mx, my) {
    this.startBtn.update(mx, my);
    this.settBtn.update(mx, my);
    for (const ev of events) {
      if (ev.type === 'mousedown' && ev.button === 0) {
        if (this.settingsOpen) {
          const [bx, by] = settingsBoxOrigin();
          const rects = settingsClickRects(bx, by, false);
          const action = handleSettingsClick(mx, my, rects);
          if (action === 'closed') this.settingsOpen = false;
        } else {
          if (this.startBtn.hovered) {
            playSfx('click');
            const prof = loadProfile();
            if (prof && prof.governor_name) Game.goto('hub');
            else Game.goto('profile');
            return;
          }
          if (this.settBtn.hovered) {
            playSfx('click');
            this.settingsOpen = true;
          }
        }
      }
      if (ev.type === 'mouseup' && ev.button === 0) UIState.sliderDragging = null;
    }

    this.tick++;
    if (this.settingsOpen) updateSliderDrag(mx, Input.mouseDown, false);

    if (Math.random() < 0.02) {
      this.shootingStars.push({
        x: Math.random() * (SW - 100), y: Math.random() * (SH / 2),
        vx: 4 + Math.random() * 4, vy: 2 + Math.random() * 2, life: 30,
      });
    }
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx; s.y += s.vy; s.life -= 1;
      if (s.life <= 0) this.shootingStars.splice(i, 1);
    }

    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, SH);
    grad.addColorStop(0, 'rgb(15,10,8)');
    grad.addColorStop(1, 'rgb(35,18,14)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SW, SH);

    for (const [sx, sy, spd] of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin(this.tick * 0.05 * spd);
      const col = Math.floor(140 + tw * 115);
      circle(ctx, sx, sy, 1, `rgb(${col},${col},${col})`);
    }
    for (const s of this.shootingStars) {
      lineSeg(ctx, s.x, s.y, s.x - s.vx * 3, s.y - s.vy * 3, 'rgb(220,220,255)', 2);
    }

    const titleY = SH / 2 - 150 + Math.sin(this.tick * 0.04) * 4;
    dtxt(ctx, 'ผู้ว่าอวกาศ 2067', 'xxl', MARS_RUST, SW / 2, titleY, 'center', true);
    dtxt(ctx, 'SPACE GOVERNOR CD.', 'ml', HOLO_BLUE, SW / 2, SH / 2 - 70, 'center', true);

    this.startBtn.draw(ctx);
    this.settBtn.draw(ctx);

    if (this.settingsOpen) {
      drawDimOverlay(ctx, 140);
      drawSettingsPanel(ctx, mx, my, false);
    }
  },
};
Game.register('menu', SceneMenu);

/* ==========================================================
   8. SCENE: GOVERNOR PROFILE CREATION
   ========================================================== */
const SceneProfile = {
  init() {
    this.nameText = '';
    this.errorMsg = '';
    const btnW = 180, btnH = 44;
    this.confirmBtn = new Button(SW / 2 - btnW / 2, SH / 2 + 50, btnW, btnH, tr('Confirm'), 'm', HOLO_BLUE, WHITE);
    TextCapture.activate('', 14);
  },
  exit() { TextCapture.deactivate(); },
  frame(ctx, dt, events, mx, my) {
    this.nameText = TextCapture.value;
    this.confirmBtn.update(mx, my);

    let confirmAction = false;
    for (const ev of events) {
      if (ev.type === 'mousedown' && ev.button === 0) {
        if (this.confirmBtn.hovered) confirmAction = true;
      }
      if (ev.type === 'keydown' && ev.key === 'Enter') confirmAction = true;
    }

    if (confirmAction) {
      const cleaned = this.nameText.trim();
      if (cleaned) {
        playSfx('click');
        SETTINGS.governor_name = cleaned;
        saveProfile();
        Game.goto('hub');
        return;
      } else {
        this.errorMsg = tr('Name cannot be empty!');
      }
    }

    ctx.fillStyle = MARS_BG;
    ctx.fillRect(0, 0, SW, SH);
    for (let gx = 0; gx < SW; gx += 40) lineSeg(ctx, gx, 0, gx, SH, 'rgb(30,20,15)', 1);
    for (let gy = 0; gy < SH; gy += 40) lineSeg(ctx, 0, gy, SW, gy, 'rgb(30,20,15)', 1);

    const boxW = 460, boxH = 260;
    rectFill(ctx, SW / 2 - boxW / 2, SH / 2 - boxH / 2, boxW, boxH, DARK_GLASS, 12);
    rectStroke(ctx, SW / 2 - boxW / 2, SH / 2 - boxH / 2, boxW, boxH, HOLO_BLUE, 2, 12);

    dtxt(ctx, tr('Enter Governor Name'), 'l', WHITE, SW / 2, SH / 2 - 80, 'center', true);

    const tboxW = 320, tboxH = 40;
    const tboxX = SW / 2 - tboxW / 2, tboxY = SH / 2 - 20;
    rectFill(ctx, tboxX, tboxY, tboxW, tboxH, 'rgb(15,18,30)', 6);
    rectStroke(ctx, tboxX, tboxY, tboxW, tboxH, this.nameText.length > 0 ? HOLO_BLUE : 'rgb(60,65,80)', 2, 6);

    const cursor = (Date.now() / 500) % 2 > 1.0 ? '|' : '';
    dtxt(ctx, this.nameText + cursor, 'm', GOLD, SW / 2, SH / 2, 'center', false);

    if (this.errorMsg) dtxt(ctx, this.errorMsg, 's', RED_ALERT, SW / 2, SH / 2 + 30, 'center', false);

    this.confirmBtn.draw(ctx);
  },
};
Game.register('profile', SceneProfile);


/* ==========================================================
   9. SCENE: HUB MENU (statistics & city slots)
   ========================================================== */
function freshCityData(cityName) {
  return {
    city_name: cityName,
    exists: true,
    current_wave: 1,
    money: 500,
    iron: 100,
    coal: 50,
    dome_hp: 1000,
    dome_max_hp: 1000,
    structures: [
      { type: 'iron_mine', x: 820.0, y: 200.0 },
      { type: 'coal_mine', x: 820.0, y: 360.0 },
      { type: 'house', x: 820.0, y: 520.0 },
    ],
    turrets: [],
    walls: [],
    play_time: 0.0,
    unlocked_structures: ['house', 'iron_mine', 'coal_mine'],
    unlocked_turrets: ['normal_turret', 'wall'],
    unlocked_upgrades: [],
    happiness: 50,
    happiness_bonus: 0.0,
  };
}

const SceneHub = {
  init() {
    this.profData = loadProfile() || {};
    this.govName = this.profData.governor_name || 'Governor';
    this.refreshStats();

    const greetings = [
      tr('Welcome back, Governor.'),
      tr('The citizens await your leadership.'),
      tr('Ready to defend the city again?'),
    ];
    this.gText = greetings[Math.floor(Math.random() * greetings.length)];

    this.settingsOpen = false;
    this.dialogOpen = false;
    this.dialogSlot = -1;
    this.dialogError = '';

    const slotW = 440, slotH = 110, startY = 180, gap = 25;
    this.slotsRects = [];
    this.deleteRects = [];
    for (let i = 1; i <= 3; i++) {
      const sy = startY + (i - 1) * (slotH + gap);
      this.slotsRects.push([makeRect(SW / 2 + 40, sy, slotW, slotH), i]);
      this.deleteRects.push([makeRect(SW / 2 + 40 + slotW + 12, sy + slotH / 2 - 20, 40, 40), i]);
    }

    this.backBtn = new Button(40, SH - 70, 160, 44, tr('Back'), 'm', RED_ALERT, WHITE);
    this.settBtnRect = makeRect(SW - 160, 20, 140, 36);
  },
  refreshStats() {
    this.highWave = this.profData.highest_wave || 0;
    this.totTime = this.profData.total_play_time || 0.0;
    this.lastCity = this.profData.last_played_city || '-';
    this.createdCnt = this.profData.cities_created || 0;
  },
  exit() { TextCapture.deactivate(); },
  startNewCity(slot, name) {
    const data = freshCityData(name);
    saveCity(slot, data);
    const prof = loadProfile() || {};
    saveProfile({ cities_created: (prof.cities_created || 0) + 1 });
    Game.goto('game', { slotId: slot });
  },
  frame(ctx, dt, events, mx, my) {
    let click = false;
    for (const ev of events) {
      if (ev.type === 'mousedown' && ev.button === 0) click = true;
      if (ev.type === 'mouseup' && ev.button === 0) UIState.sliderDragging = null;
      if (this.dialogOpen && ev.type === 'keydown' && ev.key === 'Enter') {
        const cleaned = TextCapture.value.trim();
        if (cleaned) { this.dialogOpen = false; TextCapture.deactivate(); this.startNewCity(this.dialogSlot, cleaned); return; }
        else this.dialogError = tr('Name cannot be empty!');
      }
    }

    const settHov = pointInRect(mx, my, this.settBtnRect);
    if (this.settingsOpen) updateSliderDrag(mx, Input.mouseDown, true);
    this.backBtn.update(mx, my);

    if (click) {
      if (this.backBtn.hovered && !this.dialogOpen && !this.settingsOpen) {
        playSfx('click');
        Game.goto('menu');
        return;
      }

      if (this.dialogOpen) {
        const boxX = SW / 2 - 200, boxY = SH / 2 - 100;
        const okR = makeRect(boxX + 50, boxY + 130, 120, 36);
        const cnR = makeRect(boxX + 230, boxY + 130, 120, 36);
        if (pointInRect(mx, my, okR)) {
          playSfx('click');
          const cleaned = TextCapture.value.trim();
          if (cleaned) { this.dialogOpen = false; TextCapture.deactivate(); this.startNewCity(this.dialogSlot, cleaned); return; }
          else this.dialogError = tr('Name cannot be empty!');
        } else if (pointInRect(mx, my, cnR)) {
          playSfx('click');
          this.dialogOpen = false;
          TextCapture.deactivate();
        }
      } else if (this.settingsOpen) {
        const [bx, by] = settingsBoxOrigin();
        const rects = settingsClickRects(bx, by, true);
        const action = handleSettingsClick(mx, my, rects);
        if (action === 'reset') {
          UIState.sliderDragging = null;
          resetAllData();
          Game.goto('menu');
          return;
        }
        if (action === 'closed') { UIState.sliderDragging = null; this.settingsOpen = false; }
      } else {
        if (settHov) { playSfx('click'); this.settingsOpen = true; }
        else {
          for (const [r, slot] of this.slotsRects) {
            if (pointInRect(mx, my, r)) {
              playSfx('click');
              const save = loadCity(slot);
              if (save && (save.exists || save.city_name)) { Game.goto('game', { slotId: slot }); return; }
              else {
                this.dialogSlot = slot;
                this.dialogError = '';
                this.dialogOpen = true;
                TextCapture.activate(`Colony ${String.fromCharCode(64 + slot)}`, 14);
              }
            }
          }
          for (const [r, slot] of this.deleteRects) {
            const save = loadCity(slot);
            if (save && (save.exists || save.city_name) && pointInRect(mx, my, r)) {
              playSfx('click');
              deleteCity(slot);
              this.profData = loadProfile() || {};
              this.refreshStats();
            }
          }
        }
      }
    }

    ctx.fillStyle = MARS_BG; ctx.fillRect(0, 0, SW, SH);
    for (let gx = 0; gx < SW; gx += 60) lineSeg(ctx, gx, 0, gx, SH, MARS_GRID, 1);
    for (let gy = 0; gy < SH; gy += 60) lineSeg(ctx, 0, gy, SW, gy, MARS_GRID, 1);

    dtxt(ctx, tr('Space Governor CD.'), 'l', HOLO_BLUE, 40, 20, 'topleft', true);
    dtxt(ctx, `${tr('Welcome back, Governor.')} ${this.govName}`, 'm', WHITE, 40, 56, 'topleft', false);

    const lw = 420, lh = 460, lx = 40, ly = 180;
    rectFill(ctx, lx, ly, lw, lh, DARK_GLASS, 10);
    rectStroke(ctx, lx, ly, lw, lh, 'rgb(30,48,80)', 1, 10);

    dtxt(ctx, `"${this.gText}"`, 's', GOLD, lx + 20, ly + 25, 'topleft', false);
    lineSeg(ctx, lx + 20, ly + 60, lx + lw - 20, ly + 60, 'rgb(30,48,80)', 1);

    let statY = ly + 80;
    const timeStr = `${String(Math.floor(this.totTime / 3600)).padStart(2, '0')}:${String(Math.floor((this.totTime % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(this.totTime % 60)).padStart(2, '0')}`;
    const statsList = [
      [tr('Highest Wave Reached'), this.highWave],
      [tr('Total Play Time'), timeStr],
      [tr('Last Played City'), this.lastCity],
      [tr('Number of Cities Created'), this.createdCnt],
    ];
    for (const [lbl, val] of statsList) {
      dtxt(ctx, lbl, 's', 'rgb(160,165,185)', lx + 20, statY, 'topleft', false);
      dtxt(ctx, String(val), 'm', HOLO_BLUE, lx + lw - 20, statY, 'topright', false);
      statY += 70;
    }

    for (const [r, slot] of this.slotsRects) {
      const save = loadCity(slot);
      const hov = pointInRect(mx, my, r);
      let cardCol = 'rgb(16,20,32)', borderCol = 'rgb(40,60,100)';
      if (hov) { cardCol = 'rgb(24,32,54)'; borderCol = HOLO_GREEN; }

      rectFill(ctx, r.x, r.y, r.w, r.h, cardCol, 8);
      rectStroke(ctx, r.x, r.y, r.w, r.h, borderCol, hov ? 2 : 1, 8);
      rectFill(ctx, r.x, r.y, 8, r.h, save ? HOLO_BLUE : 'rgb(60,65,75)', 8);

      dtxt(ctx, `${tr('City #')}${slot}`, 'ml', GOLD, r.x + 24, r.y + 16, 'topleft', false);

      if (save && (save.exists || save.city_name)) {
        dtxt(ctx, save.city_name, 'm', WHITE, r.x + 24, r.y + 45, 'topleft', false);
        dtxt(ctx, `${tr('WAVE')}: ${save.current_wave} | $${save.money}`, 'xs', 'rgb(185,190,200)', r.x + 24, r.y + 75, 'topleft', false);

        const dr = this.deleteRects[slot - 1][0];
        const dhov = pointInRect(mx, my, dr);
        rectFill(ctx, dr.x, dr.y, dr.w, dr.h, dhov ? RED_ALERT : 'rgb(80,20,20)', 6);
        rectStroke(ctx, dr.x, dr.y, dr.w, dr.h, dhov ? WHITE : RED_ALERT, 1, 6);
        dtxt(ctx, 'X', 's', WHITE, dr.x + dr.w / 2, dr.y + dr.h / 2, 'center', false);
      } else {
        dtxt(ctx, tr('Empty Slot'), 'm', 'rgb(100,105,115)', r.x + 24, r.y + 45, 'topleft', false);
      }
    }

    const settCol = settHov ? WHITE : HOLO_BLUE;
    rectFill(ctx, this.settBtnRect.x, this.settBtnRect.y, this.settBtnRect.w, this.settBtnRect.h, 'rgb(15,20,38)', 6);
    rectStroke(ctx, this.settBtnRect.x, this.settBtnRect.y, this.settBtnRect.w, this.settBtnRect.h, settCol, 1, 6);
    dtxt(ctx, tr('Settings'), 's', settCol, this.settBtnRect.x + this.settBtnRect.w / 2, this.settBtnRect.y + this.settBtnRect.h / 2, 'center', false);

    this.backBtn.draw(ctx);

    if (this.dialogOpen) {
      drawDimOverlay(ctx, 140);
      const boxX = SW / 2 - 200, boxY = SH / 2 - 100;
      rectFill(ctx, boxX, boxY, 400, 200, DARK_GLASS, 10);
      rectStroke(ctx, boxX, boxY, 400, 200, HOLO_BLUE, 2, 10);

      dtxt(ctx, tr('Enter City Name'), 'ml', WHITE, SW / 2, boxY + 25, 'center', false);

      rectFill(ctx, boxX + 50, boxY + 60, 300, 36, 'rgb(15,18,30)', 5);
      rectStroke(ctx, boxX + 50, boxY + 60, 300, 36, HOLO_BLUE, 1, 5);

      const cursor = (Date.now() / 500) % 2 > 1.0 ? '|' : '';
      dtxt(ctx, TextCapture.value + cursor, 'm', GOLD, SW / 2, boxY + 78, 'center', false);

      if (this.dialogError) dtxt(ctx, this.dialogError, 'xs', RED_ALERT, SW / 2, boxY + 110, 'center', false);

      const okR = makeRect(boxX + 50, boxY + 130, 120, 36);
      const cnR = makeRect(boxX + 230, boxY + 130, 120, 36);
      const oHov = pointInRect(mx, my, okR), cHov = pointInRect(mx, my, cnR);

      rectFill(ctx, okR.x, okR.y, okR.w, okR.h, oHov ? HOLO_GREEN : 'rgb(10,50,25)', 6);
      rectStroke(ctx, okR.x, okR.y, okR.w, okR.h, oHov ? HOLO_GREEN : 'rgb(20,120,60)', 1, 6);
      dtxt(ctx, tr('Confirm'), 'xs', WHITE, okR.x + okR.w / 2, okR.y + okR.h / 2, 'center', false);

      rectFill(ctx, cnR.x, cnR.y, cnR.w, cnR.h, cHov ? RED_ALERT : 'rgb(50,15,15)', 6);
      rectStroke(ctx, cnR.x, cnR.y, cnR.w, cnR.h, cHov ? RED_ALERT : 'rgb(160,30,30)', 1, 6);
      dtxt(ctx, tr('Back'), 'xs', WHITE, cnR.x + cnR.w / 2, cnR.y + cnR.h / 2, 'center', false);
    } else if (this.settingsOpen) {
      drawDimOverlay(ctx, 140);
      drawSettingsPanel(ctx, mx, my, true);
    }
  },
};
Game.register('hub', SceneHub);


