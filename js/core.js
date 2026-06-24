'use strict';
/* ==========================================================
   SPACE GOVERNOR CD. (ผู้ว่าอวกาศ 2067) — Web Port
   Ported from the original Pygame project (core.py / entities.py /
   ui.py / screens.py / main.py) to a single-canvas HTML5/JS build.
   Architecture mirrors the original module split via section markers.
   ========================================================== */

/* ==========================================================
   1. CORE — CONFIG, COLORS, TRANSLATIONS, SAVE, SOUND
   ========================================================== */
const SW = 1100, SH = 720, FPS = 60;
const MW = SW, MH = SH;
let VIEWPORT_WIDTH = window.innerWidth;

const ENEMY_BASE_X = 90;
const DOME_X = 960;
const DOME_Y = SH / 2;
const DOME_RADIUS = 170;
const CITY_ZONE_X = 760;

const LANE_Y = SH / 2;
const LANE_W = 50;

const WALL_ZONE_X_MIN = ENEMY_BASE_X + 60;
const WALL_ZONE_X_MAX = CITY_ZONE_X;

// Colors (Sleek Mars / Holographic theme)
const MARS_BG     = '#22120e';
const MARS_RUST   = '#af4b2d';
const MARS_GRID   = '#3a1c14';
const DOME_GLOW   = '#00c3ff';
const HOLO_BLUE   = '#008cff';
const HOLO_GREEN  = '#00dc64';
const HOLO_ORANGE = '#ff7800';
const WHITE       = '#ffffff';
const BLACK       = '#000000';
const DARK_GLASS  = 'rgba(12,14,26,0.86)';
const GOLD        = '#ffd232';
const RED_ALERT   = '#e62828';

function rgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function rgbTuple(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

// ---------------- Settings & localization ----------------
const LANG = { v: 'th' };
const SETTINGS = {
  music: true,
  sfx: true,
  governor_name: '',
  music_vol: 80,
  sfx_vol: 80,
};

const TR = {
  "Space Governor CD.": { th: "ผู้ว่าอวกาศ 2067" },
  "Start Game": { th: "เริ่มเกม" },
  "Start New Game": { th: "เริ่มเกมใหม่" },
  "Start Playing": { th: "เริ่มเล่น" },
  "Exit": { th: "ออกจากเกม" },
  "Pause": { th: "หยุดชั่วคราว" },
  "Resume Game": { th: "กลับไปยังเกม" },
  "Back to Menu": { th: "กลับหน้าเมนู" },

  "Enter Governor Name": { th: "กรุณาใส่ชื่อผู้ว่าการ" },
  "Confirm": { th: "ยืนยัน" },
  "Name cannot be empty!": { th: "ชื่อผู้ว่าการห้ามว่าง!" },

  "Welcome back, Governor.": { th: "ยินดีต้อนรับกลับครับ ผู้ว่าการ" },
  "The citizens await your leadership.": { th: "ประชาชนกำลังรอคอยการนำของท่าน" },
  "Ready to defend the city again?": { th: "พร้อมที่จะปกป้องเมืองอีกครั้งหรือยัง?" },

  "Highest Wave Reached": { th: "ป้องกันได้คลื่นสูงสุด" },
  "Total Play Time": { th: "เวลาเล่นทั้งหมด" },
  "Last Played City": { th: "เมืองที่เล่นล่าสุด" },
  "Number of Cities Created": { th: "จำนวนเมืองที่สร้างแล้ว" },
  "Reset All Data": { th: "รีเซ็ตข้อมูลทั้งหมด" },

  "City #": { th: "เมืองที่ " },
  "Empty Slot": { th: "ว่างเปล่า (สร้างเมืองใหม่)" },
  "New City": { th: "สร้างเมืองใหม่" },
  "Continue": { th: "เล่นต่อ" },
  "Delete": { th: "ลบเมือง" },
  "Enter City Name": { th: "กรุณาตั้งชื่อเมือง" },

  "Settings": { th: "การตั้งค่า" },
  "Language": { th: "ภาษา" },
  "Music": { th: "ดนตรีประกอบ" },
  "Sound Effects": { th: "เอฟเฟกต์เสียง" },
  "ON": { th: "เปิด" },
  "OFF": { th: "ปิด" },
  "Reset successful!": { th: "รีเซ็ตข้อมูลเรียบร้อย!" },
  "Back": { th: "กลับ" },

  "DOME HP": { th: "พลังโดม" },
  "MONEY": { th: "เงินทุน" },
  "IRON": { th: "เหล็ก" },
  "COAL": { th: "ถ่านหิน" },
  "HAPPINESS": { th: "ความสุข" },
  "POPULATION": { th: "ประชากร" },
  "WAVE": { th: "คลื่น" },
  "NEXT WAVE": { th: "เริ่มป้องกันคลื่นถัดไป" },
  "BUILD PHASE": { th: "ช่วงเวลาพัฒนาเมือง" },
  "COMBAT PHASE": { th: "ศัตรูเข้าโจมตี!" },
  "AUTOSAVED": { th: "บันทึกอัตโนมัติเรียบร้อย" },

  "House": { th: "บ้านพักอาศัย" },
  "Iron Mine": { th: "เหมืองเหล็ก" },
  "Coal Mine": { th: "เหมืองถ่านหิน" },
  "Park": { th: "สวนสาธารณะ" },
  "Normal Turret": { th: "ป้อมปืนกลเบา" },
  "High Damage Turret": { th: "ป้อมปืนเลเซอร์หนัก" },
  "Rapid Turret": { th: "ป้อมปืนเร็ว" },
  "Medical Bay": { th: "สถานพยาบาล" },
  "Wall": { th: "กำแพงเหล็กกล้า" },

  "Locked": { th: "ล็อกอยู่" },
  "Demolish": { th: "รื้อถอน" },
  "Sell": { th: "ขาย" },
  "Move": { th: "ย้ายที่" },
  "Upgrade": { th: "อัปเกรด" },
  "MAX": { th: "สูงสุด" },
  "Upgraded!": { th: "อัปเกรดสำเร็จ!" },
  "FREE": { th: "ฟรี" },
  "POP": { th: "ปชก" },
  "UNHAPPY WARNING": { th: "ชาวบ้านไม่พอใจ!" },
  "You have been fired!": { th: "คุณถูกไล่ออก!" },

  "HouseDesc": { th: "เพิ่มจำนวนประชากรและผลิตเงินรายได้" },
  "IronMineDesc": { th: "ขุดเจาะแร่เหล็กสำหรับสร้างป้อมและกำแพง" },
  "CoalMineDesc": { th: "ขุดเจาะถ่านหินสำหรับใช้ในเหมืองอื่นๆ" },
  "ParkDesc": { th: "เพิ่มความสุขของประชาชน เพิ่มประสิทธิภาพการผลิต" },
  "NormalTurretDesc": { th: "ยิงกระสุนทำความเสียหายปกติ อัตรายิงปานกลาง" },
  "HighDamageTurretDesc": { th: "ยิงเลเซอร์พลังงานสูง อัตรายิงช้า ทำดาเมจหนัก" },
  "WallDesc": { th: "กำแพงสำหรับบล็อกการเดินศัตรู มีความทนทานสูง" },

  "SELECT NEXT ENEMY GROUP": { th: "เลือกกลุ่มศัตรูที่จะต้านทาน" },
  "Choose your threat and reward": { th: "เลือกความท้าทายเพื่อรับรางวัลที่คุ้มค่า" },
  "Choose upgrades to defend colony": { th: "เลือกการอัปเกรดเพื่อปกป้องอาณานิคม" },
  "Enemy Group": { th: "หน่วยศัตรู" },
  "Enemies Left": { th: "ศัตรูที่เหลือ" },
  "Waves": { th: "คลื่น" },
  "Reward": { th: "รางวัล" },
  "Reward:": { th: "รางวัล:" },
  "Risk Level:": { th: "ระดับอันตราย:" },
  "Low": { th: "ต่ำ" },
  "Medium": { th: "ปานกลาง" },
  "High": { th: "สูง" },
  "Select": { th: "เลือก" },

  "SELECT ONE UPGRADE CARD": { th: "เลือกการอัปเกรด 1 อย่าง" },
  "Tax Reform": { th: "ปฏิรูปภาษี" },
  "Policy: Money generation +25%": { th: "นโยบาย: ผลิตเงินเร็วขึ้น +25%" },
  "Defensive Plating": { th: "เสริมแผ่นเกราะป้องกัน" },
  "Policy: Dome Max HP +250, heal 250": { th: "นโยบาย: เพิ่มเลือดโดมสูงสุด 250 และฮีล" },
  "Citizen Motivation": { th: "กระตุ้นจิตวิญญาณเมือง" },
  "Policy: Global happiness +20": { th: "นโยบาย: เพิ่มความสุขของเมือง +20" },
  "Deep Core Drill": { th: "เครื่องเจาะแกนโลกลึก" },
  "Policy: Mine production +30%": { th: "นโยบาย: กำลังการผลิตเหมือง +30%" },
  "Carbon Steel Walls": { th: "กำแพงโครงสร้างคาร์บอน" },
  "Defense Upgrade: Wall HP +50%": { th: "ต้านทาน: เพิ่มพลังป้องกันกำแพง +50%" },
  "Military Subsidy": { th: "ทุนสนับสนุนการทหาร" },
  "Turrets purchase cost -20%": { th: "การทหาร: ลดราคาการสร้างป้อมปืนลง -20%" },
  "Fast Recharger": { th: "วงจรระบายพลังงานเร็ว" },
  "Normal Turret attack rate +30%": { th: "ป้อมกลเบา: ยิงเร็วขึ้น +30%" },
  "Laser Overcharge": { th: "เลเซอร์โอเวอร์ชาร์จ" },
  "High Damage Turret damage +25%": { th: "เลเซอร์หนัก: เพิ่มพลังโจมตี +25%" },
  "Unlock Park": { th: "ปลดล็อกสวนสาธารณะ" },
  "Structure Unlock: Build Parks": { th: "สิ่งปลูกสร้าง: ปลดล็อกการสร้างสวนสาธารณะ" },
  "Unlock High Damage Turret": { th: "ปลดล็อกป้อมเลเซอร์หนัก" },
  "Turret Unlock: Build Heavy Lasers": { th: "ป้องกัน: ปลดล็อกการสร้างป้อมเลเซอร์หนัก" },
  "Shield Generator": { th: "เครื่องกำเนิดโล่พลังงาน" },
  "Defense: Dome takes -25% damage": { th: "ป้องกัน: โดมรับความเสียหายลดลง -25%" },
  "Auto Repair Drones": { th: "โดรนซ่อมแซมอัตโนมัติ" },
  "Policy: Dome heals +60 HP each wave": { th: "นโยบาย: โดมฟื้นฟู +60 HP ทุกคลื่น" },
  "Advanced Optics": { th: "ระบบเล็งขั้นสูง" },
  "Defense: All turret range +25%": { th: "ป้องกัน: เพิ่มระยะยิงป้อมปืนทั้งหมด +25%" },
  "Energy Capacitor": { th: "ตัวเก็บประจุพลังงาน" },
  "Policy: All resource generation +15%": { th: "นโยบาย: เพิ่มการผลิตทรัพยากรทั้งหมด +15%" },
  "Quick Hands": { th: "มือไวดั่งสายฟ้า" },
  "Defense: All turrets fire +20% faster": { th: "ป้องกัน: ป้อมปืนทั้งหมดยิงเร็วขึ้น +20%" },
  "Recycling Plant": { th: "โรงงานรีไซเคิล" },
  "Policy: Demolish refunds 80% instead of 50%": { th: "นโยบาย: รื้อถอนคืนทุน 80% แทน 50%" },

  "GAME OVER": { th: "เกมสิ้นสุดลงแล้ว!" },
  "Wave Reached:": { th: "คลื่นที่ต้านทานได้:" },
  "Play Time:": { th: "ระยะเวลาการเล่น:" },
  "Return to Hub Menu": { th: "กลับสู่เมนูหลัก" },
  "Start New City": { th: "สร้างเมืองใหม่ในช่องเดิม" },
  "Next Wave in": { th: "คลื่นถัดไปในอีก" },
  "Skip": { th: "ข้าม" },
  "Wave Cleared!": { th: "ผ่านคลื่นสำเร็จ!" },

  "Void Specter": { th: "ผีดิบอวกาศ" },
  "Rapid Turret": { th: "ป้อมปืนเร็ว" },
  "Medical Bay": { th: "ห้องพยาบาล" },
  "Unlock Rapid Turret": { th: "ปลดล็อกป้อมปืนเร็ว" },
  "Turret Unlock: Build Rapid-Fire Turrets": { th: "ป้องกัน: ปลดล็อกการสร้างป้อมปืนเร็ว" },
  "Unlock Medical Bay": { th: "ปลดล็อกห้องพยาบาล" },
  "Structure Unlock: Build Medical Bays": { th: "สิ่งปลูกสร้าง: ปลดล็อกห้องพยาบาล" },
  "RapidTurretDesc": { th: "ยิงเร็วมาก ทำความเสียหายน้อยต่อครั้ง" },
  "MedicalBayDesc": { th: "ซ่อมแซมโดม +20 HP หลังจบแต่ละคลื่น" },
  "Reroll": { th: "สุ่มใหม่" },
};

function tr(text) {
  if (LANG.v === 'th') {
    const e = TR[text];
    if (e && e.th) return e.th;
    return text;
  }
  return text;
}

// ---------------- Local persistent save/load (localStorage) ----------------
const SAVE_PREFIX = 'spacegov_';
const PROFILE_KEY = SAVE_PREFIX + 'profile';
const PROFILE_STAT_KEYS = ['highest_wave', 'total_play_time', 'last_played_city', 'cities_created'];

function citySaveKey(slotId) { return SAVE_PREFIX + 'city_' + slotId; }

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    SETTINGS.governor_name = data.governor_name || '';
    LANG.v = data.language || 'th';
    SETTINGS.music = data.music !== undefined ? data.music : true;
    SETTINGS.sfx = data.sfx !== undefined ? data.sfx : true;
    SETTINGS.music_vol = data.music_vol !== undefined ? data.music_vol : 80;
    SETTINGS.sfx_vol = data.sfx_vol !== undefined ? data.sfx_vol : 80;
    return data;
  } catch (e) {
    console.error('Error loading profile:', e);
    return null;
  }
}

function saveProfile(statsToMerge) {
  const profileData = {
    governor_name: '', language: 'th', music: true, sfx: true,
    music_vol: 80, sfx_vol: 80,
    highest_wave: 0, total_play_time: 0.0, last_played_city: null, cities_created: 0,
  };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const old = JSON.parse(raw);
      for (const k in profileData) if (k in old) profileData[k] = old[k];
    }
  } catch (e) { /* ignore */ }

  profileData.governor_name = SETTINGS.governor_name;
  profileData.language = LANG.v;
  profileData.music = SETTINGS.music;
  profileData.sfx = SETTINGS.sfx;
  profileData.music_vol = SETTINGS.music_vol;
  profileData.sfx_vol = SETTINGS.sfx_vol;

  if (statsToMerge) {
    for (const k of PROFILE_STAT_KEYS) if (k in statsToMerge) profileData[k] = statsToMerge[k];
  }
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
  } catch (e) { console.error('Error saving profile:', e); }
}

function loadCity(slotId) {
  try {
    const raw = localStorage.getItem(citySaveKey(slotId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { console.error('Error loading slot', slotId, e); return null; }
}

function saveCity(slotId, cityData) {
  try {
    localStorage.setItem(citySaveKey(slotId), JSON.stringify(cityData));
    saveProfile({ last_played_city: cityData.city_name });
  } catch (e) { console.error('Error saving slot', slotId, e); }
}

function deleteCity(slotId) {
  try { localStorage.removeItem(citySaveKey(slotId)); } catch (e) { /* ignore */ }
}

function resetAllData() {
  for (let i = 1; i <= 3; i++) deleteCity(i);
  try { localStorage.removeItem(PROFILE_KEY); } catch (e) { /* ignore */ }
  SETTINGS.governor_name = '';
  LANG.v = 'th';
  SETTINGS.music = true;
  SETTINGS.sfx = true;
}

// ---------------- Procedural sound (Web Audio API) ----------------
const AudioSys = (() => {
  let ctx = null;
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, shape, vol, t0, freqEnd) {
    const ac = ensureCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = shape;
    const start = ac.currentTime + t0;
    osc.frequency.setValueAtTime(Math.max(20, freq), start);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + dur);
    }
    const sfxVol = (SETTINGS.sfx_vol / 100) * vol;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(sfxVol, start + Math.min(0.012, dur * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function noiseBurst(dur, vol, t0, lowpass) {
    const ac = ensureCtx();
    const bufSize = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    const sfxVol = (SETTINGS.sfx_vol / 100) * vol;
    gain.gain.value = sfxVol;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 2200;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(ac.currentTime + t0);
  }

  const SFX = {
    click: () => tone(1200, 0.035, 'square', 0.18, 0),
    place: () => { tone(440, 0.05, 'triangle', 0.22, 0); tone(880, 0.09, 'triangle', 0.18, 0.05); },
    shoot_normal: () => tone(620, 0.07, 'sawtooth', 0.12, 0, 320),
    shoot_heavy: () => { tone(170, 0.26, 'sawtooth', 0.30, 0, 60); noiseBurst(0.08, 0.10, 0, 1200); },
    explosion: () => { tone(90, 0.32, 'square', 0.32, 0, 35); noiseBurst(0.3, 0.22, 0, 900); },
    dome_hit: () => tone(190, 0.16, 'square', 0.32, 0, 90),
    cash: () => { tone(880, 0.05, 'triangle', 0.18, 0); tone(1320, 0.07, 'triangle', 0.16, 0.05); },
    win_collection: () => { tone(523, 0.09, 'square', 0.22, 0); tone(659, 0.09, 'square', 0.22, 0.09); tone(784, 0.18, 'square', 0.26, 0.18); },
    gameover: () => { tone(220, 0.22, 'square', 0.30, 0, 200); tone(165, 0.28, 'square', 0.26, 0.22, 150); tone(110, 0.42, 'square', 0.22, 0.5, 90); },
    wave_start: () => { tone(300, 0.08, 'square', 0.18, 0, 500); tone(500, 0.12, 'square', 0.18, 0.08); },
  };

  function play(name) {
    if (!SETTINGS.sfx) return;
    const fn = SFX[name];
    if (fn) {
      try { fn(); } catch (e) { /* audio not unlocked yet */ }
    }
  }

  function unlock() { ensureCtx(); }

  return { play, unlock };
})();

function playSfx(name) { AudioSys.play(name); }

// ---------------- Background music (mainsong.mp3) ----------------
const MusicPlayer = (() => {
  let audio = null;
  let started = false;

  function ensure() {
    if (audio) return true;
    try {
      audio = new Audio('mainsong.mp3');
      audio.loop = true;
      audio.volume = 0;
      return true;
    } catch (e) {
      return false;
    }
  }

  function sync() {
    if (!audio) return;
    if (SETTINGS.music && SETTINGS.music_vol > 0) {
      audio.volume = SETTINGS.music_vol / 100;
      if (audio.paused && started) audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  function start() {
    if (!ensure()) return;
    started = true;
    sync();
  }

  function unlock() {
    if (!ensure()) return;
    if (!started) start();
  }

  return { unlock, start, sync };
})();

/* ==========================================================
   2. CANVAS DRAW HELPERS (low level, used by entities + ui)
   ========================================================== */
function circle(ctx, x, y, r, col, lineW) {
  if (r <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (lineW) { ctx.strokeStyle = col; ctx.lineWidth = lineW; ctx.stroke(); }
  else { ctx.fillStyle = col; ctx.fill(); }
}
function rectFill(ctx, x, y, w, h, col, radius) {
  ctx.fillStyle = col;
  if (radius) roundRectPath(ctx, x, y, w, h, radius);
  else ctx.fillRect(x, y, w, h);
  if (radius) ctx.fill();
}
function rectStroke(ctx, x, y, w, h, col, lineW, radius) {
  ctx.strokeStyle = col;
  ctx.lineWidth = lineW || 1;
  if (radius) { roundRectPath(ctx, x, y, w, h, radius); ctx.stroke(); }
  else ctx.strokeRect(x, y, w, h);
}
function roundRectPath(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.arcTo(x + w, y, x + w, y + r.tr, r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.arcTo(x + w, y + h, x + w - r.br, y + h, r.br);
  ctx.lineTo(x + r.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - r.bl, r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.arcTo(x, y, x + r.tl, y, r.tl);
  ctx.closePath();
}
function lineSeg(ctx, x1, y1, x2, y2, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w || 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function ellipseFill(ctx, x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}
function ellipseStroke(ctx, x, y, w, h, col, lw) {
  ctx.strokeStyle = col; ctx.lineWidth = lw || 1;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}
function polygonFill(ctx, pts, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}
function arcStroke(ctx, x, y, w, h, start, end, col, lw) {
  ctx.strokeStyle = col; ctx.lineWidth = lw || 1;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, start, end);
  ctx.stroke();
}
function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
function makeRect(x, y, w, h) { return { x, y, w, h }; }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }


