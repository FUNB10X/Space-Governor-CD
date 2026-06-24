# Buildings Reference — Space Governor CD.

## สิ่งก่อสร้าง (Structures) — วางได้เฉพาะใน City Zone

| Key | ชื่อ | HP | ราคา | ปลดล็อก | ผลพิเศษ |
|-----|------|----|------|----------|---------|
| `house` | House | 120 | $100 | ตั้งต้น | ประชากร +10, ผลิตเงินต่อคลื่น |
| `iron_mine` | Iron Mine | 180 | $150 + 10C | ตั้งต้น | ผลิต Iron ต่อคลื่น |
| `coal_mine` | Coal Mine | 180 | $150 + 10I | ตั้งต้น | ผลิต Coal ต่อคลื่น |
| `park` | Park | 150 | $200 + 15I + 15C | Unlock Park | Happiness +15 ต่อ Park |
| `medical` | Medical Bay | 140 | $180 + 15C | Unlock Medical Bay | ซ่อมโดม +20 HP ต่อคลื่น (สะสมต่อ Medical Bay) |

> ผลผลิตของ House / Iron Mine / Coal Mine ขึ้นกับ Happiness, Tax Reform, Deep Core Drill, Energy Capacitor

---

## ป้องกัน (Defense) — วางได้นอก City Zone

### Turrets — วางนอก Lane และนอก City Zone, ต้องมีประชากร ≥ จำนวนที่กำหนด

| Key | ชื่อ | HP | ราคา | ต้องมี ปชก. | Range | DMG | Fire Rate | ปลดล็อก |
|-----|------|----|------|-------------|-------|-----|-----------|---------|
| `normal` | Normal Turret | 200 | $120 + 20I + 5C | 5 | 220 | 12 | 0.8 s/shot | ตั้งต้น |
| `heavy` | High Damage Turret | 200 | $250 + 50I + 10C | 10 | 320 | 40 | 2.2 s/shot | Unlock High Damage Turret |
| `rapid` | Rapid Turret | 200 | $160 + 30I + 8C | 15 | 190 | 6 | 0.22 s/shot | Unlock Rapid Turret |

> Fire Rate = cooldown ระหว่าง shot (น้อย = ยิงเร็ว)  
> ค่าจริงขึ้นกับ upgrades: Military Subsidy (cost −20%), Fast Recharger (normal ×0.7), Laser Overcharge (heavy dmg ×1.25), Quick Hands (all ×0.8), Advanced Optics (range ×1.25)  
> **ประชากรไม่ถูกใช้เมื่อสร้าง** — แค่ต้องมีประชากรมากกว่าหรือเท่ากับที่กำหนด

### Wall — วางได้บน Lane เท่านั้น

| Key | ชื่อ | HP | ราคา | ปลดล็อก | หน้าที่ |
|-----|------|----|------|----------|--------|
| `wall` | Wall | 250 | $30 + 10I | ตั้งต้น | บล็อกศัตรูบน Lane, ศัตรูจะโจมตีกำแพงแทน |

> Carbon Steel Walls upgrade เพิ่ม Wall HP ×1.5

---

## Happiness Effects

| ช่วงความสุข | ผล |
|-------------|-----|
| < 30% | ผลผลิตทุกชนิด −50% |
| < 15% | ผลผลิต −80%, ชาวบ้านบ่น (แสดงคำเตือน) |
| ≤ 0% | **โดนไล่ออก!** จบเกมทันที |
| > 70% | ผลผลิต +30% |
| > 90% | ผลผลิต +50% |

> ผลผลิต = เงินสด, แร่เหล็ก, ถ่านหิน และเงินรางวัลจากข้าศึก

---

## Enemy Sets (10 แบบ ไม่ซ้ำกัน)

เมื่อเข้าสู่ SELECTOR phase จะสุ่ม **3 ชุดจาก 10 ชุด** ที่ยังไม่ถูกใช้ในรอบเกมนั้น เมื่อใช้ครบทั้ง 10 แล้ว จะสร้างแบบสุ่มตาม wave แทน

| Set | ชื่อ | Risk | องค์ประกอบ |
|-----|------|------|-----------|
| 1 | Patrol | Low | A, A, A, A, A |
| 2 | Strike | Low | A, A, B, A, A, B |
| 3 | Assault | Medium | A, B, A, B, A, B, C |
| 4 | Siege | Medium | B, B, C, B, C, D |
| 5 | Vanguard | Medium | A, B, C, C, B, A, D |
| 6 | Dread | High | B, C, D, C, B, D, C, D |
| 7 | Nightmare | High | C, D, C, D, C, D, B |
| 8 | Apocalypse | High | A, A, B, B, C, C, D, D, C, D |
| 9 | Phalanx | High | B, C, C, D, D, B, C, D, D |
| 10 | Omega | High | B, D, C, D, D, C, D, B, D, D, C |

> Enemy type A = Scout Drone (HP 30, spd 85), B = Heavy Crawler (HP 90, spd 50), C = Elite Behemoth (HP 220, spd 38), D = Void Specter (HP 50, spd 130)  
> HP และ Speed scale ตาม wave: HP +12%/wave, Speed +4%/wave (เริ่ม wave 6)  
> รางวัลเงิน/เหล็ก/ถ่านหิน × (1 + (wave-1) × 0.15)

---

## Upgrade Cards ที่เกี่ยวกับสิ่งก่อสร้าง

| ชื่อ | ประเภท | ผล |
|------|--------|----|
| Unlock Park | Unlock | ปลดล็อก Park |
| Unlock High Damage Turret | Unlock | ปลดล็อก Heavy Laser |
| Unlock Rapid Turret | Unlock | ปลดล็อก Rapid Turret |
| Unlock Medical Bay | Unlock | ปลดล็อก Medical Bay |
| Carbon Steel Walls | Defense | Wall HP +50% |
| Military Subsidy | Defense | Turret cost −20% |
| Fast Recharger | Defense | Normal Turret fire rate +30% |
| Laser Overcharge | Defense | Heavy Turret damage +25% |
| Advanced Optics | Defense | All turret range +25% |
| Quick Hands | Defense | All turrets fire +20% faster |
| Shield Generator | Defense | Dome takes −25% damage |
| Auto Repair Drones | Policy | Dome heals +60 HP/wave |
| Deep Core Drill | Policy | Mine yield +30% |
| Tax Reform | Policy | Money yield +25% |
| Energy Capacitor | Policy | All resources +15% |
| Recycling Plant | Policy | Demolish refund 80% (was 50%) |
| Defensive Plating | Policy | Dome max HP +250, heal 250 |
| Citizen Motivation | Policy | Happiness bonus +20 |

> การเลือก Upgrade card: **บางอันฟรี บางอันมีค่าใช้จ่าย** (ดูใน card)  
> การสุ่มใหม่ (Reroll) ใช้ $75 — ทุกครั้งที่มีการสุ่มใหม่ จะมีการ์ดฟรีอย่างน้อย 1 ใบเสมอ  
> หากเงินไม่พอเลือกการ์ดที่มีค่าใช้จ่าย ปุ่มจะ变为สีแดงและเลือกไม่ได้

---

## Game Flow

```
SELECTOR (เลือกข้าศึก) → BUILD (สร้าง/อัปเกรด) → COMBAT (สู้)
  ↑                                            ↓
  └──────── UPGRADE (เลือกการ์ด) ←──────────────┘
```

- เริ่มเกม: เลือกข้าศึก → สร้างป้อม → นับถอยหลัง 30 วิ → สู้ → เลือก Upgrade  
- **สร้างได้ตลอดเวลา** (ทั้ง BUILD และ COMBAT phase) — Build bar แสดงตลอด
- ใน BUILD phase: นับถอยหลัง 30 วิแล้วเริ่ม COMBAT อัตโนมัติ  
  กดที่ตัวเลขเพื่อเริ่ม COMBAT ทันที
- หลัง Upgrade: กลับไปเลือกข้าศึกของ Wave ถัดไปทันที (โดยสุ่ม 3 ชุดที่ไม่ซ้ำกัน)

---

## Entity Management (Move / Upgrade / Sell)

สามารถจัดการสิ่งปลูกสร้างและป้อมปืนได้ตลอดเวลา (ทั้ง BUILD และ COMBAT phase) โดยคลิกที่สิ่งปลูกสร้าง/ป้อมปืนที่วางไว้ → จะแสดง Panel

### ปุ่มใน Panel

| ปุ่ม | คำอธิบาย |
|------|----------|
| **Move** (ย้ายที่) | ย้ายสิ่งปลูกสร้าง/ป้อมปืนไปตำแหน่งใหม่ ราคาฟรี ใช้ ESC หรือคลิกขวาเพื่อยกเลิก |
| **Upgrade** (อัปเกรด) | เฉพาะป้อม Normal Turret เท่านั้น → Heavy ($130 + 30I) หรือ → Rapid ($40 + 10I) |
| **Sell** (ขาย) | ขายทิ้งได้เงินคืน 50% (80% ถ้ามี Recycling Plant) |

### Move
- กด Move → วัตถุจะติดเมาส์ (โปร่งแสง) + แสดงพื้นที่วางได้เป็นสีเขียว/แดง
- คลิกที่ตำแหน่งใหม่ที่ถูกต้องเพื่อวาง
- ESC หรือคลิกขวาเพื่อยกเลิก (วัตถุกลับไปที่เดิม)

### Upgrade (Turrets)
- Normal Turret เท่านั้นที่อัปเกรดได้
- Heavy: $130 + 30I (DMG 40, Range 320, Fire Rate 2.2s)
- Rapid: $40 + 10I (DMG 6, Range 190, Fire Rate 0.22s)
- เมื่ออัปเกรดแล้วไม่สามารถถอยหลังได้

### Sell
- ขายได้ทั้งสิ่งปลูกสร้างและป้อมปืน
- ราคาขายขึ้นกับชนิดของสิ่งปลูกสร้าง
- Recycling Plant upgrade: ขายได้ 80% ของราคา
