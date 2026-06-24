/* ==========================================================
   3. ENTITIES — particles, structures, turrets, projectiles, enemies, dome
   ========================================================== */
class Particle {
  constructor(x, y, col, vx, vy, size, life) {
    this.x = x; this.y = y; this.col = col;
    this.vx = vx !== undefined ? vx : (Math.random() * 4 - 2);
    this.vy = vy !== undefined ? vy : (Math.random() * 4 - 2);
    this.size = size || 3;
    const baseLife = life || 40;
    this.life = Math.floor(baseLife / 2 + Math.random() * (baseLife / 2));
    this.maxLife = this.life;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.05;
    this.life -= 1;
  }
  draw(ctx) {
    if (this.life <= 0) return;
    const size = Math.max(1, this.size * (this.life / this.maxLife));
    circle(ctx, this.x, this.y, size, this.col);
  }
}

class FloatingText {
  constructor(x, y, text, col, fontKey) {
    this.x = x; this.y = y; this.text = text; this.col = col;
    this.life = 60; this.maxLife = 60;
    this.fontKey = fontKey || 's';
  }
  update() { this.y -= 0.6; this.life -= 1; }
  draw(ctx) {
    if (this.life <= 0) return;
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    dtxt(ctx, this.text, this.fontKey, this.col, this.x, this.y, 'center', false);
    ctx.restore();
  }
}

const STRUCTURE_STATS = {
  house:     { hp: 120, name: 'House' },
  iron_mine: { hp: 180, name: 'Iron Mine' },
  coal_mine: { hp: 180, name: 'Coal Mine' },
  park:      { hp: 150, name: 'Park' },
  wall:      { hp: 250, name: 'Wall' },
  medical:   { hp: 140, name: 'Medical Bay' },
};

class Structure {
  constructor(stype, x, y, wallHpMult) {
    this.stype = stype;
    this.x = x; this.y = y;
    this.size = 28;
    this.upgradeLevel = 1;
    const stat = STRUCTURE_STATS[stype];
    if (stype === 'wall') {
      this.maxHp = Math.floor(stat.hp * (wallHpMult || 1.0));
      this.hp = this.maxHp;
      this.size = 20;
    } else {
      this.hp = stat.hp; this.maxHp = stat.hp;
    }
    this.name = stat.name;
  }
  draw(ctx, tick) {
    const sx = this.x, sy = this.y;
    if (!(sx >= -100 && sx <= SW + 100 && sy >= -100 && sy <= SH + 100)) return;

    if (this.hp < this.maxHp) {
      const bw = 40, bh = 4;
      rectFill(ctx, sx - bw / 2, sy - 25, bw, bh, 'rgb(60,10,10)');
      const ratio = Math.max(0, this.hp / this.maxHp);
      rectFill(ctx, sx - bw / 2, sy - 25, bw * ratio, bh, ratio > 0.5 ? 'rgb(0,225,100)' : 'rgb(225,120,0)');
    }

    if (this.stype === 'house') {
      circle(ctx, sx, sy, 24, 'rgb(15,10,10)');
      circle(ctx, sx, sy, 20, 'rgb(220,220,240)');
      circle(ctx, sx, sy, 20, HOLO_BLUE, 2);
      arcStroke(ctx, sx - 14, sy - 14, 28, 28, 0, Math.PI * 2, 'rgb(40,60,100)', 3);
      circle(ctx, sx, sy, 4, HOLO_ORANGE);
    } else if (this.stype === 'iron_mine') {
      rectFill(ctx, sx - 18, sy - 18, 36, 36, 'rgb(50,50,60)', 4);
      rectFill(ctx, sx - 15, sy - 15, 30, 30, MARS_RUST, 3);
      const ang = tick * 0.15;
      const dx = Math.cos(ang) * 8, dy = Math.sin(ang) * 8;
      lineSeg(ctx, sx - dx, sy - dy, sx + dx, sy + dy, 'rgb(220,220,255)', 4);
      if (Math.floor(tick / 15) % 2 === 0) {
        circle(ctx, sx - 12, sy - 12, 2, HOLO_ORANGE);
        circle(ctx, sx + 12, sy + 12, 2, HOLO_ORANGE);
      }
    } else if (this.stype === 'coal_mine') {
      rectFill(ctx, sx - 18, sy - 18, 36, 36, 'rgb(40,40,40)', 5);
      circle(ctx, sx, sy, 14, 'rgb(80,80,85)');
      const glowR = 8 + Math.abs(Math.sin(tick * 0.1)) * 4;
      circle(ctx, sx, sy, glowR, 'rgb(255,60,0)');
      circle(ctx, sx, sy, Math.max(0, glowR - 4), GOLD);
      rectFill(ctx, sx - 14, sy - 20, 6, 8, 'rgb(30,30,30)');
      rectFill(ctx, sx + 8, sy - 20, 6, 8, 'rgb(30,30,30)');
    } else if (this.stype === 'park') {
      circle(ctx, sx, sy, 22, 'rgb(10,40,20)');
      circle(ctx, sx, sy, 22, HOLO_GREEN, 2);
      circle(ctx, sx - 4, sy - 4, 8, 'rgb(34,139,34)');
      circle(ctx, sx + 4, sy + 4, 6, 'rgb(50,205,50)');
      circle(ctx, sx, sy + 4, 7, 'rgb(0,100,0)');
      circle(ctx, sx - 6, sy + 6, 4, 'rgb(0,191,255)');
    } else if (this.stype === 'wall') {
      circle(ctx, sx, sy, 15, 'rgb(80,85,100)');
      circle(ctx, sx, sy, 12, 'rgb(40,45,55)');
      circle(ctx, sx, sy, 8, MARS_RUST);
      lineSeg(ctx, sx - 10, sy, sx + 10, sy, 'rgb(100,105,120)', 2);
      lineSeg(ctx, sx, sy - 10, sx, sy + 10, 'rgb(100,105,120)', 2);
    } else if (this.stype === 'medical') {
      circle(ctx, sx, sy, 22, 'rgb(10,30,30)');
      circle(ctx, sx, sy, 18, 'rgb(200,235,235)');
      circle(ctx, sx, sy, 18, 'rgb(0,200,180)', 2);
      rectFill(ctx, sx - 4, sy - 13, 8, 26, 'rgb(220,50,80)');
      rectFill(ctx, sx - 13, sy - 4, 26, 8, 'rgb(220,50,80)');
      circle(ctx, sx, sy, 4, WHITE);
    }
  }
}

const TURRET_STATS = {
  normal: { name: 'Normal Turret', baseCost: 120, baseRange: 220, dmg: 12, baseFireRate: 0.8 },
  heavy:  { name: 'High Damage Turret', baseCost: 250, baseRange: 320, dmg: 40, baseFireRate: 2.2 },
  rapid:  { name: 'Rapid Turret', baseCost: 160, baseRange: 190, dmg: 6, baseFireRate: 0.22 },
};

class Turret {
  constructor(ttype, x, y, turretCostMult, normalRateMult, heavyDmgMult, rangeMult, globalRateMult) {
    this.ttype = ttype;
    this.x = x; this.y = y;
    this.size = 24;
    this.angle = 0;
    this.cooldownTimer = 0;
    this.target = null;
    this.hp = 200; this.maxHp = 200;

    turretCostMult = turretCostMult || 1.0;
    normalRateMult = normalRateMult || 1.0;
    heavyDmgMult = heavyDmgMult || 1.0;
    rangeMult = rangeMult || 1.0;
    globalRateMult = globalRateMult || 1.0;

    const stat = TURRET_STATS[ttype];
    this.name = stat.name;
    this.cost = Math.floor(stat.baseCost * turretCostMult);
    this.rng = Math.floor(stat.baseRange * rangeMult);
    if (ttype === 'normal') {
      this.dmg = 12;
      this.fireRate = 0.8 * normalRateMult * globalRateMult;
    } else if (ttype === 'rapid') {
      this.dmg = 6;
      this.fireRate = 0.22 * globalRateMult;
    } else {
      this.dmg = Math.floor(40 * heavyDmgMult);
      this.fireRate = 2.2 * globalRateMult;
    }
  }
  update(dt, enemies, projectiles) {
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    this.target = null;
    let closestDist = Infinity;
    for (const e of enemies) {
      if (e.hp > 0) {
        const d = dist(e.x, e.y, this.x, this.y);
        if (d <= this.rng && d < closestDist) { closestDist = d; this.target = e; }
      }
    }
    if (this.target) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      if (this.cooldownTimer <= 0) {
        this.cooldownTimer = this.fireRate;
        projectiles.push(new Projectile(this.x, this.y, this.target, this.dmg, this.ttype));
        playSfx(this.ttype === 'normal' || this.ttype === 'rapid' ? 'shoot_normal' : 'shoot_heavy');
      }
    }
  }
  draw(ctx, isHovered) {
    const sx = this.x, sy = this.y;
    if (!(sx >= -100 && sx <= SW + 100 && sy >= -100 && sy <= SH + 100)) return;

    if (isHovered) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      circle(ctx, sx, sy, this.rng, HOLO_BLUE);
      ctx.globalAlpha = 0.24;
      circle(ctx, sx, sy, this.rng, HOLO_BLUE, 1);
      ctx.restore();
    }

    if (this.hp < this.maxHp) {
      const bw = 40, bh = 4;
      rectFill(ctx, sx - bw / 2, sy - 25, bw, bh, 'rgb(60,10,10)');
      const ratio = Math.max(0, this.hp / this.maxHp);
      rectFill(ctx, sx - bw / 2, sy - 25, bw * ratio, bh, ratio > 0.5 ? 'rgb(0,225,100)' : 'rgb(225,120,0)');
    }

    circle(ctx, sx, sy, 18, 'rgb(40,42,50)');
    circle(ctx, sx, sy, 14, 'rgb(80,85,95)');

    const barrelLen = this.ttype === 'normal' ? 22 : 26;
    const bx = Math.cos(this.angle) * barrelLen, by = Math.sin(this.angle) * barrelLen;

    if (this.ttype === 'normal') {
      lineSeg(ctx, sx, sy, sx + bx, sy + by, 'rgb(150,155,165)', 5);
      circle(ctx, sx, sy, 10, HOLO_BLUE);
      circle(ctx, sx, sy, 6, 'rgb(220,220,220)');
    } else if (this.ttype === 'rapid') {
      const o1x = Math.cos(this.angle + Math.PI / 2) * 5, o1y = Math.sin(this.angle + Math.PI / 2) * 5;
      lineSeg(ctx, sx, sy, sx + bx, sy + by, 'rgb(130,210,160)', 3);
      lineSeg(ctx, sx - o1x, sy - o1y, sx + bx - o1x, sy + by - o1y, 'rgb(100,180,130)', 2);
      lineSeg(ctx, sx + o1x, sy + o1y, sx + bx + o1x, sy + by + o1y, 'rgb(100,180,130)', 2);
      circle(ctx, sx, sy, 11, 'rgb(30,50,40)');
      circle(ctx, sx, sy, 7, HOLO_GREEN);
      if (this.cooldownTimer > 0) {
        const cr = 1.0 - (this.cooldownTimer / this.fireRate);
        circle(ctx, sx, sy, Math.max(0, 7 * cr), WHITE);
      }
    } else {
      const ox = Math.cos(this.angle + Math.PI / 2) * 4, oy = Math.sin(this.angle + Math.PI / 2) * 4;
      lineSeg(ctx, sx - ox, sy - oy, sx + bx - ox, sy + by - oy, 'rgb(100,105,115)', 4);
      lineSeg(ctx, sx + ox, sy + oy, sx + bx + ox, sy + by + oy, 'rgb(100,105,115)', 4);
      circle(ctx, sx, sy, 12, 'rgb(60,62,70)');
      circle(ctx, sx, sy, 7, RED_ALERT);
      if (this.cooldownTimer > 0) {
        const chargeRatio = 1.0 - (this.cooldownTimer / this.fireRate);
        circle(ctx, sx, sy, Math.max(0, 7 * chargeRatio), GOLD);
      }
    }
  }
}

class Projectile {
  constructor(x, y, target, dmg, ptype) {
    this.x = x; this.y = y; this.target = target; this.dmg = dmg; this.ptype = ptype;
    this.spd = ptype === 'normal' ? 450.0 : 300.0;
    this.alive = true;
  }
  update(dt, particles) {
    if (!this.target || this.target.hp <= 0) { this.alive = false; return; }
    const dx = this.target.x - this.x, dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 12) {
      this.target.hp -= this.dmg;
      this.alive = false;
      const col = this.ptype === 'normal' ? HOLO_BLUE : RED_ALERT;
      for (let i = 0; i < 8; i++) particles.push(new Particle(this.target.x, this.target.y, col));
      return;
    }
    this.x += (dx / d) * this.spd * dt;
    this.y += (dy / d) * this.spd * dt;
    if (Math.random() < 0.3) {
      const col = this.ptype === 'normal' ? 'rgb(200,220,255)' : this.ptype === 'rapid' ? 'rgb(150,255,180)' : 'rgb(255,150,50)';
      particles.push(new Particle(this.x, this.y, col, 0, 0, 2, 15));
    }
  }
  draw(ctx) {
    if (this.ptype === 'normal') {
      circle(ctx, this.x, this.y, 4, HOLO_BLUE);
      circle(ctx, this.x, this.y, 2, WHITE);
    } else if (this.ptype === 'rapid') {
      circle(ctx, this.x, this.y, 3, HOLO_GREEN);
      circle(ctx, this.x, this.y, 1, WHITE);
    } else {
      circle(ctx, this.x, this.y, 8, RED_ALERT);
      circle(ctx, this.x, this.y, 5, GOLD);
      circle(ctx, this.x, this.y, 2, WHITE);
    }
  }
}

const ENEMY_STATS = {
  A: { name: 'Scout Drone', baseHp: 30, spd: 85.0, dmg: 12, rewMoney: 15, rewIron: 3, rewCoal: 2 },
  B: { name: 'Heavy Crawler', baseHp: 90, spd: 50.0, dmg: 30, rewMoney: 35, rewIron: 10, rewCoal: 6 },
  // NOTE: the original Python Enemy.__init__ only branched on 'A'/'B' but the
  // high-risk "Gamma" composition (generate_enemy_options) can include a 'C'
  // entry from wave 3 onward, which would crash with an AttributeError when
  // spawned. We define a real elite unit here instead of reproducing that bug.
  C: { name: 'Elite Behemoth', baseHp: 220, spd: 38.0, dmg: 55, rewMoney: 70, rewIron: 22, rewCoal: 14 },
  D: { name: 'Void Specter', baseHp: 50, spd: 130.0, dmg: 20, rewMoney: 28, rewIron: 6, rewCoal: 3 },
};

class Enemy {
  constructor(etype, waveNum) {
    this.x = ENEMY_BASE_X + Math.random() * 40;
    this.y = LANE_Y + (Math.random() * 2 - 1) * (LANE_W * 0.35);
    this.etype = etype;
    this.size = 20;
    this.wallAttackTimer = 0;
    this.domeAttackTimer = 0;
    this.reachedDome = false;

    const hpScalar = 1.0 + (waveNum - 1) * 0.12;
    const spdScalar = 1.0 + Math.max(0, waveNum - 5) * 0.04;
    const stat = ENEMY_STATS[etype] || ENEMY_STATS.A;
    this.name = stat.name;
    this.maxHp = Math.floor(stat.baseHp * hpScalar);
    this.hp = this.maxHp;
    this.spd = stat.spd * spdScalar;
    this.dmg = stat.dmg;
    this.rewMoney = stat.rewMoney;
    this.rewIron = stat.rewIron;
    this.rewCoal = stat.rewCoal;
  }
  update(dt, dome, structures, turrets, particles, floatingTexts, domeDmgMult) {
    if (this.hp <= 0) {
      playSfx('explosion');
      const col = this.etype === 'A' ? HOLO_ORANGE : this.etype === 'D' ? 'rgb(180,80,255)' : RED_ALERT;
      for (let i = 0; i < 12; i++) particles.push(new Particle(this.x, this.y, col, undefined, undefined, 4, 50));
      floatingTexts.push(new FloatingText(this.x, this.y - 10, `+$${this.rewMoney}`, GOLD));
      return false;
    }

    const targetX = CITY_ZONE_X + 20, targetY = DOME_Y;
    const dx = targetX - this.x, dy = targetY - this.y;
    const distToTarget = Math.hypot(dx, dy);

    const insideDomeRect = (this.x >= CITY_ZONE_X && this.x <= MW && this.y >= 0 && this.y <= MH);
    if (insideDomeRect) {
      this.reachedDome = true;
      const dmgDealt = Math.floor(100 * domeDmgMult);
      dome.hp = Math.max(0, dome.hp - dmgDealt);
      playSfx('dome_hit');
      for (let i = 0; i < 8; i++) particles.push(new Particle(this.x, this.y, RED_ALERT, undefined, undefined, 4, 50));
      floatingTexts.push(new FloatingText(this.x, this.y - 12, `-${dmgDealt} HP`, RED_ALERT));
      return false;
    }

    let blocked = false, blockingWall = null;
    for (const s of structures) {
      if (s.stype === 'wall' && s.hp > 0) {
        const dToWall = dist(s.x, s.y, this.x, this.y);
        if (dToWall <= (this.size + s.size + 4)) {
          if (s.x > this.x - 10) { blocked = true; blockingWall = s; break; }
        }
      }
    }

    if (blocked && blockingWall) {
      this.wallAttackTimer += dt;
      if (this.wallAttackTimer >= 1.0) {
        this.wallAttackTimer = 0;
        blockingWall.hp = Math.max(0, blockingWall.hp - this.dmg);
        playSfx('dome_hit');
        for (let i = 0; i < 4; i++) particles.push(new Particle(blockingWall.x, blockingWall.y, MARS_RUST));
      }
      return true;
    }

    if (distToTarget > 5) {
      this.x += (dx / distToTarget) * this.spd * dt;
      this.y += (dy / distToTarget) * this.spd * dt * 0.3;
      this.y = clamp(this.y, LANE_Y - LANE_W, LANE_Y + LANE_W);
    }
    return true;
  }
  draw(ctx, tick) {
    const sx = this.x, sy = this.y;
    if (!(sx >= -50 && sx <= SW + 50 && sy >= -50 && sy <= SH + 50)) return;

    const bw = 26, bh = 3;
    rectFill(ctx, sx - bw / 2, sy - 20, bw, bh, 'rgb(60,10,10)');
    const ratio = Math.max(0, this.hp / this.maxHp);
    rectFill(ctx, sx - bw / 2, sy - 20, bw * ratio, bh, 'rgb(225,40,40)');

    if (this.etype === 'A') {
      const bob = Math.sin(tick * 0.2) * 3;
      circle(ctx, sx, sy + bob + 8, 6, 'rgb(40,10,5)');
      circle(ctx, sx, sy + bob + 8, 3, HOLO_ORANGE);
      ellipseFill(ctx, sx - 12, sy - 8 + bob, 24, 16, 'rgb(80,80,85)');
      circle(ctx, sx, sy - 2 + bob, 5, HOLO_ORANGE);
      circle(ctx, sx, sy - 2 + bob, 2, WHITE);
    } else if (this.etype === 'B') {
      const legExtend = 4 * Math.abs(Math.sin(tick * 0.1));
      lineSeg(ctx, sx, sy, sx - 16 - legExtend, sy - 8, 'rgb(40,40,45)', 3);
      lineSeg(ctx, sx, sy, sx + 16 + legExtend, sy - 8, 'rgb(40,40,45)', 3);
      lineSeg(ctx, sx, sy, sx - 18 - legExtend, sy + 8, 'rgb(40,40,45)', 3);
      lineSeg(ctx, sx, sy, sx + 18 + legExtend, sy + 8, 'rgb(40,40,45)', 3);
      circle(ctx, sx, sy, 16, 'rgb(50,52,60)');
      circle(ctx, sx, sy, 10, RED_ALERT);
      rectFill(ctx, sx - 8, sy - 8, 16, 4, 'rgb(20,20,20)');
      rectFill(ctx, sx - 4, sy - 8, 8, 2, GOLD);
    } else if (this.etype === 'C') {
      // Elite Behemoth — larger, armored silhouette with a pulsing energy core
      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.12);
      circle(ctx, sx, sy, 22, 'rgb(35,15,45)');
      circle(ctx, sx, sy, 18, 'rgb(70,30,90)');
      circle(ctx, sx, sy, 18, 'rgb(180,80,220)', 2);
      const legExtend = 5 * Math.abs(Math.sin(tick * 0.08));
      lineSeg(ctx, sx, sy, sx - 22 - legExtend, sy - 10, 'rgb(40,20,50)', 4);
      lineSeg(ctx, sx, sy, sx + 22 + legExtend, sy - 10, 'rgb(40,20,50)', 4);
      lineSeg(ctx, sx, sy, sx - 24 - legExtend, sy + 10, 'rgb(40,20,50)', 4);
      lineSeg(ctx, sx, sy, sx + 24 + legExtend, sy + 10, 'rgb(40,20,50)', 4);
      circle(ctx, sx, sy, 8 + pulse * 2, 'rgb(220,80,255)');
      circle(ctx, sx, sy, 3, WHITE);
    } else if (this.etype === 'D') {
      const phase = tick * 0.18;
      const alpha = 0.55 + 0.45 * Math.sin(phase);
      ctx.save();
      ctx.globalAlpha = alpha;
      circle(ctx, sx, sy, 13, 'rgb(80,30,140)');
      circle(ctx, sx, sy, 9, 'rgb(170,70,240)');
      circle(ctx, sx, sy, 4, WHITE);
      ctx.globalAlpha = alpha * 0.28;
      circle(ctx, sx - 8, sy, 11, 'rgb(150,60,220)');
      circle(ctx, sx - 16, sy, 8, 'rgb(120,40,190)');
      ctx.restore();
    }
  }
}

class Dome {
  constructor() {
    this.x = DOME_X; this.y = DOME_Y; this.radius = DOME_RADIUS;
    this.hp = 1000; this.maxHp = 1000;
  }
  draw(ctx, tick) {
    const sx = this.x, sy = this.y;
    const hpRatio = this.hp / Math.max(1, this.maxHp);
    const glowAlpha = (25 + Math.sin(tick * 0.1) * 8) / 255;

    let fillCol, rimCol;
    if (hpRatio > 0.35) {
      fillCol = `rgba(0,195,255,${Math.max(0, glowAlpha)})`;
      rimCol = 'rgba(0,195,255,0.5)';
    } else {
      fillCol = `rgba(255,40,40,${Math.max(0, glowAlpha + 0.05)})`;
      rimCol = 'rgba(255,40,40,0.66)';
    }

    const domeX = CITY_ZONE_X, domeW = MW - CITY_ZONE_X;
    rectFill(ctx, domeX, 0, domeW, MH, fillCol);
    rectStroke(ctx, domeX, 0, domeW, MH, rimCol, 3);

    const coreSize = 84;
    const cx = sx - coreSize / 2, cy = sy - coreSize / 2;
    rectFill(ctx, cx, cy, coreSize, coreSize, 'rgb(24,28,42)', 6);
    rectStroke(ctx, cx, cy, coreSize, coreSize, 'rgb(0,195,255)', 2, 6);

    const tileGap = 6;
    const tileSize = (coreSize - tileGap * 3) / 2;
    const tileCols = ['rgb(38,46,68)', 'rgb(45,56,82)', 'rgb(45,56,82)', 'rgb(38,46,68)'];
    for (let idx = 0; idx < 4; idx++) {
      const tx = cx + tileGap + (idx % 2) * (tileSize + tileGap);
      const ty = cy + tileGap + Math.floor(idx / 2) * (tileSize + tileGap);
      rectFill(ctx, tx, ty, tileSize, tileSize, tileCols[idx], 3);
      rectStroke(ctx, tx, ty, tileSize, tileSize, 'rgb(0,195,255)', 1, 3);
    }

    lineSeg(ctx, sx, cy + 8, sx, cy + coreSize - 8, 'rgb(0,195,255)', 1);
    lineSeg(ctx, cx + 8, sy, cx + coreSize - 8, sy, 'rgb(0,195,255)', 1);
    dtxt(ctx, 'CORE', 'xs', WHITE, sx, sy, 'center', false);
  }
}


