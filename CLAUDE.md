# CLAUDE.md

## Build & Run Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server at http://localhost:5173
npm run build        # TypeScript compile + Vite bundle to /dist
npm run preview      # Preview production build locally
```

There are no tests or linting configured.

## Architecture

Asteroids (1979) arcade clone built with **TypeScript + HTML5 Canvas 2D**. Zero external runtime dependencies — all graphics drawn as vector lines via Canvas, all sounds synthesized via Web Audio API.

### Entry Flow

`index.html` → `src/main.ts` → `Game` constructor → FSM starts at `Attract` state → `requestAnimationFrame` loop.

### Core Game Loop

Fixed-timestep accumulator pattern: physics update at locked 60 FPS (16.67ms) while rendering runs at display refresh rate.

### Key Modules

| Directory | Purpose |
|-----------|---------|
| `src/core/` | Constants, enums, input handling, math/vector utilities |
| `src/entities/` | Ship, Asteroid (3 sizes, 4 variants), Bullet, Saucer (large/small), Debris particles |
| `src/rendering/` | Canvas 2D vector-line renderer — white on black, screen wrapping visuals |
| `src/systems/` | Level/wave configs, sound manager, collision detection, scoring |
| `src/states/` | FSM: Attract, Ready, Playing, Death, GameOver |

### Physics

Newtonian: thrust adds velocity, no friction (slight drag for playability). 72 rotation positions (5° each). Screen wraps toroidally. Max velocity capped.

### Gameplay

- Rotate left/right, thrust, fire (max 4 bullets), hyperspace (25% death chance)
- Asteroids split: Large→2 Medium, Medium→2 Small, Small→destroyed
- Two saucer types: Large (random fire), Small (aimed fire, accuracy increases with score)
- Waves: 4/6/8/10/11(max) starting large asteroids
- Heartbeat audio speeds up as fewer asteroids remain

## TypeScript Conventions

- **Strict mode** with `noUnusedLocals` and `noUnusedParameters`
- Zero use of `any`
- ES2022 target, ESNext modules, bundler resolution
- All imports use `.js` extensions for ESM compatibility
