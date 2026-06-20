# Space Governor City Defense — โครงสร้างไฟล์และคู่มือเริ่มงาน

โปรเจกต์นี้สร้างด้วย **Python + Pygame** เป็นเกมแนวป้องกันเมือง/โดมแบบ Endless Wave ชื่อ `ผู้ว่าอวกาศ 2067 — Space Governor CD.`

ไฟล์หลักทั้งหมดอยู่ในโฟลเดอร์รากของโปรเจกต์:

```text
main.py
core.py
entities.py
screens.py
ui.py
_bugfix.md
requirements.txt
data/
Asset/
```

---

## ภาพรวมการทำงานของเกม

เกมทำงานเป็น Flow หลักดังนี้:

```text
main.py
  └── screens.menu()
        ├── profile()
        └── hub()
              └── game()
```

### Flow อธิบาย

1. `main.py` เป็นจุดรันเกม
2. `core.py` เก็บค่ากลาง เช่น ขนาดจอ, สี, การแปลภาษา, เสียง, ระบบเซฟ
3. `ui.py` เก็บ UI helper เช่น ข้อความ, ปุ่ม, HUD, Build Bar, Popup Cards
4. `entities.py` เก็บ object ในเกม เช่น สิ่งก่อสร้าง, ป้อม, กระสุน, ศัตรู
5. `screens.py` เก็บหน้าจอและระบบการเล่นจริง เช่น เมนู, Hub, Game, Combat

---

# 1. `main.py`

## ไฟล์นี้ทำอะไร

`main.py` เป็นไฟล์เริ่มต้นของโปรแกรม

## สิ่งที่มีในไฟล์

- เปลี่ยน working directory ไปยังโฟลเดอร์ที่ไฟล์อยู่
- ตั้งค่าหน้าต่าง Pygame
- โหลด profile
- เริ่มหน้าจอเมนูหลัก

## ส่วนที่สำคัญ

```python
def main():
    pygame.display.set_caption("ผู้ว่าอวกาศ 2067 — Space Governor CD.")
    screen = pygame.display.set_mode((SW, SH))
    clock = pygame.time.Clock()
    load_profile()
    screens.menu(screen, clock)
```

## ถ้าจะแก้เรื่องอะไรให้ดูไฟล์นี้

ดู `main.py` เมื่อต้องการแก้:

- ชื่อหน้าต่างเกม
- ขนาดหน้าต่างเริ่มต้น
- การเริ่มเกมครั้งแรก
- การเรียกหน้าเมนูแรก

---

# 2. `core.py`

## ไฟล์นี้ทำอะไร

`core.py` เป็นศูนย์กลางข้อมูลกลางของเกม

## สิ่งที่มีในไฟล์

### 1. ค่าขนาดหน้าจอและแผนที่

```python
SW, SH = 1100, 720
MW, MH = SW, SH
FPS = 60
```

ใช้กำหนดขนาดหน้าจอและเฟรมเรต

---

### 2. ตำแหน่งสำคัญบนแผนที่

```python
ENEMY_BASE_X = 90
DOME_X = 960
DOME_Y = SH // 2
DOME_RADIUS = 170
CITY_ZONE_X = 760
LANE_Y = SH // 2
LANE_W = 50
```

ใช้กำหนดตำแหน่ง:

- ฐานศัตรู
- โดมเมือง
- เส้นทางศัตรูเดิน
- โซนสร้างกำแพง
- โซนสร้างสิ่งก่อสร้าง

---

### 3. สีและธีม

```python
MARS_BG
MARS_RUST
DOME_GLOW
HOLO_BLUE
HOLO_GREEN
HOLO_ORANGE
DARK_GLASS
RED_ALERT
```

ถ้าอยากปรับสีเกม ให้ดู `core.py`

---

### 4. ระบบภาษา

```python
LANG = ['th']
SETTINGS = {...}
TR = {...}
def tr(text):
    ...
```

ใช้เก็บข้อความไทย/อังกฤษ และฟังก์ชันแปลภาษา

---

### 5. ระบบเสียง

```python
SOUNDS = {}
init_procedural_sounds()
play_sfx()
play_music()
set_music_volume()
set_sfx_volume()
```

ใช้สร้างเสียงด้วย NumPy และเล่น BGM จาก `Asset/`

---

### 6. ระบบเซฟข้อมูล

```python
load_profile()
save_profile()
load_city()
save_city()
delete_city()
reset_all_data()
```

ใช้โหลด/บันทึก:

- `data/profile.json`
- `data/city_1.json`
- `data/city_2.json`
- `data/city_3.json`

## ถ้าจะแก้เรื่องอะไรให้ดูไฟล์นี้

ดู `core.py` เมื่อต้องการแก้:

- ขนาดจอ
- สีธีม
- ข้อความแปลภาษา
- เสียง
- การตั้งค่าใน `profile.json`
- การบันทึกเมือง
- ตำแหน่งฐานศัตรู/โดม/เลน
- เงื่อนไขโซนวางสิ่งก่อสร้าง

---

# 3. `entities.py`

## ไฟล์นี้ทำอะไร

`entities.py` เก็บ object ที่เคลื่อนไหวหรือแสดงผลในเกม

## สิ่งที่มีในไฟล์

### 1. Particle

```python
class Particle
```

ใช้สร้างเอฟเฟกต์ระเบิด, แสง, ฝุ่น

---

### 2. FloatingText

```python
class FloatingText
```

ใช้แสดงข้อความลอย เช่น:

- `+150`
- `-100 HP`
- `+$100 +10I +5C`

---

### 3. Structure

```python
class Structure
```

ใช้สร้างสิ่งก่อสร้างทั่วไป เช่น:

- บ้าน
- เหมืองเหล็ก
- เหมืองถ่านหิน
- สวนสาธารณะ
- กำแพง

มีข้อมูล:

```python
stype
hp
max_hp
name
x
y
size
upgrade_level
```

---

### 4. Turret

```python
class Turret
```

ใช้สร้างป้อมปืน เช่น:

- Normal Turret
- High Damage Turret

ระบบสำคัญ:

- หาเป้าหมายศัตรู
- คำนวณมุมยิง
- ยิง Projectile
- Cooldown
- แสดงระยะยิงเมื่อ hover

---

### 5. Projectile

```python
class Projectile
```

ใช้สร้างกระสุน/เลเซอร์ที่ยิงจากป้อมไปยังศัตรู

ระบบสำคัญ:

- เคลื่อนที่ตาม target
- ลด HP ศัตรูเมื่อชน
- สร้าง particle เวลาโดน

---

### 6. Enemy

```python
class Enemy
```

ใช้สร้างศัตรู เช่น:

- Scout Drone
- Heavy Crawler

ระบบสำคัญ:

- เดินไปทางโดม
- โจมตีกำแพง
- ทำลายโดมเมื่อทะลุเข้ามา
- ให้รางวัลเมื่อตาย

## ถ้าจะแก้เรื่องอะไรให้ดูไฟล์นี้

ดู `entities.py` เมื่อต้องการแก้:

- รูปทรง/สีของสิ่งก่อสร้าง
- รูปทรง/สีของป้อม
- รูปทรง/สีของศัตรู
- ความแรงกระสุน
- ความเร็วกระสุน
- HP ศัตรู
- ความเสียหายศัตรู
- ระบบโจมตีกำแพง/โดม
- เอฟเฟกต์ particle
- Floating text

---

# 4. `screens.py`

## ไฟล์นี้ทำอะไร

`screens.py` เป็นไฟล์ใหญ่ที่สุด และเก็บหน้าจอทั้งหมดกับระบบการเล่นจริง

## สิ่งที่มีในไฟล์

### 1. Helper ส่วนกลาง

```python
_settings_box_origin()
_settings_click_rects()
_draw_vol_slider()
_draw_settings_panel()
_update_slider_drag()
_handle_settings_click()
_draw_dim_overlay()
_pause_menu_layout()
_draw_pause_menu()
```

ใช้ร่วมกันในหลายหน้าจอ เช่น:

- Settings overlay
- Pause menu
- Slider volume

---

### 2. หน้าเมนูหลัก

```python
def menu(screen, clock):
```

สิ่งที่ทำ:

- เล่นเพลงเมนู
- แสดงปุ่มเริ่มเกม/ออกเกม
- แสดงปุ่ม Settings
- ไปหน้า Profile ถ้ายังไม่มีชื่อผู้ว่าการ
- ไปหน้า Hub ถ้ามีชื่อผู้ว่าการแล้ว

---

### 3. หน้าสร้าง Profile

```python
def profile(screen, clock):
```

สิ่งที่ทำ:

- รับชื่อผู้ว่าการ
- บันทึกชื่อลง `profile.json`
- ไปหน้า Hub

---

### 4. หน้า Hub เลือกเมือง

```python
def hub(screen, clock):
```

สิ่งที่ทำ:

- แสดงชื่อผู้ว่าการ
- แสดงสถิติรวม
- แสดงช่องเมือง 3 ช่อง
- สร้างเมืองใหม่
- เล่นเมืองที่มีอยู่
- ลบเมือง
- เปิด Settings

ข้อมูลเริ่มต้นเมื่อสร้างเมืองใหม่:

```python
money
iron
coal
dome_hp
structures
turrets
walls
unlocked_structures
unlocked_turrets
happiness
```

---

### 5. ระบบเกมหลัก

```python
def game(screen, clock, slot_id):
```

สิ่งที่มีภายใน:

#### Dome

```python
class Dome
```

ใช้แสดงโดมเมืองและ HP

---

#### Map

```python
def build_static_map():
```

สร้างพื้นหลังแผนที่:

- ฐานศัตรูด้านซ้าย
- เลนกลาง
- โดมเมืองด้านขวา
- ถนน/ตารางพื้นหลัง
- หลุมอุกกาบาต

---

#### โซนวางสิ่งก่อสร้าง

```python
def get_placement_zone(selected_building, world_x, world_y, dome):
```

ใช้ตรวจสอบว่าสิ่งก่อสร้างวางตรงไหนได้

กฎปัจจุบัน:

- `wall` วางได้เฉพาะบนเลน
- `normal`, `heavy` วางได้นอกเลนและนอกโดม
- อาคารทั่วไปวางได้ภายในโซนโดม

---

#### Upgrade Pool

```python
UPGRADE_POOL = [...]
```

เก็บรายการอัปเกรดที่เป็นไปได้

---

#### Game Loop

```python
while True:
```

ระบบภายในเกม:

- โหลดข้อมูลเมืองจาก `city_1.json`
- คำนวณเงิน, วัตถุดิบ, ความสุข, ประชากร
- สร้างสิ่งก่อสร้าง, ป้อม, กำแพง
- รับ input เมาส์/คีย์บอร์ด
- วางสิ่งก่อสร้าง
- เลือกสิ่งก่อสร้าง
- กด Next Wave
- เลือกกลุ่มศัตรู
- เข้าสู่ Combat
- Spawn ศัตรู
- คำนวณรางวัลหลังชนะ
- บันทึกเมืองอัตโนมัติ

---

### Phase ของเกม

```text
BUILD
  └── เลือกสิ่งก่อสร้าง
  └── วางสิ่งก่อสร้าง
  └── กด Next Wave

SELECTOR
  └── เลือกกลุ่มศัตรู

COMBAT
  └── ศัตรูเดินและโจมตี
  └── ป้อมยิง
  └── ชนะแล้วรับรางวัล

UPGRADE
  └── เลือกอัปเกรดหลังชนะ

PAUSE
  └── กลับเกม
  └── Settings
  └── กลับ Hub
```

## ถ้าจะแก้เรื่องอะไรให้ดูไฟล์นี้

ดู `screens.py` เมื่อต้องการแก้:

- หน้าเมนู
- หน้า Profile
- หน้า Hub
- หน้าสร้างเมืองใหม่
- ระบบเริ่มเกม
- ระบบเลือกเมือง
- ระบบวางสิ่งก่อสร้าง
- ระบบเลือกสิ่งก่อสร้าง
- ระบบ Next Wave
- ระบบเลือกกลุ่มศัตรู
- ระบบ Combat
- ระบบอัปเกรด
- ระบบ Pause
- ระบบ Settings
- ระบบบันทึกอัตโนมัติระหว่างเล่น

---

# 5. `ui.py`

## ไฟล์นี้ทำอะไร

`ui.py` เก็บส่วนแสดงผล UI และ helper ที่ใช้วาดหน้าจอ

## สิ่งที่มีในไฟล์

### 1. Font

```python
FONTS = {}
init_fonts()
```

โหลดฟอนต์จาก:

```text
Asset/Anakotmai-Medium.ttf
Asset/Anakotmai-Bold.ttf
```

ถ้าไม่มี จะใช้ system font fallback

---

### 2. Text helper

```python
def dtxt(...)
def dtxt_bg(...)
def wrap_text_to_width(...)
def fit_font_key(...)
```

ใช้สำหรับ:

- วาดข้อความ
- วาดข้อความพร้อมพื้นหลัง
- ตัดข้อความยาวให้พอดี
- เลือกขนาดฟอนต์ให้พอดีกับกล่อง

---

### 3. ปุ่ม

```python
class Button
```

ใช้สร้างปุ่มแบบ glow border

---

### 4. Slider

```python
class Slider
```

ใช้สร้าง slider แบบลากค่า

---

### 5. HUD

```python
def draw_hud(...)
```

ใช้แสดง:

- Dome HP
- Money
- Iron
- Coal
- Happiness
- Population
- Wave
- สถานะ Build/Combat

---

### 6. Build Bar

```python
def draw_build_bar(...)
```

ใช้แสดงแถบสร้างด้านล่าง:

- Tab Defense
- Tab Structure
- ปุ่มสร้างป้อม/กำแพง
- ปุ่มสร้างสิ่งก่อสร้าง
- Tooltip คำอธิบาย
- ราคา

---

### 7. Popup Cards

```python
def draw_popup_cards(...)
```

ใช้แสดงการ์ด:

- เลือกกลุ่มศัตรู
- เลือกอัปเกรด

## ถ้าจะแก้เรื่องอะไรให้ดูไฟล์นี้

ดู `ui.py` เมื่อต้องการแก้:

- ฟอนต์
- ขนาดตัวหนังสือ
- ปุ่ม
- HUD
- Build Bar
- Tooltip
- Popup Cards
- สี UI
- การจัดวาง UI
- การแสดงผลการ์ดอัปเกรด/ศัตรู

---

# 6. `_bugfix.md`

## ไฟล์นี้ทำอะไร

`_bugfix.md` เป็นไฟล์บันทึกปัญหา/วิธีแก้/สิ่งที่เคยเจอ

## ควรใช้ไฟล์นี้ตอนไหน

ก่อนเริ่มแก้บัค ให้เปิด `_bugfix.md` ก่อนเสมอ

ควรบันทึกข้อมูลเช่น:

- อาการบัค
- สาเหตุที่เจอ
- ไฟล์ที่เกี่ยวข้อง
- วิธีแก้
- สิ่งที่ยังค้างอยู่

---

# 7. `requirements.txt`

## ไฟล์นี้ทำอะไร

เก็บ dependency ที่ต้องใช้รันโปรเจกต์

## Dependency ปัจจุบัน

```text
pygame==2.6.1
numpy==2.4.3
pyinstaller>=6.0
```

## ถ้าจะเพิ่ม library ใหม่

ให้เพิ่มลงใน `requirements.txt` แล้วรัน:

```bash
pip install -r requirements.txt
```

---

# 8. `data/profile.json`

## ไฟล์นี้ทำอะไร

เก็บข้อมูลผู้เล่นและค่าตั้งค่า

## ข้อมูลที่เก็บ

```text
governor_name
language
music
sfx
music_vol
sfx_vol
highest_wave
total_play_time
last_played_city
cities_created
```

## ถ้าจะแก้เรื่องอะไรให้ดูไฟล์นี้

ดู `data/profile.json` หรือ `core.py` เมื่อต้องการแก้:

- ชื่อผู้ว่าการ
- ภาษา
- เสียง
- สถิติรวม
- จำนวนเมืองที่สร้างแล้ว

---

# 9. `data/city_1.json`

## ไฟล์นี้ทำอะไร

เก็บสถานะเมือง Slot 1

## ข้อมูลที่เก็บ

```text
city_name
exists
current_wave
money
iron
coal
dome_hp
dome_max_hp
structures
turrets
walls
play_time
unlocked_structures
unlocked_turrets
unlocked_upgrades
happiness
happiness_bonus
```

## Slot อื่น

```text
data/city_2.json
data/city_3.json
```

## ถ้าจะแก้เรื่องอะไรให้ดูไฟล์นี้

ดู `data/city_1.json` หรือ `core.py` เมื่อต้องการแก้:

- เงินเริ่มต้น
- ทรัพยากรเริ่มต้น
- HP โดมเริ่มต้น
- สิ่งก่อสร้างเริ่มต้น
- ป้อมเริ่มต้น
- อัปเกรดที่ปลดล็อกแล้ว

---

# 10. `Asset/`

## ไฟล์นี้ทำอะไร

เก็บไฟล์ทรัพยากรภายนอก

## ไฟล์ที่โค้ดใช้

```text
Asset/Anakotmai-Medium.ttf
Asset/Anakotmai-Bold.ttf
Asset/mainsong.mp3
Asset/Finale.mp3
```

## ถ้าจะแก้เรื่องอะไรให้ดูโฟลเดอร์นี้

ดู `Asset/` เมื่อต้องการแก้:

- ฟอนต์
- เพลงเมนู
- เพลงเกม
- เพลง boss/endgame
- ทรัพยากรภาพในอนาคต

---

# วิธีเริ่มงานในอนาคต

## ถ้าจะแก้บัคระบบต่อสู้

ให้เริ่มจาก:

1. อ่าน `_bugfix.md`
2. อ่าน `screens.py` ส่วน `game()`
3. อ่าน `entities.py` ส่วน `Enemy`, `Turret`, `Projectile`
4. อ่าน `ui.py` ส่วน `draw_hud()` ถ้าบัคเกี่ยวกับ HUD
5. อ่าน `core.py` ถ้าบัคเกี่ยวกับค่า HP, wave, reward, zone

---

## ถ้าจะแก้ UI

ให้เริ่มจาก:

1. อ่าน `ui.py`
2. อ่าน `screens.py` ส่วนหน้าจอที่เกี่ยวข้อง
3. อ่าน `core.py` ถ้าเกี่ยวข้องกับสี/ข้อความ/ภาษา
4. อ่าน `Asset/` ถ้าเกี่ยวข้องกับฟอนต์หรือเพลง

---

## ถ้าจะแก้ระบบเซฟ

ให้เริ่มจาก:

1. อ่าน `core.py`
2. อ่าน `data/profile.json`
3. อ่าน `data/city_1.json`
4. อ่าน `screens.py` ส่วน `hub()` และ `game()`

---

## ถ้าจะแก้ระบบสร้างเมือง

ให้เริ่มจาก:

1. อ่าน `screens.py` ส่วน `hub()`
2. อ่าน `core.py` ฟังก์ชัน `save_city()`
3. อ่าน `data/city_1.json`

---

## ถ้าจะแก้ระบบอัปเกรด

ให้เริ่มจาก:

1. อ่าน `screens.py` ส่วน `UPGRADE_POOL`
2. อ่าน `ui.py` ส่วน `draw_popup_cards()`
3. อ่าน `screens.py` ส่วน logic รับรางวัลอัปเกรดใน `game()`
4. อ่าน `entities.py` ถ้าอัปเกรดกระทบป้อม/กำแพง

---

## ถ้าจะแก้ระบบภาษา

ให้เริ่มจาก:

1. อ่าน `core.py` ส่วน `TR`
2. อ่าน `ui.py` ถ้าเป็น UI text ใหม่
3. อ่าน `screens.py` ถ้าเป็นข้อความในเกม

---

# สรุปไฟล์ตามงาน

| งานที่ต้องการทำ | ไฟล์หลักที่ต้องดู |
|---|---|
| เริ่มรันเกม | `main.py` |
| แก้สี/ภาษา/เสียง | `core.py` |
| แก้ระบบเซฟ | `core.py`, `data/profile.json`, `data/city_1.json` |
| แก้รูปสิ่งก่อสร้าง/ป้อม/ศัตรู | `entities.py` |
| แก้การโจมตี/กระสุน/HP ศัตรู | `entities.py`, `screens.py` |
| แก้ HUD/Build Bar/Card UI | `ui.py` |
| แก้หน้าเมนู/Hub/Game Loop | `screens.py` |
| แก้ฟอนต์/เพลง | `ui.py`, `core.py`, `Asset/` |
| แก้บัคที่เคยเจอ | `_bugfix.md` |
| เพิ่ม dependency | `requirements.txt` |
