import math
import os
import sys
import json
import random
import pygame

# Initialize Pygame Mixer before any sound synthesis
pygame.mixer.pre_init(44100, -16, 2, 512)
pygame.init()
pygame.mixer.init(44100, -16, 2, 512)

# ==========================================
# 1. SCREEN & MAP LAYOUT CONFIGURATION
# ==========================================
SW, SH = 1100, 720
MW, MH = SW, SH      # Compact 1.5:1 lane map that fits the window
FPS = 60

# ==========================================
# MAP ZONE CONSTANTS (Left-Right Lane Layout)
# ==========================================
# Enemy base is far left, our city/dome is far right
ENEMY_BASE_X = 90           # X center of enemy base
DOME_X       = 960          # X center of our city core
DOME_Y       = SH // 2      # Y center of dome (vertical middle)
DOME_RADIUS  = 170          # City zone inset and old save compatibility size
CITY_ZONE_X  = 760          # Left edge of the rectangular city/dome zone

# Lane path: horizontal corridor enemies walk through
LANE_Y       = SH // 2      # Y center of enemy path
LANE_W       = 50           # Half-width of the lane (total = 100px)

# Zone boundaries for placement rules
# Wall: must be on the lane (between enemy base and dome entry)
WALL_ZONE_X_MIN = ENEMY_BASE_X + 60
WALL_ZONE_X_MAX = CITY_ZONE_X

# Turret: outside lane band (above or below)
# Building: inside the visible rectangular dome zone

# ==========================================
# 2. COLORS & PALETTE (Sleek Mars/Holographic Theme)
# ==========================================
MARS_BG     = (34, 18, 14)      # Deep dark rust/brown
MARS_RUST   = (175, 75, 45)     # Classic Mars rust orange
MARS_GRID   = (58, 28, 20)      # Grid lines
DOME_GLOW   = (0, 195, 255)     # Glowing cyan for forcefield
DOME_FILL   = (0, 195, 255, 30) # Translucent cyan fill
HOLO_BLUE   = (0, 140, 255)     # Neon UI blue
HOLO_GREEN  = (0, 220, 100)     # Neon UI green
HOLO_ORANGE = (255, 120, 0)      # Neon UI warning orange
WHITE       = (255, 255, 255)
BLACK       = (0, 0, 0)
DARK_GLASS  = (12, 14, 26, 220)  # Holographic panel BG
GOLD        = (255, 210, 50)
RED_ALERT   = (230, 40, 40)

# ==========================================
# 3. SETTINGS & LOCALIZATION
# ==========================================
LANG = ['th']  # Mutable 1-elem list: 'th' or 'en'
SETTINGS = {
    'music': True,
    'sfx': True,
    'governor_name': '',
    'music_vol': 80,
    'sfx_vol': 80,
}

# Translation table
TR = {
    # Main Menu
    "Space Governor CD.": {"th": "ผู้ว่าอวกาศ 2067"},
    "Start Game": {"th": "เริ่มเกม"},
    "Start New Game": {"th": "เริ่มเกมใหม่"},
    "Start Playing": {"th": "เริ่มเล่น"},
    "Exit": {"th": "ออกจากเกม"},
    "Pause": {"th": "หยุดชั่วคราว"},
    "Resume Game": {"th": "กลับไปยังเกม"},
    "Back to Menu": {"th": "กลับหน้าเมนู"},
    
    # Profile Screen
    "Enter Governor Name": {"th": "กรุณาใส่ชื่อผู้ว่าการ"},
    "Confirm": {"th": "ยืนยัน"},
    "Name cannot be empty!": {"th": "ชื่อผู้ว่าการห้ามว่าง!"},
    
    # Hub Menu
    "Welcome back, Governor.": {"th": "ยินดีต้อนรับกลับครับ ผู้ว่าการ"},
    "The citizens await your leadership.": {"th": "ประชาชนกำลังรอคอยการนำของท่าน"},
    "Ready to defend the city again?": {"th": "พร้อมที่จะปกป้องเมืองอีกครั้งหรือยัง?"},
    
    "Highest Wave Reached": {"th": "ป้องกันได้คลื่นสูงสุด"},
    "Total Play Time": {"th": "เวลาเล่นทั้งหมด"},
    "Last Played City": {"th": "เมืองที่เล่นล่าสุด"},
    "Number of Cities Created": {"th": "จำนวนเมืองที่สร้างแล้ว"},
    "Reset All Data": {"th": "รีเซ็ตข้อมูลทั้งหมด"},
    
    "City #1": {"th": "เมืองที่ 1"},
    "City #2": {"th": "เมืองที่ 2"},
    "City #3": {"th": "เมืองที่ 3"},
    "Empty Slot": {"th": "ว่างเปล่า (สร้างเมืองใหม่)"},
    "New City": {"th": "สร้างเมืองใหม่"},
    "Continue": {"th": "เล่นต่อ"},
    "Delete": {"th": "ลบเมือง"},
    "Enter City Name": {"th": "กรุณาตั้งชื่อเมือง"},
    
    # Settings Screen
    "Settings": {"th": "การตั้งค่า"},
    "Language": {"th": "ภาษา"},
    "Music": {"th": "ดนตรีประกอบ"},
    "Sound Effects": {"th": "เอฟเฟกต์เสียง"},
    "ON": {"th": "เปิด"},
    "OFF": {"th": "ปิด"},
    "Reset successful!": {"th": "รีเซ็ตข้อมูลเรียบร้อย!"},
    "Back": {"th": "กลับ"},
    
    # Game Screen - HUD
    "DOME HP": {"th": "พลังโดม"},
    "MONEY": {"th": "เงินทุน"},
    "IRON": {"th": "เหล็ก"},
    "COAL": {"th": "ถ่านหิน"},
    "HAPPINESS": {"th": "ความสุข"},
    "POPULATION": {"th": "ประชากร"},
    "WAVE": {"th": "เวฟ"},
    "NEXT WAVE": {"th": "เริ่มป้องกันเวฟถัดไป"},
    "BUILD PHASE": {"th": "ช่วงเวลาพัฒนาเมือง"},
    "COMBAT PHASE": {"th": "ศัตรูเข้าโจมตี!"},
    "AUTOSAVED": {"th": "บันทึกอัตโนมัติเรียบร้อย"},
    
    # Structures
    "House": {"th": "บ้านพักอาศัย"},
    "Iron Mine": {"th": "เหมืองเหล็ก"},
    "Coal Mine": {"th": "เหมืองถ่านหิน"},
    "Park": {"th": "สวนสาธารณะ"},
    "Normal Turret": {"th": "ป้อมปืนกลเบา"},
    "High Damage Turret": {"th": "ป้อมปืนเลเซอร์หนัก"},
    "Wall": {"th": "กำแพงเหล็กกล้า"},
    
    "Locked": {"th": "ล็อกอยู่"},
    "Demolish": {"th": "รื้อถอน (คืนวัตถุดิบ 50%)"},
    
    # Descriptions
    "HouseDesc": {"th": "เพิ่มจำนวนประชากรและผลิตเงินรายได้"},
    "IronMineDesc": {"th": "ขุดเจาะแร่เหล็กสำหรับสร้างป้อมและกำแพง"},
    "CoalMineDesc": {"th": "ขุดเจาะถ่านหินสำหรับใช้ในเหมืองอื่นๆ"},
    "ParkDesc": {"th": "เพิ่มความสุขของประชาชน เพิ่มประสิทธิภาพการผลิต"},
    "NormalTurretDesc": {"th": "ยิงกระสุนทำความเสียหายปกติ อัตรายิงปานกลาง"},
    "HighDamageTurretDesc": {"th": "ยิงเลเซอร์พลังงานสูง อัตรายิงช้า ทำดาเมจหนัก"},
    "WallDesc": {"th": "กำแพงสำหรับบล็อกการเดินศัตรู มีความทนทานสูง"},
    
    # Enemy Selector
    "SELECT NEXT ENEMY GROUP": {"th": "เลือกกลุ่มศัตรูที่จะต้านทาน"},
    "Choose your threat and reward": {"th": "เลือกความท้าทายเพื่อรับรางวัลที่คุ้มค่า"},
    "Waves": {"th": "คลื่น"},
    "Reward": {"th": "รางวัล"},
    "Reward:": {"th": "รางวัล:"},
    "Risk Level:": {"th": "ระดับอันตราย:"},
    "Low": {"th": "ต่ำ"},
    "Medium": {"th": "ปานกลาง"},
    "High": {"th": "สูง"},
    "Select": {"th": "เลือก"},
    
    # Upgrades
    "SELECT ONE UPGRADE CARD": {"th": "เลือกการอัปเกรด 1 อย่าง"},
    "Tax Reform": {"th": "ปฏิรูปภาษี"},
    "Policy: Money generation +25%": {"th": "นโยบาย: ผลิตเงินเร็วขึ้น +25%"},
    "Defensive Plating": {"th": "เสริมแผ่นเกราะป้องกัน"},
    "Policy: Dome Max HP +250, heal 250": {"th": "นโยบาย: เพิ่มเลือดโดมสูงสุด 250 และฮีล"},
    "Citizen Motivation": {"th": "กระตุ้นจิตวิญญาณเมือง"},
    "Policy: Global happiness +20": {"th": "นโยบาย: เพิ่มความสุขของเมือง +20"},
    "Deep Core Drill": {"th": "เครื่องเจาะแกนโลกลึก"},
    "Policy: Mine production +30%": {"th": "นโยบาย: กำลังการผลิตเหมือง +30%"},
    "Carbon Steel Walls": {"th": "กำแพงโครงสร้างคาร์บอน"},
    "Defense Upgrade: Wall HP +50%": {"th": "ต้านทาน: เพิ่มพลังป้องกันกำแพง +50%"},
    "Military Subsidy": {"th": "ทุนสนับสนุนการทหาร"},
    "Turrets purchase cost -20%": {"th": "การทหาร: ลดราคาการสร้างป้อมปืนลง -20%"},
    "Fast Recharger": {"th": "วงจรระบายพลังงานเร็ว"},
    "Normal Turret attack rate +30%": {"th": "ป้อมกลเบา: ยิงเร็วขึ้น +30%"},
    "Laser Overcharge": {"th": "เลเซอร์โอเวอร์ชาร์จ"},
    "High Damage Turret damage +25%": {"th": "เลเซอร์หนัก: เพิ่มพลังโจมตี +25%"},
    "Unlock Park": {"th": "ปลดล็อกสวนสาธารณะ"},
    "Structure Unlock: Build Parks": {"th": "สิ่งปลูกสร้าง: ปลดล็อกการสร้างสวนสาธารณะ"},
    "Unlock High Damage Turret": {"th": "ปลดล็อกป้อมเลเซอร์หนัก"},
    "Turret Unlock: Build Heavy Lasers": {"th": "ป้องกัน: ปลดล็อกการสร้างป้อมเลเซอร์หนัก"},

    # Game Over
    "GAME OVER": {"th": "เกมสิ้นสุดลงแล้ว!"},
    "Wave Reached:": {"th": "คลื่นที่ต้านทานได้:"},
    "Play Time:": {"th": "ระยะเวลาการเล่น:"},
    "Return to Hub Menu": {"th": "กลับสู่เมนูหลัก"},
    "Start New City": {"th": "สร้างเมืองใหม่ในช่องเดิม"},
    "Next Wave in": {"th": "คลื่นถัดไปในอีก"},
    "Skip": {"th": "ข้าม"},
}


def tr(text):
    """Translate text based on global LANG setting."""
    lang_code = LANG[0]
    if lang_code == 'th':
        return TR.get(text, {}).get('th', text)
    return text

# ==========================================
# 4. PROCEDURAL SOUND GENERATOR (Using NumPy)
# ==========================================
# Try to build procedural sounds. Fallback to nothing if NumPy fails.
SOUNDS = {}
HAS_NP = False
try:
    import numpy as np
    HAS_NP = True
except ImportError:
    pass

def _ws(freq, dur, shape='sq', vol=0.25):
    if not HAS_NP:
        return None
    sr = 44100
    n = int(sr * dur)
    if n <= 0 or freq <= 0:
        return np.zeros(n, dtype=np.float32)
    t = np.linspace(0, dur, n, endpoint=False)
    if shape == 'sq':
        w = np.sign(np.sin(2 * np.pi * freq * t))
    elif shape == 'tri':
        ph = (t * freq) % 1.0
        w = 2 * np.abs(2 * ph - 1) - 1
    elif shape == 'saw':
        w = 2 * ((t * freq) % 1.0) - 1
    else:
        w = np.sin(2 * np.pi * freq * t)
    
    # Attack & Release envelope
    att = min(n, max(1, int(0.005 * sr)))
    rel = min(n, max(1, int(0.015 * sr)))
    w[:att] *= np.linspace(0, 1, att)
    w[-rel:] *= np.linspace(1, 0, rel)
    return (w * vol).astype(np.float32)

def _mk(arr):
    if not HAS_NP or arr is None:
        return None
    d = np.clip(arr, -1.0, 1.0)
    d16 = (d * 32767).astype(np.int16)
    st = np.column_stack([d16, d16])
    return pygame.sndarray.make_sound(st)

def init_procedural_sounds():
    global SOUNDS
    if not HAS_NP:
        return
    try:
        # Generate procedural sound effects
        SOUNDS['click'] = _mk(_ws(1200, 0.03, 'sq', 0.2))
        SOUNDS['place'] = _mk(np.concatenate([_ws(440, 0.05, 'tri', 0.25), _ws(880, 0.08, 'tri', 0.2)]))
        SOUNDS['shoot_normal'] = _mk(_ws(600, 0.06, 'saw', 0.15))
        SOUNDS['shoot_heavy'] = _mk(_ws(150, 0.25, 'saw', 0.35))
        SOUNDS['explosion'] = _mk(_ws(80, 0.35, 'sq', 0.45) * np.linspace(1, 0, int(44100 * 0.35)))
        SOUNDS['dome_hit'] = _mk(_ws(180, 0.15, 'sq', 0.4))
        SOUNDS['cash'] = _mk(np.concatenate([_ws(880, 0.04, 'tri', 0.2), _ws(1320, 0.06, 'tri', 0.2)]))
        SOUNDS['win_collection'] = _mk(np.concatenate([_ws(523, 0.08, 'sq', 0.25), _ws(659, 0.08, 'sq', 0.25), _ws(784, 0.16, 'sq', 0.3)]))
        SOUNDS['gameover'] = _mk(np.concatenate([_ws(220, 0.2, 'sq', 0.35), _ws(165, 0.25, 'sq', 0.3), _ws(110, 0.4, 'sq', 0.25)]))
        SOUNDS['wave_start'] = _mk(np.concatenate([_ws(440, 0.1, 'sq', 0.2), _ws(660, 0.1, 'sq', 0.2), _ws(880, 0.2, 'sq', 0.3)]))
    except Exception as e:
        print("Sound creation error:", e)

init_procedural_sounds()

def play_sfx(name):
    if not SETTINGS['sfx']:
        return
    snd = SOUNDS.get(name)
    if snd:
        snd.play()

# ==========================================
# 5. MUSIC MANAGEMENT (External or Procedural)
# ==========================================
_current_track = [None]

def play_music(name):
    """Play background music track. Fallback gracefully if file not found."""
    if not SETTINGS['music']:
        stop_music()
        return
    
    if _current_track[0] == name:
        return  # Already playing
        
    stop_music()
    
    # Try loading files from Asset folder
    fname = ""
    if name == 'menu':
        fname = os.path.join('Asset', 'mainsong.mp3')
    elif name == 'game':
        fname = os.path.join('Asset', 'mainsong.mp3')
    elif name == 'boss':
        fname = os.path.join('Asset', 'Finale.mp3')
        
    if fname and os.path.exists(fname):
        try:
            pygame.mixer.music.load(fname)
            pygame.mixer.music.set_volume(SETTINGS.get('music_vol', 80) / 100.0)
            pygame.mixer.music.play(-1)
            _current_track[0] = name
            return
        except Exception as e:
            print(f"Error loading music {fname}: {e}")
            
    # Fallback to no music (Week 1 gameplay can function without BGM file)
    print(f"BGM file '{fname}' not loaded. Continuing in silence.")

def stop_music():
    pygame.mixer.music.stop()
    _current_track[0] = None

def toggle_music():
    SETTINGS['music'] = not SETTINGS['music']
    if SETTINGS['music']:
        # Resume or start appropriate music based on current context (screens handle it)
        pass
    else:
        stop_music()
    save_profile()

def toggle_sfx():
    SETTINGS['sfx'] = not SETTINGS['sfx']
    save_profile()

def set_music_volume(vol):
    """Set music volume (0-100) and apply immediately."""
    SETTINGS['music_vol'] = max(0, min(100, int(vol)))
    if SETTINGS['music']:
        pygame.mixer.music.set_volume(SETTINGS['music_vol'] / 100.0)
    save_profile()

def set_sfx_volume(vol):
    """Set SFX volume (0-100) and apply to all loaded sounds."""
    SETTINGS['sfx_vol'] = max(0, min(100, int(vol)))
    v = SETTINGS['sfx_vol'] / 100.0
    for snd in SOUNDS.values():
        try:
            snd.set_volume(v)
        except Exception:
            pass
    save_profile()

# ==========================================
# 6. LOCAL PERSISTENT SAVE/LOAD SYSTEM
# ==========================================
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

PROFILE_PATH = os.path.join(DATA_DIR, 'profile.json')
PROFILE_STAT_KEYS = ('highest_wave', 'total_play_time', 'last_played_city', 'cities_created')

def load_profile():
    global SETTINGS
    if os.path.exists(PROFILE_PATH):
        try:
            with open(PROFILE_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                SETTINGS['governor_name'] = data.get('governor_name', '')
                LANG[0] = data.get('language', 'th')
                SETTINGS['music'] = data.get('music', True)
                SETTINGS['sfx'] = data.get('sfx', True)
                SETTINGS['music_vol'] = data.get('music_vol', 80)
                SETTINGS['sfx_vol'] = data.get('sfx_vol', 80)
                return data
        except Exception as e:
            print("Error loading profile.json:", e)
    return None

def save_profile(stats_to_merge=None):
    profile_data = {
        'governor_name': '',
        'language': 'th',
        'music': True,
        'sfx': True,
        'music_vol': 80,
        'sfx_vol': 80,
        'highest_wave': 0,
        'total_play_time': 0.0,
        'last_played_city': None,
        'cities_created': 0,
    }

    if os.path.exists(PROFILE_PATH):
        try:
            with open(PROFILE_PATH, 'r', encoding='utf-8') as f:
                old = json.load(f)
                for k in profile_data:
                    if k in old:
                        profile_data[k] = old[k]
        except Exception:
            pass

    profile_data['governor_name'] = SETTINGS['governor_name']
    profile_data['language'] = LANG[0]
    profile_data['music'] = SETTINGS['music']
    profile_data['sfx'] = SETTINGS['sfx']
    profile_data['music_vol'] = SETTINGS.get('music_vol', 80)
    profile_data['sfx_vol'] = SETTINGS.get('sfx_vol', 80)

    if stats_to_merge:
        for k in PROFILE_STAT_KEYS:
            if k in stats_to_merge:
                profile_data[k] = stats_to_merge[k]

    try:
        with open(PROFILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(profile_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Error saving profile.json:", e)

def get_city_save_path(slot_id):
    return os.path.join(DATA_DIR, f'city_{slot_id}.json')

def load_city(slot_id):
    path = get_city_save_path(slot_id)
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading slot {slot_id}:", e)
    return None

def save_city(slot_id, city_data):
    path = get_city_save_path(slot_id)
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(city_data, f, ensure_ascii=False, indent=2)
        
        save_profile({'last_played_city': city_data['city_name']})
    except Exception as e:
        print(f"Error saving slot {slot_id}:", e)

def delete_city(slot_id):
    path = get_city_save_path(slot_id)
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception as e:
            print(f"Error deleting city slot {slot_id}:", e)

def create_new_city_data(city_name):
    """Create a new city data dictionary with default starting values."""
    return {
        "city_name": city_name,
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

def reset_all_data():
    """Delete all city slots and profile file to reset system."""
    for i in range(1, 4):
        delete_city(i)
    if os.path.exists(PROFILE_PATH):
        try:
            os.remove(PROFILE_PATH)
        except Exception as e:
            print("Error deleting profile:", e)
    # Re-init settings defaults
    SETTINGS['governor_name'] = ''
    LANG[0] = 'th'
    SETTINGS['music'] = True
    SETTINGS['sfx'] = True
    stop_music()
