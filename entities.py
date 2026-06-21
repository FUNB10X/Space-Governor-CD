import math
import random
import pygame
from core import *

# ==========================================
# 1. PARTICLES & FLOATING TEXTS
# ==========================================
class Particle:
    def __init__(self, x, y, col, vx=None, vy=None, size=3, life=40):
        self.x = float(x)
        self.y = float(y)
        self.col = col
        self.vx = vx if vx is not None else random.uniform(-2, 2)
        self.vy = vy if vy is not None else random.uniform(-2, 2)
        self.size = size
        self.life = random.randint(life // 2, life)
        self.max_life = self.life

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.05  # Slight gravity
        self.life -= 1

    def draw(self, surf, cam_x, cam_y):
        if self.life <= 0:
            return
        alpha = int((self.life / self.max_life) * 255)
        # Handle alpha draw in Pygame
        size = max(1, int(self.size * (self.life / self.max_life)))
        pos = (int(self.x - cam_x), int(self.y - cam_y))
        
        # Draw particle
        c = (self.col[0], self.col[1], self.col[2])
        pygame.draw.circle(surf, c, pos, size)

class FloatingText:
    def __init__(self, x, y, text, col, font_key='s'):
        self.x = float(x)
        self.y = float(y)
        self.text = text
        self.col = col
        self.life = 60
        self.max_life = 60
        self.font_key = font_key

    def update(self):
        self.y -= 0.6
        self.life -= 1

    def draw(self, surf, font_dict, cam_x, cam_y):
        if self.life <= 0:
            return
        alpha = int((self.life / self.max_life) * 255)
        font = font_dict[self.font_key]
        
        # Render text with alpha fade
        text_surf = font.render(self.text, True, self.col)
        # Create alpha-capable surface copy
        alpha_surf = text_surf.copy()
        alpha_surf.fill((255, 255, 255, alpha), special_flags=pygame.BLEND_RGBA_MULT)
        
        rect = alpha_surf.get_rect(center=(int(self.x - cam_x), int(self.y - cam_y)))
        surf.blit(alpha_surf, rect)

# ==========================================
# 2. BASE ENTITY & STRUCTURES
# ==========================================
class Structure:
    def __init__(self, stype, x, y, wall_hp_mult=1.0):
        self.stype = stype
        self.x = float(x)
        self.y = float(y)
        self.size = 28  # Collision radius
        self.upgrade_level = 1
        
        # Stats based on type
        if stype == 'house':
            self.hp = 120
            self.max_hp = 120
            self.name = "House"
        elif stype == 'iron_mine':
            self.hp = 180
            self.max_hp = 180
            self.name = "Iron Mine"
        elif stype == 'coal_mine':
            self.hp = 180
            self.max_hp = 180
            self.name = "Coal Mine"
        elif stype == 'park':
            self.hp = 150
            self.max_hp = 150
            self.name = "Park"
        elif stype == 'wall':
            base_hp = 250
            self.max_hp = int(base_hp * wall_hp_mult)
            self.hp = self.max_hp
            self.size = 20  # Smaller radius for walls to pack them
            self.name = "Wall"
            
    def draw(self, surf, cam_x, cam_y, tick):
        screen_x = int(self.x - cam_x)
        screen_y = int(self.y - cam_y)
        
        # Check if onscreen
        if not (-100 <= screen_x <= SW + 100 and -100 <= screen_y <= SH + 100):
            return

        # Selection/Health bar
        if self.hp < self.max_hp:
            bar_w = 40
            bar_h = 4
            pygame.draw.rect(surf, (60, 10, 10), (screen_x - bar_w//2, screen_y - 25, bar_w, bar_h))
            ratio = max(0.0, self.hp / self.max_hp)
            pygame.draw.rect(surf, (0, 225, 100) if ratio > 0.5 else (225, 120, 0), (screen_x - bar_w//2, screen_y - 25, int(bar_w * ratio), bar_h))

        # Render visual models
        if self.stype == 'house':
            # Futuristic Habitat Pod
            # Outer ring shadow
            pygame.draw.circle(surf, (15, 10, 10), (screen_x, screen_y), 24)
            # Habitat main dome
            pygame.draw.circle(surf, (220, 220, 240), (screen_x, screen_y), 20)
            pygame.draw.circle(surf, HOLO_BLUE, (screen_x, screen_y), 20, 2)
            # Solar panel roof patterns
            pygame.draw.arc(surf, (40, 60, 100), (screen_x - 14, screen_y - 14, 28, 28), 0, math.pi * 2, 3)
            # Center communication hub
            pygame.draw.circle(surf, HOLO_ORANGE, (screen_x, screen_y), 4)
            
        elif self.stype == 'iron_mine':
            # Excavator/Drill Rig
            pygame.draw.rect(surf, (50, 50, 60), (screen_x - 18, screen_y - 18, 36, 36), border_radius=4)
            pygame.draw.rect(surf, MARS_RUST, (screen_x - 15, screen_y - 15, 30, 30), border_radius=3)
            # Spinning Drill core
            drill_angle = (tick * 0.15)
            dx = int(math.cos(drill_angle) * 8)
            dy = int(math.sin(drill_angle) * 8)
            pygame.draw.line(surf, (220, 220, 255), (screen_x - dx, screen_y - dy), (screen_x + dx, screen_y + dy), 4)
            # Warning lights
            if (tick // 15) % 2 == 0:
                pygame.draw.circle(surf, HOLO_ORANGE, (screen_x - 12, screen_y - 12), 2)
                pygame.draw.circle(surf, HOLO_ORANGE, (screen_x + 12, screen_y + 12), 2)

        elif self.stype == 'coal_mine':
            # Furnace extractor
            pygame.draw.rect(surf, (40, 40, 40), (screen_x - 18, screen_y - 18, 36, 36), border_radius=5)
            pygame.draw.circle(surf, (80, 80, 85), (screen_x, screen_y), 14)
            # Burning coal fire glow
            glow_rad = int(8 + abs(math.sin(tick * 0.1)) * 4)
            pygame.draw.circle(surf, (255, 60, 0), (screen_x, screen_y), glow_rad)
            pygame.draw.circle(surf, GOLD, (screen_x, screen_y), glow_rad - 4)
            # Smoke stacks
            pygame.draw.rect(surf, (30, 30, 30), (screen_x - 14, screen_y - 20, 6, 8))
            pygame.draw.rect(surf, (30, 30, 30), (screen_x + 8, screen_y - 20, 6, 8))

        elif self.stype == 'park':
            # Eco-Dome Biosphere
            # Glass floor
            pygame.draw.circle(surf, (10, 40, 20), (screen_x, screen_y), 22)
            # Glass dome outline
            pygame.draw.circle(surf, HOLO_GREEN, (screen_x, screen_y), 22, 2)
            # Internal tree/greenery
            pygame.draw.circle(surf, (34, 139, 34), (screen_x - 4, screen_y - 4), 8)
            pygame.draw.circle(surf, (50, 205, 50), (screen_x + 4, screen_y + 4), 6)
            pygame.draw.circle(surf, (0, 100, 0), (screen_x, screen_y + 4), 7)
            # Water pond
            pygame.draw.circle(surf, (0, 191, 255), (screen_x - 6, screen_y + 6), 4)

        elif self.stype == 'wall':
            # Heavy carbon steel shield
            pygame.draw.circle(surf, (80, 85, 100), (screen_x, screen_y), 15)
            pygame.draw.circle(surf, (40, 45, 55), (screen_x, screen_y), 12)
            pygame.draw.circle(surf, MARS_RUST, (screen_x, screen_y), 8)
            # Cross brace details
            pygame.draw.line(surf, (100, 105, 120), (screen_x - 10, screen_y), (screen_x + 10, screen_y), 2)
            pygame.draw.line(surf, (100, 105, 120), (screen_x, screen_y - 10), (screen_x, screen_y + 10), 2)

# ==========================================
# 3. DEFENSE TURRETS
# ==========================================
class Turret:
    def __init__(self, ttype, x, y, turret_cost_mult=1.0, normal_rate_mult=1.0, heavy_dmg_mult=1.0, range_mult=1.0, global_rate_mult=1.0):
        self.ttype = ttype
        self.x = float(x)
        self.y = float(y)
        self.size = 24
        self.angle = 0.0
        self.cooldown_timer = 0.0
        self.target = None
        self.hp = 200
        self.max_hp = 200
        
        # Stats based on upgrades
        if ttype == 'normal':
            self.name = "Normal Turret"
            self.cost = int(120 * turret_cost_mult)
            self.rng = int(220 * range_mult)
            self.dmg = 12
            self.fire_rate = 0.8 * normal_rate_mult * global_rate_mult  # Seconds per shot
        elif ttype == 'heavy':
            self.name = "High Damage Turret"
            self.cost = int(250 * turret_cost_mult)
            self.rng = int(320 * range_mult)
            self.dmg = int(40 * heavy_dmg_mult)
            self.fire_rate = 2.2 * global_rate_mult  # Seconds per shot

    def update(self, dt, enemies, projectiles):
        if self.cooldown_timer > 0:
            self.cooldown_timer -= dt

        # Find target (closest enemy in range)
        self.target = None
        closest_dist = float('inf')
        for e in enemies:
            if e.hp > 0:
                dist = math.hypot(e.x - self.x, e.y - self.y)
                if dist <= self.rng and dist < closest_dist:
                    closest_dist = dist
                    self.target = e

        if self.target:
            # Rotate towards target
            self.angle = math.atan2(self.target.y - self.y, self.target.x - self.x)
            
            # Fire when cooled down
            if self.cooldown_timer <= 0:
                self.cooldown_timer = self.fire_rate
                # Spawn projectile
                projectiles.append(Projectile(self.x, self.y, self.target, self.dmg, self.ttype))
                if self.ttype == 'normal':
                    play_sfx('shoot_normal')
                else:
                    play_sfx('shoot_heavy')

    def draw(self, surf, cam_x, cam_y, is_hovered=False):
        screen_x = int(self.x - cam_x)
        screen_y = int(self.y - cam_y)
        
        # Check if onscreen
        if not (-100 <= screen_x <= SW + 100 and -100 <= screen_y <= SH + 100):
            return

        # Render range circle if hovered
        if is_hovered:
            range_surf = pygame.Surface((self.rng * 2, self.rng * 2), pygame.SRCALPHA)
            pygame.draw.circle(range_surf, (0, 140, 255, 20), (self.rng, self.rng), self.rng)
            pygame.draw.circle(range_surf, (0, 140, 255, 60), (self.rng, self.rng), self.rng, 1)
            surf.blit(range_surf, (screen_x - self.rng, screen_y - self.rng))

        # HP Bar
        if self.hp < self.max_hp:
            bar_w = 40
            bar_h = 4
            pygame.draw.rect(surf, (60, 10, 10), (screen_x - bar_w//2, screen_y - 25, bar_w, bar_h))
            ratio = max(0.0, self.hp / self.max_hp)
            pygame.draw.rect(surf, (0, 225, 100) if ratio > 0.5 else (225, 120, 0), (screen_x - bar_w//2, screen_y - 25, int(bar_w * ratio), bar_h))

        # Turret Base (Grounded generator)
        pygame.draw.circle(surf, (40, 42, 50), (screen_x, screen_y), 18)
        pygame.draw.circle(surf, (80, 85, 95), (screen_x, screen_y), 14)
        
        # Turret Rotator Head
        # Calculations for gun barrel
        barrel_len = 22 if self.ttype == 'normal' else 26
        bx = int(math.cos(self.angle) * barrel_len)
        by = int(math.sin(self.angle) * barrel_len)
        
        # Draw barrel
        if self.ttype == 'normal':
            pygame.draw.line(surf, (150, 155, 165), (screen_x, screen_y), (screen_x + bx, screen_y + by), 5)
            pygame.draw.circle(surf, HOLO_BLUE, (screen_x, screen_y), 10)
            pygame.draw.circle(surf, (220, 220, 220), (screen_x, screen_y), 6)
        else:
            # Double heavy barrel
            ox = int(math.cos(self.angle + math.pi/2) * 4)
            oy = int(math.sin(self.angle + math.pi/2) * 4)
            pygame.draw.line(surf, (100, 105, 115), (screen_x - ox, screen_y - oy), (screen_x + bx - ox, screen_y + by - oy), 4)
            pygame.draw.line(surf, (100, 105, 115), (screen_x + ox, screen_y + oy), (screen_x + bx + ox, screen_y + by + oy), 4)
            # Glowing core
            pygame.draw.circle(surf, (60, 62, 70), (screen_x, screen_y), 12)
            pygame.draw.circle(surf, RED_ALERT, (screen_x, screen_y), 7)
            # Charging particle indicators
            if self.cooldown_timer > 0:
                charge_ratio = 1.0 - (self.cooldown_timer / self.fire_rate)
                pygame.draw.circle(surf, GOLD, (screen_x, screen_y), int(7 * charge_ratio))

# ==========================================
# 4. PROJECTILES
# ==========================================
class Projectile:
    def __init__(self, x, y, target, dmg, ptype):
        self.x = float(x)
        self.y = float(y)
        self.target = target
        self.dmg = dmg
        self.ptype = ptype
        self.spd = 450.0 if ptype == 'normal' else 300.0  # Pixels per second
        self.alive = True
        
    def update(self, dt, particles):
        if not self.target or self.target.hp <= 0:
            # Target dead, vanish projectile
            self.alive = False
            return

        dx = self.target.x - self.x
        dy = self.target.y - self.y
        dist = math.hypot(dx, dy)
        
        if dist < 12:
            # Hit! Apply damage
            self.target.hp -= self.dmg
            self.alive = False
            
            # Hit particles
            col = HOLO_BLUE if self.ptype == 'normal' else RED_ALERT
            for _ in range(8):
                particles.append(Particle(self.target.x, self.target.y, col))
            return

        # Move towards target
        self.x += (dx / dist) * self.spd * dt
        self.y += (dy / dist) * self.spd * dt
        
        # Engine trail particles
        if random.random() < 0.3:
            col = (200, 220, 255) if self.ptype == 'normal' else (255, 150, 50)
            particles.append(Particle(self.x, self.y, col, vx=0, vy=0, size=2, life=15))

    def draw(self, surf, cam_x, cam_y):
        screen_x = int(self.x - cam_x)
        screen_y = int(self.y - cam_y)
        
        if self.ptype == 'normal':
            pygame.draw.circle(surf, HOLO_BLUE, (screen_x, screen_y), 4)
            pygame.draw.circle(surf, WHITE, (screen_x, screen_y), 2)
        else:
            # Large heavy plasma ball
            pygame.draw.circle(surf, RED_ALERT, (screen_x, screen_y), 8)
            pygame.draw.circle(surf, GOLD, (screen_x, screen_y), 5)
            pygame.draw.circle(surf, WHITE, (screen_x, screen_y), 2)

# ==========================================
# 5. ENEMIES
# ==========================================
class Enemy:
    def __init__(self, etype, wave_num):
        # Spawn from the left side (enemy base), ±LANE_W/2 vertically
        self.x = float(ENEMY_BASE_X + random.randint(0, 40))
        self.y = float(LANE_Y + random.uniform(-LANE_W * 0.35, LANE_W * 0.35))
        
        self.etype = etype
        self.size = 20
        self.wall_attack_timer = 0.0
        self.dome_attack_timer = 0.0
        self.reached_dome = False
        
        # Wave health scaling (+10% health per wave)
        hp_scalar = 1.0 + (wave_num - 1) * 0.1
        
        if etype == 'A':
            self.name = "Scout Drone"
            self.max_hp = int(30 * hp_scalar)
            self.hp = self.max_hp
            self.spd = 85.0  # Pixels per second
            self.dmg = 12    # Attack damage to walls/dome
            self.rew_money = 15
            self.rew_iron = 3
            self.rew_coal = 2
        elif etype == 'B':
            self.name = "Heavy Crawler"
            self.max_hp = int(90 * hp_scalar)
            self.hp = self.max_hp
            self.spd = 50.0
            self.dmg = 30
            self.rew_money = 35
            self.rew_iron = 10
            self.rew_coal = 6
        elif etype == 'C':
            self.name = "Siege Titan"
            self.max_hp = int(200 * hp_scalar)
            self.hp = self.max_hp
            self.spd = 35.0
            self.dmg = 50
            self.rew_money = 80
            self.rew_iron = 25
            self.rew_coal = 15

    def update(self, dt, dome, structures, turrets, particles, floating_texts, dome_dmg_mult=1.0):
        if self.hp <= 0:
            # Generate rewards
            play_sfx('explosion')
            # Particles burst
            col = HOLO_ORANGE if self.etype == 'A' else RED_ALERT
            for _ in range(12):
                particles.append(Particle(self.x, self.y, col, size=4, life=50))
            # Floating cash indicator
            floating_texts.append(FloatingText(self.x, self.y - 10, f"+${self.rew_money}", GOLD))
            return False  # Dead

        # --- Movement: walk right toward the rectangular Dome gate ---
        target_x = float(CITY_ZONE_X + 20)
        target_y = float(DOME_Y)

        dx = target_x - self.x
        dy = target_y - self.y
        dist_to_target = math.hypot(dx, dy)

        # Check if reached the city/dome danger zone.
        inside_dome_rect = (
            CITY_ZONE_X <= self.x <= MW
            and abs(self.y - DOME_Y) <= DOME_RADIUS
        )
        if inside_dome_rect:
            self.reached_dome = True
            self.dome_attack_timer += dt

            if self.dome_attack_timer >= 1.0:
                ticks = int(self.dome_attack_timer)
                self.dome_attack_timer -= ticks

                dmg_per_tick = int(100 * dome_dmg_mult)
                dmg_dealt = dmg_per_tick * ticks
                dome.hp = max(0, dome.hp - dmg_dealt)
                play_sfx('dome_hit')
                for _ in range(8):
                    particles.append(Particle(self.x, self.y, RED_ALERT, size=4, life=50))
                floating_texts.append(FloatingText(self.x, self.y - 12, f"-{dmg_dealt} HP", RED_ALERT))

            return False


        # Check for blocking WALLS ahead (only walls on lane matter)
        blocked = False
        blocking_wall = None
        for s in structures:
            if s.stype == 'wall' and s.hp > 0:
                dist_to_wall = math.hypot(s.x - self.x, s.y - self.y)
                if dist_to_wall <= (self.size + s.size + 4):
                    # Only block if wall is ahead (to the right of enemy)
                    if s.x > self.x - 10:
                        blocked = True
                        blocking_wall = s
                        break

        if blocked and blocking_wall:
            # Attack Wall
            self.wall_attack_timer += dt
            if self.wall_attack_timer >= 1.0:
                self.wall_attack_timer = 0.0
                blocking_wall.hp = max(0, blocking_wall.hp - self.dmg)
                play_sfx('dome_hit')
                for _ in range(4):
                    particles.append(Particle(blocking_wall.x, blocking_wall.y, MARS_RUST))
            return True

        # Walk toward dome entry (mostly rightward, slight Y correction)
        if dist_to_target > 5:
            self.x += (dx / dist_to_target) * self.spd * dt
            # Clamp Y to lane corridor
            self.y += (dy / dist_to_target) * self.spd * dt * 0.3
            self.y = max(LANE_Y - LANE_W, min(LANE_Y + LANE_W, self.y))
        return True

    def draw(self, surf, cam_x, cam_y, tick):
        screen_x = int(self.x - cam_x)
        screen_y = int(self.y - cam_y)
        
        # Check if onscreen
        if not (-50 <= screen_x <= SW + 50 and -50 <= screen_y <= SH + 50):
            return

        # HP Bar
        bar_w = 26
        bar_h = 3
        pygame.draw.rect(surf, (60, 10, 10), (screen_x - bar_w//2, screen_y - 20, bar_w, bar_h))
        ratio = max(0.0, self.hp / self.max_hp)
        pygame.draw.rect(surf, (225, 40, 40), (screen_x - bar_w//2, screen_y - 20, int(bar_w * ratio), bar_h))

        # Draw enemy model
        if self.etype == 'A':
            # Swift Hover Probe
            bob = int(math.sin(tick * 0.2) * 3)
            # Glowing core engine glow
            pygame.draw.circle(surf, (40, 10, 5), (screen_x, screen_y + bob + 8), 6)
            pygame.draw.circle(surf, HOLO_ORANGE, (screen_x, screen_y + bob + 8), 3)
            # Metallic hover body
            pygame.draw.ellipse(surf, (80, 80, 85), (screen_x - 12, screen_y - 8 + bob, 24, 16))
            pygame.draw.circle(surf, HOLO_ORANGE, (screen_x, screen_y - 2 + bob), 5)
            pygame.draw.circle(surf, WHITE, (screen_x, screen_y - 2 + bob), 2)
            
        elif self.etype == 'B':
            # Heavy Armored Spider Crawler
            # Legs details
            leg_extend = int(4 * abs(math.sin(tick * 0.1)))
            pygame.draw.line(surf, (40, 40, 45), (screen_x, screen_y), (screen_x - 16 - leg_extend, screen_y - 8), 3)
            pygame.draw.line(surf, (40, 40, 45), (screen_x, screen_y), (screen_x + 16 + leg_extend, screen_y - 8), 3)
            pygame.draw.line(surf, (40, 40, 45), (screen_x, screen_y), (screen_x - 18 - leg_extend, screen_y + 8), 3)
            pygame.draw.line(surf, (40, 40, 45), (screen_x, screen_y), (screen_x + 18 + leg_extend, screen_y + 8), 3)
            # Main hull plates
            pygame.draw.circle(surf, (50, 52, 60), (screen_x, screen_y), 16)
            pygame.draw.circle(surf, RED_ALERT, (screen_x, screen_y), 10)
            # Shield visor
            pygame.draw.rect(surf, (20, 20, 20), (screen_x - 8, screen_y - 8, 16, 4))
            pygame.draw.rect(surf, GOLD, (screen_x - 4, screen_y - 8, 8, 2))
            
        elif self.etype == 'C':
            # Siege Titan - massive walking fortress
            # Heavy footsteps shake
            step_offset = int(abs(math.sin(tick * 0.08)) * 3)
            # Legs
            pygame.draw.line(surf, (60, 60, 70), (screen_x - 14, screen_y + 8), (screen_x - 20, screen_y + 18 + step_offset), 5)
            pygame.draw.line(surf, (60, 60, 70), (screen_x + 14, screen_y + 8), (screen_x + 20, screen_y + 18 + step_offset), 5)
            # Main body - massive armor
            pygame.draw.circle(surf, (40, 42, 50), (screen_x, screen_y), 22)
            pygame.draw.circle(surf, (70, 75, 85), (screen_x, screen_y), 18)
            pygame.draw.circle(surf, (100, 105, 115), (screen_x, screen_y), 14)
            # Core reactor glow
            pulse = 0.5 + 0.5 * math.sin(tick * 0.12)
            reactor_col = (int(200 * pulse), int(50 * pulse), 0)
            pygame.draw.circle(surf, reactor_col, (screen_x, screen_y), 6)
            pygame.draw.circle(surf, GOLD, (screen_x, screen_y), 3)
            # Shoulder cannons
            pygame.draw.circle(surf, (50, 52, 60), (screen_x - 18, screen_y - 6), 6)
            pygame.draw.circle(surf, (50, 52, 60), (screen_x + 18, screen_y - 6), 6)
            pygame.draw.circle(surf, RED_ALERT, (screen_x - 18, screen_y - 6), 3)
            pygame.draw.circle(surf, RED_ALERT, (screen_x + 18, screen_y - 6), 3)
