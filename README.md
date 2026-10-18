# Nia's VR World — The Magic Number Garden

A 3D, walk-around world based on **Nia & the Number Garden — Deluxe Edition** by Darnell Clark (PenGame Publishing).
Play in any modern browser on desktop, phone, tablet, or VR headset (Meta Quest, Pico).

**Play:** open `index.html` (published with GitHub Pages).

## What's inside
- Landmarks from every chapter: the Magic Gate, Addition Bridge, Fraction Field, Shape Greenhouse, Sunflower Maze, Pattern Pond, Time Flower, Math Dreams Island and more
- Nia, Freddy, Addie, Gwenda, Carlo, Subby, Milly, Skippy and friends — talk to them to start a math game
- 17 math & learning games with stars, badges and a Garden Journal; 24 golden 8s to find
- 🗺️ Tap-to-travel world map
- 🦋 AR "Catch the Number Butterfly" game with a 3D Nia
- 🥽 WebXR VR: thumbstick walking, snap turn, point-and-teleport, laser-pointer game cards
- 📚 Story Library & Bookshop

## Controls
| Device | Move | Look | Interact |
|---|---|---|---|
| Desktop | WASD / arrows (Shift = run) | drag mouse | E or click · M = map |
| Phone / tablet | on-screen joystick | drag right side | tap characters / action button |
| VR headset | left thumbstick · trigger on ground to teleport | right thumbstick snap-turns | trigger at stones/characters · A/X nearby · B/Y closes |

## Note on live features
Multiplayer presence, chat, the weekly events calendar/RSVPs, live readings and cross-device progress use the Claude artifact runtime,
so they are active on the shared Claude link. On this GitHub Pages copy the world, games, map, AR and VR all work, and progress saves in the browser.

## Editing
`index.html` is generated. Source lives in `source/`: `head.html` (styles + HUD) and `src/*.js` (scene modules, concatenated in order).
Rebuild with `python3 source/build.py` (writes `index.html`).

© PenGame Publishing, LLC. All rights reserved.
