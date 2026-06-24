/* ==========================================================
   4. UI — fonts, text helpers, widgets, HUD, build bar, popup cards
   ========================================================== */
const FONT_FAMILY = "'Kanit','Tahoma',sans-serif";
const FONTS = {
  xs: { size: 13, weight: 500 },
  s:  { size: 16, weight: 500 },
  m:  { size: 20, weight: 500 },
  ml: { size: 24, weight: 700 },
  l:  { size: 30, weight: 700 },
  xl: { size: 44, weight: 700 },
  xxl:{ size: 64, weight: 700 },
};
function setFont(ctx, fk) {
  const f = FONTS[fk] || FONTS.m;
  ctx.font = `${f.weight} ${f.size}px ${FONT_FAMILY}`;
}

function dtxt(ctx, text, fk, col, x, y, anch, shad) {
  anch = anch || 'center';
  setFont(ctx, fk);
  const str = String(text);

  let align = 'center', baseline = 'middle';
  if (anch === 'topleft') { align = 'left'; baseline = 'top'; }
  else if (anch === 'topright') { align = 'right'; baseline = 'top'; }
  else if (anch === 'midleft') { align = 'left'; baseline = 'middle'; }
  else if (anch === 'midright') { align = 'right'; baseline = 'middle'; }
  else if (anch === 'bottomleft') { align = 'left'; baseline = 'bottom'; }
  else if (anch === 'bottomright') { align = 'right'; baseline = 'bottom'; }
  else if (anch === 'midtop') { align = 'center'; baseline = 'top'; }
  else if (anch === 'midbottom') { align = 'center'; baseline = 'bottom'; }
  else { align = 'center'; baseline = 'middle'; }

  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (shad) {
    ctx.fillStyle = 'rgb(10,10,15)';
    ctx.fillText(str, x + 2, y + 2);
  }
  ctx.fillStyle = col;
  ctx.fillText(str, x, y);
}

function dtxtBg(ctx, text, fk, col, x, y, pad, bg, anch) {
  pad = pad !== undefined ? pad : 6;
  bg = bg || 'rgba(0,0,0,0.63)';
  anch = anch || 'center';
  setFont(ctx, fk);
  const str = String(text);
  const w = ctx.measureText(str).width;
  const f = FONTS[fk] || FONTS.m;
  const h = f.size;

  let rx, ry;
  if (anch === 'topleft') { rx = x; ry = y; }
  else { rx = x - w / 2; ry = y - h / 2; }

  rectFill(ctx, rx - pad, ry - pad / 2, w + pad * 2, h + pad, bg, 6);
  dtxt(ctx, text, fk, col, x, y, anch, false);
}

function measureTextWidth(ctx, text, fk) {
  setFont(ctx, fk);
  return ctx.measureText(String(text)).width;
}

function wrapTextToWidth(ctx, text, fontKey, maxWidth, maxLines) {
  setFont(ctx, fontKey);
  const words = String(text).split(' ');
  const lines = [];
  let curr = '';
  let truncated = false;

  for (const word of words) {
    const candidate = curr ? `${curr} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      curr = candidate;
    } else {
      if (curr) {
        lines.push(curr);
        curr = word;
      } else {
        let chunk = '';
        for (const ch of word) {
          const c2 = chunk + ch;
          if (ctx.measureText(c2).width <= maxWidth) chunk = c2;
          else { if (chunk) lines.push(chunk); chunk = ch; }
        }
        curr = chunk;
      }
    }
    if (lines.length >= maxLines) { truncated = true; break; }
  }
  if (curr && lines.length < maxLines) lines.push(curr);

  if (truncated && lines.length) {
    while (lines[lines.length - 1] && ctx.measureText(lines[lines.length - 1] + '...').width > maxWidth) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
    }
    lines[lines.length - 1] += '...';
  }
  return lines.slice(0, maxLines);
}

function fitFontKey(ctx, text, preferredKey, fallbackKeys, maxWidth) {
  const keys = [preferredKey, ...fallbackKeys];
  for (const key of keys) {
    setFont(ctx, key);
    if (ctx.measureText(String(text)).width <= maxWidth) return key;
  }
  return fallbackKeys[fallbackKeys.length - 1] || preferredKey;
}

// ---------------- Button widget ----------------
class Button {
  constructor(x, y, w, h, text, fontKey, baseCol, hoverCol, isLocked) {
    this.rect = makeRect(x, y, w, h);
    this.text = text;
    this.fontKey = fontKey || 'm';
    this.baseCol = baseCol || HOLO_BLUE;
    this.hoverCol = hoverCol || WHITE;
    this.isLocked = !!isLocked;
    this.hovered = false;
  }
  update(mx, my) { this.hovered = pointInRect(mx, my, this.rect); }
  draw(ctx) {
    let bgCol = 'rgb(20,24,38)', borderCol = this.baseCol, textCol;
    if (this.isLocked) { borderCol = 'rgb(60,62,70)'; textCol = 'rgb(100,102,110)'; }
    else if (this.hovered) {
      borderCol = this.hoverCol; textCol = this.hoverCol;
      ctx.save();
      ctx.globalAlpha = 0.1;
      rectFill(ctx, this.rect.x - 6, this.rect.y - 6, this.rect.w + 12, this.rect.h + 12, this.baseCol, 12);
      ctx.restore();
    } else { textCol = this.baseCol; }

    rectFill(ctx, this.rect.x, this.rect.y, this.rect.w, this.rect.h, bgCol, 8);
    rectStroke(ctx, this.rect.x, this.rect.y, this.rect.w, this.rect.h, borderCol, 2, 8);
    dtxt(ctx, this.text, this.fontKey, textCol, this.rect.x + this.rect.w / 2, this.rect.y + this.rect.h / 2, 'center', true);
  }
}

// ---------------- HUD ----------------
function drawHud(ctx, domeHp, domeMaxHp, resources, wave, maxWave, stateMsg, combatActive, combatEnemiesLeft) {
  rectFill(ctx, 0, 0, SW, 65, 'rgba(8,10,18,0.94)');
  lineSeg(ctx, 0, 64, SW, 64, 'rgb(30,48,80)', 2);

  dtxt(ctx, tr('DOME HP'), 'xs', 'rgb(150,155,175)', 15, 12, 'topleft', false);
  const hpRatio = Math.max(0, domeHp / Math.max(1, domeMaxHp));
  const hpCol = hpRatio > 0.5 ? HOLO_GREEN : hpRatio > 0.25 ? HOLO_ORANGE : RED_ALERT;
  rectFill(ctx, 15, 30, 140, 18, 'rgb(35,10,10)', 4);
  rectFill(ctx, 15, 30, 140 * hpRatio, 18, hpCol, 4);
  rectStroke(ctx, 15, 30, 140, 18, 'rgb(80,85,95)', 1, 4);
  dtxt(ctx, `${domeHp}/${domeMaxHp}`, 'xs', WHITE, 85, 39, 'center', false);

  const items = [
    ['MONEY', resources.money, GOLD, 180],
    ['IRON', resources.iron, 'rgb(200,205,220)', 280],
    ['COAL', resources.coal, 'rgb(130,135,140)', 380],
    ['HAPPINESS', `${Math.floor(resources.happiness)}%`, HOLO_GREEN, 480],
    ['POPULATION', `${resources.population}`, HOLO_BLUE, 580],
  ];
  for (const [label, val, color, rx] of items) {
    lineSeg(ctx, rx - 10, 8, rx - 10, 56, 'rgb(25,36,58)', 1);
    dtxt(ctx, tr(label), 'xs', 'rgb(140,145,165)', rx, 12, 'topleft', false);
    dtxt(ctx, String(val), 'm', color, rx, 34, 'topleft', false);
  }

  lineSeg(ctx, 690, 8, 690, 56, 'rgb(25,36,58)', 1);
  dtxt(ctx, tr('WAVE'), 'xs', 'rgb(140,145,165)', 705, 12, 'topleft', false);
  const waveCol = combatActive ? HOLO_ORANGE : HOLO_BLUE;
  dtxt(ctx, `${wave}`, 'ml', waveCol, 705, 32, 'topleft', false);

  lineSeg(ctx, 780, 8, 780, 56, 'rgb(25,36,58)', 1);
  const stateCol = stateMsg === 'BUILD PHASE' ? HOLO_GREEN : HOLO_ORANGE;
  const stateFont = fitFontKey(ctx, tr(stateMsg), 's', ['xs'], combatActive ? 95 : 280);
  dtxt(ctx, tr(stateMsg), stateFont, stateCol, 800, 22, 'topleft', false);

  if (combatActive) {
    lineSeg(ctx, SW - 210, 8, SW - 210, 56, 'rgb(25,36,58)', 1);
    dtxt(ctx, tr('Enemies Left'), 'xs', 'rgb(140,145,165)', SW - 195, 12, 'topleft', false);
    dtxt(ctx, String(combatEnemiesLeft), 'm', HOLO_ORANGE, SW - 195, 34, 'topleft', false);
  }
}

// ---------------- Build bar ----------------
const TAB_LABELS = { Defense: { th: 'ป้องกัน' }, Structure: { th: 'สิ่งปลูกสร้าง' } };
function tabTr(name) {
  if (LANG.v === 'th') return (TAB_LABELS[name] && TAB_LABELS[name].th) || name;
  return name;
}

function drawBuildBar(ctx, selectedBuilding, money, iron, coal, unlockedStructures, unlockedTurrets, mx, my, category, population) {
  const barH = 90, barY = SH - barH;
  rectFill(ctx, 0, barY, SW, barH, 'rgba(8,10,18,0.94)');
  lineSeg(ctx, 0, barY, SW, barY, 'rgb(30,48,80)', 2);

  const tabRects = [];
  const tabNames = ['Defense', 'Structure'];
  const tabW = 90, tabH = 34, tabX = 12;
  const tabYBase = barY + (barH - tabNames.length * (tabH + 6)) / 2;

  for (let i = 0; i < tabNames.length; i++) {
    const tname = tabNames[i];
    const ty = tabYBase + i * (tabH + 6);
    const r = makeRect(tabX, ty, tabW, tabH);
    tabRects.push([r, tname]);

    const isActive = category === tname;
    const hov = pointInRect(mx, my, r);
    let tabBg, tabBorder, tabTextCol;
    if (isActive) { tabBg = 'rgb(20,45,70)'; tabBorder = HOLO_BLUE; tabTextCol = WHITE; }
    else if (hov) { tabBg = 'rgb(22,30,48)'; tabBorder = 'rgb(80,120,180)'; tabTextCol = HOLO_BLUE; }
    else { tabBg = 'rgb(14,16,26)'; tabBorder = 'rgb(40,45,60)'; tabTextCol = 'rgb(120,125,140)'; }

    rectFill(ctx, r.x, r.y, r.w, r.h, tabBg, 5);
    rectStroke(ctx, r.x, r.y, r.w, r.h, tabBorder, isActive ? 2 : 1, 5);
    if (isActive) rectFill(ctx, r.x, r.y + 4, 3, r.h - 8, HOLO_BLUE, 2);
    dtxt(ctx, tabTr(tname), 'xs', tabTextCol, r.x + r.w / 2, r.y + r.h / 2, 'center', false);
  }

  const defenseDefs = [
    ['normal', tr('Normal Turret'), 120, 20, 5, unlockedTurrets.has('normal_turret'), 'NormalTurretDesc', 5],
    ['heavy', tr('High Damage Turret'), 250, 50, 10, unlockedTurrets.has('heavy_turret'), 'HighDamageTurretDesc', 10],
    ['rapid', tr('Rapid Turret'), 160, 30, 8, unlockedTurrets.has('rapid_turret'), 'RapidTurretDesc', 15],
    ['wall', tr('Wall'), 30, 10, 0, unlockedTurrets.has('wall'), 'WallDesc', 0],
  ];
  const structureDefs = [
    ['house', tr('House'), 100, 0, 0, unlockedStructures.has('house'), 'HouseDesc'],
    ['iron_mine', tr('Iron Mine'), 150, 0, 10, unlockedStructures.has('iron_mine'), 'IronMineDesc'],
    ['coal_mine', tr('Coal Mine'), 150, 10, 0, unlockedStructures.has('coal_mine'), 'CoalMineDesc'],
    ['park', tr('Park'), 200, 15, 15, unlockedStructures.has('park'), 'ParkDesc'],
    ['medical', tr('Medical Bay'), 180, 0, 15, unlockedStructures.has('medical'), 'MedicalBayDesc'],
  ];

  let buildingDefs = (category === 'Defense' ? defenseDefs : structureDefs).filter(b => b[5]);

  const btnW = 120, btnH = 70;
  const itemsStartX = tabX + tabW + 18, gap = 16;

  const clickRects = [];
  let hoveredInfo = null;

  for (let i = 0; i < buildingDefs.length; i++) {
    const [btype, name, cMon, cIrn, cCo, isUnlocked, descKey, cPop] = buildingDefs[i];
    const bx = itemsStartX + i * (btnW + gap), by = barY + 10;
    const r = makeRect(bx, by, btnW, btnH);
    clickRects.push([r, btype]);

    const hovered = pointInRect(mx, my, r);
    if (hovered) hoveredInfo = [name, cMon, cIrn, cCo, isUnlocked, descKey, cPop];

    const canAfford = (money >= cMon && iron >= cIrn && coal >= cCo && (population === undefined || population >= (cPop || 0)));
    let cardCol = 'rgb(16,20,32)', borderCol = 'rgb(40,42,60)';

    if (!isUnlocked) borderCol = 'rgb(50,50,55)';
    else if (hovered) { borderCol = canAfford ? HOLO_BLUE : RED_ALERT; cardCol = 'rgb(22,30,48)'; }
    else if (canAfford) borderCol = 'rgb(30,70,110)';
    if (selectedBuilding === btype) { borderCol = HOLO_GREEN; cardCol = 'rgb(15,35,25)'; }

    rectFill(ctx, r.x, r.y, r.w, r.h, cardCol, 6);
    rectStroke(ctx, r.x, r.y, r.w, r.h, borderCol, hovered ? 2 : 1, 6);

    const textCol = isUnlocked ? WHITE : 'rgb(100,102,110)';
    dtxt(ctx, name, 'xs', textCol, r.x + r.w / 2, r.y + 15, 'center', false);

    if (!isUnlocked) {
      dtxt(ctx, tr('Locked'), 'xs', RED_ALERT, r.x + r.w / 2, r.y + 45, 'center', false);
    } else {
      let costsText = `$${cMon}`;
      if (cIrn > 0) costsText += ` ${cIrn}I`;
      if (cCo > 0) costsText += ` ${cCo}C`;
      if (cPop > 0) costsText += ` ${cPop}${tr('POP')}`;
      dtxt(ctx, costsText, 'xs', canAfford ? GOLD : 'rgb(120,50,50)', r.x + r.w / 2, r.y + 45, 'center', false);
    }
  }

  if (hoveredInfo) {
    const [name, cMon, cIrn, cCo, isUnlocked, descKey, cPop] = hoveredInfo;
    const tw = 340, th = 120;
    const tx = clamp(mx - tw / 2, 10, SW - tw - 10);
    const ty = barY - th - 10;

    rectFill(ctx, tx, ty, tw, th, DARK_GLASS, 8);
    rectStroke(ctx, tx, ty, tw, th, HOLO_BLUE, 1, 8);

    dtxt(ctx, name, 's', WHITE, tx + 15, ty + 12, 'topleft', false);
    const costLine = `${tr('MONEY')}: $${cMon} | ${tr('IRON')}: ${cIrn} | ${tr('COAL')}: ${cCo}${cPop > 0 ? ' | ' + tr('POP') + ': ' + cPop : ''}`;
    dtxt(ctx, costLine, 'xs', isUnlocked ? GOLD : 'rgb(120,50,50)', tx + 15, ty + 35, 'topleft', false);
    dtxt(ctx, tr(descKey), 'xs', 'rgb(180,185,200)', tx + 15, ty + 60, 'topleft', false);
  }

  return { clickRects, tabRects };
}

// ---------------- Popup cards (enemy selector / upgrades) ----------------
const UPGRADE_SELECT_COST = 100;
const UPGRADE_REROLL_COST = 75;

function drawPopupCards(ctx, title, subtitle, cardsList, mx, my, tick, money) {
  rectFill(ctx, 0, 0, SW, SH, 'rgba(0,0,0,0.55)');

  const isUpgrade = cardsList.length > 0 && 'category' in cardsList[0];
  const boxW = 840, boxH = isUpgrade ? 490 : 440;
  const boxX = (SW - boxW) / 2, boxY = (SH - boxH) / 2;

  rectFill(ctx, boxX, boxY, boxW, boxH, 'rgba(10,14,28,0.94)', 12);
  rectStroke(ctx, boxX, boxY, boxW, boxH, 'rgb(40,60,100)', 2, 12);

  dtxt(ctx, title, 'l', WHITE, SW / 2, boxY + 40, 'center', true);
  dtxt(ctx, subtitle, 's', 'rgb(140,150,180)', SW / 2, boxY + 72, 'center', false);

  const cardW = 220, cardH = 280, gap = 30;
  const totalW = cardsList.length * cardW + (cardsList.length - 1) * gap;
  const startX = (SW - totalW) / 2;
  const cardY = boxY + 110;

  let hoveredIndex = -1;

  for (let idx = 0; idx < cardsList.length; idx++) {
    const card = cardsList[idx];
    const cx = startX + idx * (cardW + gap);
    const r = makeRect(cx, cardY, cardW, cardH);
    const hovered = pointInRect(mx, my, r);
    if (hovered) hoveredIndex = idx;

    let cardCol = 'rgb(16,20,32)', borderCol = 'rgb(40,60,100)';
    let drawY = cardY;
    if (hovered) {
      cardCol = 'rgb(22,34,56)'; borderCol = HOLO_GREEN;
      ctx.save(); ctx.globalAlpha = 0.1;
      rectFill(ctx, cx - 7, cardY - 7, cardW + 14, cardH + 14, HOLO_GREEN, 10);
      ctx.restore();
      drawY = cardY - 4;
    }

    rectFill(ctx, cx, drawY, cardW, cardH, cardCol, 8);
    rectStroke(ctx, cx, drawY, cardW, cardH, borderCol, hovered ? 2 : 1, 8);

    const centerX = cx + cardW / 2;

    if ('reward_money' in card) {
      const riskCol = card.risk === 'High' ? RED_ALERT : card.risk === 'Medium' ? HOLO_ORANGE : HOLO_GREEN;
      const iconY = drawY + 45;
      const pulseR = 22 + (hovered ? 2 : 0);
      ctx.save(); ctx.globalAlpha = 0.25;
      circle(ctx, centerX, iconY, pulseR + 4, riskCol);
      ctx.restore();
      circle(ctx, centerX, iconY, pulseR, riskCol);
      circle(ctx, centerX, iconY, pulseR, WHITE, 2);
      dtxt(ctx, card.risk[0], 'ml', WHITE, centerX, iconY, 'center', false);

      dtxt(ctx, card.name, 'm', WHITE, centerX, drawY + 95, 'center', false);
      dtxt(ctx, `${tr('Risk Level:')} ${tr(card.risk)}`, 'xs', 'rgb(180,185,200)', centerX, drawY + 122, 'center', false);

      const comp = card.composition || [];
      const countA = comp.filter(c => c === 'A').length;
      const countB = comp.filter(c => c === 'B').length;
      const countC = comp.filter(c => c === 'C').length;
      const countD = comp.filter(c => c === 'D').length;
      let compStr = '';
      if (countA > 0) compStr += `A:${countA} `;
      if (countB > 0) compStr += `B:${countB} `;
      if (countC > 0) compStr += `C:${countC} `;
      if (countD > 0) compStr += `D:${countD} `;
      dtxt(ctx, compStr.trim(), 'xs', HOLO_ORANGE, centerX, drawY + 148, 'center', false);

      const rewardY = drawY + 185;
      dtxt(ctx, tr('Reward:'), 'xs', 'rgb(140,145,165)', centerX, rewardY, 'center', false);
      let rewardStr = `$${card.reward_money}`;
      if (card.reward_iron > 0) rewardStr += ` | ${card.reward_iron}I`;
      if (card.reward_coal > 0) rewardStr += ` | ${card.reward_coal}C`;
      dtxt(ctx, rewardStr, 's', GOLD, centerX, rewardY + 22, 'center', false);
    } else {
      const catCol = card.category === 'Policy' ? HOLO_GREEN : card.category === 'Defense' ? HOLO_BLUE : HOLO_ORANGE;
      dtxtBg(ctx, tr(card.category), 'xs', catCol, centerX, drawY + 25, 5, 'rgb(20,24,38)', 'center');

      const titleText = tr(card.name);
      const titleFont = fitFontKey(ctx, titleText, 'ml', ['m', 's'], cardW - 28);
      const titleLines = wrapTextToWidth(ctx, titleText, titleFont, cardW - 28, 2);
      let titleY = titleLines.length > 1 ? drawY + 62 : drawY + 72;
      for (const line of titleLines) {
        dtxt(ctx, line, titleFont, WHITE, centerX, titleY, 'center', false);
        titleY += 23;
      }

      const descText = tr(card.desc);
      const lines = wrapTextToWidth(ctx, descText, 'xs', cardW - 30, 5);
      let dyOffset = 125;
      for (const line of lines) {
        dtxt(ctx, line, 'xs', 'rgb(180,185,200)', centerX, drawY + dyOffset, 'center', false);
        dyOffset += 19;
      }

      const cardCost = card.cost !== undefined ? card.cost : 0;
      const canAffordSel = money === undefined || money >= cardCost;
      const btnCol = hovered && canAffordSel ? HOLO_GREEN : canAffordSel ? 'rgb(40,50,70)' : 'rgb(40,25,25)';
      rectFill(ctx, cx + 25, drawY + cardH - 40, cardW - 50, 26, btnCol, 4);
      const costLabel = cardCost === 0 ? 'FREE' : '$' + cardCost;
      dtxt(ctx, tr('Select') + ' ' + costLabel, 'xs', canAffordSel ? WHITE : 'rgb(120,60,60)', centerX, drawY + cardH - 27, 'center', false);
    }
  }

  if (isUpgrade) {
    const btnY = boxY + boxH - 48;
    const btnW = 180, btnH = 30;
    const rerollX = SW / 2 - btnW - 10;
    const skipX   = SW / 2 + 10;

    const rerollHov = pointInRect(mx, my, makeRect(rerollX, btnY, btnW, btnH));
    const skipHov   = pointInRect(mx, my, makeRect(skipX,   btnY, btnW, btnH));

    const canAffordReroll = money === undefined || money >= UPGRADE_REROLL_COST;

    rectFill(ctx, rerollX, btnY, btnW, btnH, rerollHov && canAffordReroll ? 'rgb(30,70,120)' : canAffordReroll ? 'rgb(18,28,48)' : 'rgb(22,14,14)', 5);
    rectStroke(ctx, rerollX, btnY, btnW, btnH, rerollHov && canAffordReroll ? HOLO_BLUE : canAffordReroll ? 'rgb(40,60,90)' : 'rgb(80,30,30)', 1, 5);
    dtxt(ctx, tr('Reroll') + ' $' + UPGRADE_REROLL_COST, 'xs', canAffordReroll ? (rerollHov ? WHITE : 'rgb(160,170,200)') : 'rgb(120,60,60)', rerollX + btnW / 2, btnY + btnH / 2, 'center', false);

    rectFill(ctx, skipX, btnY, btnW, btnH, skipHov ? 'rgb(50,30,18)' : 'rgb(22,16,12)', 5);
    rectStroke(ctx, skipX, btnY, btnW, btnH, skipHov ? HOLO_ORANGE : 'rgb(70,50,30)', 1, 5);
    dtxt(ctx, tr('Skip'), 'xs', skipHov ? WHITE : 'rgb(180,160,130)', skipX + btnW / 2, btnY + btnH / 2, 'center', false);

    if (rerollHov) return -2;
    if (skipHov)   return -3;
  }

  return hoveredIndex;
}


