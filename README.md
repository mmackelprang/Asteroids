# Asteroids

A faithful TypeScript recreation of Atari's **Asteroids** (1979), the legendary vector space shooter designed by Ed Logg and Lyle Rains.

Built with Canvas 2D and Web Audio API — zero runtime dependencies, no sprite sheets, no audio files. All vector graphics and sounds are generated procedurally.

## Play

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Controls

| Key | Action |
|-----|--------|
| Left/Right Arrow (or A/D) | Rotate ship |
| Up Arrow (or W) | Thrust |
| Down Arrow / S / Shift | Hyperspace (25% death chance) |
| Space | Fire (max 4 bullets) |
| M | Toggle mute |

## Gameplay

You pilot a small triangular ship in the middle of an asteroid field. Asteroids drift across the screen and wrap around the edges. Shoot them to break them apart — large asteroids split into two medium ones, medium into two small ones. Clear all asteroids to advance to the next wave with even more rocks.

### Enemies

- **Large Asteroid** (20 pts) — Slow-moving, splits into 2 medium asteroids
- **Medium Asteroid** (50 pts) — Moderate speed, splits into 2 small asteroids
- **Small Asteroid** (100 pts) — Fast and hard to hit
- **Large Saucer** (200 pts) — Fires randomly, appears periodically
- **Small Saucer** (1,000 pts) — Fires aimed shots at you, appears at higher scores

### Features

- **Newtonian physics** — Ship has inertia; thrust accelerates, drag slowly decelerates
- **Screen wrap** — Ship, asteroids, bullets, and saucers wrap around all edges
- **Hyperspace** — Emergency teleport to random position (25% chance of death)
- **Heartbeat pulse** — Accelerating thump-thump that speeds up as fewer asteroids remain
- **Wave progression** — 4, 6, 8, 10, then 11 starting asteroids per wave
- **Extra lives** — Every 10,000 points

## Architecture

| Module | Purpose |
|--------|---------|
| `src/game.ts` | Main orchestrator — FSM states, input, scoring, spawning, collisions |
| `src/entities/entities.ts` | Ship, Asteroid, Saucer, Bullet, Debris — physics and AI |
| `src/rendering/renderer.ts` | Vector-style Canvas 2D drawing with glow effects |
| `src/systems/sound.ts` | Web Audio procedural synthesis — heartbeat, thrust, shots, explosions, saucer |
| `src/states/` | Generic FSM: Attract, Playing, Death, GameOver |

### Technical Highlights

- **Wrap-around collision** — Distance calculations account for screen wrapping
- **Procedural asteroid shapes** — 10-13 vertex jagged polygons with random radius multipliers
- **Saucer AI** — Large saucer fires randomly; small saucer aims at player with slight inaccuracy
- **Heartbeat tempo** — Pulse rate scales inversely with asteroid count for mounting tension
- **Fixed-timestep accumulator** — Physics locked at 60 FPS, rendering at display refresh rate
- **3x render scale** — 1023x768 canvas (341x256 native) for crisp vector aesthetics

## History

Asteroids was released by Atari in November 1979, designed by Ed Logg and Lyle Rains. It became one of the most successful arcade games of all time and Atari's best-selling coin-op, surpassing even Space Invaders in the United States. The game was built on Atari's Digital Vector Generator (DVG) hardware, rendering crisp white lines on a black CRT.

The game's revolutionary features included its Newtonian physics model (one of the first in arcade gaming), the hyperspace escape mechanic, and screen-edge wrapping. It used a 6502 processor at 1.512 MHz with the DVG handling vector rendering. The original cabinet featured the iconic black-and-white vector display that gave the game its distinctive visual style.

Asteroids introduced the concept of the high score initial entry (3 letters), which became a standard feature of arcade games throughout the 1980s.

## Build

```bash
npm run build     # TypeScript compile + Vite bundle to /dist
npm run preview   # Preview production build
```

## License

MIT
