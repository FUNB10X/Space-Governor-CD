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
    
    # Try custom TTF in Asset folder
    font_path_med = os.path.join('Asset', 'Anakotmai-Medium.ttf')
    font_path_bold = os.path.join('Asset', 'Anakotmai-Bold.ttf')
    
    for key, sz in sizes.items():
        loaded = False
        # Choose bold for larger titles
        path = font_path_bold if key in ['ml', 'l', 'xl', 'xxl'] else font_path_med
        if os.path.exists(path):
            try:
                FONTS[key] = pygame.font.Font(path, sz)
                loaded = True
            except Exception:
                pass
        
        if not loaded:
            # Fallback to system fonts
            for sys_name in ['segoeui', 'tahoma', 'arial', 'helvetica', 'freesans']:
                try:
                    FONTS[key] = pygame.font.SysFont(sys_name, sz, bold=(key in ['ml', 'l', 'xl', 'xxl']))
                    loaded = True
                    break
                except Exception:
                    pass
        
        if not loaded:
            FONTS[key] = pygame.font.Font(None, sz + 2)

# Run Font initialization immediately
init_fonts()

def dtxt(surf, text, fk, col, x, y, anch='center', shad=False):
    """Draw a text string with optional shadow drop."""
    font = FONTS.get(fk)
    if not font:
        return
    
    # Process string representation
    text_str = str(text)
    
    if shad:
        # Render black shadow text offset by 2px
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
    
    # Draw background
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
        # Draw dynamic capsule button
        bg_col = (20, 24, 38)
        border_col = self.base_col
        
        if self.is_locked:
            border_col = (60, 62, 70)
            text_col = (100, 102, 110)
        elif self.hovered:
            border_col = self.hover_col
            text_col = self.hover_col
            # Hover glow effect
            glow_surf = pygame.Surface((self.rect.w + 12, self.rect.h + 12), pygame.SRCALPHA)
            pygame.draw.rect(glow_surf, (self.base_col[0], self.base_col[1], self.base_col[2], 25), glow_surf.get_rect(), border_radius=12)
            surf.blit(glow_surf, (self.rect.x - 6, self.rect.y - 6))
        else:
            text_col = self.base_col

        # Background Fill
        pygame.draw.rect(surf, bg_col, self.rect, border_radius=8)
        # Glowing border outline
        pygame.draw.rect(surf, border_col, self.rect, 2, border_radius=8)
        
        # Center text label
        dtxt(surf, self.text, self.font_key, text_col, self.rect.centerx, self.rect.centery, shad=True)

class Slider:
    def __init__(self, x, y, w, h, label, val=1.0):
        self.rect = pygame.Rect(x, y, w, h)
        self.label = label
        self.val = val  # 0.0 to 1.0
        self.knob_r = h
        self.dragging = False

    def update(self, mx, my, is_clicked):
        if is_clicked and self.rect.collidepoint(mx, my):
            self.dragging = True
            
        if not pygame.mouse.get_pressed()[0]:
            self.dragging = False

        if self.dragging:
            # Constrain drag
            self.val = max(0.0, min(1.0, (mx - self.rect.x) / self.rect.w))
            return True
        return False

    def draw(self, surf, mx, my):
        # Hover indicator
        hovered = self.rect.collidepoint(mx, my) or self.dragging
        
        # Draw track
        pygame.draw.rect(surf, (40, 42, 50), self.rect, border_radius=self.rect.h // 2)
        
        # Draw fill track
        fill_w = int(self.rect.w * self.val)
        if fill_w > 0:
            fill_col = HOLO_BLUE if hovered else (0, 100, 200)
            pygame.draw.rect(surf, fill_col, (self.rect.x, self.rect.y, fill_w, self.rect.h), border_radius=self.rect.h // 2)

        # Draw knob indicator
        kx = self.rect.x + fill_w
        ky = self.rect.y + self.rect.h // 2
        knob_col = WHITE if hovered else (200, 202, 210)
        pygame.draw.circle(surf, knob_col, (kx, ky), self.knob_r)
        
        # Render text labels
        dtxt(surf, self.label, 's', WHITE, self.rect.x, self.rect.y - 18, 'topleft')
        dtxt(surf, f"{int(self.val * 100)}%", 's', WHITE, self.rect.right + 15, ky, 'midleft')

# ==========================================
# 3. GAMEPLAY TOP HUD PANEL
# ==========================================
def draw_hud(surf, dome_hp, dome_max_hp, resources, wave, max_wave, state_msg, active_upgrade_list=None):
    # Top bar size: Height 65
    hud_rect = pygame.Rect(0, 0, SW, 65)
    
    # Glassmorphism panel draw
    bg_surf = pygame.Surface((SW, 65), pygame.SRCALPHA)
    pygame.draw.rect(bg_surf, (8, 10, 18, 240), bg_surf.get_rect())
    surf.blit(bg_surf, (0, 0))
    # Border separation line
    pygame.draw.line(surf, (30, 48, 80), (0, 64), (SW, 64), 2)
    
    # --- Dome HP (Left HUD) ---
    dtxt(surf, tr("DOME HP"), 'xs', (150, 155, 175), 15, 12, 'topleft')
    hp_ratio = max(0.0, dome_hp / dome_max_hp)
    hp_col = HOLO_GREEN if hp_ratio > 0.5 else HOLO_ORANGE if hp_ratio > 0.25 else RED_ALERT
    
    pygame.draw.rect(surf, (35, 10, 10), (15, 30, 140, 18), border_radius=4)
    pygame.draw.rect(surf, hp_col, (15, 30, int(140 * hp_ratio), 18), border_radius=4)
    pygame.draw.rect(surf, (80, 85, 95), (15, 30, 140, 18), 1, border_radius=4)
    dtxt(surf, f"{dome_hp}/{dome_max_hp}", 'xs', WHITE, 85, 39)
    
    # --- Resource displays ---
    items = [
        ("MONEY", resources['money'], GOLD, 180),
        ("IRON", resources['iron'], (200, 205, 220), 280),
        ("COAL", resources['coal'], (130, 135, 140), 380),
        ("HAPPINESS", f"{int(resources['happiness'])}%", HOLO_GREEN, 480),
        ("POPULATION", f"{resources['population']}", HOLO_BLUE, 580)
    ]
    
    for label, val, color, rx in items:
        # Separate partition lines
        pygame.draw.line(surf, (25, 36, 58), (rx - 10, 8), (rx - 10, 56))
        dtxt(surf, tr(label), 'xs', (140, 145, 165), rx, 12, 'topleft')
        dtxt(surf, str(val), 'm', color, rx, 34, 'topleft')
        
    # --- Wave indicator (Right HUD) ---
    pygame.draw.line(surf, (25, 36, 58), (690, 8), (690, 56))
    dtxt(surf, tr("WAVE"), 'xs', (140, 145, 165), 705, 12, 'topleft')
    dtxt(surf, f"{wave}", 'ml', HOLO_BLUE, 705, 32, 'topleft')
    
    # --- Mode / Message (Far Right) ---
    pygame.draw.line(surf, (25, 36, 58), (780, 8), (780, 56))
    state_col = HOLO_GREEN if "BUILD" in state_msg else HOLO_ORANGE
    dtxt(surf, tr(state_msg), 's', state_col, 800, 22, 'topleft')



# ==========================================
# 4. CONSTRUCTION BAR (Bottom Selection panel with Category Tabs)
# ==========================================
# Tab label translations
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
    
    # Background glass panel
    bg_surf = pygame.Surface((SW, bar_h), pygame.SRCALPHA)
    pygame.draw.rect(bg_surf, (8, 10, 18, 240), bg_surf.get_rect())
    surf.blit(bg_surf, (0, bar_y))
    pygame.draw.line(surf, (30, 48, 80), (0, bar_y), (SW, bar_y), 2)
    
    # --- Category Tabs (left side) ---
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
        
        # Active tab left accent bar
        if is_active:
            pygame.draw.rect(surf, HOLO_BLUE, (tr_rect.x, tr_rect.y + 4, 3, tr_rect.h - 8), border_radius=2)
        
        dtxt(surf, _tab_tr(tname), 'xs', tab_text_col, tr_rect.centerx, tr_rect.centery)

    # --- Filtered building definitions by category ---
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
    items_start_x = tab_x + tab_w + 18  # Start items after tabs
    gap = 16
    
    click_rects = []
    hovered_info = None

    for i, (btype, name, c_mon, c_irn, c_co, is_unlocked, desc_key) in enumerate(building_defs):
        bx = items_start_x + i * (btn_w + gap)
        by = bar_y + 10
        rect = pygame.Rect(bx, by, btn_w, btn_h)
        click_rects.append((rect, btype))
        
        # Check hover
        hovered = rect.collidepoint(mx, my)
        if hovered:
            hovered_info = (name, c_mon, c_irn, c_co, is_unlocked, desc_key)
            
        # Draw slot card
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
        
        # Card Text Label
        text_col = WHITE if is_unlocked else (100, 102, 110)
        dtxt(surf, name, 'xs', text_col, rect.centerx, rect.y + 15)
        
        if not is_unlocked:
            dtxt(surf, tr("Locked"), 'xs', RED_ALERT, rect.centerx, rect.y + 45)
        else:
            # Costs displays
            costs_text = f"${c_mon}"
            if c_irn > 0:
                costs_text += f" {c_irn}I"
            if c_co > 0:
                costs_text += f" {c_co}C"
            dtxt(surf, costs_text, 'xs', GOLD if can_afford else (120, 50, 50), rect.centerx, rect.y + 45)

    # Draw hovered structure descriptive tooltip above build bar
    if hovered_info:
        name, c_mon, c_irn, c_co, is_unlocked, desc_key = hovered_info
        tw, th = 340, 100
        tx = max(10, min(SW - tw - 10, mx - tw // 2))
        ty = bar_y - th - 10
        
        # Tooltip container
        pygame.draw.rect(surf, DARK_GLASS, (tx, ty, tw, th), border_radius=8)
        pygame.draw.rect(surf, HOLO_BLUE, (tx, ty, tw, th), 1, border_radius=8)
        
        dtxt(surf, name, 's', WHITE, tx + 15, ty + 12, 'topleft')
        
        # Cost block
        cost_line = f"{tr('MONEY')}: ${c_mon} | {tr('IRON')}: {c_irn} | {tr('COAL')}: {c_co}"
        dtxt(surf, cost_line, 'xs', GOLD if is_unlocked else (120, 50, 50), tx + 15, ty + 35, 'topleft')
        
        # Translation explanation
        desc_text = tr(desc_key)
        dtxt(surf, desc_text, 'xs', (180, 185, 200), tx + 15, ty + 60, 'topleft')

    return click_rects, tab_rects

# ==========================================
# 5. DYNAMIC SELECTION OVERLAYS (upgrades / selector cards)
# ==========================================
def draw_popup_cards(surf, title, subtitle, cards_list, mx, my):
    """Draw a list of card overlays (Upgrade Selector / Enemy Selector).
    Returns hovered card index.
    """
    # Dim background slightly
    dim = pygame.Surface((SW, SH), pygame.SRCALPHA)
    dim.fill((0, 0, 0, 140))
    surf.blit(dim, (0, 0))
    
    # Outer container box
    box_w = 840
    box_h = 440
    box_x = (SW - box_w) // 2
    box_y = (SH - box_h) // 2
    
    pygame.draw.rect(surf, (10, 14, 28, 240), (box_x, box_y, box_w, box_h), border_radius=12)
    pygame.draw.rect(surf, (40, 60, 100), (box_x, box_y, box_w, box_h), 2, border_radius=12)
    
    # Titles
    dtxt(surf, title, 'l', WHITE, SW//2, box_y + 35, 'center', shad=True)
    dtxt(surf, subtitle, 's', (140, 150, 180), SW//2, box_y + 68, 'center')
    
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
            
        # Draw card container
        card_col = (16, 20, 32)
        border_col = (40, 60, 100)
        
        if hovered:
            card_col = (22, 34, 56)
            border_col = HOLO_GREEN
            # Outer card glow
            glow = pygame.Surface((card_w + 12, card_h + 12), pygame.SRCALPHA)
            pygame.draw.rect(glow, (0, 220, 100, 20), glow.get_rect(), border_radius=10)
            surf.blit(glow, (cx - 6, card_y - 6))
            
        pygame.draw.rect(surf, card_col, rect, border_radius=8)
        pygame.draw.rect(surf, border_col, rect, 1 if not hovered else 2, border_radius=8)
        
        # --- Draw Card Contents ---
        if 'reward_money' in card:
            # ENEMY SELECTOR CARDS
            # Icon top
            pygame.draw.circle(surf, RED_ALERT if card['risk'] == 'High' else HOLO_ORANGE if card['risk'] == 'Medium' else HOLO_GREEN, (cx + card_w//2, card_y + 45), 22)
            dtxt(surf, str(card['risk'][0]), 'ml', WHITE, cx + card_w//2, card_y + 45)
            
            dtxt(surf, card['name'], 'm', WHITE, cx + card_w//2, card_y + 90)
            dtxt(surf, f"{tr('Risk Level:')} {tr(card['risk'])}", 'xs', (180, 185, 200), cx + card_w//2, card_y + 120)
            
            dtxt(surf, f"{tr('Waves')}: {card['waves_count']}", 's', HOLO_BLUE, cx + card_w//2, card_y + 155)
            
            # Rewards
            reward_y = card_y + 195
            dtxt(surf, tr("Reward:"), 'xs', (140, 145, 165), cx + card_w//2, reward_y)
            reward_str = f"${card['reward_money']}"
            if card['reward_iron'] > 0:
                reward_str += f" | {card['reward_iron']}I"
            if card['reward_coal'] > 0:
                reward_str += f" | {card['reward_coal']}C"
            dtxt(surf, reward_str, 's', GOLD, cx + card_w//2, reward_y + 22)
            
        else:
            # UPGRADE CARDS
            # Category label
            cat_col = HOLO_GREEN if card['category'] == 'Policy' else HOLO_BLUE if card['category'] == 'Defense' else HOLO_ORANGE
            dtxt_bg(surf, tr(card['category']), 'xs', cat_col, cx + card_w//2, card_y + 25, pad=5, bg=(20, 24, 38))
            
            # Title
            title_text = tr(card['name'])
            title_font = fit_font_key(title_text, 'ml', ['m', 's'], card_w - 28)
            title_lines = wrap_text_to_width(title_text, title_font, card_w - 28, 2)
            title_y = card_y + 62 if len(title_lines) > 1 else card_y + 72
            for line in title_lines:
                dtxt(surf, line, title_font, WHITE, cx + card_w//2, title_y)
                title_y += 23
            
            # Desc
            desc_text = tr(card['desc'])
            lines = wrap_text_to_width(desc_text, 'xs', card_w - 30, 5)

            dy_offset = 125
            for line in lines:
                dtxt(surf, line, 'xs', (180, 185, 200), cx + card_w//2, card_y + dy_offset)
                dy_offset += 19
                
            # Prompt click button inside card bottom
            btn_col = HOLO_GREEN if hovered else (40, 50, 70)
            pygame.draw.rect(surf, btn_col, (cx + 25, card_y + card_h - 40, card_w - 50, 26), border_radius=4)
            dtxt(surf, tr("Select"), 'xs', WHITE, cx + card_w//2, card_y + card_h - 27)

    return hovered_index
