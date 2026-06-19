import sys
import time
import random
import math
import pygame
from core import *
from entities import *
from ui import *

# Slider drag tracking (module-level so it persists across helper calls)
_slider_dragging = [None]  # None | 'mus' | 'sfx'

# ==========================================
# SHARED SETTINGS / PAUSE OVERLAY HELPERS
# ==========================================
def _settings_box_origin():
    return SW // 2 - 220, SH // 2 - 200

def _settings_click_rects(box_x, box_y, show_reset=True):
    slider_w = 230
    rects = {
        'lang':       pygame.Rect(box_x + 170, box_y + 88,  slider_w, 30),
        'slider_mus': pygame.Rect(box_x + 170, box_y + 148, slider_w, 22),
        'slider_sfx': pygame.Rect(box_x + 170, box_y + 208, slider_w, 22),
        'close':      pygame.Rect(box_x + 406, box_y + 12,  24, 24),
    }
    if show_reset:
        rects['reset'] = pygame.Rect(box_x + 40, box_y + 320, 360, 36)
    return rects

def _draw_vol_slider(screen, mx, track_rect, vol, label, label_x, label_y):
    """Draw a horizontal 0-100 volume slider bar with handle. label_x/label_y unused (caller draws label)."""
    # Track
    pygame.draw.rect(screen, (18, 28, 50), track_rect, border_radius=5)
    # Fill
    fill_w = max(0, int(track_rect.width * vol / 100))
    if fill_w > 0:
        fill_r = pygame.Rect(track_rect.x, track_rect.y, fill_w, track_rect.height)
        pygame.draw.rect(screen, HOLO_BLUE, fill_r, border_radius=5)
    # Border
    is_hov = track_rect.collidepoint(mx, track_rect.centery)
    pygame.draw.rect(screen, WHITE if is_hov else (60, 90, 140), track_rect, 1, border_radius=5)
    # Handle knob
    hx = track_rect.x + fill_w
    hx = max(track_rect.x + 6, min(track_rect.right - 6, hx))
    pygame.draw.circle(screen, WHITE, (hx, track_rect.centery), 9)
    pygame.draw.circle(screen, HOLO_BLUE, (hx, track_rect.centery), 9, 2)
    # Percentage label to the right of track
    dtxt(screen, f"{vol}%", 'xs', GOLD, track_rect.right + 28, track_rect.centery)

def _draw_settings_panel(screen, mx, my, show_reset=True):
    box_x, box_y = _settings_box_origin()
    box_h = 375 if show_reset else 275
    pygame.draw.rect(screen, DARK_GLASS, (box_x, box_y, 440, box_h), border_radius=12)
    pygame.draw.rect(screen, HOLO_BLUE,  (box_x, box_y, 440, box_h), 2,  border_radius=12)
    dtxt(screen, tr("Settings"), 'l', WHITE, SW // 2, box_y + 32, shad=True)

    rects = _settings_click_rects(box_x, box_y, show_reset)

    # Close [x]
    close_r = rects['close']
    cl_hov = close_r.collidepoint(mx, my)
    pygame.draw.rect(screen, RED_ALERT if cl_hov else (50, 15, 15), close_r, border_radius=4)
    dtxt(screen, "x", 'xs', WHITE, close_r.centerx, close_r.centery)

    # Language toggle
    dtxt(screen, tr("Language"), 's', WHITE, box_x + 40, box_y + 103, 'midleft')
    lang_r = rects['lang']
    lang_str = "ภาษาไทย" if LANG[0] == 'th' else "English"
    l_hov = lang_r.collidepoint(mx, my)
    pygame.draw.rect(screen, (30, 48, 80) if l_hov else (15, 22, 38), lang_r, border_radius=6)
    pygame.draw.rect(screen, HOLO_BLUE if l_hov else (40, 60, 100), lang_r, 1, border_radius=6)
    dtxt(screen, lang_str, 'xs', GOLD if l_hov else WHITE, lang_r.centerx, lang_r.centery)

    # Music volume label + slider
    mus_vol = SETTINGS.get('music_vol', 80)
    dtxt(screen, tr("Music"), 's', WHITE, box_x + 40, box_y + 159, 'midleft')
    _draw_vol_slider(screen, mx, rects['slider_mus'], mus_vol, "", box_x + 40, box_y + 159)

    # SFX volume label + slider
    sfx_vol = SETTINGS.get('sfx_vol', 80)
    dtxt(screen, tr("Sound Effects"), 's', WHITE, box_x + 40, box_y + 219, 'midleft')
    _draw_vol_slider(screen, mx, rects['slider_sfx'], sfx_vol, "", box_x + 40, box_y + 219)

    if show_reset:
        reset_r = rects['reset']
        r_hov = reset_r.collidepoint(mx, my)
        pygame.draw.rect(screen, RED_ALERT if r_hov else (60, 15, 15), reset_r, border_radius=6)
        pygame.draw.rect(screen, WHITE if r_hov else RED_ALERT, reset_r, 1 if not r_hov else 2, border_radius=6)
        dtxt(screen, tr("Reset All Data"), 's', WHITE, reset_r.centerx, reset_r.centery)

    return rects

def _update_slider_drag(mx, music_track='menu'):
    """Called every frame when settings panel is open. Handles slider dragging."""
    if _slider_dragging[0] is None:
        return
    if not pygame.mouse.get_pressed()[0]:
        _slider_dragging[0] = None
        return
    box_x, box_y = _settings_box_origin()
    rects = _settings_click_rects(box_x, box_y)
    key = f'slider_{_slider_dragging[0]}'
    r = rects.get(key)
    if r:
        rel = (mx - r.x) / r.width
        vol = int(max(0.0, min(1.0, rel)) * 100)
        if _slider_dragging[0] == 'mus':
            set_music_volume(vol)
            if SETTINGS['music']:
                play_music(music_track)
        else:
            set_sfx_volume(vol)

def _handle_settings_click(mx, my, rects, music_track='menu'):
    # Slider: start dragging on mousedown
    if rects['slider_mus'].collidepoint(mx, my):
        _slider_dragging[0] = 'mus'
        rel = (mx - rects['slider_mus'].x) / rects['slider_mus'].width
        set_music_volume(int(max(0.0, min(1.0, rel)) * 100))
        return None
    if rects['slider_sfx'].collidepoint(mx, my):
        _slider_dragging[0] = 'sfx'
        rel = (mx - rects['slider_sfx'].x) / rects['slider_sfx'].width
        set_sfx_volume(int(max(0.0, min(1.0, rel)) * 100))
        return None
    if rects['lang'].collidepoint(mx, my):
        play_sfx('click')
        LANG[0] = 'en' if LANG[0] == 'th' else 'th'
        save_profile()
        return None
    if 'reset' in rects and rects['reset'].collidepoint(mx, my):
        play_sfx('click')
        return 'reset'
    if rects['close'].collidepoint(mx, my):
        play_sfx('click')
        _slider_dragging[0] = None
        return 'closed'
    return None

def _draw_dim_overlay(screen, alpha=140):
    dim = pygame.Surface((SW, SH), pygame.SRCALPHA)
    dim.fill((0, 0, 0, alpha))
    screen.blit(dim, (0, 0))

def _pause_menu_layout():
    box_w, box_h = 360, 300
    box_x = SW // 2 - box_w // 2
    box_y = SH // 2 - box_h // 2
    btn_w, btn_h, gap = 280, 44, 16
    btn_x = SW // 2 - btn_w // 2
    return {
        'box': (box_x, box_y, box_w, box_h),
        'resume': pygame.Rect(btn_x, box_y + 80, btn_w, btn_h),
        'settings': pygame.Rect(btn_x, box_y + 80 + btn_h + gap, btn_w, btn_h),
        'menu': pygame.Rect(btn_x, box_y + 80 + (btn_h + gap) * 2, btn_w, btn_h),
    }

def _draw_pause_menu(screen, mx, my):
    rects = _pause_menu_layout()
    box_x, box_y, box_w, box_h = rects['box']
    pygame.draw.rect(screen, DARK_GLASS, (box_x, box_y, box_w, box_h), border_radius=12)
    pygame.draw.rect(screen, HOLO_BLUE, (box_x, box_y, box_w, box_h), 2, border_radius=12)
    dtxt(screen, tr("Pause"), 'l', WHITE, SW // 2, box_y + 36, shad=True)

    for rect, label, base_col in [
        (rects['resume'], tr("Resume Game"), HOLO_GREEN),
        (rects['settings'], tr("Settings"), HOLO_BLUE),
        (rects['menu'], tr("Back to Menu"), RED_ALERT),
    ]:
        hov = rect.collidepoint(mx, my)
        bg = base_col if hov else tuple(max(10, c // 4) for c in base_col)
        border = WHITE if hov else base_col
        pygame.draw.rect(screen, bg, rect, border_radius=8)
        pygame.draw.rect(screen, border, rect, 2 if hov else 1, border_radius=8)
        dtxt(screen, label, 'm', WHITE, rect.centerx, rect.centery)

    return rects

# ==========================================
# 1. SCENE: MAIN MENU
# ==========================================
def menu(screen, clock):
    load_profile()
    play_music('menu')
    
    has_account = bool(SETTINGS.get('governor_name', '').strip())
    start_label = tr("Start Playing") if has_account else tr("Start New Game")

    # Animated background stars
    stars = [(random.randint(0, SW), random.randint(0, SH), random.uniform(0.5, 2.0)) for _ in range(120)]
    shooting_stars = []

    # UI Buttons
    btn_w, btn_h = 240, 50
    start_btn = Button(SW//2 - btn_w//2, SH//2 + 20, btn_w, btn_h, start_label, 'm', HOLO_BLUE, WHITE)
    exit_btn = Button(SW//2 - btn_w//2, SH//2 + 90, btn_w, btn_h, tr("Exit"), 'm', RED_ALERT, WHITE)

    tick = 0
    settings_open = False
    menu_sett_btn = pygame.Rect(SW - 155, 14, 135, 38)

    while True:
        mx, my = pygame.mouse.get_pos()
        click = False

        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                click = True
                if settings_open:
                    rects = _settings_click_rects(*_settings_box_origin())
                    action = _handle_settings_click(mx, my, rects, music_track='menu')
                    if action == 'closed':
                        settings_open = False
                elif menu_sett_btn.collidepoint(mx, my):
                    play_sfx('click')
                    settings_open = True
                else:
                    if start_btn.hovered:
                        play_sfx('click')
                        prof = load_profile()
                        if prof and prof.get('governor_name', ''):
                            hub(screen, clock)
                        else:
                            profile(screen, clock)
                        return
                    if exit_btn.hovered:
                        play_sfx('click')
                        pygame.quit()
                        sys.exit()
            if ev.type == pygame.MOUSEBUTTONUP and ev.button == 1:
                _slider_dragging[0] = None

        tick += 1

        # --- Update ---
        if settings_open:
            _update_slider_drag(mx, music_track='menu')
        start_btn.update(mx, my)
        exit_btn.update(mx, my)

        # Space animation
        if random.random() < 0.02:
            shooting_stars.append({
                'x': float(random.randint(0, SW - 100)),
                'y': float(random.randint(0, SH // 2)),
                'vx': random.uniform(4, 8),
                'vy': random.uniform(2, 4),
                'life': 30
            })

        for s in shooting_stars[:]:
            s['x'] += s['vx']
            s['y'] += s['vy']
            s['life'] -= 1
            if s['life'] <= 0:
                shooting_stars.remove(s)

        # --- Draw ---
        for y in range(SH):
            ratio = y / SH
            c = (int(15 + ratio * 20), int(10 + ratio * 8), int(8 + ratio * 6))
            pygame.draw.line(screen, c, (0, y), (SW, y))

        for sx, sy, spd in stars:
            tw = 0.5 + 0.5 * math.sin(tick * 0.05 * spd)
            col = int(140 + tw * 115)
            pygame.draw.circle(screen, (col, col, col), (int(sx), int(sy)), 1)

        for s in shooting_stars:
            pygame.draw.line(screen, (220, 220, 255),
                             (int(s['x']), int(s['y'])),
                             (int(s['x'] - s['vx']*3), int(s['y'] - s['vy']*3)), 2)

        dtxt(screen, "ผู้ว่าอวกาศ 2067", 'xxl', MARS_RUST, SW//2, SH//2 - 150, 'center', shad=True)
        dtxt(screen, "SPACE GOVERNOR CD.", 'ml', HOLO_BLUE, SW//2, SH//2 - 70, 'center', shad=True)

        start_btn.draw(screen)
        exit_btn.draw(screen)

        # Settings button (top-right corner)
        sb_hov = menu_sett_btn.collidepoint(mx, my)
        pygame.draw.rect(screen, (20, 30, 58) if not sb_hov else (30, 50, 90), menu_sett_btn, border_radius=8)
        pygame.draw.rect(screen, HOLO_BLUE if not sb_hov else WHITE, menu_sett_btn, 1 if not sb_hov else 2, border_radius=8)
        dtxt(screen, "⚙ " + tr("Settings"), 's', WHITE if not sb_hov else GOLD, menu_sett_btn.centerx, menu_sett_btn.centery)

        if settings_open:
            _draw_dim_overlay(screen)
            _draw_settings_panel(screen, mx, my, show_reset=False)

        pygame.display.flip()
        clock.tick(FPS)

# ==========================================
# 2. SCENE: GOVERNOR PROFILE CREATION
# ==========================================
def profile(screen, clock):
    name_text = ""
    error_msg = ""
    
    btn_w, btn_h = 180, 44
    confirm_btn = Button(SW//2 - btn_w//2, SH//2 + 50, btn_w, btn_h, tr("Confirm"), 'm', HOLO_BLUE, WHITE)
    
    while True:
        mx, my = pygame.mouse.get_pos()
        click = False
        
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if ev.type == pygame.KEYDOWN:
                if ev.key == pygame.K_BACKSPACE:
                    name_text = name_text[:-1]
                elif ev.key == pygame.K_RETURN:
                    click = True
            if ev.type == pygame.TEXTINPUT:
                # TEXTINPUT handles Thai / Unicode characters properly
                if len(name_text) < 14:
                    name_text += ev.text
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                click = True
                
        confirm_btn.update(mx, my)

        # Handle Submit
        if click:
            if confirm_btn.hovered or (pygame.key.get_pressed()[pygame.K_RETURN]):
                play_sfx('click')
                cleaned = name_text.strip()
                if cleaned:
                    # Save profile config
                    SETTINGS['governor_name'] = cleaned
                    save_profile()
                    hub(screen, clock)
                    return
                else:
                    error_msg = tr("Name cannot be empty!")

        # --- Draw ---
        screen.fill(MARS_BG)
        # Cyber grids
        for gx in range(0, SW, 40):
            pygame.draw.line(screen, (30, 20, 15), (gx, 0), (gx, SH))
        for gy in range(0, SH, 40):
            pygame.draw.line(screen, (30, 20, 15), (0, gy), (SW, gy))

        # Profile Card dialog
        box_w, box_h = 460, 260
        pygame.draw.rect(screen, DARK_GLASS, (SW//2 - box_w//2, SH//2 - box_h//2, box_w, box_h), border_radius=12)
        pygame.draw.rect(screen, HOLO_BLUE, (SW//2 - box_w//2, SH//2 - box_h//2, box_w, box_h), 2, border_radius=12)
        
        dtxt(screen, tr("Enter Governor Name"), 'l', WHITE, SW//2, SH//2 - 80, shad=True)
        
        # Textbox box
        tbox_w, tbox_h = 320, 40
        tbox_rect = pygame.Rect(SW//2 - tbox_w//2, SH//2 - 20, tbox_w, tbox_h)
        pygame.draw.rect(screen, (15, 18, 30), tbox_rect, border_radius=6)
        pygame.draw.rect(screen, HOLO_BLUE if len(name_text) > 0 else (60, 65, 80), tbox_rect, 2, border_radius=6)
        
        # Typed text
        cursor = "|" if (time.time() * 2) % 2 > 1.0 else ""
        dtxt(screen, name_text + cursor, 'm', GOLD, SW//2, SH//2, 'center')
        
        # Error display
        if error_msg:
            dtxt(screen, error_msg, 's', RED_ALERT, SW//2, SH//2 + 30)

        confirm_btn.draw(screen)
        pygame.display.flip()
        clock.tick(FPS)

# ==========================================
# 3. SCENE: HUB MENU (STATISTICS & SLOTS)
# ==========================================
def hub(screen, clock):
    prof_data = load_profile() or {}
    play_music('menu')
    gov_name = prof_data.get('governor_name', 'Governor')
    high_wave = prof_data.get('highest_wave', 0)
    tot_time = prof_data.get('total_play_time', 0.0)
    last_city = prof_data.get('last_played_city', '-')
    created_cnt = prof_data.get('cities_created', 0)

    # Greeting choice (static randomized once on enter)
    greetings = [
        tr("Welcome back, Governor."),
        tr("The citizens await your leadership."),
        tr("Ready to defend the city again?")
    ]
    g_text = random.choice(greetings)

    # Settings Overlay toggle
    settings_open = False
    
    # Text dialog inputs for slot creation
    dialog_open = False
    dialog_slot = -1
    dialog_text = ""
    dialog_error = ""

    # Generate slot continue/create button layout
    slot_w, slot_h = 440, 110
    start_y = 180
    gap = 25
    
    slots_rects = []
    delete_rects = []
    
    for i in range(1, 4):
        sy = start_y + (i - 1) * (slot_h + gap)
        # Main slot button
        slots_rects.append((pygame.Rect(SW//2 + 40, sy, slot_w, slot_h), i))
        # Small delete button right of it
        delete_rects.append((pygame.Rect(SW//2 + 40 + slot_w + 12, sy + slot_h//2 - 20, 40, 40), i))

    while True:
        mx, my = pygame.mouse.get_pos()
        click = False
        
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                click = True
            if ev.type == pygame.MOUSEBUTTONUP and ev.button == 1:
                _slider_dragging[0] = None
            if dialog_open and ev.type == pygame.KEYDOWN:
                if ev.key == pygame.K_BACKSPACE:
                    dialog_text = dialog_text[:-1]
                elif ev.key == pygame.K_RETURN:
                    # Confirm input
                    cleaned = dialog_text.strip()
                    if cleaned:
                        # Create new city
                        new_city_data = {
                            "city_name": cleaned,
                            "exists": True,
                            "current_wave": 1,
                            "money": 500,
                            "iron": 100,
                            "coal": 50,
                            "dome_hp": 1000,
                            "dome_max_hp": 1000,
                            "structures": [
                                {"type": "iron_mine", "x": 820.0, "y": 200.0},
                                {"type": "coal_mine", "x": 820.0, "y": 360.0},
                                {"type": "house", "x": 820.0, "y": 520.0}
                            ],
                            "turrets": [],
                            "walls": [],
                            "play_time": 0.0,
                            "unlocked_structures": ["house", "iron_mine", "coal_mine"],
                            "unlocked_turrets": ["normal_turret", "wall"],
                            "happiness": 50,
                            "happiness_bonus": 0.0
                        }

                        save_city(dialog_slot, new_city_data)
                        
                        # Increment cities created
                        prof_data = load_profile() or {}
                        save_profile({'cities_created': prof_data.get('cities_created', 0) + 1})
                        
                        dialog_open = False
                        game(screen, clock, dialog_slot)
                        return
                    else:
                        dialog_error = tr("Name cannot be empty!")
            if dialog_open and ev.type == pygame.TEXTINPUT:
                # TEXTINPUT handles Thai / Unicode characters properly
                if len(dialog_text) < 14:
                    dialog_text += ev.text

        # --- Update Calculations ---
        # Settings Button (Top Right)
        sett_btn_rect = pygame.Rect(SW - 160, 20, 140, 36)
        sett_hov = sett_btn_rect.collidepoint(mx, my)

        # Slider drag update (runs every frame when settings open)
        if settings_open:
            _update_slider_drag(mx, music_track='menu')

        # --- Handle Clicks ---
        if click:
            if dialog_open:
                # Dialog confirm/cancel bounds
                box_x = SW//2 - 200
                box_y = SH//2 - 100
                ok_r = pygame.Rect(box_x + 50, box_y + 130, 120, 36)
                cn_r = pygame.Rect(box_x + 230, box_y + 130, 120, 36)
                if ok_r.collidepoint(mx, my):
                    play_sfx('click')
                    cleaned = dialog_text.strip()
                    if cleaned:
                        new_city_data = {
                            "city_name": cleaned,
                            "exists": True,
                            "current_wave": 1,
                            "money": 500,
                            "iron": 100,
                            "coal": 50,
                            "dome_hp": 1000,
                            "dome_max_hp": 1000,
                            "structures": [
                                {"type": "iron_mine", "x": 820.0, "y": 200.0},
                                {"type": "coal_mine", "x": 820.0, "y": 360.0},
                                {"type": "house", "x": 820.0, "y": 520.0}
                            ],
                            "turrets": [],
                            "walls": [],
                            "play_time": 0.0,
                            "unlocked_structures": ["house", "iron_mine", "coal_mine"],
                            "unlocked_turrets": ["normal_turret", "wall"],
                            "happiness": 50,
                            "happiness_bonus": 0.0
                        }
                        save_city(dialog_slot, new_city_data)
                        
                        prof_data = load_profile() or {}
                        save_profile({'cities_created': prof_data.get('cities_created', 0) + 1})
                        
                        dialog_open = False
                        game(screen, clock, dialog_slot)
                        return
                    else:
                        dialog_error = tr("Name cannot be empty!")
                elif cn_r.collidepoint(mx, my):
                    play_sfx('click')
                    dialog_open = False
            elif settings_open:
                rects = _settings_click_rects(*_settings_box_origin())
                action = _handle_settings_click(mx, my, rects, music_track='menu')
                if action == 'reset':
                    _slider_dragging[0] = None
                    reset_all_data()
                    menu(screen, clock)
                    return
                if action == 'closed':
                    _slider_dragging[0] = None
                    settings_open = False
            else:
                # General Hub buttons
                if sett_hov:
                    play_sfx('click')
                    settings_open = True
                else:
                    # Slot continue/create logic
                    for r, slot in slots_rects:
                        if r.collidepoint(mx, my):
                            play_sfx('click')
                            save = load_city(slot)
                            if save and save.get('exists', False):
                                # Load existing Endless mode
                                game(screen, clock, slot)
                                return
                            else:
                                # Open name entry dialog
                                dialog_slot = slot
                                dialog_text = f"Colony {chr(64 + slot)}"
                                dialog_error = ""
                                dialog_open = True
                                
                    # Slot delete logic
                    for r, slot in delete_rects:
                        save = load_city(slot)
                        if save and save.get('exists', False):
                            if r.collidepoint(mx, my):
                                play_sfx('click')
                                delete_city(slot)
                                # Refresh stats counters
                                prof_data = load_profile() or {}
                                high_wave = prof_data.get('highest_wave', 0)
                                tot_time = prof_data.get('total_play_time', 0.0)
                                last_city = prof_data.get('last_played_city', '-')
                                created_cnt = prof_data.get('cities_created', 0)

        # --- Draw ---
        screen.fill(MARS_BG)
        # Star field drift
        for gx in range(0, SW, 60):
            pygame.draw.line(screen, MARS_GRID, (gx, 0), (gx, SH))
        for gy in range(0, SH, 60):
            pygame.draw.line(screen, MARS_GRID, (0, gy), (SW, gy))

        # Title Hub
        dtxt(screen, tr("Space Governor CD."), 'l', HOLO_BLUE, 40, 20, 'topleft', shad=True)
        dtxt(screen, f"{tr('Welcome back, Governor.')} {gov_name}", 'm', WHITE, 40, 56, 'topleft')
        
        # --- LEFT PANEL (Stats) ---
        lw, lh = 420, 460
        lx, ly = 40, 180
        pygame.draw.rect(screen, DARK_GLASS, (lx, ly, lw, lh), border_radius=10)
        pygame.draw.rect(screen, (30, 48, 80), (lx, ly, lw, lh), 1, border_radius=10)
        
        # Random greeting
        dtxt(screen, f"\"{g_text}\"", 's', GOLD, lx + 20, ly + 25, 'topleft')
        pygame.draw.line(screen, (30, 48, 80), (lx + 20, ly + 60), (lx + lw - 20, ly + 60))
        
        # Statistics
        stat_y = ly + 80
        stats_list = [
            (tr("Highest Wave Reached"), high_wave),
            (tr("Total Play Time"), f"{int(tot_time // 3600):02d}:{int((tot_time % 3600) // 60):02d}:{int(tot_time % 60):02d}"),
            (tr("Last Played City"), last_city),
            (tr("Number of Cities Created"), created_cnt)
        ]
        
        for lbl, val in stats_list:
            dtxt(screen, lbl, 's', (160, 165, 185), lx + 20, stat_y, 'topleft')
            dtxt(screen, str(val), 'm', HOLO_BLUE, lx + lw - 20, stat_y, 'topright')
            stat_y += 70

        # --- RIGHT PANEL (Slots) ---
        for r, slot in slots_rects:
            save = load_city(slot)
            hov = r.collidepoint(mx, my)
            
            # Card styling
            card_col = (16, 20, 32)
            border_col = (40, 60, 100)
            
            if hov:
                card_col = (24, 32, 54)
                border_col = HOLO_GREEN
                
            pygame.draw.rect(screen, card_col, r, border_radius=8)
            pygame.draw.rect(screen, border_col, r, 1 if not hov else 2, border_radius=8)
            
            # Left vertical marker
            pygame.draw.rect(screen, HOLO_BLUE if save else (60, 65, 75), (r.x, r.y, 8, r.h), border_radius=8)

            dtxt(screen, f"{tr('City #')}{slot}", 'ml', GOLD, r.x + 24, r.y + 16, 'topleft')
            
            if save and save.get('exists', False):
                # Saved slot text details
                c_name = save['city_name']
                w_reached = save['current_wave']
                money = save['money']
                dtxt(screen, c_name, 'm', WHITE, r.x + 24, r.y + 45, 'topleft')
                dtxt(screen, f"{tr('WAVE')}: {w_reached} | ${money}", 'xs', (185, 190, 200), r.x + 24, r.y + 75, 'topleft')
                
                # Active Delete button
                dr = delete_rects[slot - 1][0]
                dhov = dr.collidepoint(mx, my)
                pygame.draw.rect(screen, RED_ALERT if dhov else (80, 20, 20), dr, border_radius=6)
                pygame.draw.rect(screen, WHITE if dhov else RED_ALERT, dr, 1, border_radius=6)
                dtxt(screen, "X", 's', WHITE, dr.centerx, dr.centery)
            else:
                dtxt(screen, tr("Empty Slot"), 'm', (100, 105, 115), r.x + 24, r.y + 45, 'topleft')

        # Top settings button draw
        sett_col = HOLO_BLUE if not sett_hov else WHITE
        pygame.draw.rect(screen, (15, 20, 38), sett_btn_rect, border_radius=6)
        pygame.draw.rect(screen, sett_col, sett_btn_rect, 1, border_radius=6)
        dtxt(screen, tr("Settings"), 's', sett_col, sett_btn_rect.centerx, sett_btn_rect.centery)

        # --- Dialog overlays input ---
        if dialog_open:
            dim = pygame.Surface((SW, SH), pygame.SRCALPHA)
            dim.fill((0, 0, 0, 140))
            screen.blit(dim, (0, 0))
            
            box_x = SW//2 - 200
            box_y = SH//2 - 100
            pygame.draw.rect(screen, DARK_GLASS, (box_x, box_y, 400, 200), border_radius=10)
            pygame.draw.rect(screen, HOLO_BLUE, (box_x, box_y, 400, 200), 2, border_radius=10)
            
            dtxt(screen, tr("Enter City Name"), 'ml', WHITE, SW//2, box_y + 25)
            
            # Textbox
            pygame.draw.rect(screen, (15, 18, 30), (box_x + 50, box_y + 60, 300, 36), border_radius=5)
            pygame.draw.rect(screen, HOLO_BLUE, (box_x + 50, box_y + 60, 300, 36), 1, border_radius=5)
            
            cursor = "|" if (time.time() * 2) % 2 > 1.0 else ""
            dtxt(screen, dialog_text + cursor, 'm', GOLD, SW//2, box_y + 78)
            
            if dialog_error:
                dtxt(screen, dialog_error, 'xs', RED_ALERT, SW//2, box_y + 110)
                
            # OK / Cancel Buttons
            ok_r = pygame.Rect(box_x + 50, box_y + 130, 120, 36)
            cn_r = pygame.Rect(box_x + 230, box_y + 130, 120, 36)
            
            o_hov = ok_r.collidepoint(mx, my)
            c_hov = cn_r.collidepoint(mx, my)
            
            pygame.draw.rect(screen, HOLO_GREEN if o_hov else (10, 50, 25), ok_r, border_radius=6)
            pygame.draw.rect(screen, HOLO_GREEN if o_hov else (20, 120, 60), ok_r, 1, border_radius=6)
            dtxt(screen, tr("Confirm"), 'xs', WHITE, ok_r.centerx, ok_r.centery)
            
            pygame.draw.rect(screen, RED_ALERT if c_hov else (50, 15, 15), cn_r, border_radius=6)
            pygame.draw.rect(screen, RED_ALERT if c_hov else (160, 30, 30), cn_r, 1, border_radius=6)
            dtxt(screen, tr("Back"), 'xs', WHITE, cn_r.centerx, cn_r.centery)

        elif settings_open:
            _draw_dim_overlay(screen)
            _draw_settings_panel(screen, mx, my, show_reset=True)

        pygame.display.flip()
        clock.tick(FPS)

# ==========================================
# 4. SCENE: GAMEPLAY (ENDLESS PLAY & COMBAT)
# ==========================================
class Dome:
    def __init__(self):
        self.x = float(DOME_X)
        self.y = float(DOME_Y)
        self.radius = float(DOME_RADIUS)
        self.hp = 1000
        self.max_hp = 1000
        
    def draw(self, surf, cam_x, cam_y, tick):
        screen_x = int(self.x - cam_x)
        screen_y = int(self.y - cam_y)
        hp_ratio = self.hp / self.max_hp
        glow_alpha = int(25 + math.sin(tick * 0.1) * 8)
        
        if hp_ratio > 0.35:
            fill_col = (0, 195, 255, glow_alpha)
            rim_col  = (0, 195, 255, 130)
        else:
            fill_col = (255, 40, 40, glow_alpha + 12)
            rim_col  = (255, 40, 40, 170)

        dome_x = int(CITY_ZONE_X - cam_x)
        dome_w = int(MW - CITY_ZONE_X)
        dome_surf = pygame.Surface((dome_w, MH), pygame.SRCALPHA)
        dome_rect = dome_surf.get_rect()
        pygame.draw.rect(dome_surf, fill_col, dome_rect)
        pygame.draw.rect(dome_surf, rim_col, dome_rect, 3)
        surf.blit(dome_surf, (dome_x, -int(cam_y)))
        
        # Central city core pad: four square reactor blocks.
        core_size = 84
        core_rect = pygame.Rect(0, 0, core_size, core_size)
        core_rect.center = (screen_x, screen_y)
        pygame.draw.rect(surf, (24, 28, 42), core_rect, border_radius=6)
        pygame.draw.rect(surf, (0, 195, 255), core_rect, 2, border_radius=6)

        tile_gap = 6
        tile_size = (core_size - tile_gap * 3) // 2
        tile_cols = [(38, 46, 68), (45, 56, 82), (45, 56, 82), (38, 46, 68)]
        for idx in range(4):
            tx = core_rect.x + tile_gap + (idx % 2) * (tile_size + tile_gap)
            ty = core_rect.y + tile_gap + (idx // 2) * (tile_size + tile_gap)
            tile_rect = pygame.Rect(tx, ty, tile_size, tile_size)
            pygame.draw.rect(surf, tile_cols[idx], tile_rect, border_radius=3)
            pygame.draw.rect(surf, (0, 195, 255), tile_rect, 1, border_radius=3)

        pygame.draw.line(surf, (0, 195, 255), (screen_x, core_rect.y + 8), (screen_x, core_rect.bottom - 8), 1)
        pygame.draw.line(surf, (0, 195, 255), (core_rect.x + 8, screen_y), (core_rect.right - 8, screen_y), 1)
        dtxt(surf, "CORE", 'xs', WHITE, screen_x, screen_y)

def build_static_map():
    """Generates horizontal left-right lane map: enemy base left, city right."""
    surf = pygame.Surface((MW, MH))
    surf.fill(MARS_BG)
    
    # Background planetary grid (fine)
    for gx in range(0, MW, 80):
        pygame.draw.line(surf, MARS_GRID, (gx, 0), (gx, MH))
    for gy in range(0, MH, 80):
        pygame.draw.line(surf, MARS_GRID, (0, gy), (MW, gy))

    # --- Lane Path (center corridor) ---
    lane_top = LANE_Y - LANE_W
    lane_bot = LANE_Y + LANE_W
    # Lane fill
    pygame.draw.rect(surf, (28, 16, 12), (0, lane_top, MW, LANE_W * 2))
    # Lane border lines
    pygame.draw.line(surf, (80, 45, 30), (0, lane_top), (MW, lane_top), 3)
    pygame.draw.line(surf, (80, 45, 30), (0, lane_bot), (MW, lane_bot), 3)
    # Dashed center line
    for dx in range(0, MW, 60):
        pygame.draw.line(surf, (60, 38, 25), (dx, LANE_Y), (dx + 30, LANE_Y), 2)

    # --- Enemy Base (far left) ---
    ex = ENEMY_BASE_X
    ey = LANE_Y
    # Base platform
    pygame.draw.rect(surf, (55, 15, 15), (ex - 80, ey - 100, 160, 200), border_radius=8)
    pygame.draw.rect(surf, (180, 30, 30), (ex - 80, ey - 100, 160, 200), 3, border_radius=8)
    # Threat spikes top
    for i in range(-2, 3):
        sx = ex + i * 28
        pygame.draw.polygon(surf, (200, 40, 40), [(sx, ey - 110), (sx - 8, ey - 85), (sx + 8, ey - 85)])
    # Core glow
    pygame.draw.circle(surf, (120, 20, 20), (ex, ey), 35)
    pygame.draw.circle(surf, (220, 50, 50), (ex, ey), 22)
    pygame.draw.circle(surf, (255, 100, 80), (ex, ey), 10)

    # Warning stripes at base border
    for i in range(5):
        stripe_y = ey - 80 + i * 32
        pygame.draw.rect(surf, (200, 60, 0) if i % 2 == 0 else (60, 10, 10), (ex + 85, stripe_y, 20, 28))
        pygame.draw.rect(surf, (200, 60, 0) if i % 2 == 0 else (60, 10, 10), (ex - 105, stripe_y, 20, 28))

    # --- Terrain craters (outside lane area) ---
    random.seed(777)
    for _ in range(22):
        cx = random.randint(80, MW - 80)
        cy_top = random.randint(20, lane_top - 30)
        cr = random.randint(18, 55)
        pygame.draw.ellipse(surf, (24, 12, 10), (cx - cr, cy_top - cr // 2, cr * 2, cr))
        pygame.draw.ellipse(surf, (50, 25, 18), (cx - cr, cy_top - cr // 2, cr * 2, cr), 2)
        # Bottom side craters
        cy_bot = random.randint(lane_bot + 30, MH - 20)
        pygame.draw.ellipse(surf, (24, 12, 10), (cx - cr, cy_bot - cr // 2, cr * 2, cr))
        pygame.draw.ellipse(surf, (50, 25, 18), (cx - cr, cy_bot - cr // 2, cr * 2, cr), 2)

    # --- City ground (right side inside dome zone) ---
    city_left = CITY_ZONE_X
    pygame.draw.rect(surf, (22, 24, 38), (city_left, 0, MW - city_left, MH))
    pygame.draw.line(surf, (40, 60, 100), (city_left, 0), (city_left, MH), 3)

        # City road grid
    for gx in range(city_left, MW, 60):
        pygame.draw.line(surf, (30, 36, 55), (gx, 0), (gx, MH))
    for gy in range(0, MH, 60):
        pygame.draw.line(surf, (30, 36, 55), (city_left, gy), (MW, gy))

    return surf

def get_placement_zone(selected_building, world_x, world_y, dome):
    on_lane = abs(world_y - LANE_Y) <= LANE_W
    on_lane_x_range = WALL_ZONE_X_MIN <= world_x <= WALL_ZONE_X_MAX
    in_city_dome = (
        CITY_ZONE_X + 15 <= world_x <= MW - 15
        and 15 <= world_y <= MH - 15
    )

    if selected_building == 'wall':
        return on_lane and on_lane_x_range
    if selected_building in ['normal', 'heavy']:
        in_outer_dome_rect = (
            CITY_ZONE_X - 10 <= world_x <= MW + 10
            and -10 <= world_y <= MH + 10
        )
        return (not on_lane) and not in_outer_dome_rect
    return in_city_dome

# Upgrades card selection data pool
UPGRADE_POOL = [
    {"name": "Tax Reform", "category": "Policy", "desc": "Policy: Money generation +25%"},
    {"name": "Defensive Plating", "category": "Policy", "desc": "Policy: Dome Max HP +250, heal 250"},
    {"name": "Citizen Motivation", "category": "Policy", "desc": "Policy: Global happiness +20"},
    {"name": "Deep Core Drill", "category": "Policy", "desc": "Policy: Mine production +30%"},
    {"name": "Carbon Steel Walls", "category": "Defense", "desc": "Defense Upgrade: Wall HP +50%"},
    {"name": "Military Subsidy", "category": "Defense", "desc": "Turrets purchase cost -20%"},
    {"name": "Fast Recharger", "category": "Defense", "desc": "Normal Turret attack rate +30%"},
    {"name": "Laser Overcharge", "category": "Defense", "desc": "High Damage Turret damage +25%"},
    {"name": "Unlock Park", "category": "Unlock", "desc": "Structure Unlock: Build Parks"},
    {"name": "Unlock High Damage Turret", "category": "Unlock", "desc": "Turret Unlock: Build Heavy Lasers"}
]

def game(screen, clock, slot_id):
    load_profile()
    play_music('game')

    MAP_SURF = build_static_map()
    
    # Load slot game state
    city_data = load_city(slot_id)
    if not city_data:
        return
        
    # --- Local Variables ---
    money = city_data['money']
    iron = city_data['iron']
    coal = city_data['coal']
    happiness = float(city_data['happiness'])
    population = 0
    wave = city_data['current_wave']
    play_time = city_data['play_time']
    happiness_bonus = float(city_data.get('happiness_bonus', 0.0))
    passive_resource_timer = 0.0
    combat_break_timer = 0.0

    
    unlocked_structures = set(city_data.get('unlocked_structures', ["house", "iron_mine", "coal_mine"]))
    unlocked_turrets = set(city_data.get('unlocked_turrets', ["normal_turret", "wall"]))
    unlocked_upgrades = set(city_data.get('unlocked_upgrades', []))
    
    # Entities sets
    dome = Dome()
    dome.hp = city_data['dome_hp']
    dome.max_hp = city_data.get('dome_max_hp', 1000)
    
    structures = []
    for s in city_data.get('structures', []):
        structures.append(Structure(s['type'], s['x'], s['y']))
        
    turrets = []
    for t in city_data.get('turrets', []):
        turrets.append(Turret(t['type'], t['x'], t['y']))
        
    walls = []
    for w in city_data.get('walls', []):
        structures.append(Structure('wall', w['x'], w['y']))

    enemies = []
    projectiles = []
    particles = []
    floating_texts = []

    # Compact map fits in the window; keep camera locked.
    cam_x = 0.0
    cam_y = 0.0  # Map height = SH, no vertical scroll needed
    dragging = False
    last_drag_pos = (0, 0)
    
    # Selected building from build bar
    selected_building = None
    
    # Placed building detail panel overlay state
    selected_placed_entity = None
    
    # Gameplay Loop phase state
    # Phase: "BUILD", "SELECTOR", "COMBAT", "UPGRADE"
    game_phase = "BUILD"
    bar_h = 90
    build_bar_category = "Defense"  # "Defense" or "Structure" tab
    
    # Enemy selector card collections
    enemy_options = []
    upgrade_options = []
    active_enemy_collection = None
    combat_waves_total = 0
    combat_waves_current = 0
    combat_spawn_queue = []
    combat_spawn_timer = 0.0
    collection_rewards = None
    
    # Timer tracking for total playtime
    last_frame_time = time.time()
    
    autosave_alert_timer = 0.0

    pause_open = False
    pause_submenu = None
    pause_btn_rect = pygame.Rect(SW - 125, 12, 50, 42)

    def persist_city():
        city_data['money'] = money
        city_data['iron'] = iron
        city_data['coal'] = coal
        city_data['happiness'] = happiness
        city_data['happiness_bonus'] = happiness_bonus
        city_data['current_wave'] = wave
        city_data['dome_hp'] = dome.hp
        city_data['dome_max_hp'] = dome.max_hp
        city_data['play_time'] = play_time
        city_data['structures'] = [{'type': s.stype, 'x': s.x, 'y': s.y} for s in structures if s.stype != 'wall']

        city_data['walls'] = [{'x': s.x, 'y': s.y} for s in structures if s.stype == 'wall']
        city_data['turrets'] = [{'type': t.ttype, 'x': t.x, 'y': t.y} for t in turrets]
        city_data['unlocked_structures'] = list(unlocked_structures)
        city_data['unlocked_turrets'] = list(unlocked_turrets)
        city_data['unlocked_upgrades'] = list(unlocked_upgrades)
        save_city(slot_id, city_data)

    tick = 0

    while True:
        dt = clock.tick(FPS) / 1000.0
        dt = min(dt, 0.05)  # Constrain lag spikes
        
        tick += 1
        
        if not pause_open:
            play_time += dt
        
        # Auto-diminish save flash text
        if autosave_alert_timer > 0:
            autosave_alert_timer -= dt

        # Global population updates based on Houses built
        houses_count = sum(1 for s in structures if s.stype == 'house')
        population = houses_count * 10

        # Global happiness updates: Park bonus offsets population drag + happiness_bonus
        parks_count = sum(1 for s in structures if s.stype == 'park')
        base_happy = 50.0 + (parks_count * 15.0) + happiness_bonus
        pop_penalty = (population // 10) * 1.5
        happiness = max(5.0, min(100.0, base_happy - pop_penalty))


        # Check upgrade policies applied
        upgrade_cost_mult = 0.8 if "Military Subsidy" in unlocked_upgrades else 1.0
        wall_hp_mult = 1.5 if "Carbon Steel Walls" in unlocked_upgrades else 1.0
        normal_rate_mult = 0.7 if "Fast Recharger" in unlocked_upgrades else 1.0  # smaller rate = faster shots
        heavy_dmg_mult = 1.25 if "Laser Overcharge" in unlocked_upgrades else 1.0

        mx, my = pygame.mouse.get_pos()
        click = False
        
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                persist_city()
                pygame.quit()
                sys.exit()
                
            if ev.type == pygame.MOUSEBUTTONDOWN:
                if ev.button == 1:
                    click = True
                    # Camera drag state activation
                    if my > 65 and my < SH - bar_h:
                        dragging = True
                        last_drag_pos = (mx, my)
                elif ev.button == 3:
                    # Right-click cancels building mode
                    selected_building = None
                    selected_placed_entity = None
                    
            if ev.type == pygame.MOUSEBUTTONUP:
                if ev.button == 1:
                    dragging = False
                    _slider_dragging[0] = None
                    
            if ev.type == pygame.KEYDOWN:
                if ev.key == pygame.K_ESCAPE:
                    if pause_submenu == 'settings':
                        pause_submenu = None
                    elif pause_open:
                        pause_open = False
                    elif game_phase not in ("SELECTOR", "UPGRADE"):
                        pause_open = True
                        selected_building = None
                        selected_placed_entity = None

        if pause_open:
            dragging = False

        overlay_active = pause_open or pause_submenu == 'settings'
        # Update slider drag when in settings overlay
        if pause_submenu == 'settings':
            _update_slider_drag(mx, music_track='game')
        if click and game_phase not in ("SELECTOR", "UPGRADE"):
            if pause_btn_rect.collidepoint(mx, my):
                play_sfx('click')
                if pause_submenu == 'settings':
                    pause_submenu = None
                else:
                    pause_open = not pause_open
                selected_building = None
                selected_placed_entity = None
                click = False
            elif overlay_active:
                if pause_submenu == 'settings':
                    rects = _settings_click_rects(*_settings_box_origin())
                    action = _handle_settings_click(mx, my, rects, music_track='game')
                    if action == 'closed':
                        pause_submenu = None
                elif pause_open:
                    pause_rects = _pause_menu_layout()
                    if pause_rects['resume'].collidepoint(mx, my):
                        play_sfx('click')
                        pause_open = False
                    elif pause_rects['settings'].collidepoint(mx, my):
                        play_sfx('click')
                        pause_submenu = 'settings'
                    elif pause_rects['menu'].collidepoint(mx, my):
                        play_sfx('click')
                        persist_city()
                        hub(screen, clock)
                        return
                click = False
        if dragging and not overlay_active:
            dx = mx - last_drag_pos[0]
            cam_x = max(0, min(MW - SW, cam_x - dx))
            cam_y = 0.0  # locked; map height == screen height
            last_drag_pos = (mx, my)

        # --- Handle Scene Phases Actions ---
        if not overlay_active and game_phase in ("BUILD", "COMBAT"):

            # Placements or button triggers
            build_bar_rects, tab_rects = draw_build_bar(screen, selected_building, money, iron, coal, unlocked_structures, unlocked_turrets, mx, my, build_bar_category)
            
            # Top HUD click checks
            if click:
                # Check category tab clicks first
                tab_clicked = False
                for tab_r, tab_name in tab_rects:
                    if tab_r.collidepoint(mx, my):
                        play_sfx('click')
                        build_bar_category = tab_name
                        selected_building = None
                        tab_clicked = True
                        break
                
                # Check build bar item selected
                bar_clicked = tab_clicked
                if not tab_clicked:
                    for r, btype in build_bar_rects:
                        if r.collidepoint(mx, my):
                            play_sfx('click')
                            bar_clicked = True
                            selected_placed_entity = None
                            if selected_building == btype:
                                selected_building = None  # Toggle off
                            else:
                                # Map btype to its unlock key name
                                unlock_map = {
                                    'normal': 'normal_turret',
                                    'heavy': 'heavy_turret',
                                    'wall': 'wall'
                                }
                                if btype in ['house', 'iron_mine', 'coal_mine', 'park']:
                                    if btype in unlocked_structures:
                                        selected_building = btype
                                else:
                                    unlock_key = unlock_map.get(btype, btype)
                                    if unlock_key in unlocked_turrets:
                                        selected_building = btype
                            break
                        
                if not bar_clicked:
                    # Verify click to place inside playable map space
                    if my > 65 and my < SH - bar_h:
                        # Translate click to absolute map position
                        world_x = cam_x + mx
                        world_y = cam_y + my
                        if selected_building:
                            # placement logic
                            c_mon, c_irn, c_co = 0, 0, 0

                            if selected_building == 'house':
                                c_mon = 100
                            elif selected_building == 'iron_mine':
                                c_mon, c_co = 150, 10
                            elif selected_building == 'coal_mine':
                                c_mon, c_irn = 150, 10
                            elif selected_building == 'park':
                                c_mon, c_irn, c_co = 200, 15, 15
                            elif selected_building == 'normal':
                                c_mon, c_irn = int(120 * upgrade_cost_mult), 20
                            elif selected_building == 'heavy':
                                c_mon, c_irn = int(250 * upgrade_cost_mult), 50
                            elif selected_building == 'wall':
                                c_mon, c_irn = int(30 * upgrade_cost_mult), 10

                            # ---- ZONE RULES ----
                            # Wall: lane only. Turret: outside lane/dome. Buildings: inside the left-facing dome.
                            bound_ok = get_placement_zone(selected_building, world_x, world_y, dome)
                                
                        # Collision checks with other structures (no overlaps)
                            overlap = False
                            # Compare distance against structures
                            all_objs = structures + turrets
                            for obj in all_objs:
                                safety_dist = 28 + obj.size
                                # Walls have smaller radius to pack tighter
                                if selected_building == 'wall' or (hasattr(obj, 'stype') and obj.stype == 'wall'):
                                    safety_dist = 22 + obj.size

                                if math.hypot(obj.x - world_x, obj.y - world_y) < safety_dist:
                                    overlap = True
                                    break
                                    
                            if bound_ok and not overlap and money >= c_mon and iron >= c_irn and coal >= c_co:
                                # Consume resources
                                money -= c_mon
                                iron -= c_irn
                                coal -= c_co
                                
                                play_sfx('place')
                                
                                # Spawn entity
                                if selected_building in ['normal', 'heavy']:
                                    turrets.append(Turret(selected_building, world_x, world_y, upgrade_cost_mult, normal_rate_mult, heavy_dmg_mult))
                                else:
                                    structures.append(Structure(selected_building, world_x, world_y, wall_hp_mult))
                                    
                                for _ in range(8):
                                    particles.append(Particle(world_x, world_y, MARS_RUST))
                                    
                                selected_building = None  # Consume build choice
                            else:
                                # Play error sound or text float alert
                                play_sfx('dome_hit')
                        else:
                            # Selection Mode: select placed entity for stats display
                            clicked_ent = None
                            for s in structures:
                                if math.hypot(s.x - world_x, s.y - world_y) < s.size + 10:
                                    clicked_ent = s
                                    break
                            if not clicked_ent:
                                for t in turrets:
                                    if math.hypot(t.x - world_x, t.y - world_y) < t.size + 10:
                                        clicked_ent = t
                                        break
                                        
                            selected_placed_entity = clicked_ent
                            



            # "Next Wave" button hover/activation
            if game_phase == "BUILD":
                next_wave_btn_rect = pygame.Rect(SW - 180, SH - bar_h - 55, 160, 40)
                next_wave_btn_hov = next_wave_btn_rect.collidepoint(mx, my)
                if click and next_wave_btn_hov:
                    play_sfx('click')
                    # Transition to Enemy Selector Phase
                    # Generate 3 risk-reward enemy options
                    enemy_options = [
                        {
                            "name": f"{tr('Enemy Group')} Alpha",
                            "risk": "Low",
                            "waves_count": 3,
                            "reward_money": 150,
                            "reward_iron": 30,
                            "reward_coal": 10,
                            "composition": ['A'] * 12
                        },
                        {
                            "name": f"{tr('Enemy Group')} Beta",
                            "risk": "Medium",
                            "waves_count": 4,
                            "reward_money": 280,
                            "reward_iron": 50,
                            "reward_coal": 25,
                            "composition": ['A'] * 10 + ['B'] * 6
                        },
                        {
                            "name": f"{tr('Enemy Group')} Gamma",
                            "risk": "High",
                            "waves_count": 5,
                            "reward_money": 450,
                            "reward_iron": 80,
                            "reward_coal": 45,
                            "composition": ['A'] * 8 + ['B'] * 15
                        }
                    ]
                    game_phase = "SELECTOR"
                    selected_building = None
                    selected_placed_entity = None


        elif not overlay_active and game_phase == "SELECTOR":
            # Selection Cards overlay
            hovered_card = draw_popup_cards(screen, tr("SELECT NEXT ENEMY GROUP"), tr("Choose your threat and reward"), enemy_options, mx, my)
            if click and hovered_card != -1:
                play_sfx('click')
                # Setup combat phase parameters
                active_enemy_collection = enemy_options[hovered_card]
                combat_waves_total = active_enemy_collection['waves_count']
                combat_waves_current = 1
                collection_rewards = {
                    'money': active_enemy_collection['reward_money'],
                    'iron': active_enemy_collection['reward_iron'],
                    'coal': active_enemy_collection['reward_coal']
                }
                
                # Load first wave spawn queue
                # Distribute enemy composition among waves
                raw_list = list(active_enemy_collection['composition'])
                random.shuffle(raw_list)
                
                # Split composition list into list of lists (waves count)
                combat_spawn_queue = []
                avg = len(raw_list) // combat_waves_total
                for w_i in range(combat_waves_total):
                    if w_i == combat_waves_total - 1:
                        combat_spawn_queue.append(raw_list[w_i * avg:])
                    else:
                        combat_spawn_queue.append(raw_list[w_i * avg: (w_i + 1) * avg])
                
                combat_spawn_timer = 0.0
                combat_break_timer = 0.0
                game_phase = "COMBAT"

        elif not overlay_active and game_phase == "COMBAT":
            # Check if we are in a break phase
            if combat_break_timer > 0:
                combat_break_timer -= dt
                if combat_break_timer <= 0:
                    # Break ended, start spawning next wave!
                    combat_spawn_timer = 0.0
            else:
                # Run Wave Spawner logic
                if len(enemies) == 0 and len(combat_spawn_queue) == 0:
                    # Combat victory! Distribute collection rewards
                    money += collection_rewards['money']
                    iron += collection_rewards['iron']
                    coal += collection_rewards['coal']
                    
                    play_sfx('win_collection')
                    
                    # Award passive collection income yields from structures (Houses and Mines)
                    # Production rates boosted by city Happiness
                    happy_mult = 1.0 + (happiness - 50.0) / 100.0
                    
                    # Apply Upgrades Automation core drill bonus
                    mine_mult = 1.3 if "Deep Core Drill" in unlocked_upgrades else 1.0
                    tax_mult = 1.25 if "Tax Reform" in unlocked_upgrades else 1.0
                    
                    house_yield = int(houses_count * 20 * happy_mult * tax_mult)
                    
                    # Mines produce resources. Mine production consumes coal/iron as logical balance:
                    # Houses produce Money. Iron mines produce Iron (needs Coal). Coal mines produce Coal (needs Iron).
                    # To avoid lockouts, raw outputs are generated:
                    iron_yield = int(sum(1 for s in structures if s.stype == 'iron_mine') * 10 * happy_mult * mine_mult)
                    coal_yield = int(sum(1 for s in structures if s.stype == 'coal_mine') * 10 * happy_mult * mine_mult)
                    
                    # Apply resource gains
                    money += house_yield
                    iron += iron_yield
                    coal += coal_yield
                    
                    # Alert floats above Dome center core
                    floating_texts.append(FloatingText(DOME_X, DOME_Y - 64, f"+${house_yield} +{iron_yield}I +{coal_yield}C", GOLD, 'm'))
                    
                    # Collection cleared: advance to the next main wave before upgrades.
                    wave += 1
                    
                    # Check highwave
                    prof = load_profile() or {}
                    if wave > prof.get('highest_wave', 0):
                        save_profile({'highest_wave': wave})

                    # Transition to Roguelike Upgrades scene phase
                    game_phase = "UPGRADE"
                    
                    # Generate 3 upgrade choices
                    # Pull 3 random options from UPGRADE_POOL
                    random.seed(tick)
                    # Filter out unlocks that are already active
                    avail_pool = []
                    for upg in UPGRADE_POOL:
                        if upg['name'] == 'Unlock Park' and 'park' in unlocked_structures:
                            continue
                        if upg['name'] == 'Unlock High Damage Turret' and 'heavy_turret' in unlocked_turrets:
                            continue
                        # Keep others
                        avail_pool.append(upg)
                    
                    if len(avail_pool) < 3:
                        avail_pool = list(UPGRADE_POOL)  # Reset safety
                    upgrade_options = random.sample(avail_pool, 3)
                    
                else:
                    # Handle Spawner timers
                    if combat_spawn_timer > 0:
                        combat_spawn_timer -= dt
                    elif len(combat_spawn_queue) > 0:
                        # Spawn active wave queue
                        active_wave_list = combat_spawn_queue[0]
                        if len(active_wave_list) > 0:
                            etype = active_wave_list.pop(0)
                            enemies.append(Enemy(etype, wave))
                            # Spawning cooldown: 1.2s for light, 2s for heavy
                            combat_spawn_timer = 1.2 if etype == 'A' else 2.2
                        else:
                            # Active wave list fully spawned. Wait until all enemies dead, then go to next sub-wave
                            if len(enemies) == 0:
                                combat_spawn_queue.pop(0)
                                if len(combat_spawn_queue) > 0:
                                    combat_break_timer = 30.0
                                    combat_waves_current = min(combat_waves_total, combat_waves_current + 1)


        elif not overlay_active and game_phase == "UPGRADE":
            # Card Upgrade selection screen
            hovered_card = draw_popup_cards(screen, tr("SELECT ONE UPGRADE CARD"), tr("Choose upgrades to defend colony"), upgrade_options, mx, my)
            if click and hovered_card != -1:
                play_sfx('click')
                chosen = upgrade_options[hovered_card]
                unlocked_upgrades.add(chosen['name'])
                
                # Apply instant unlock benefits
                if chosen['name'] == 'Unlock Park':
                    unlocked_structures.add('park')
                elif chosen['name'] == 'Unlock High Damage Turret':
                    unlocked_turrets.add('heavy_turret')
                elif chosen['name'] == 'Defensive Plating':
                    dome.max_hp += 250
                    dome.hp = min(dome.max_hp, dome.hp + 250)
                elif chosen['name'] == 'Citizen Motivation':
                    # Add happiness points instantly
                    happiness_bonus += 20.0
                    
                # Return back to BUILD phase
                game_phase = "BUILD"
                active_enemy_collection = None
                enemy_options = []
                combat_waves_total = 0
                combat_waves_current = 0
                combat_spawn_queue = []
                combat_spawn_timer = 0.0
                collection_rewards = None
                
                # --- TRIGGER AUTOSAVE ---
                city_data['money'] = money
                city_data['iron'] = iron
                city_data['coal'] = coal
                city_data['happiness'] = happiness
                city_data['happiness_bonus'] = happiness_bonus
                city_data['current_wave'] = wave
                city_data['dome_hp'] = dome.hp
                city_data['dome_max_hp'] = dome.max_hp
                city_data['play_time'] = play_time
                city_data['structures'] = [{'type': s.stype, 'x': s.x, 'y': s.y} for s in structures if s.stype != 'wall']
                city_data['walls'] = [{'x': s.x, 'y': s.y} for s in structures if s.stype == 'wall']
                city_data['turrets'] = [{'type': t.ttype, 'x': t.x, 'y': t.y} for t in turrets]
                city_data['unlocked_structures'] = list(unlocked_structures)
                city_data['unlocked_turrets'] = list(unlocked_turrets)
                city_data['unlocked_upgrades'] = list(unlocked_upgrades)
                save_city(slot_id, city_data)

                
                autosave_alert_timer = 2.5  # Flash alert text indicator on HUD

        # --- Check Defeat Condition (Dome HP reaches 0) ---
        if dome.hp <= 0:
            play_sfx('gameover')
            # Trigger Game Over Screen
            game_over_screen(screen, clock, slot_id, city_data, wave, play_time)
            return

        # ==========================================
        # 5. CORE UPDATES LOOP (Entities)
        # ==========================================
        # Entities are paused during popups Selector/Upgrade phases
        if not overlay_active and game_phase in ["BUILD", "COMBAT"]:
            # Passive resource addition every minute (60 seconds)
            passive_resource_timer += dt
            if passive_resource_timer >= 60.0:
                passive_resource_timer -= 60.0
                happy_mult = 1.0 + (happiness - 50.0) / 100.0
                mine_mult = 1.3 if "Deep Core Drill" in unlocked_upgrades else 1.0
                tax_mult = 1.25 if "Tax Reform" in unlocked_upgrades else 1.0
                
                house_yield = int(houses_count * 20 * happy_mult * tax_mult)
                iron_yield = int(sum(1 for s in structures if s.stype == 'iron_mine') * 10 * happy_mult * mine_mult)
                coal_yield = int(sum(1 for s in structures if s.stype == 'coal_mine') * 10 * happy_mult * mine_mult)
                
                money += house_yield
                iron += iron_yield
                coal += coal_yield
                
                # Floating yield notification above Dome center core
                floating_texts.append(FloatingText(DOME_X, DOME_Y - 64, f"+${house_yield} +{iron_yield}I +{coal_yield}C", GOLD, 'm'))

            # Update turrets combat
            for t in turrets:
                t.update(dt, enemies, projectiles)
                
            # Update projectiles tracking
            for p in projectiles[:]:
                p.update(dt, particles)
                if not p.alive:
                    projectiles.remove(p)
                    
            # Update active enemies
            for e in enemies[:]:
                alive = e.update(dt, dome, structures, turrets, particles, floating_texts)
                if not alive:
                    # Grant kill rewards if they didn't crash into the dome
                    if not getattr(e, 'reached_dome', False):
                        money += e.rew_money
                        iron += e.rew_iron
                        coal += e.rew_coal
                    enemies.remove(e)

                    
            # Check structure demolition / death
            for s in structures[:]:
                if s.hp <= 0:
                    play_sfx('explosion')
                    # Debris particles
                    for _ in range(6):
                        particles.append(Particle(s.x, s.y, MARS_RUST))
                    structures.remove(s)
                    if selected_placed_entity == s:
                        selected_placed_entity = None
                        
            for t in turrets[:]:
                if t.hp <= 0:
                    play_sfx('explosion')
                    for _ in range(6):
                        particles.append(Particle(t.x, t.y, (80, 85, 95)))
                    turrets.remove(t)
                    if selected_placed_entity == t:
                        selected_placed_entity = None

            # Particles update
            for p in particles[:]:
                p.update()
                if p.life <= 0:
                    particles.remove(p)
                    
            # Floating texts updates
            for ft in floating_texts[:]:
                ft.update()
                if ft.life <= 0:
                    floating_texts.remove(ft)

        # ==========================================
        # 6. DRAW WORLD VIEWPORT
        # ==========================================
        screen.fill(MARS_BG)
        # Blit Mars ground field viewport coordinates
        screen.blit(MAP_SURF, (-int(cam_x), -int(cam_y)))
        
        # Draw dome space field
        dome.draw(screen, cam_x, cam_y, tick)
        
        # Sort and render all structure and enemy entities together based on Y position (Y-sorting depth render)
        render_list = []
        for s in structures:
            render_list.append((s, s.y))
        for t in turrets:
            render_list.append((t, t.y))
        for e in enemies:
            render_list.append((e, e.y))
            
        render_list.sort(key=lambda item: item[1])
        
        for entity, _ in render_list:
            if isinstance(entity, Structure):
                entity.draw(screen, cam_x, cam_y, tick)
            elif isinstance(entity, Turret):
                entity.draw(screen, cam_x, cam_y, entity is selected_placed_entity)
            elif isinstance(entity, Enemy):
                entity.draw(screen, cam_x, cam_y, tick)

        # Draw Projectiles & Particles
        for p in projectiles:
            p.draw(screen, cam_x, cam_y)
        for p in particles:
            p.draw(screen, cam_x, cam_y)
        for ft in floating_texts:
            ft.draw(screen, FONTS, cam_x, cam_y)

        # Hover marker indicator for placing structure footprint
        if selected_building and my > 65 and my < SH - bar_h:
            world_x = cam_x + mx
            world_y = cam_y + my
            valid = get_placement_zone(selected_building, world_x, world_y, dome)
                
            overlap = False
            all_objs = structures + turrets
            for obj in all_objs:
                safety = 28 + obj.size
                if selected_building == 'wall' or (hasattr(obj, 'stype') and obj.stype == 'wall'):
                    safety = 20 + obj.size
                if math.hypot(obj.x - world_x, obj.y - world_y) < safety:
                    overlap = True
                    break
            
            color = HOLO_GREEN if (valid and not overlap) else RED_ALERT
            # Draw a square footprint so the build preview matches the grid-like map.
            marker_size = 58 if selected_building == 'wall' else 64
            mark_surf = pygame.Surface((marker_size, marker_size), pygame.SRCALPHA)
            marker_rect = mark_surf.get_rect()
            pygame.draw.rect(mark_surf, (color[0], color[1], color[2], 50), marker_rect, border_radius=4)
            pygame.draw.rect(mark_surf, color, marker_rect, 2, border_radius=4)
            screen.blit(mark_surf, (mx - marker_size // 2, my - marker_size // 2))

        # --- Draw UI OVERLAYS & HUD Panels ---
        # State label mapping
        state_label = "BUILD PHASE" if game_phase == "BUILD" else "COMBAT PHASE" if game_phase == "COMBAT" else "COMBAT PHASE"
        resources = {
            'money': money,
            'iron': iron,
            'coal': coal,
            'happiness': happiness,
            'population': population
        }
        hud_wave = wave
        draw_hud(screen, dome.hp, dome.max_hp, resources, hud_wave, combat_waves_total, state_label)

        # Bottom Build Bar Draw
        if game_phase in ("BUILD", "COMBAT"):
            draw_build_bar(screen, selected_building, money, iron, coal, unlocked_structures, unlocked_turrets, mx, my, build_bar_category)
            
            # Draw next wave trigger button bottom right
            if game_phase == "BUILD":
                pygame.draw.rect(screen, (15, 25, 45), next_wave_btn_rect, border_radius=6)
                next_wave_btn_border = HOLO_BLUE if next_wave_btn_hov else (40, 60, 100)
                pygame.draw.rect(screen, next_wave_btn_border, next_wave_btn_rect, 1 if not next_wave_btn_hov else 2, border_radius=6)
                dtxt(screen, tr("NEXT WAVE"), 'xs', WHITE if next_wave_btn_hov else HOLO_BLUE, next_wave_btn_rect.centerx, next_wave_btn_rect.centery)

        # Placed Entity Detail demolish popup overlay box
        if selected_placed_entity and game_phase in ("BUILD", "COMBAT"):

            # Center of entity screen space
            ent_sx = int(selected_placed_entity.x - cam_x)
            ent_sy = int(selected_placed_entity.y - cam_y)
            
            panel_w, panel_h = 240, 100
            px = max(10, min(SW - panel_w - 10, ent_sx - panel_w // 2))
            py = max(80, min(SH - 200, ent_sy - panel_h - 15))
            
            pygame.draw.rect(screen, DARK_GLASS, (px, py, panel_w, panel_h), border_radius=8)
            pygame.draw.rect(screen, HOLO_BLUE, (px, py, panel_w, panel_h), 1, border_radius=8)
            
            # Stats displays
            name_lbl = tr(selected_placed_entity.name) if hasattr(selected_placed_entity, 'name') else tr(selected_placed_entity.stype)
            dtxt(screen, name_lbl, 's', GOLD, px + 12, py + 12, 'topleft')
            dtxt(screen, f"HP: {selected_placed_entity.hp}/{selected_placed_entity.max_hp}", 'xs', (180, 185, 200), px + 12, py + 34, 'topleft')
            
            # Demolish button inside panel
            dem_btn_rect = pygame.Rect(px + 12, py + 58, panel_w - 24, 30)
            dem_hov = dem_btn_rect.collidepoint(mx, my)
            pygame.draw.rect(screen, (60, 15, 15) if not dem_hov else RED_ALERT, dem_btn_rect, border_radius=4)
            pygame.draw.rect(screen, RED_ALERT if not dem_hov else WHITE, dem_btn_rect, 1, border_radius=4)
            dtxt(screen, tr("Demolish"), 'xs', WHITE, dem_btn_rect.centerx, dem_btn_rect.centery)
            
            # Click Demolish check
            if click and dem_btn_rect.collidepoint(mx, my):
                play_sfx('click')
                
                # Demolish refunds 50%
                stype = selected_placed_entity.stype if hasattr(selected_placed_entity, 'stype') else selected_placed_entity.ttype
                refund_mon, refund_irn, refund_co = 0, 0, 0
                if stype == 'house':
                    refund_mon = 50
                elif stype == 'iron_mine':
                    refund_mon, refund_co = 75, 5
                elif stype == 'coal_mine':
                    refund_mon, refund_irn = 75, 5
                elif stype == 'park':
                    refund_mon, refund_irn, refund_co = 100, 7, 7
                elif stype == 'normal':
                    refund_mon, refund_irn = int(60 * upgrade_cost_mult), 10
                elif stype == 'heavy':
                    refund_mon, refund_irn = int(125 * upgrade_cost_mult), 25
                elif stype == 'wall':
                    refund_mon, refund_irn = int(15 * upgrade_cost_mult), 5
                    
                money += refund_mon
                iron += refund_irn
                coal += refund_co
                
                # Delete entity
                if selected_placed_entity in structures:
                    structures.remove(selected_placed_entity)
                elif selected_placed_entity in turrets:
                    turrets.remove(selected_placed_entity)
                    
                selected_placed_entity = None

        # Draw Wave Break Timer
        if game_phase == "COMBAT" and combat_break_timer > 0:
            box_w, box_h = 240, 80
            bx = SW // 2 - box_w // 2
            by = 90
            pygame.draw.rect(screen, DARK_GLASS, (bx, by, box_w, box_h), border_radius=8)
            pygame.draw.rect(screen, HOLO_BLUE, (bx, by, box_w, box_h), 1, border_radius=8)
            
            dtxt(screen, f"{tr('Next Wave in')} {int(combat_break_timer)}s", 's', WHITE, SW // 2, by + 22)
            
            skip_btn_rect = pygame.Rect(bx + 40, by + 45, box_w - 80, 24)
            skip_hov = skip_btn_rect.collidepoint(mx, my)
            pygame.draw.rect(screen, (30, 48, 80) if skip_hov else (15, 22, 38), skip_btn_rect, border_radius=4)
            pygame.draw.rect(screen, HOLO_BLUE if skip_hov else (40, 60, 100), skip_btn_rect, 1, border_radius=4)
            dtxt(screen, tr("Skip"), 'xs', WHITE, skip_btn_rect.centerx, skip_btn_rect.centery)
            
            if click and skip_btn_rect.collidepoint(mx, my):
                play_sfx('click')
                combat_break_timer = 0.0

        # Draw Autosave alert flash indicator text
        if autosave_alert_timer > 0:
            dtxt_bg(screen, tr("AUTOSAVED"), 'xs', HOLO_GREEN, SW//2, 85, pad=6, bg=(20, 30, 45, 220))


        # Selector Overlay card phase
        if game_phase == "SELECTOR":
            draw_popup_cards(screen, tr("SELECT NEXT ENEMY GROUP"), tr("Choose your threat and reward"), enemy_options, mx, my)

        # Card upgrade selection overlays
        elif game_phase == "UPGRADE":
            draw_popup_cards(screen, tr("SELECT ONE UPGRADE CARD"), tr("Choose upgrades to defend colony"), upgrade_options, mx, my)

        if game_phase not in ("SELECTOR", "UPGRADE"):
            pause_hov = pause_btn_rect.collidepoint(mx, my)
            p_col = HOLO_BLUE if pause_hov or pause_open else (40, 60, 100)
            pygame.draw.rect(screen, (15, 20, 38), pause_btn_rect, border_radius=6)
            pygame.draw.rect(screen, p_col, pause_btn_rect, 1 if not pause_hov else 2, border_radius=6)
            dtxt(screen, "II", 's', WHITE if pause_hov or pause_open else HOLO_BLUE, pause_btn_rect.centerx, pause_btn_rect.centery)

        if overlay_active:
            _draw_dim_overlay(screen)
            if pause_submenu == 'settings':
                _draw_settings_panel(screen, mx, my, show_reset=False)
            elif pause_open:
                _draw_pause_menu(screen, mx, my)

        pygame.display.flip()

# ==========================================
# 5. SCENE: GAME OVER SCREEN
# ==========================================
def game_over_screen(screen, clock, slot_id, city_data, wave, playtime_seconds):
    # Dim screen
    dim = pygame.Surface((SW, SH), pygame.SRCALPHA)
    dim.fill((0, 0, 0, 180))
    screen.blit(dim, (0, 0))
    
    # Save file reset dome hp
    city_data['exists'] = False
    delete_city(slot_id)
    
    # Update profile stats high wave records
    prof = load_profile() or {}
    save_profile({'total_play_time': prof.get('total_play_time', 0.0) + playtime_seconds})

    # UI Options buttons
    btn_w, btn_h = 280, 44
    hub_btn = Button(SW//2 - btn_w//2, SH//2 + 40, btn_w, btn_h, tr("Return to Hub Menu"), 'm', HOLO_BLUE, WHITE)
    new_city_btn = Button(SW//2 - btn_w//2, SH//2 + 100, btn_w, btn_h, tr("Start New City"), 'm', HOLO_GREEN, WHITE)
    
    tick = 0
    while True:
        mx, my = pygame.mouse.get_pos()
        click = False
        
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                click = True
                
        tick += 1
        
        # --- Update ---
        hub_btn.update(mx, my)
        new_city_btn.update(mx, my)
        
        # Handle Clicks
        if click:
            if hub_btn.hovered:
                play_sfx('click')
                hub(screen, clock)
                return
            if new_city_btn.hovered:
                # Trigger Slot reset recreation
                # Returns to slot dialog in Hub
                play_sfx('click')
                hub(screen, clock)
                return

        # --- Draw Overlays text ---
        box_w, box_h = 560, 360
        box_x = SW//2 - box_w//2
        box_y = SH//2 - box_h//2
        
        pygame.draw.rect(screen, (10, 14, 28, 240), (box_x, box_y, box_w, box_h), border_radius=12)
        pygame.draw.rect(screen, RED_ALERT, (box_x, box_y, box_w, box_h), 2, border_radius=12)
        
        # Alert Title
        glow_alpha = int(120 + math.sin(tick * 0.15) * 60)
        dtxt(screen, tr("GAME OVER"), 'xl', (RED_ALERT[0], RED_ALERT[1], RED_ALERT[2]), SW//2, box_y + 45, 'center', shad=True)
        
        # Summary details
        dtxt(screen, f"{tr('Wave Reached:')} {wave}", 'ml', GOLD, SW//2, box_y + 115)
        
        time_str = f"{int(playtime_seconds // 3600):02d}:{int((playtime_seconds % 3600) // 60):02d}:{int(playtime_seconds % 60):02d}"
        dtxt(screen, f"{tr('Play Time:')} {time_str}", 'ml', WHITE, SW//2, box_y + 155)

        hub_btn.draw(screen)
        new_city_btn.draw(screen)

        pygame.display.flip()
        clock.tick(FPS)
