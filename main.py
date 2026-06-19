"""
Space Governor CD. (ผู้ว่าอวกาศ 2067) — root entry point.
Run: python main.py
"""
import os
import sys
import pygame

# Set Cwd to current folder
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Import configuration and screens
from core import SW, SH, FPS
import screens

def main():
    # Set Window Title
    pygame.display.set_caption("ผู้ว่าอวกาศ 2067 — Space Governor CD.")
    
    # Initialize main screen buffer
    screen = pygame.display.set_mode((SW, SH))
    
    # Game clock
    clock = pygame.time.Clock()
    
    # Load profile options configuration
    from core import load_profile
    load_profile()
    
    # Start Main Menu loop
    screens.menu(screen, clock)

if __name__ == '__main__':
    main()