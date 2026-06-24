/* ==========================================================
   10. GAMEPLAY — static map generation, placement rules, data pools
   ========================================================== */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randInt(rng, lo, hi) { return Math.floor(rng() * (hi - lo + 1)) + lo; }

function buildStaticMap() {
  const off = document.createElement('canvas');
  off.width = MW; off.height = MH;
  const ctx = off.getContext('2d');
  ctx.fillStyle = '#1a0e0a'; ctx.fillRect(0, 0, MW, MH);
  ctx.fillStyle = '#22120e'; ctx.fillRect(0, MH * 0.28, MW, MH * 0.44);

  const rng = mulberry32(777);

  for (let i = 0; i < 8; i++) {
    const cx = randInt(rng, 0, MW), cy = randInt(rng, 0, MH), r = randInt(rng, 80, 180);
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const lum = randInt(rng, 45, 65);
    grd.addColorStop(0, 'rgba(' + lum + ',' + Math.floor(lum * 0.52) + ',' + Math.floor(lum * 0.34) + ',0.32)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < 500; i++) {
    const cx = randInt(rng, 0, MW), cy = randInt(rng, 0, MH), cr = randInt(rng, 1, 5);
    const lum = randInt(rng, 32, 72);
    circle(ctx, cx, cy, cr, 'rgb(' + lum + ',' + Math.floor(lum * 0.54) + ',' + Math.floor(lum * 0.37) + ')');
  }

  for (let i = 0; i < 40; i++) {
    const cx = randInt(rng, 50, MW - 50);
    const cr = randInt(rng, 18, 55);
    for (let side = 0; side < 2; side++) {
      const cy = side === 0
        ? randInt(rng, 20, LANE_Y - LANE_W - 30)
        : randInt(rng, LANE_Y + LANE_W + 30, MH - 20);
      ellipseFill(ctx, cx - cr, cy - cr * 0.5, cr * 2, cr, 'rgb(12,6,5)');
      ellipseFill(ctx, cx - cr * 0.82, cy - cr * 0.42, cr * 1.64, cr * 0.82, 'rgb(26,13,10)');
      ellipseStroke(ctx, cx - cr, cy - cr * 0.5, cr * 2, cr, 'rgb(62,32,20)', 2);
      ellipseFill(ctx, cx - cr * 0.22, cy - cr * 0.11, cr * 0.44, cr * 0.22, 'rgb(8,4,3)');
    }
  }

  const laneTop = LANE_Y - LANE_W, laneBot = LANE_Y + LANE_W;
  rectFill(ctx, 0, laneTop, MW, LANE_W * 2, 'rgb(62,36,20)');
  rectFill(ctx, 0, laneTop, MW, 7, 'rgb(48,26,13)');
  rectFill(ctx, 0, laneBot - 7, MW, 7, 'rgb(48,26,13)');
  lineSeg(ctx, 0, laneTop, MW, laneTop, 'rgb(112,66,38)', 2);
  lineSeg(ctx, 0, laneBot, MW, laneBot, 'rgb(112,66,38)', 2);

  for (let dx = 0; dx < MW; dx += 16) {
    for (let i = 0; i < 4; i++) {
      const ox = randInt(rng, -8, 8), oy = randInt(rng, -LANE_W + 8, LANE_W - 8);
      const sz = randInt(rng, 1, 4);
      const lum = randInt(rng, 42, 58);
      circle(ctx, dx + ox, LANE_Y + oy, sz, 'rgb(' + lum + ',' + Math.floor(lum * 0.5) + ',' + Math.floor(lum * 0.3) + ')');
    }
  }

  for (let dx = 30; dx < MW - 60; dx += 44) {
    rectFill(ctx, dx, LANE_Y - 2, 24, 4, 'rgba(118,72,40,0.5)', 2);
  }

  const ex = ENEMY_BASE_X, ey = LANE_Y;
  ctx.save(); ctx.globalAlpha = 0.15;
  circle(ctx, ex, ey, 115, 'rgb(220,40,40)');
  ctx.restore();

  rectFill(ctx, ex - 80, ey - 100, 160, 200, 'rgb(48,11,11)', 8);
  rectStroke(ctx, ex - 80, ey - 100, 160, 200, 'rgb(200,35,35)', 3, 8);

  for (let i = 0; i < 5; i++) {
    const stripeY = ey - 80 + i * 32;
    const col = i % 2 === 0 ? 'rgb(200,60,0)' : 'rgb(60,10,10)';
    rectFill(ctx, ex + 85, stripeY, 20, 28, col);
    rectFill(ctx, ex - 105, stripeY, 20, 28, col);
  }

  for (let i = -2; i <= 2; i++) {
    const sx = ex + i * 28;
    polygonFill(ctx, [[sx, ey - 116], [sx - 9, ey - 89], [sx + 9, ey - 89]], 'rgb(175,32,32)');
    polygonFill(ctx, [[sx, ey - 113], [sx - 5, ey - 91], [sx + 5, ey - 91]], 'rgb(240,60,60)');
  }

  circle(ctx, ex, ey, 38, 'rgb(95,14,14)');
  circle(ctx, ex, ey, 28, 'rgb(180,35,35)');
  circle(ctx, ex, ey, 16, 'rgb(240,58,58)');
  circle(ctx, ex, ey, 7, 'rgb(255,155,115)');

  lineSeg(ctx, ex - 40, ey - 100, ex - 40, ey - 132, 'rgb(145,28,28)', 2);
  lineSeg(ctx, ex + 40, ey - 100, ex + 40, ey - 132, 'rgb(145,28,28)', 2);
  circle(ctx, ex - 40, ey - 132, 4, 'rgb(255,75,75)');
  circle(ctx, ex + 40, ey - 132, 4, 'rgb(255,75,75)');

  const cityLeft = CITY_ZONE_X;
  rectFill(ctx, cityLeft, 0, MW - cityLeft, MH, 'rgb(17,19,32)');
  lineSeg(ctx, cityLeft, 0, cityLeft, MH, 'rgb(0,145,205)', 3);
  lineSeg(ctx, cityLeft + 2, 0, cityLeft + 2, MH, 'rgba(0,185,255,0.12)', 7);

  for (let gx = cityLeft; gx < MW; gx += 60) {
    const bright = (Math.round((gx - cityLeft) / 60) % 3 === 0);
    lineSeg(ctx, gx, 0, gx, MH, bright ? 'rgb(33,52,84)' : 'rgb(24,30,48)', 1);
  }
  for (let gy = 0; gy < MH; gy += 60) {
    const bright = (Math.round(gy / 60) % 3 === 0);
    lineSeg(ctx, cityLeft, gy, MW, gy, bright ? 'rgb(33,52,84)' : 'rgb(24,30,48)', 1);
  }

  const bLen = 18;
  ctx.strokeStyle = 'rgb(0,175,255)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cityLeft + 12, 12 + bLen); ctx.lineTo(cityLeft + 12, 12); ctx.lineTo(cityLeft + 12 + bLen, 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cityLeft + 12, MH - 12 - bLen); ctx.lineTo(cityLeft + 12, MH - 12); ctx.lineTo(cityLeft + 12 + bLen, MH - 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(MW - 12 - bLen, 12); ctx.lineTo(MW - 12, 12); ctx.lineTo(MW - 12, 12 + bLen); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(MW - 12 - bLen, MH - 12); ctx.lineTo(MW - 12, MH - 12); ctx.lineTo(MW - 12, MH - 12 - bLen); ctx.stroke();

  return off;
}

function getPlacementZone(selectedBuilding, worldX, worldY) {
  const onLane = Math.abs(worldY - LANE_Y) <= LANE_W;
  const onLaneXRange = worldX >= WALL_ZONE_X_MIN && worldX <= WALL_ZONE_X_MAX;
  const inCityDome = (worldX >= CITY_ZONE_X + 15 && worldX <= MW - 15 && worldY >= 15 && worldY <= MH - 15);

  if (selectedBuilding === 'wall') return onLane && onLaneXRange;
  if (selectedBuilding === 'normal' || selectedBuilding === 'heavy' || selectedBuilding === 'rapid') {
    const inOuterDomeRect = (worldX >= CITY_ZONE_X - 10 && worldX <= MW + 10 && worldY >= -10 && worldY <= MH + 10);
    return (!onLane) && !inOuterDomeRect;
  }
  return inCityDome;
}

const UPGRADE_POOL = [
  { name: 'Tax Reform', category: 'Policy', desc: 'Policy: Money generation +25%', cost: 80 },
  { name: 'Defensive Plating', category: 'Policy', desc: 'Policy: Dome Max HP +250, heal 250', cost: 150 },
  { name: 'Citizen Motivation', category: 'Policy', desc: 'Policy: Global happiness +20', cost: 100 },
  { name: 'Deep Core Drill', category: 'Policy', desc: 'Policy: Mine production +30%', cost: 100 },
  { name: 'Carbon Steel Walls', category: 'Defense', desc: 'Defense Upgrade: Wall HP +50%', cost: 60 },
  { name: 'Military Subsidy', category: 'Defense', desc: 'Turrets purchase cost -20%', cost: 80 },
  { name: 'Fast Recharger', category: 'Defense', desc: 'Normal Turret attack rate +30%', cost: 60 },
  { name: 'Laser Overcharge', category: 'Defense', desc: 'High Damage Turret damage +25%', cost: 70 },
  { name: 'Unlock Park', category: 'Unlock', desc: 'Structure Unlock: Build Parks', cost: 0 },
  { name: 'Unlock High Damage Turret', category: 'Unlock', desc: 'Turret Unlock: Build Heavy Lasers', cost: 0 },
  { name: 'Shield Generator', category: 'Defense', desc: 'Defense: Dome takes -25% damage', cost: 120 },
  { name: 'Auto Repair Drones', category: 'Policy', desc: 'Policy: Dome heals +60 HP each wave', cost: 100 },
  { name: 'Advanced Optics', category: 'Defense', desc: 'Defense: All turret range +25%', cost: 70 },
  { name: 'Energy Capacitor', category: 'Policy', desc: 'Policy: All resource generation +15%', cost: 100 },
  { name: 'Quick Hands', category: 'Defense', desc: 'Defense: All turrets fire +20% faster', cost: 80 },
  { name: 'Recycling Plant', category: 'Policy', desc: 'Policy: Demolish refunds 80% instead of 50%', cost: 50 },
  { name: 'Unlock Rapid Turret', category: 'Unlock', desc: 'Turret Unlock: Build Rapid-Fire Turrets', cost: 0 },
  { name: 'Unlock Medical Bay', category: 'Unlock', desc: 'Structure Unlock: Build Medical Bays', cost: 0 },
];

function sampleUpgradeOptions(pool, n) {
  const shuffled = pool.slice();
  shuffleInPlace(shuffled);
  const result = sampleWithoutReplacement(shuffled, n);
  if (!result.some(u => u.cost === 0)) {
    const free = pool.filter(u => u.cost === 0);
    if (free.length > 0) {
      const freeCard = free[Math.floor(Math.random() * free.length)];
      result[Math.floor(Math.random() * result.length)] = freeCard;
    }
  }
  return result;
}

function sampleWithoutReplacement(arr, n) {
  const copy = arr.slice();
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ENEMY_SETS = [
  { nameSuffix: 'Patrol', risk: 'Low', composition: ['A','A','A','A','A'], reward_money: 60, reward_iron: 10, reward_coal: 5 },
  { nameSuffix: 'Strike', risk: 'Low', composition: ['A','A','B','A','A','B'], reward_money: 90, reward_iron: 15, reward_coal: 8 },
  { nameSuffix: 'Assault', risk: 'Medium', composition: ['A','B','A','B','A','B','C'], reward_money: 130, reward_iron: 25, reward_coal: 12 },
  { nameSuffix: 'Siege', risk: 'Medium', composition: ['B','B','C','B','C','D'], reward_money: 180, reward_iron: 35, reward_coal: 18 },
  { nameSuffix: 'Vanguard', risk: 'Medium', composition: ['A','B','C','C','B','A','D'], reward_money: 200, reward_iron: 40, reward_coal: 20 },
  { nameSuffix: 'Dread', risk: 'High', composition: ['B','C','D','C','B','D','C','D'], reward_money: 280, reward_iron: 55, reward_coal: 30 },
  { nameSuffix: 'Nightmare', risk: 'High', composition: ['C','D','C','D','C','D','B'], reward_money: 320, reward_iron: 65, reward_coal: 35 },
  { nameSuffix: 'Apocalypse', risk: 'High', composition: ['A','A','B','B','C','C','D','D','C','D'], reward_money: 400, reward_iron: 80, reward_coal: 45 },
  { nameSuffix: 'Phalanx', risk: 'High', composition: ['B','C','C','D','D','B','C','D','D'], reward_money: 350, reward_iron: 70, reward_coal: 38 },
  { nameSuffix: 'Omega', risk: 'High', composition: ['B','D','C','D','D','C','D','B','D','D','C'], reward_money: 500, reward_iron: 100, reward_coal: 55 },
];

function generateEnemyOptions(wave, usedIndices) {
  const available = [];
  for (let i = 0; i < ENEMY_SETS.length; i++) {
    if (!usedIndices.has(i)) available.push(i);
  }
  if (available.length < 3) {
    return [
      { name: `${tr('Enemy Group')} Alpha`, risk: 'Low', waves_count: 1, reward_money: 60 + wave * 20, reward_iron: 10 + wave * 5, reward_coal: 5 + wave * 3, composition: Array(4 + wave * 2).fill('A') },
      { name: `${tr('Enemy Group')} Beta`, risk: 'Medium', waves_count: 1, reward_money: 100 + wave * 30, reward_iron: 20 + wave * 8, reward_coal: 10 + wave * 4, composition: Array(3 + wave * 2).fill('A').concat(Array(wave).fill('B')) },
      { name: `${tr('Enemy Group')} Gamma`, risk: 'High', waves_count: 1, reward_money: 180 + wave * 50, reward_iron: 35 + wave * 12, reward_coal: 20 + wave * 6, composition: Array(2 + wave * 2).fill('B').concat(Array(wave).fill('C')) },
    ];
  }
  shuffleInPlace(available);
  const picks = available.slice(0, 3);
  return picks.map(i => {
    const s = ENEMY_SETS[i];
    const waveMult = 1.0 + (wave - 1) * 0.15;
    return {
      name: `${tr('Enemy Group')} ${s.nameSuffix}`,
      risk: s.risk,
      waves_count: 1,
      reward_money: Math.floor(s.reward_money * waveMult),
      reward_iron: Math.floor(s.reward_iron * waveMult),
      reward_coal: Math.floor(s.reward_coal * waveMult),
      composition: s.composition.slice(),
      setId: i,
    };
  });
}


/* ==========================================================
   11. SCENE: GAMEPLAY (build / combat / selector / upgrade)
   ========================================================== */
const SceneGame = {
  init(params) {
    loadProfile();
    this.slotId = params.slotId;
    this.mapSurf = buildStaticMap();

    const cd = loadCity(this.slotId);
    if (!cd) { Game.goto('hub'); return; }
    this.cityData = cd;

    this.money = cd.money;
    this.iron = cd.iron;
    this.coal = cd.coal;
    this.happiness = parseFloat(cd.happiness);
    this.population = 0;
    this.wave = cd.current_wave;
    this.playTime = cd.play_time;
    this.happinessBonus = parseFloat(cd.happiness_bonus || 0.0);
    this.passiveResourceTimer = 0.0;

    this.unlockedStructures = new Set(cd.unlocked_structures || ['house', 'iron_mine', 'coal_mine']);
    this.unlockedTurrets = new Set(cd.unlocked_turrets || ['normal_turret', 'wall']);
    this.unlockedUpgrades = new Set(cd.unlocked_upgrades || []);

    this.recalcMultipliers();

    this.dome = new Dome();
    this.dome.hp = cd.dome_hp;
    this.dome.maxHp = cd.dome_max_hp !== undefined ? cd.dome_max_hp : 1000;

    this.structures = [];
    for (const s of (cd.structures || [])) this.structures.push(new Structure(s.type, s.x, s.y));

    this.turrets = [];
    for (const t of (cd.turrets || [])) {
      this.turrets.push(new Turret(t.type, t.x, t.y, this.upgradeCostMult, this.normalRateMult, this.heavyDmgMult, this.rangeMult, this.globalRateMult));
    }
    for (const w of (cd.walls || [])) this.structures.push(new Structure('wall', w.x, w.y, this.wallHpMult));

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    this.selectedBuilding = null;
    this.selectedPlacedEntity = null;
    this.moveTarget = null;
    this.showUpgradeFor = null;
    this.dragBuilding = null;

    this.gamePhase = 'SELECTOR';
    if (cd.game_phase === 'UPGRADE') this.gamePhase = 'UPGRADE';
    else if (cd.game_phase === 'BUILD' || cd.game_phase === 'COMBAT') this.gamePhase = 'BUILD';
    this.usedEnemySetIndices = cd.used_enemy_sets ? new Set(cd.used_enemy_sets) : new Set();
    this.barH = 90;
    this.buildBarCategory = 'Defense';

    this.enemyOptions = this.gamePhase === 'SELECTOR' ? generateEnemyOptions(this.wave, this.usedEnemySetIndices) : [];
    this.upgradeOptions = [];
    this.combatSpawnQueue = cd.spawn_queue || [];
    this.buildTimer = cd.build_timer !== undefined ? cd.build_timer : 30;
    this.combatSpawnTimer = 0.0;
    this.combatBreakTimer = 0.0;
    this.collectionRewards = cd.collection_rewards || null;
    this.waveClearedAnim = 0.0;

    this.autosaveAlertTimer = 0.0;
    this.pauseOpen = false;
    this.pauseSubmenu = null;
    this.pauseBtnRect = makeRect(SW - 65, 12, 50, 42);

    this.tick = 0;
  },

  recalcMultipliers() {
    const up = this.unlockedUpgrades;
    this.upgradeCostMult = up.has('Military Subsidy') ? 0.8 : 1.0;
    this.wallHpMult = up.has('Carbon Steel Walls') ? 1.5 : 1.0;
    this.normalRateMult = up.has('Fast Recharger') ? 0.7 : 1.0;
    this.heavyDmgMult = up.has('Laser Overcharge') ? 1.25 : 1.0;
    this.rangeMult = up.has('Advanced Optics') ? 1.25 : 1.0;
    this.globalRateMult = up.has('Quick Hands') ? 0.8 : 1.0;
    this.domeDmgMult = up.has('Shield Generator') ? 0.75 : 1.0;
    this.energyCapMult = up.has('Energy Capacitor') ? 1.15 : 1.0;
    this.demolishRefundMult = up.has('Recycling Plant') ? 1.6 : 1.0;
  },

  computeBuildBarRects(category) {
    const barH = 90, barY = SH - barH;
    const tabX = 12, tabW = 90, tabH = 34;
    const tabNames = ['Defense', 'Structure'];
    const tabYBase = barY + (barH - tabNames.length * (tabH + 6)) / 2;
    const tabRects = [];
    for (let i = 0; i < tabNames.length; i++) {
      const tname = tabNames[i];
      const ty = tabYBase + i * (tabH + 6);
      const r = makeRect(tabX, ty, tabW, tabH);
      tabRects.push([r, tname]);
    }

    const defenseDefs = [
      ['normal', tr('Normal Turret'), 120, 20, 5, this.unlockedTurrets.has('normal_turret'), 'NormalTurretDesc', 5],
      ['heavy', tr('High Damage Turret'), 250, 50, 10, this.unlockedTurrets.has('heavy_turret'), 'HighDamageTurretDesc', 10],
      ['rapid', tr('Rapid Turret'), 160, 30, 8, this.unlockedTurrets.has('rapid_turret'), 'RapidTurretDesc', 15],
      ['wall', tr('Wall'), 30, 10, 0, this.unlockedTurrets.has('wall'), 'WallDesc', 0],
    ];
    const structureDefs = [
      ['house', tr('House'), 100, 0, 0, this.unlockedStructures.has('house'), 'HouseDesc'],
      ['iron_mine', tr('Iron Mine'), 150, 0, 10, this.unlockedStructures.has('iron_mine'), 'IronMineDesc'],
      ['coal_mine', tr('Coal Mine'), 150, 10, 0, this.unlockedStructures.has('coal_mine'), 'CoalMineDesc'],
      ['park', tr('Park'), 200, 15, 15, this.unlockedStructures.has('park'), 'ParkDesc'],
      ['medical', tr('Medical Bay'), 180, 0, 15, this.unlockedStructures.has('medical'), 'MedicalBayDesc'],
    ];

    let buildingDefs = (category === 'Defense' ? defenseDefs : structureDefs).filter(b => b[5]);

    const btnW = 120, btnH = 70;
    const itemsStartX = tabX + tabW + 18, gap = 16;

    const clickRects = [];
    for (let i = 0; i < buildingDefs.length; i++) {
      const [btype] = buildingDefs[i];
      const bx = itemsStartX + i * (btnW + gap), by = barY + 10;
      const r = makeRect(bx, by, btnW, btnH);
      clickRects.push([r, btype]);
    }
    return { clickRects, tabRects };
  },

  persistCity() {
    const cd = this.cityData;
    cd.money = this.money;
    cd.iron = this.iron;
    cd.coal = this.coal;
    cd.happiness = this.happiness;
    cd.happiness_bonus = this.happinessBonus;
    cd.current_wave = this.wave;
    cd.dome_hp = this.dome.hp;
    cd.dome_max_hp = this.dome.maxHp;
    cd.play_time = this.playTime;
    cd.structures = this.structures.filter(s => s.stype !== 'wall').map(s => ({ type: s.stype, x: s.x, y: s.y }));
    cd.walls = this.structures.filter(s => s.stype === 'wall').map(s => ({ x: s.x, y: s.y }));
    cd.turrets = this.turrets.map(t => ({ type: t.ttype, x: t.x, y: t.y }));
    cd.unlocked_structures = Array.from(this.unlockedStructures);
    cd.unlocked_turrets = Array.from(this.unlockedTurrets);
    cd.unlocked_upgrades = Array.from(this.unlockedUpgrades);
    cd.game_phase = this.gamePhase === 'COMBAT' ? 'BUILD' : this.gamePhase;
    cd.spawn_queue = this.combatSpawnQueue.slice();
    cd.build_timer = this.gamePhase === 'BUILD' ? this.buildTimer : 30;
    cd.collection_rewards = this.collectionRewards;
    cd.used_enemy_sets = Array.from(this.usedEnemySetIndices);
    saveCity(this.slotId, cd);
  },

  resourceYield() {
    const housesCount = this.structures.filter(s => s.stype === 'house').length;
    let happyMult = 1.0 + (this.happiness - 50.0) / 100.0;
    const mineMult = this.unlockedUpgrades.has('Deep Core Drill') ? 1.3 : 1.0;
    const taxMult = this.unlockedUpgrades.has('Tax Reform') ? 1.25 : 1.0;
    const energyMult = this.energyCapMult;
    if (this.happiness < 30.0) happyMult *= 0.5;
    if (this.happiness < 15.0) happyMult *= 0.4;
    if (this.happiness > 70.0) happyMult *= 1.3;
    if (this.happiness > 90.0) happyMult *= 1.5;
    const houseYield = Math.floor(housesCount * 20 * happyMult * taxMult * energyMult);
    const ironYield = Math.floor(this.structures.filter(s => s.stype === 'iron_mine').length * 10 * happyMult * mineMult * energyMult);
    const coalYield = Math.floor(this.structures.filter(s => s.stype === 'coal_mine').length * 10 * happyMult * mineMult * energyMult);
    return { houseYield, ironYield, coalYield };
  },

  exit() {},

  frame(ctx, dt, events, mx, my) {
    this.tick++;
    if (this.gamePhase !== 'BUILD' && this.gamePhase !== 'COMBAT') { this.selectedBuilding = null; this.selectedPlacedEntity = null; }
    if (!this.pauseOpen) this.playTime += dt;
    if (this.autosaveAlertTimer > 0) this.autosaveAlertTimer -= dt;
    if (this.waveClearedAnim > 0) this.waveClearedAnim -= dt;

    const housesCount = this.structures.filter(s => s.stype === 'house').length;
    this.population = housesCount * 10;
    const parksCount = this.structures.filter(s => s.stype === 'park').length;
    const baseHappy = 50.0 + parksCount * 15.0 + this.happinessBonus;
    const popPenalty = Math.floor(this.population / 10) * 1.5;
    this.happiness = clamp(baseHappy - popPenalty, 0.0, 100.0);

    this.recalcMultipliers();

    const overlayActive = this.pauseOpen || this.pauseSubmenu === 'settings';
    const buildBarRects = this.computeBuildBarRects(this.buildBarCategory);

    let click = false;
    for (const ev of events) {
      if (ev.type === 'mousedown') {
        if (ev.button === 0) {
          click = true;
        } else if (ev.button === 2) {
          this.selectedBuilding = null; this.selectedPlacedEntity = null;
          if (this.moveTarget) {
            const mt = this.moveTarget;
            if (mt.stype) this.structures.push(mt);
            else this.turrets.push(mt);
            this.moveTarget = null;
          }
          this.showUpgradeFor = null;
        }
      }
      if (ev.type === 'mouseup' && ev.button === 0) {
        UIState.sliderDragging = null;
      }
      if (ev.type === 'keydown' && ev.key === 'Escape') {
        if (this.moveTarget) {
          const mt = this.moveTarget;
          if (mt.stype) this.structures.push(mt);
          else this.turrets.push(mt);
          this.moveTarget = null;
          this.selectedPlacedEntity = mt;
        } else if (this.showUpgradeFor) {
          this.showUpgradeFor = null;
        } else if (this.pauseSubmenu === 'settings') this.pauseSubmenu = null;
        else if (this.pauseOpen) this.pauseOpen = false;
        else if (this.gamePhase !== 'SELECTOR' && this.gamePhase !== 'UPGRADE') {
          this.pauseOpen = true;
          this.selectedBuilding = null;
          this.selectedPlacedEntity = null;
        }
        this.selectedBuilding = null;
      }
    }

    if (this.pauseSubmenu === 'settings') updateSliderDrag(mx, Input.mouseDown, false);

    const skipBtnRect = makeRect(SW / 2 - 70, 108, 140, 36);
    const skipBtnHov = pointInRect(mx, my, skipBtnRect);

    if (click && this.gamePhase !== 'SELECTOR' && this.gamePhase !== 'UPGRADE') {
      if (pointInRect(mx, my, this.pauseBtnRect)) {
        playSfx('click');
        if (this.pauseSubmenu === 'settings') this.pauseSubmenu = null;
        else this.pauseOpen = !this.pauseOpen;
        this.selectedBuilding = null;
        this.selectedPlacedEntity = null;
        click = false;
      } else if (overlayActive) {
        if (this.pauseSubmenu === 'settings') {
          const [bx, by] = settingsBoxOrigin();
          const rects = settingsClickRects(bx, by, false);
          const action = handleSettingsClick(mx, my, rects);
          if (action === 'closed') this.pauseSubmenu = null;
        } else if (this.pauseOpen) {
          const pr = pauseMenuLayout();
          if (pointInRect(mx, my, pr.resume)) { playSfx('click'); this.pauseOpen = false; }
          else if (pointInRect(mx, my, pr.settings)) { playSfx('click'); this.pauseSubmenu = 'settings'; }
          else if (pointInRect(mx, my, pr.menu)) {
            playSfx('click');
            this.persistCity();
            const prof = loadProfile() || {};
            saveProfile({ total_play_time: (prof.total_play_time || 0.0) + this.playTime });
            Game.goto('hub');
            return;
          }
        }
        click = false;
      }
    }

    if (!overlayActive && (this.gamePhase === 'BUILD' || this.gamePhase === 'COMBAT')) {
      if (click) {
        let tabClicked = false;
        for (const [tabR, tabName] of buildBarRects.tabRects) {
          if (pointInRect(mx, my, tabR)) { playSfx('click'); this.buildBarCategory = tabName; this.selectedBuilding = null; tabClicked = true; click = false; break; }
        }
        if (!tabClicked) {
          let buildClicked = false;
          for (const [r, btype] of buildBarRects.clickRects) {
            if (pointInRect(mx, my, r)) {
              if (this.selectedBuilding === btype) this.selectedBuilding = null;
              else this.selectedBuilding = btype;
              this.selectedPlacedEntity = null;
              playSfx('click');
              buildClicked = true;
              click = false;
              break;
            }
          }
          if (!buildClicked) {
            if (skipBtnHov && this.gamePhase === 'BUILD' && this.combatSpawnQueue.length > 0) {
              playSfx('click');
              playSfx('wave_start');
              this.buildTimer = 0;
              this.gamePhase = 'COMBAT';
              this.selectedBuilding = null;
              this.selectedPlacedEntity = null;
              click = false;
            } else if (my > 65 && my < SH - this.barH) {
              const worldX = mx, worldY = my;
              if (this.selectedBuilding) {
                const btype = this.selectedBuilding;
                const boundOk = getPlacementZone(btype, worldX, worldY);
                let overlap = false;
                const allObjs = [...this.structures, ...this.turrets];
                for (const obj of allObjs) {
                  let safetyDist = 28 + obj.size;
                  if (btype === 'wall' || obj.stype === 'wall') safetyDist = 22 + obj.size;
                  if (dist(obj.x, obj.y, worldX, worldY) < safetyDist) { overlap = true; break; }
                }
                let cMon = 0, cIrn = 0, cCo = 0, cPop = 0;
                if (btype === 'house') cMon = 100;
                else if (btype === 'iron_mine') { cMon = 150; cCo = 10; }
                else if (btype === 'coal_mine') { cMon = 150; cIrn = 10; }
                else if (btype === 'park') { cMon = 200; cIrn = 15; cCo = 15; }
                else if (btype === 'normal') { cMon = Math.floor(120 * this.upgradeCostMult); cIrn = 20; cCo = 5; cPop = 5; }
                else if (btype === 'heavy') { cMon = Math.floor(250 * this.upgradeCostMult); cIrn = 50; cCo = 10; cPop = 10; }
                else if (btype === 'rapid') { cMon = Math.floor(160 * this.upgradeCostMult); cIrn = 30; cCo = 8; cPop = 15; }
                else if (btype === 'wall') { cMon = Math.floor(30 * this.upgradeCostMult); cIrn = 10; }
                else if (btype === 'medical') { cMon = 180; cCo = 15; }
                if (boundOk && !overlap && this.money >= cMon && this.iron >= cIrn && this.coal >= cCo && this.population >= cPop) {
                  this.money -= cMon; this.iron -= cIrn; this.coal -= cCo;
                  playSfx('place');
                  if (btype === 'normal' || btype === 'heavy' || btype === 'rapid') {
                    this.turrets.push(new Turret(btype, worldX, worldY, this.upgradeCostMult, this.normalRateMult, this.heavyDmgMult, this.rangeMult, this.globalRateMult));
                  } else {
                    this.structures.push(new Structure(btype, worldX, worldY, this.wallHpMult));
                  }
                  for (let i = 0; i < 8; i++) this.particles.push(new Particle(worldX, worldY, MARS_RUST));
                  this.selectedBuilding = null;
                  this.selectedPlacedEntity = null;
                } else {
                  playSfx('dome_hit');
                }
              } else if (this.moveTarget) {
                const mt = this.moveTarget;
                const stype = mt.stype || mt.ttype;
                const boundOk = getPlacementZone(stype, worldX, worldY);
                let overlap = false;
                const allObjs = [...this.structures, ...this.turrets];
                for (const obj of allObjs) {
                  let sd = 28 + obj.size;
                  if (stype === 'wall' || obj.stype === 'wall') sd = 22 + obj.size;
                  if (dist(obj.x, obj.y, worldX, worldY) < sd) { overlap = true; break; }
                }
                if (boundOk && !overlap) {
                  mt.x = worldX; mt.y = worldY;
                  if (mt.stype) this.structures.push(mt);
                  else this.turrets.push(mt);
                  this.moveTarget = null;
                  this.selectedPlacedEntity = mt;
                  playSfx('place');
                }
              } else {
                let clickedEnt = null;
                for (const s of this.structures) { if (dist(s.x, s.y, worldX, worldY) < s.size + 10) { clickedEnt = s; break; } }
                if (!clickedEnt) for (const t of this.turrets) { if (dist(t.x, t.y, worldX, worldY) < t.size + 10) { clickedEnt = t; break; } }
                if (clickedEnt) this.selectedPlacedEntity = clickedEnt;
              }
            }
          }
        }
      }
    } else if (!overlayActive && this.gamePhase === 'SELECTOR') {
      const hoveredCard = drawPopupCards(ctx, tr('SELECT NEXT ENEMY GROUP'), tr('Choose your threat and reward'), this.enemyOptions, mx, my, this.tick);
      if (click && hoveredCard !== -1) {
        playSfx('click');
        const chosen = this.enemyOptions[hoveredCard];
        this.collectionRewards = { money: chosen.reward_money, iron: chosen.reward_iron, coal: chosen.reward_coal };
        const rawList = shuffleInPlace(chosen.composition.slice());
        this.combatSpawnQueue = rawList;
        this.combatSpawnTimer = 1.5;
        this.combatBreakTimer = 0.0;
        this.buildTimer = 30;
        this.gamePhase = 'BUILD';
        if (chosen.setId !== undefined) this.usedEnemySetIndices.add(chosen.setId);
      }
    } else if (!overlayActive && this.gamePhase === 'UPGRADE') {
      const hoveredCard = drawPopupCards(ctx, tr('SELECT ONE UPGRADE CARD'), tr('Choose upgrades to defend colony'), this.upgradeOptions, mx, my, this.tick, this.money);
      if (click) {
        if (hoveredCard === -2) {
          if (this.money < 75) return;
          playSfx('click');
          this.money -= 75;
          let pool = UPGRADE_POOL.filter(upg => {
            if (upg.name === 'Unlock Park' && this.unlockedStructures.has('park')) return false;
            if (upg.name === 'Unlock High Damage Turret' && this.unlockedTurrets.has('heavy_turret')) return false;
            if (upg.name === 'Unlock Rapid Turret' && this.unlockedTurrets.has('rapid_turret')) return false;
            if (upg.name === 'Unlock Medical Bay' && this.unlockedStructures.has('medical')) return false;
            return true;
          });
          if (pool.length < 3) pool = UPGRADE_POOL.slice();
          this.upgradeOptions = sampleUpgradeOptions(pool, 3);
        } else if (hoveredCard === -3) {
          playSfx('click');
          this.gamePhase = 'SELECTOR';
          this.upgradeOptions = []; this.combatSpawnQueue = []; this.combatSpawnTimer = 0; this.collectionRewards = null;
          this.enemyOptions = generateEnemyOptions(this.wave, this.usedEnemySetIndices);
          this.persistCity(); this.autosaveAlertTimer = 2.5;
        } else if (hoveredCard !== -1) {
          const chosen = this.upgradeOptions[hoveredCard];
          if (this.money < chosen.cost) return;
          playSfx('click');
          this.money -= chosen.cost;
          this.unlockedUpgrades.add(chosen.name);

          if (chosen.name === 'Unlock Park') this.unlockedStructures.add('park');
          else if (chosen.name === 'Unlock High Damage Turret') this.unlockedTurrets.add('heavy_turret');
          else if (chosen.name === 'Unlock Rapid Turret') this.unlockedTurrets.add('rapid_turret');
          else if (chosen.name === 'Unlock Medical Bay') this.unlockedStructures.add('medical');
          else if (chosen.name === 'Defensive Plating') { this.dome.maxHp += 250; this.dome.hp = Math.min(this.dome.maxHp, this.dome.hp + 250); }
          else if (chosen.name === 'Citizen Motivation') this.happinessBonus += 20.0;

          this.gamePhase = 'SELECTOR';
          this.upgradeOptions = []; this.combatSpawnQueue = []; this.combatSpawnTimer = 0; this.collectionRewards = null;
          this.enemyOptions = generateEnemyOptions(this.wave, this.usedEnemySetIndices);
          this.persistCity(); this.autosaveAlertTimer = 2.5;
        }
      }
    }

    if (!overlayActive && this.gamePhase === 'COMBAT') {
      if (this.combatBreakTimer > 0) this.combatBreakTimer -= dt;
      else if (this.combatSpawnTimer > 0) this.combatSpawnTimer -= dt;
      else if (this.combatSpawnQueue.length > 0) {
        const count = 1 + Math.floor(Math.random() * 3);
        for (let s = 0; s < count && this.combatSpawnQueue.length > 0; s++) {
          const etype = this.combatSpawnQueue.shift();
          this.enemies.push(new Enemy(etype, this.wave));
        }
        this.combatSpawnTimer = 1.0 + Math.random() * 2.0;
      } else {
        if (this.enemies.length === 0) {
          this.money += this.collectionRewards.money;
          this.iron += this.collectionRewards.iron;
          this.coal += this.collectionRewards.coal;
          playSfx('win_collection');

          const { houseYield, ironYield, coalYield } = this.resourceYield();
          this.money += houseYield; this.iron += ironYield; this.coal += coalYield;
          this.floatingTexts.push(new FloatingText(DOME_X, DOME_Y - 64, `+$${houseYield} +${ironYield}I +${coalYield}C`, GOLD, 'm'));

          if (this.unlockedUpgrades.has('Auto Repair Drones')) {
            const healAmt = 60;
            this.dome.hp = Math.min(this.dome.maxHp, this.dome.hp + healAmt);
            this.floatingTexts.push(new FloatingText(DOME_X, DOME_Y - 30, `+${healAmt} HP`, HOLO_GREEN, 's'));
          }

          const medCount = this.structures.filter(s => s.stype === 'medical').length;
          if (medCount > 0) {
            const medHeal = medCount * 20;
            this.dome.hp = Math.min(this.dome.maxHp, this.dome.hp + medHeal);
            this.floatingTexts.push(new FloatingText(DOME_X, DOME_Y - 48, `+${medHeal} HP`, 'rgb(80,220,200)', 's'));
          }

          this.wave += 1;
          this.waveClearedAnim = 2.0;
          this.combatBreakTimer = 3.0;

          const prof = loadProfile() || {};
          if (this.wave > (prof.highest_wave || 0)) saveProfile({ highest_wave: this.wave });

          this.gamePhase = 'UPGRADE';
          let availPool = UPGRADE_POOL.filter(upg => {
            if (upg.name === 'Unlock Park' && this.unlockedStructures.has('park')) return false;
            if (upg.name === 'Unlock High Damage Turret' && this.unlockedTurrets.has('heavy_turret')) return false;
            if (upg.name === 'Unlock Rapid Turret' && this.unlockedTurrets.has('rapid_turret')) return false;
            if (upg.name === 'Unlock Medical Bay' && this.unlockedStructures.has('medical')) return false;
            return true;
          });
          if (availPool.length < 3) availPool = UPGRADE_POOL.slice();
          this.upgradeOptions = sampleUpgradeOptions(availPool, 3);
        }
      }
    }

    if (this.gamePhase === 'BUILD' && this.combatSpawnQueue.length > 0) {
      this.buildTimer -= dt;
      if (this.buildTimer <= 0) {
        this.buildTimer = 0;
        if (this.combatSpawnQueue.length > 0) {
          playSfx('wave_start');
          this.gamePhase = 'COMBAT';
        }
      }
    }

    if (this.happiness <= 0.0) {
      playSfx('gameover');
      Game.goto('gameOver', { slotId: this.slotId, wave: this.wave, playTime: this.playTime, reason: 'fired' });
      return;
    }
    if (this.dome.hp <= 0) {
      playSfx('gameover');
      Game.goto('gameOver', { slotId: this.slotId, wave: this.wave, playTime: this.playTime });
      return;
    }

    if (!overlayActive && (this.gamePhase === 'BUILD' || this.gamePhase === 'COMBAT')) {
      this.passiveResourceTimer += dt;
      if (this.passiveResourceTimer >= 60.0) {
        this.passiveResourceTimer -= 60.0;
        const { houseYield, ironYield, coalYield } = this.resourceYield();
        this.money += houseYield; this.iron += ironYield; this.coal += coalYield;
        this.floatingTexts.push(new FloatingText(DOME_X, DOME_Y - 64, `+$${houseYield} +${ironYield}I +${coalYield}C`, GOLD, 'm'));
      }

      for (const t of this.turrets) t.update(dt, this.enemies, this.projectiles);

      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update(dt, this.particles);
        if (!p.alive) this.projectiles.splice(i, 1);
      }

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        const alive = e.update(dt, this.dome, this.structures, this.turrets, this.particles, this.floatingTexts, this.domeDmgMult);
        if (!alive) {
          if (!e.reachedDome) { this.money += e.rewMoney; this.iron += e.rewIron; this.coal += e.rewCoal; }
          this.enemies.splice(i, 1);
        }
      }

      for (let i = this.structures.length - 1; i >= 0; i--) {
        const s = this.structures[i];
        if (s.hp <= 0) {
          playSfx('explosion');
          for (let k = 0; k < 6; k++) this.particles.push(new Particle(s.x, s.y, MARS_RUST));
          if (this.selectedPlacedEntity === s) this.selectedPlacedEntity = null;
          this.structures.splice(i, 1);
        }
      }
      for (let i = this.turrets.length - 1; i >= 0; i--) {
        const t = this.turrets[i];
        if (t.hp <= 0) {
          playSfx('explosion');
          for (let k = 0; k < 6; k++) this.particles.push(new Particle(t.x, t.y, 'rgb(80,85,95)'));
          if (this.selectedPlacedEntity === t) this.selectedPlacedEntity = null;
          this.turrets.splice(i, 1);
        }
      }
      for (let i = this.particles.length - 1; i >= 0; i--) { this.particles[i].update(); if (this.particles[i].life <= 0) this.particles.splice(i, 1); }
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) { this.floatingTexts[i].update(); if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1); }
    }

    // ---------------- DRAW ----------------
    ctx.fillStyle = MARS_BG; ctx.fillRect(0, 0, SW, SH);
    ctx.drawImage(this.mapSurf, 0, 0);

    this.dome.draw(ctx, this.tick);

    const renderList = [];
    for (const s of this.structures) renderList.push([s, s.y, 'S']);
    for (const t of this.turrets) renderList.push([t, t.y, 'T']);
    for (const e of this.enemies) renderList.push([e, e.y, 'E']);
    renderList.sort((a, b) => a[1] - b[1]);

    for (const [entity, , kind] of renderList) {
      if (kind === 'S') entity.draw(ctx, this.tick);
      else if (kind === 'T') entity.draw(ctx, entity === this.selectedPlacedEntity);
      else entity.draw(ctx, this.tick);
    }

    for (const p of this.projectiles) p.draw(ctx);
    for (const p of this.particles) p.draw(ctx);
    for (const ft of this.floatingTexts) ft.draw(ctx);

    if (this.moveTarget) {
      const mt = this.moveTarget;
      const worldX = mx, worldY = my;
      const stype = mt.stype || mt.ttype;
      const boundOk = getPlacementZone(stype, worldX, worldY);
      let overlap = false;
      const allObjs = [...this.structures, ...this.turrets, ...this.enemies];
      for (const obj of allObjs) {
        let sd = 28 + (obj.size || 20);
        if (stype === 'wall' || obj.stype === 'wall') sd = 22 + (obj.size || 20);
        if (dist(obj.x, obj.y, worldX, worldY) < sd) { overlap = true; break; }
      }
      const ghostCol = (boundOk && !overlap) ? HOLO_GREEN : RED_ALERT;
      ctx.save(); ctx.globalAlpha = 0.35;
      if (mt.stype) {
        const origX = mt.x, origY = mt.y;
        mt.x = worldX; mt.y = worldY;
        mt.draw(ctx, this.tick);
        mt.x = origX; mt.y = origY;
      } else {
        const origX = mt.x, origY = mt.y;
        mt.x = worldX; mt.y = worldY;
        mt.draw(ctx, false);
        mt.x = origX; mt.y = origY;
      }
      ctx.restore();
      const markerSize = stype === 'wall' ? 58 : 64;
      rectStroke(ctx, worldX - markerSize / 2, worldY - markerSize / 2, markerSize, markerSize, ghostCol, 2, 4);
    }

    const dragType = this.selectedBuilding;
    if (dragType && (this.gamePhase === 'BUILD' || this.gamePhase === 'COMBAT') && my > 65 && my < SH - this.barH) {
      const worldX = mx, worldY = my;
      const valid = getPlacementZone(dragType, worldX, worldY);
      let overlap = false;
      const allObjs = [...this.structures, ...this.turrets];
      for (const obj of allObjs) {
        let safety = 28 + obj.size;
        if (dragType === 'wall' || obj.stype === 'wall') safety = 20 + obj.size;
        if (dist(obj.x, obj.y, worldX, worldY) < safety) { overlap = true; break; }
      }
      const color = (valid && !overlap) ? HOLO_GREEN : RED_ALERT;
      const markerSize = dragType === 'wall' ? 58 : 64;
      ctx.save(); ctx.globalAlpha = 0.2;
      rectFill(ctx, mx - markerSize / 2, my - markerSize / 2, markerSize, markerSize, color, 4);
      ctx.restore();
      rectStroke(ctx, mx - markerSize / 2, my - markerSize / 2, markerSize, markerSize, color, 2, 4);
    }

    const stateLabel = this.gamePhase === 'BUILD' ? 'BUILD PHASE' : 'COMBAT PHASE';
    const resources = { money: this.money, iron: this.iron, coal: this.coal, happiness: this.happiness, population: this.population };
    const combatActive = this.gamePhase === 'COMBAT';
    const combatEnemiesLeft = this.enemies.length + this.combatSpawnQueue.length;
    drawHud(ctx, this.dome.hp, this.dome.maxHp, resources, this.wave, 0, stateLabel, combatActive, combatEnemiesLeft);

    if (this.gamePhase === 'BUILD' && this.combatSpawnQueue.length > 0) {
      lineSeg(ctx, 0, 68, SW, 68, 'rgb(30,48,80)', 2);
      dtxt(ctx, Math.ceil(this.buildTimer) + 's', 'ml', HOLO_BLUE, SW / 2, 85, 'center', false);
      const skHov = pointInRect(mx, my, skipBtnRect);
      rectFill(ctx, skipBtnRect.x, skipBtnRect.y, skipBtnRect.w, skipBtnRect.h, skHov ? 'rgb(50,30,18)' : 'rgb(22,16,12)', 5);
      rectStroke(ctx, skipBtnRect.x, skipBtnRect.y, skipBtnRect.w, skipBtnRect.h, skHov ? HOLO_ORANGE : 'rgb(70,50,30)', 1, 5);
      dtxt(ctx, tr('Skip'), 's', skHov ? WHITE : 'rgb(180,160,130)', skipBtnRect.x + skipBtnRect.w / 2, skipBtnRect.y + skipBtnRect.h / 2, 'center', false);
    }

    if (this.gamePhase === 'BUILD' || this.gamePhase === 'COMBAT') {
      drawBuildBar(ctx, this.selectedBuilding, this.money, this.iron, this.coal, this.unlockedStructures, this.unlockedTurrets, mx, my, this.buildBarCategory, this.population);
    }

    if (this.selectedPlacedEntity && !this.moveTarget && (this.gamePhase === 'BUILD' || this.gamePhase === 'COMBAT')) {
      const ent = this.selectedPlacedEntity;
      const entSx = ent.x, entSy = ent.y;
      const isTurret = !!(ent.ttype);
      const isUpgOpen = this.showUpgradeFor === ent && isTurret && ent.ttype === 'normal';
      const panelW = 240;
      const panelH = isUpgOpen ? 198 : 130;
      const px = clamp(entSx - panelW / 2, 10, SW - panelW - 10);
      const py = clamp(entSy - panelH - 15, 80, SH - 200);

      rectFill(ctx, px, py, panelW, panelH, DARK_GLASS, 8);
      rectStroke(ctx, px, py, panelW, panelH, HOLO_BLUE, 1, 8);

      const nameLbl = tr(ent.name || ent.stype);
      dtxt(ctx, nameLbl, 's', GOLD, px + 12, py + 12, 'topleft', false);
      dtxt(ctx, `HP: ${ent.hp}/${ent.maxHp}`, 'xs', 'rgb(180,185,200)', px + 12, py + 34, 'topleft', false);

      const moveBtnRect = makeRect(px + 12, py + 56, isTurret ? (panelW - 24) * 0.48 : panelW - 24, 28);
      const moveHov = pointInRect(mx, my, moveBtnRect);
      rectFill(ctx, moveBtnRect.x, moveBtnRect.y, moveBtnRect.w, moveBtnRect.h, moveHov ? 'rgb(30,70,120)' : 'rgb(18,28,48)', 4);
      rectStroke(ctx, moveBtnRect.x, moveBtnRect.y, moveBtnRect.w, moveBtnRect.h, moveHov ? HOLO_BLUE : 'rgb(40,60,90)', 1, 4);
      dtxt(ctx, tr('Move'), 'xs', moveHov ? WHITE : 'rgb(160,170,200)', moveBtnRect.x + moveBtnRect.w / 2, moveBtnRect.y + moveBtnRect.h / 2, 'center', false);

      if (click && moveHov) {
        playSfx('click');
        this.moveTarget = ent;
        const si = this.structures.indexOf(ent);
        if (si !== -1) this.structures.splice(si, 1);
        else { const ti = this.turrets.indexOf(ent); if (ti !== -1) this.turrets.splice(ti, 1); }
        this.selectedPlacedEntity = null;
        this.selectedBuilding = null;
        if (this.showUpgradeFor === ent) this.showUpgradeFor = null;
      }

      let sellBtnY = py + 90;
      if (isTurret) {
        const upgBtnRect = makeRect(px + 12 + (panelW - 24) * 0.52, py + 56, (panelW - 24) * 0.48, 28);
        const upgHov = pointInRect(mx, my, upgBtnRect);
        const canUpg = ent.ttype === 'normal';
        const upgCol = canUpg ? (upgHov ? 'rgb(50,90,40)' : 'rgb(20,50,30)') : 'rgb(22,22,22)';
        const upgBorder = canUpg ? (upgHov ? HOLO_GREEN : 'rgb(40,80,50)') : 'rgb(40,40,40)';
        rectFill(ctx, upgBtnRect.x, upgBtnRect.y, upgBtnRect.w, upgBtnRect.h, upgCol, 4);
        rectStroke(ctx, upgBtnRect.x, upgBtnRect.y, upgBtnRect.w, upgBtnRect.h, upgBorder, 1, 4);
        const upgLabel = canUpg ? tr('Upgrade') : tr('MAX');
        dtxt(ctx, upgLabel, 'xs', canUpg ? (upgHov ? WHITE : 'rgb(160,200,170)') : 'rgb(80,80,80)', upgBtnRect.x + upgBtnRect.w / 2, upgBtnRect.y + upgBtnRect.h / 2, 'center', false);

        if (click && upgHov && canUpg) {
          playSfx('click');
          if (this.showUpgradeFor === ent) this.showUpgradeFor = null;
          else this.showUpgradeFor = ent;
        }

        if (isUpgOpen) {
          sellBtnY = py + 158;
          const upgOptions = [
            { label: '→ Heavy  $' + Math.floor(130 * this.upgradeCostMult) + ' + 30I', type: 'heavy', costMon: Math.floor(130 * this.upgradeCostMult), costIrn: 30 },
            { label: '→ Rapid  $' + Math.floor(40 * this.upgradeCostMult) + ' + 10I', type: 'rapid', costMon: Math.floor(40 * this.upgradeCostMult), costIrn: 10 },
          ];
          let optY = py + 90;
          for (const opt of upgOptions) {
            const canAfford = this.money >= opt.costMon && this.iron >= opt.costIrn;
            const optRect = makeRect(px + 12, optY, panelW - 24, 28);
            const optHov = pointInRect(mx, my, optRect);
            const optCol = canAfford ? (optHov ? 'rgb(30,80,40)' : 'rgb(15,35,25)') : 'rgb(25,20,20)';
            const optBdr = canAfford ? (optHov ? HOLO_GREEN : 'rgb(40,80,50)') : 'rgb(50,30,30)';
            rectFill(ctx, optRect.x, optRect.y, optRect.w, optRect.h, optCol, 4);
            rectStroke(ctx, optRect.x, optRect.y, optRect.w, optRect.h, optBdr, 1, 4);
            dtxt(ctx, opt.label, 'xs', canAfford ? (optHov ? WHITE : 'rgb(180,200,180)') : 'rgb(100,60,60)', optRect.x + optRect.w / 2, optRect.y + optRect.h / 2, 'center', false);
            if (click && optHov && canAfford) {
              playSfx('click');
              this.money -= opt.costMon; this.iron -= opt.costIrn;
              ent.ttype = opt.type;
              ent.name = TURRET_STATS[opt.type].name;
              const stat = TURRET_STATS[opt.type];
              ent.cost = Math.floor(stat.baseCost * this.upgradeCostMult);
              ent.rng = Math.floor(stat.baseRange * this.rangeMult);
              if (opt.type === 'normal') { ent.dmg = 12; ent.fireRate = 0.8 * this.normalRateMult * this.globalRateMult; }
              else if (opt.type === 'rapid') { ent.dmg = 6; ent.fireRate = 0.22 * this.globalRateMult; }
              else { ent.dmg = Math.floor(40 * this.heavyDmgMult); ent.fireRate = 2.2 * this.globalRateMult; }
              ent.cooldownTimer = 0;
              ent.target = null;
              ent.angle = 0;
              this.showUpgradeFor = null;
              this.floatingTexts.push(new FloatingText(ent.x, ent.y - 20, tr('Upgraded!'), HOLO_GREEN, 's'));
            }
            optY += 34;
          }
        }
      }

      const refundPct = this.unlockedUpgrades.has('Recycling Plant') ? '80%' : '50%';
      const demBtnRect = makeRect(px + 12, sellBtnY, panelW - 24, 28);
      const demHov = pointInRect(mx, my, demBtnRect);
      rectFill(ctx, demBtnRect.x, demBtnRect.y, demBtnRect.w, demBtnRect.h, demHov ? RED_ALERT : 'rgb(60,15,15)', 4);
      rectStroke(ctx, demBtnRect.x, demBtnRect.y, demBtnRect.w, demBtnRect.h, demHov ? WHITE : RED_ALERT, 1, 4);
      dtxt(ctx, `${tr('Sell')} (${refundPct})`, 'xs', WHITE, demBtnRect.x + demBtnRect.w / 2, demBtnRect.y + demBtnRect.h / 2, 'center', false);

      if (click && pointInRect(mx, my, demBtnRect)) {
        playSfx('click');
        const stype = ent.stype || ent.ttype;
        let refundMon = 0, refundIrn = 0, refundCo = 0;
        const m = this.demolishRefundMult;
        if (stype === 'house') refundMon = Math.floor(50 * m);
        else if (stype === 'iron_mine') { refundMon = Math.floor(75 * m); refundCo = Math.floor(5 * m); }
        else if (stype === 'coal_mine') { refundMon = Math.floor(75 * m); refundIrn = Math.floor(5 * m); }
        else if (stype === 'park') { refundMon = Math.floor(100 * m); refundIrn = Math.floor(7 * m); refundCo = Math.floor(7 * m); }
        else if (stype === 'normal') { refundMon = Math.floor(60 * this.upgradeCostMult * m); refundIrn = Math.floor(10 * m); }
        else if (stype === 'heavy') { refundMon = Math.floor(125 * this.upgradeCostMult * m); refundIrn = Math.floor(25 * m); }
        else if (stype === 'wall') { refundMon = Math.floor(15 * this.upgradeCostMult * m); refundIrn = Math.floor(5 * m); }

        this.money += refundMon; this.iron += refundIrn; this.coal += refundCo;

        const si = this.structures.indexOf(ent);
        if (si !== -1) this.structures.splice(si, 1);
        else { const ti = this.turrets.indexOf(ent); if (ti !== -1) this.turrets.splice(ti, 1); }
        this.selectedPlacedEntity = null;
        if (this.showUpgradeFor === ent) this.showUpgradeFor = null;
      }
    }

    if (this.gamePhase === 'COMBAT' && this.combatBreakTimer > 0) {
      const boxW = 320, boxH = 80, bx = SW / 2 - boxW / 2, by = 90;
      rectFill(ctx, bx, by, boxW, boxH, DARK_GLASS, 8);
      rectStroke(ctx, bx, by, boxW, boxH, HOLO_ORANGE, 1, 8);
      dtxt(ctx, `${tr('COMBAT PHASE')} — ${tr('WAVE')} ${this.wave}`, 's', WHITE, SW / 2, by + 22, 'center', false);
      dtxt(ctx, `${tr('Next Wave in')} ${Math.floor(this.combatBreakTimer) + 1}s`, 'xs', HOLO_ORANGE, SW / 2, by + 50, 'center', false);
    }

    if (this.waveClearedAnim > 0) {
      const animAlpha = clamp(this.waveClearedAnim * 200 / 255, 0, 1);
      ctx.save(); ctx.globalAlpha = animAlpha;
      dtxt(ctx, tr('Wave Cleared!'), 'xl', HOLO_GREEN, SW / 2, SH / 2 - 80, 'center', false);
      ctx.restore();
    }

    if (this.autosaveAlertTimer > 0) {
      dtxtBg(ctx, tr('AUTOSAVED'), 'xs', HOLO_GREEN, SW / 2, 85, 6, 'rgba(20,30,45,0.86)', 'center');
    }

    if (this.happiness < 15.0) {
      const warnX = 700, warnY = SH - this.barH - 45;
      rectFill(ctx, warnX - 5, warnY - 5, 290, 40, 'rgba(60,10,10,0.85)', 6);
      dtxt(ctx, tr('UNHAPPY WARNING'), 's', RED_ALERT, warnX + 140, warnY + 5, 'center', false);
      dtxt(ctx, `${tr('HAPPINESS')}: ${Math.floor(this.happiness)}%`, 'xs', HOLO_ORANGE, warnX + 140, warnY + 23, 'center', false);
    }

    if (this.gamePhase === 'SELECTOR') {
      drawPopupCards(ctx, tr('SELECT NEXT ENEMY GROUP'), tr('Choose your threat and reward'), this.enemyOptions, mx, my, this.tick);
    } else if (this.gamePhase === 'UPGRADE') {
      drawPopupCards(ctx, tr('SELECT ONE UPGRADE CARD'), tr('Choose upgrades to defend colony'), this.upgradeOptions, mx, my, this.tick, this.money);
    }

    if (this.gamePhase !== 'SELECTOR' && this.gamePhase !== 'UPGRADE') {
      const pauseHov = pointInRect(mx, my, this.pauseBtnRect);
      const pCol = (pauseHov || this.pauseOpen) ? HOLO_BLUE : 'rgb(40,60,100)';
      rectFill(ctx, this.pauseBtnRect.x, this.pauseBtnRect.y, this.pauseBtnRect.w, this.pauseBtnRect.h, 'rgb(15,20,38)', 6);
      rectStroke(ctx, this.pauseBtnRect.x, this.pauseBtnRect.y, this.pauseBtnRect.w, this.pauseBtnRect.h, pCol, pauseHov ? 2 : 1, 6);
      dtxt(ctx, 'II', 's', (pauseHov || this.pauseOpen) ? WHITE : HOLO_BLUE, this.pauseBtnRect.x + this.pauseBtnRect.w / 2, this.pauseBtnRect.y + this.pauseBtnRect.h / 2, 'center', false);
    }

    if (overlayActive) {
      drawDimOverlay(ctx, 140);
      if (this.pauseSubmenu === 'settings') drawSettingsPanel(ctx, mx, my, false);
      else if (this.pauseOpen) drawPauseMenu(ctx, mx, my);
    }
  },
};
Game.register('game', SceneGame);


/* ==========================================================
   12. SCENE: GAME OVER
   ========================================================== */
const SceneGameOver = {
  init(params) {
    this.slotId = params.slotId;
    this.wave = params.wave;
    this.playTime = params.playTime;
    this.reason = params.reason || '';

    deleteCity(this.slotId);
    const prof = loadProfile() || {};
    saveProfile({ total_play_time: (prof.total_play_time || 0.0) + this.playTime });

    const btnW = 280, btnH = 44;
    this.hubBtn = new Button(SW / 2 - btnW / 2, SH / 2 + 40, btnW, btnH, tr('Return to Hub Menu'), 'm', HOLO_BLUE, WHITE);
    this.newCityBtn = new Button(SW / 2 - btnW / 2, SH / 2 + 100, btnW, btnH, tr('Start New City'), 'm', HOLO_GREEN, WHITE);
    this.tick = 0;
    this.bgSnapshot = null; // last gameplay frame dimmed behind the dialog, drawn by main loop
  },
  frame(ctx, dt, events, mx, my) {
    let click = false;
    for (const ev of events) if (ev.type === 'mousedown' && ev.button === 0) click = true;
    this.tick++;

    this.hubBtn.update(mx, my);
    this.newCityBtn.update(mx, my);

    if (click) {
      if (this.hubBtn.hovered || this.newCityBtn.hovered) {
        playSfx('click');
        Game.goto('hub');
        return;
      }
    }

    ctx.fillStyle = MARS_BG; ctx.fillRect(0, 0, SW, SH);
    for (let gx = 0; gx < SW; gx += 60) lineSeg(ctx, gx, 0, gx, SH, MARS_GRID, 1);
    for (let gy = 0; gy < SH; gy += 60) lineSeg(ctx, 0, gy, SW, gy, MARS_GRID, 1);
    rectFill(ctx, 0, 0, SW, SH, 'rgba(0,0,0,0.7)');

    const boxW = 560, boxH = 360;
    const boxX = SW / 2 - boxW / 2, boxY = SH / 2 - boxH / 2;
    rectFill(ctx, boxX, boxY, boxW, boxH, 'rgba(10,14,28,0.94)', 12);
    rectStroke(ctx, boxX, boxY, boxW, boxH, RED_ALERT, 2, 12);

    const title = this.reason === 'fired' ? tr('You have been fired!') : tr('GAME OVER');
    dtxt(ctx, title, 'xl', RED_ALERT, SW / 2, boxY + 45, 'center', true);
    if (this.reason === 'fired') {
      dtxt(ctx, tr('HAPPINESS') + ' 0%', 'ml', RED_ALERT, SW / 2, boxY + 80, 'center', false);
    }
    dtxt(ctx, `${tr('Wave Reached:')} ${this.wave}`, 'ml', GOLD, SW / 2, boxY + 115, 'center', false);

    const timeStr = `${String(Math.floor(this.playTime / 3600)).padStart(2, '0')}:${String(Math.floor((this.playTime % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(this.playTime % 60)).padStart(2, '0')}`;
    dtxt(ctx, `${tr('Play Time:')} ${timeStr}`, 'ml', WHITE, SW / 2, boxY + 155, 'center', false);

    this.hubBtn.draw(ctx);
    this.newCityBtn.draw(ctx);
  },
};
Game.register('gameOver', SceneGameOver);


