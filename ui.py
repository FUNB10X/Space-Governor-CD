import os
import pygame
import math
from core import *

# ==========================================
# 1. FONT MANAGEMENT & TEXT HELPERS
# ==========================================
FONTS = {}

def init_fonts():
    global FONTS
    sizes = {
        'xs': 13,
        's': 16,
        'm': 20,
        'ml': 24,
        'l': 30,
        'xl': 44,
        'xxl': 64
    }

    font_path_med = os.path.join('Asset', 'Anakotmai-Medium.ttf')
    font_path_bold = os.path.join('Asset', 'Anakotmai-Bold.ttf')

    for key, sz in sizes.items():
        loaded = False
        path = font_path_bold if key in ['ml', 'l', 'xl', 'xxl'] else font_path_med
        if os.path.exists(path):
            try:
                FONTS[key] = pygame.font.Font(path, sz)
                loaded = True
            except Exception:
                pass

        if not loaded:
            for sys_name in ['seagothic', 'leelawadeeui', 'segoeui', 'tahoma', 'arial', 'helvetica', 'freesans']:
                try:
                    FONTS[key] = pygame.font.SysFont(sys_name, sz, bold=(key in ['ml', 'l', 'xl', 'xxl']))
                    loaded = True
                    break
                except Exception:
                    pass

        if not loaded:
            FONTS[key] = pygame.font.Font(None, sz + 2)

init_fonts()

def dtxt(surf, text, fk, col, x, y, anch='center', shad=False):
    """Draw a text string with optional shadow drop."""
    font = FONTS.get(fk)
    if not font:
        return

    text_str = str(text)

    if shad:
        s_surf = font.render(text_str, True, (10, 10, 15))
        r = s_surf.get_rect()
        setattr(r, anch, (int(x) + 2, int(y) + 2))
        surf.blit(s_surf, r)

    s_surf = font.render(text_str, True, col)
    r = s_surf.get_rect()
    setattr(r, anch, (int(x), int(y)))
    surf.blit(s_surf, r)

def dtxt_bg(surf, text, fk, col, x, y, pad=6, bg=(0, 0, 0, 160), anch='center'):
    """Draw a text with rounded container pill behind it."""
    font = FONTS.get(fk)
    if not font:
        return

    text_str = str(text)
    s_surf = font.render(text_str, True, col)
    r = s_surf.get_rect()
    setattr(r, anch, (int(x), int(y)))

    bg_r = pygame.Rect(r.x - pad, r.y - pad//2, r.w + pad*2, r.h + pad)
    bg_surf = pygame.Surface((bg_r.w, bg_r.h), pygame.SRCALPHA)
    pygame.draw.rect(bg_surf, bg, bg_surf.get_rect(), border_radius=6)

    surf.blit(bg_surf, (bg_r.x, bg_r.y))
    surf.blit(s_surf, r)

def wrap_text_to_width(text, font_key, max_width, max_lines):
    font = FONTS.get(font_key)
    if not font:
        return [str(text)]

    words = str(text).split(" ")
    lines = []
    curr = ""
    truncated = False
    for word in words:
        candidate = word if not curr else f"{curr} {word}"
        if font.size(candidate)[0] <= max_width:
            curr = candidate
        else:
            if curr:
                lines.append(curr)
                curr = word
            else:
                chunk = ""
                for ch in word:
                    candidate = chunk + ch
                    if font.size(candidate)[0] <= max_width:
                        chunk = candidate
                    else:
                        if chunk:
                            lines.append(chunk)
                        chunk = ch
                curr = chunk

        if len(lines) >= max_lines:
            truncated = True
            break

    if curr and len(lines) < max_lines:
        lines.append(curr)

    if truncated and lines:
        while lines[-1] and font.size(lines[-1] + "...")[0] > max_width:
            lines[-1] = lines[-1][:-1]
        lines[-1] += "..."

    return lines[:max_lines]

def fit_font_key(text, preferred_key, fallback_keys, max_width):
    for key in [preferred_key] + fallback_keys:
        font = FONTS.get(key)
        if font and font.size(str(text))[0] <= max_width:
            return key
    return fallback_keys[-1] if fallback_keys else preferred_key

# ==========================================
# 2. INTERACTIVE UI WIDGETS
# ==========================================
class Button:
    def __init__(self, x, y, w, h, text, font_key='m', base_col=HOLO_BLUE, hover_col=WHITE, is_locked=False):
        self.rect = pygame.Rect(x, y, w, h)
        self.text = text
        self.font_key = font_key
        self.base_col = base_col
        self.hover_col = hover_col
        self.is_locked = is_locked
        self.hovered = False

    def update(self, mx, my):
        self.hovered = self.rect.collidepoint(mx, my)

    def draw(self, surf):
        bg_col = (20, 24, 38)
        border_col = self.base_col

        if self.is_locked:
            border_col = (60, 62, 70)
            text_col = (100, 102, 110)
        elif self.hovered:
            border_col = self.hover_col
            text_col = self.hover_col
            glow_surf = pygame.Surface((self.rect.w + 12, self.rect.h + 12), pygame.SRCALPHA)
            pygame.draw.rect(glow_surf, (self.base_col[0], self.base_col[1], self.base_col[2], 25), glow_surf.get_rect(), border_radius=12)
            surf.blit(glow_surf, (self.rect.x - 6, self.rect.y - 6))
        else:
            text_col = self.base_col

        pygame.draw.rect(surf, bg_col, self.rect, border_radius=8)
        pygame.draw.rect(surf, border_col, self.rect, 2, border_radius=8)

        dtxt(surf, self.text, self.font_key, text_col, self.rect.centerx, self.rect.centery, shad=True)

# ==========================================
# 3. GAMEPLAY TOP HUD PANEL
# ==========================================
def draw_hud(surf, dome_hp, dome_max_hp, resources, wave, max_wave, state_msg, active_upgrade_list=None,
             combat_active=False, combat_enemies_left=0):
    """Draw the top HUD panel. When combat_active is True, show extra combat info."""
    hud_rect = pygame.Rect(0, 0, SW, 65)

    bg_surf = pygame.Surface((SW, 65), pygame.SRCALPHA)
    pygame.draw.rect(bg_surf, (8, 10, 18, 240), bg_surf.get_rect())
    surf.blit(bg_surf, (0, 0))
    
    # Only 1 line at the bottom of the HUD
    pygame.draw.line(surf, (30, 48, 80), (0, 64), (SW, 64), 2)

    dtxt(surf, tr("DOME HP"), 'xs', (150, 155, 175), 15, 12, 'topleft')
    hp_ratio = max(0.0, dome_hp / max(1, dome_max_hp))
    hp_col = HOLO_GREEN if hp_ratio > 0.5 else HOLO_ORANGE if hp_ratio > 0.25 else RED_ALERT

    pygame.draw.rect(surf, (35, 10, 10), (15, 30, 140, 18), border_radius=4)
    pygame.draw.rect(surf, hp_col, (15, 30, int(140 * hp_ratio), 18), border_radius=4)
    pygame.draw.rect(surf, (80, 85, 95), (15, 30, 140, 18), 1, border_radius=4)
    dtxt(surf, f"{dome_hp}/{dome_max_hp}", 'xs', WHITE, 85, 39)

    items = [
        ("MONEY", resources['money'], GOLD, 180),
        ("IRON", resources['iron'], (200, 205, 220), 280),
        ("COAL", resources['coal'], (130, 135, 140), 380),
        ("HAPPINESS", f"{int(resources['happiness'])}%", HOLO_GREEN, 480),
        ("POPULATION", f"{resources['population']}", HOLO_BLUE, 580)
    ]

    for label, val, color, rx in items:
        pygame.draw.line(surf, (25, 36, 58), (rx - 10, 8), (rx - 10, 56))
        dtxt(surf, tr(label), 'xs', (140, 145, 165), rx, 12, 'topleft')
        dtxt(surf, str(val), 'm', color, rx, 34, 'topleft')

    pygame.draw.line(surf, (25, 36, 58), (690, 8), (690, 56))
    dtxt(surf, tr("WAVE"), 'xs', (140, 145, 165), 705, 12, 'topleft')
    wave_col = HOLO_ORANGE if combat_active else HOLO_BLUE
    dtxt(surf, f"{wave}", 'ml', wave_col, 705, 32, 'topleft')

    pygame.draw.line(surf, (25, 36, 58), (780, 8), (780, 56))
    state_col = HOLO_GREEN if "BUILD" in state_msg else HOLO_ORANGE
    dtxt(surf, tr(state_msg), 's', state_col, 800, 22, 'topleft')

    if combat_active:
        pygame.draw.line(surf, (25, 36, 58), (SW - 200, 8), (SW - 200, 56))
        dtxt(surf, tr("COMBAT PHASE"), 'xs', HOLO_ORANGE, SW - 185, 14, 'topleft')
        dtxt(surf, f"Enemies: {combat_enemies_left}", 's', WHITE, SW - 185, 36, 'topleft')

# ==========================================
# 4. CONSTRUCTION BAR (Bottom Selection panel with Category Tabs)
# ==========================================
_TAB_LABELS = {
    "Defense": {"th": "ป้องกัน"},
    "Structure": {"th": "สิ่งปลูกสร้าง"}
}

def _tab_tr(name):
    from core import LANG
    if LANG[0] == 'th':
        return _TAB_LABELS.get(name, {}).get('th', name)
    return name

def draw_build_bar(surf, selected_building, money, iron, coal, unlocked_structures, unlocked_turrets, mx, my, category="Defense"):
    """Draw bottom toolbar with category tabs. Returns (click_rects, tab_rects)."""
    bar_h = 90
    bar_y = SH - bar_h

    bg_surf = pygame.Surface((SW, bar_h), pygame.SRCALPHA)
    pygame.draw.rect(bg_surf, (8, 10, 18, 240), bg_surf.get_rect())
    surf.blit(bg_surf, (0, bar_y))
    
    # Only 1 line at the top of the build bar
    pygame.draw.line(surf, (30, 48, 80), (0, bar_y), (SW, bar_y), 2)

    tab_rects = []
    tab_names = ["Defense", "Structure"]
    tab_w, tab_h = 90, 34
    tab_x = 12
    tab_y_base = bar_y + (bar_h - len(tab_names) * (tab_h + 6)) // 2

    for i, tname in enumerate(tab_names):
        ty = tab_y_base + i * (tab_h + 6)
        tr_rect = pygame.Rect(tab_x, ty, tab_w, tab_h)
        tab_rects.append((tr_rect, tname))

        is_active = (category == tname)
        hov = tr_rect.collidepoint(mx, my)

        if is_active:
            tab_bg = (20, 45, 70)
            tab_border = HOLO_BLUE
            tab_text_col = WHITE
        elif hov:
            tab_bg = (22, 30, 48)
            tab_border = (80, 120, 180)
            tab_text_col = HOLO_BLUE
        else:
            tab_bg = (14, 16, 26)
            tab_border = (40, 45, 60)
            tab_text_col = (120, 125, 140)

        pygame.draw.rect(surf, tab_bg, tr_rect, border_radius=5)
        pygame.draw.rect(surf, tab_border, tr_rect, 2 if is_active else 1, border_radius=5)

        if is_active:
            pygame.draw.rect(surf, HOLO_BLUE, (tr_rect.x, tr_rect.y + 4, 3, tr_rect.h - 8), border_radius=2)

        dtxt(surf, _tab_tr(tname), 'xs', tab_text_col, tr_rect.centerx, tr_rect.centery)

    defense_defs = [
        ('normal', tr("Normal Turret"), 120, 20, 0, 'normal_turret' in unlocked_turrets, "NormalTurretDesc"),
        ('heavy', tr("High Damage Turret"), 250, 50, 0, 'heavy_turret' in unlocked_turrets, "HighDamageTurretDesc"),
        ('wall', tr("Wall"), 30, 10, 0, 'wall' in unlocked_turrets, "WallDesc")
    ]
    structure_defs = [
        ('house', tr("House"), 100, 0, 0, 'house' in unlocked_structures, "HouseDesc"),
        ('iron_mine', tr("Iron Mine"), 150, 0, 10, 'iron_mine' in unlocked_structures, "IronMineDesc"),
        ('coal_mine', tr("Coal Mine"), 150, 10, 0, 'coal_mine' in unlocked_structures, "CoalMineDesc"),
        ('park', tr("Park"), 200, 15, 15, 'park' in unlocked_structures, "ParkDesc"),
    ]

    building_defs = defense_defs if category == "Defense" else structure_defs
    building_defs = [b for b in building_defs if b[5]]

    btn_w = 120
    btn_h = 70
    items_start_x = tab_x + tab_w + 18
    gap = 16

    click_rects = []
    hovered_info = None

    for i, (btype, name, c_mon, c_irn, c_co, is_unlocked, desc_key) in enumerate(building_defs):
        bx = items_start_x + i * (btn_w + gap)
        by = bar_y + 10
        rect = pygame.Rect(bx, by, btn_w, btn_h)
        click_rects.append((rect, btype))

        hovered = rect.collidepoint(mx, my)
        if hovered:
            hovered_info = (name, c_mon, c_irn, c_co, is_unlocked, desc_key)

        can_afford = (money >= c_mon and iron >= c_irn and coal >= c_co)

        card_col = (16, 20, 32)
        border_col = (40, 42, 60)

        if not is_unlocked:
            border_col = (50, 50, 55)
        elif selected_building == btype:
            border_col = HOLO_GREEN
            card_col = (15, 35, 25)
        elif hovered:
            border_col = HOLO_BLUE if can_afford else RED_ALERT
            card_col = (22, 30, 48)
        elif can_afford:
            border_col = (30, 70, 110)

        pygame.draw.rect(surf, card_col, rect, border_radius=6)
        pygame.draw.rect(surf, border_col, rect, 1 if not hovered else 2, border_radius=6)

        text_col = WHITE if is_unlocked else (100, 102, 110)
        dtxt(surf, name, 'xs', text_col, rect.centerx, rect.y + 15)

        if not is_unlocked:
            dtxt(surf, tr("Locked"), 'xs', RED_ALERT, rect.centerx, rect.y + 45)
        else:
            costs_text = f"${c_mon}"
            if c_irn > 0:
                costs_text += f" {c_irn}I"
            if c_co > 0:
                costs_text += f" {c_co}C"
            dtxt(surf, costs_text, 'xs', GOLD if can_afford else (120, 50, 50), rect.centerx, rect.y + 45)

    if hovered_info:
        name, c_mon, c_irn, c_co, is_unlocked, desc_key = hovered_info
        tw, th = 340, 100
        tx = max(10, min(SW - tw - 10, mx - tw // 2))
        ty = bar_y - th - 10

        pygame.draw.rect(surf, DARK_GLASS, (tx, ty, tw, th), border_radius=8)
        pygame.draw.rect(surf, HOLO_BLUE, (tx, ty, tw, th), 1, border_radius=8)

        dtxt(surf, name, 's', WHITE, tx + 15, ty + 12, 'topleft')

        cost_line = f"{tr('MONEY')}: ${c_mon} | {tr('IRON')}: {c_irn} | {tr('COAL')}: {c_co}"
        dtxt(surf, cost_line, 'xs', GOLD if is_unlocked else (120, 50, 50), tx + 15, ty + 35, 'topleft')

        desc_text = tr(desc_key)
        dtxt(surf, desc_text, 'xs', (180, 185, 200), tx + 15, ty + 60, 'topleft')

    return click_rects, tab_rects

# ==========================================
# 5. DYNAMIC SELECTION OVERLAYS (upgrades / selector cards)
# ==========================================
def draw_popup_cards(surf, title, subtitle, cards_list, mx, my, tick=0):
    """Draw a list of card overlays (Upgrade Selector / Enemy Selector).
    Returns hovered card index.
    """
    dim = pygame.Surface((SW, SH), pygame.SRCALPHA)
    dim.fill((0, 0, 0, 140))
    surf.blit(dim, (0, 0))

    box_w = 840
    box_h = 440
    box_x = (SW - box_w) // 2
    box_y = (SH - box_h) // 2

    pygame.draw.rect(surf, (10, 14, 28, 240), (box_x, box_y, box_w, box_h), border_radius=12)
    pygame.draw.rect(surf, (40, 60, 100), (box_x, box_y, box_w, box_h), 2, border_radius=12)

    accent_w = box_w - 40
    accent_x = box_x + 20
    accent_y = box_y + 18
    pulse = 0.5 + 0.5 * math.sin(tick * 0.08)
    accent_col = (int(40 + pulse * 30), int(60 + pulse * 50), int(100 + pulse * 60))
    pygame.draw.rect(surf, accent_col, (accent_x, accent_y, accent_w, 3), border_radius=2)

    dtxt(surf, title, 'l', WHITE, SW//2, box_y + 40, 'center', shad=True)
    dtxt(surf, subtitle, 's', (140, 150, 180), SW//2, box_y + 72, 'center')

    card_w = 220
    card_h = 280
    gap = 30
    total_w = len(cards_list) * card_w + (len(cards_list) - 1) * gap
    start_x = (SW - total_w) // 2
    card_y = box_y + 110

    hovered_index = -1

    for idx, card in enumerate(cards_list):
        cx = start_x + idx * (card_w + gap)
        rect = pygame.Rect(cx, card_y, card_w, card_h)

        hovered = rect.collidepoint(mx, my)
        if hovered:
            hovered_index = idx

        card_col = (16, 20, 32)
        border_col = (40,60,100)

        if hovered:
            card_col = (22, 34, 56)
            border_col = HOLO_GREEN
            glow = pygame.Surface((card_w + 14, card_h + 14), pygame.SRCALPHA)
            pygame.draw.rect(glow, (0, 220, 100, 25), glow.get_rect(), border_radius=10)
            surf.blit(glow, (cx - 7, card_y - 7))
            rect_draw = pygame.Rect(cx, card_y - 4, card_w, card_h)
        else:
            rect_draw = rect

        pygame.draw.rect(surf, card_col, rect_draw, border_radius=8)
        pygame.draw.rect(surf, border_col, rect_draw, 1 if not hovered else 2, border_radius=8)

        if 'reward_money' in card:
            risk_col = RED_ALERT if card['risk'] == 'High' else HOLO_ORANGE if card['risk'] == 'Medium' else HOLO_GREEN
            icon_y = rect_draw.y + 45
            pulse_r = 22 + (2 if hovered else 0)
            pygame.draw.circle(surf, (risk_col[0]//4, risk_col[1]//4, risk_col[2]//4), (rect_draw.centerx, icon_y), pulse_r + 4)
            pygame.draw.circle(surf, risk_col, (rect_draw.centerx, icon_y), pulse_r)
            pygame.draw.circle(surf, WHITE, (rect_draw.centerx, icon_y), pulse_r, 2)
            dtxt(surf, str(card['risk'][0]), 'ml', WHITE, rect_draw.centerx, icon_y)

            dtxt(surf, card['name'], 'm', WHITE, rect_draw.centerx, rect_draw.y + 95)
            dtxt(surf, f"{tr('Risk Level:')} {tr(card['risk'])}", 'xs', (180, 185, 200), rect_draw.centerx, rect_draw.y + 122)

            comp = card.get('composition', [])
            count_a = comp.count('A')
            count_b = comp.count('B')
            count_c = comp.count('C')
            comp_str = ""
            if count_a > 0:
                comp_str += f"A:{count_a} "
            if count_b > 0:
                comp_str += f"B:{count_b} "
            if count_c > 0:
                comp_str += f"C:{count_c} "
            dtxt(surf, comp_str.strip(), 'xs', HOLO_ORANGE, rect_draw.centerx, rect_draw.y + 148)

            reward_y = rect_draw.y + 185
            dtxt(surf, tr("Reward:"), 'xs', (140, 145, 165), rect_draw.centerx, reward_y)
            reward_str = f"${card['reward_money']}"
            if card['reward_iron'] > 0:
                reward_str += f" | {card['reward_iron']}I"
            if card['reward_coal'] > 0:
                reward_str += f" | {card['reward_coal']}C"
            dtxt(surf, reward_str, 's', GOLD, rect_draw.centerx, reward_y + 22)

        else:
            cat_col = HOLO_GREEN if card['category'] == 'Policy' else HOLO_BLUE if card['category'] == 'Defense' else HOLO_ORANGE
            dtxt_bg(surf, tr(card['category']), 'xs', cat_col, rect_draw.centerx, rect_draw.y + 25, pad=5, bg=(20, 24, 38))

            title_text = tr(card['name'])
            title_font = fit_font_key(title_text, 'ml', ['m', 's'], card_w - 28)
            title_lines = wrap_text_to_width(title_text, title_font, card_w - 28, 2)
            title_y = rect_draw.y + 62 if len(title_lines) > 1 else rect_draw.y + 72
            for line in title_lines:
                dtxt(surf, line, title_font, WHITE, rect_draw.centerx, title_y)
                title_y += 23

            desc_text = tr(card['desc'])
            lines = wrap_text_to_width(desc_text, 'xs', card_w - 30, 5)

            dy_offset = 125
            for line in lines:
                dtxt(surf, line, 'xs', (180, 185, 200), rect_draw.centerx, rect_draw.y + dy_offset)
                dy_offset += 19

            btn_col = HOLO_GREEN if hovered else (40, 50, 70)
            pygame.draw.rect(surf, btn_col, (rect_draw.x + 25, rect_draw.y + card_h - 40, card_w - 50, 26), border_radius=4)
            dtxt(surf, tr("Select"), 'xs', WHITE, rect_draw.centerx, rect_draw.y + card_h - 27)

    return hovered_index