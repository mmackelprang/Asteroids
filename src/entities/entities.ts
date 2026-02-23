/**
 * Asteroids game entities: Ship, Asteroid, Saucer, Bullet, Debris.
 * All positions wrap around screen edges.
 */

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, RENDER_SCALE,
  ROTATION_SPEED, THRUST_ACCEL, MAX_SPEED, DRAG,
  BULLET_SPEED, BULLET_LIFETIME,
  ASTEROID_RADIUS_LARGE, ASTEROID_RADIUS_MEDIUM, ASTEROID_RADIUS_SMALL,
  ASTEROID_SPEED_LARGE, ASTEROID_SPEED_MEDIUM, ASTEROID_SPEED_SMALL,
  SAUCER_SPEED, SAUCER_RADIUS_LARGE, SAUCER_RADIUS_SMALL,
  SAUCER_DIRECTION_CHANGE_INTERVAL,
} from '../core/constants.js';

// ── Helpers ──────────────────────────────────────────────────────

export function wrapX(x: number): number {
  if (x < 0) return x + CANVAS_WIDTH;
  if (x >= CANVAS_WIDTH) return x - CANVAS_WIDTH;
  return x;
}

export function wrapY(y: number): number {
  if (y < 0) return y + CANVAS_HEIGHT;
  if (y >= CANVAS_HEIGHT) return y - CANVAS_HEIGHT;
  return y;
}

function distWrap(x1: number, y1: number, x2: number, y2: number): number {
  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);
  if (dx > CANVAS_WIDTH / 2) dx = CANVAS_WIDTH - dx;
  if (dy > CANVAS_HEIGHT / 2) dy = CANVAS_HEIGHT - dy;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Ship ─────────────────────────────────────────────────────────

export interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;   // radians, 0 = up
  alive: boolean;
  thrusting: boolean;
  invulnerable: number; // seconds remaining of spawn invulnerability
}

export function createShip(): Ship {
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 0, vy: 0,
    angle: -Math.PI / 2, // pointing up
    alive: true,
    thrusting: false,
    invulnerable: 2.0,
  };
}

export function updateShip(ship: Ship, dt: number, turnDir: number, thrust: boolean): void {
  const dtSec = dt / 1000;

  // Rotate
  ship.angle += turnDir * ROTATION_SPEED * dtSec;

  // Thrust
  ship.thrusting = thrust;
  if (thrust) {
    ship.vx += Math.cos(ship.angle) * THRUST_ACCEL * RENDER_SCALE * dtSec;
    ship.vy += Math.sin(ship.angle) * THRUST_ACCEL * RENDER_SCALE * dtSec;
  }

  // Clamp speed
  const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
  const maxSpd = MAX_SPEED * RENDER_SCALE;
  if (speed > maxSpd) {
    ship.vx = (ship.vx / speed) * maxSpd;
    ship.vy = (ship.vy / speed) * maxSpd;
  }

  // Drag
  const drag = Math.pow(1 - DRAG, dtSec * 60);
  ship.vx *= drag;
  ship.vy *= drag;

  // Move
  ship.x = wrapX(ship.x + ship.vx * dtSec);
  ship.y = wrapY(ship.y + ship.vy * dtSec);

  // Invulnerability countdown
  if (ship.invulnerable > 0) {
    ship.invulnerable -= dtSec;
  }
}

// ── Bullet ───────────────────────────────────────────────────────

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;  // seconds remaining
  fromPlayer: boolean;
}

export function createBullet(x: number, y: number, angle: number, fromPlayer: boolean, baseVx = 0, baseVy = 0): Bullet {
  return {
    x, y,
    vx: Math.cos(angle) * BULLET_SPEED * RENDER_SCALE + (fromPlayer ? baseVx * 0.3 : 0),
    vy: Math.sin(angle) * BULLET_SPEED * RENDER_SCALE + (fromPlayer ? baseVy * 0.3 : 0),
    life: BULLET_LIFETIME,
    fromPlayer,
  };
}

export function updateBullet(b: Bullet, dt: number): void {
  const dtSec = dt / 1000;
  b.x = wrapX(b.x + b.vx * dtSec);
  b.y = wrapY(b.y + b.vy * dtSec);
  b.life -= dtSec;
}

// ── Asteroid ─────────────────────────────────────────────────────

export const enum AsteroidSize {
  Large,
  Medium,
  Small,
}

export interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: AsteroidSize;
  radius: number;
  shape: number[]; // offsets for each vertex (jaggedness)
  rotAngle: number;
  rotSpeed: number;
}

function asteroidRadius(size: AsteroidSize): number {
  switch (size) {
    case AsteroidSize.Large: return ASTEROID_RADIUS_LARGE * RENDER_SCALE;
    case AsteroidSize.Medium: return ASTEROID_RADIUS_MEDIUM * RENDER_SCALE;
    case AsteroidSize.Small: return ASTEROID_RADIUS_SMALL * RENDER_SCALE;
  }
}

function asteroidSpeed(size: AsteroidSize): number {
  switch (size) {
    case AsteroidSize.Large: return ASTEROID_SPEED_LARGE * RENDER_SCALE;
    case AsteroidSize.Medium: return ASTEROID_SPEED_MEDIUM * RENDER_SCALE;
    case AsteroidSize.Small: return ASTEROID_SPEED_SMALL * RENDER_SCALE;
  }
}

function generateAsteroidShape(): number[] {
  const verts = 10 + Math.floor(Math.random() * 4); // 10-13 vertices
  const shape: number[] = [];
  for (let i = 0; i < verts; i++) {
    shape.push(0.7 + Math.random() * 0.6); // radius multiplier 0.7-1.3
  }
  return shape;
}

export function createAsteroid(x: number, y: number, size: AsteroidSize, angle?: number): Asteroid {
  const dir = angle !== undefined ? angle : Math.random() * Math.PI * 2;
  const speed = asteroidSpeed(size) * (0.6 + Math.random() * 0.8);
  return {
    x, y,
    vx: Math.cos(dir) * speed,
    vy: Math.sin(dir) * speed,
    size,
    radius: asteroidRadius(size),
    shape: generateAsteroidShape(),
    rotAngle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 2,
  };
}

export function updateAsteroid(a: Asteroid, dt: number): void {
  const dtSec = dt / 1000;
  a.x = wrapX(a.x + a.vx * dtSec);
  a.y = wrapY(a.y + a.vy * dtSec);
  a.rotAngle += a.rotSpeed * dtSec;
}

export function splitAsteroid(a: Asteroid): Asteroid[] {
  if (a.size === AsteroidSize.Small) return [];

  const nextSize = a.size === AsteroidSize.Large ? AsteroidSize.Medium : AsteroidSize.Small;
  const angle1 = Math.random() * Math.PI * 2;
  const angle2 = angle1 + Math.PI * (0.5 + Math.random() * 1.0);

  return [
    createAsteroid(a.x, a.y, nextSize, angle1),
    createAsteroid(a.x, a.y, nextSize, angle2),
  ];
}

// ── Saucer ───────────────────────────────────────────────────────

export interface Saucer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  small: boolean;
  radius: number;
  alive: boolean;
  fireTimer: number;
  dirTimer: number;
}

export function createSaucer(small: boolean): Saucer {
  const fromLeft = Math.random() < 0.5;
  const x = fromLeft ? 0 : CANVAS_WIDTH;
  const y = Math.random() * CANVAS_HEIGHT;
  const speed = SAUCER_SPEED * RENDER_SCALE * (small ? 1.2 : 1.0);

  return {
    x, y,
    vx: (fromLeft ? 1 : -1) * speed,
    vy: (Math.random() - 0.5) * speed * 0.6,
    small,
    radius: (small ? SAUCER_RADIUS_SMALL : SAUCER_RADIUS_LARGE) * RENDER_SCALE,
    alive: true,
    fireTimer: 1.0 + Math.random(),
    dirTimer: SAUCER_DIRECTION_CHANGE_INTERVAL,
  };
}

export function updateSaucer(s: Saucer, dt: number): void {
  const dtSec = dt / 1000;
  s.x = wrapX(s.x + s.vx * dtSec);
  s.y = wrapY(s.y + s.vy * dtSec);
  s.fireTimer -= dtSec;
  s.dirTimer -= dtSec;

  // Change vertical direction periodically
  if (s.dirTimer <= 0) {
    s.dirTimer = SAUCER_DIRECTION_CHANGE_INTERVAL * (0.7 + Math.random() * 0.6);
    const speed = Math.abs(s.vx);
    s.vy = (Math.random() - 0.5) * speed * 0.8;
  }
}

export function saucerFireAngle(s: Saucer, ship: Ship): number {
  if (s.small) {
    // Small saucer aims at player with some inaccuracy
    const dx = ship.x - s.x;
    const dy = ship.y - s.y;
    return Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
  } else {
    // Large saucer fires randomly
    return Math.random() * Math.PI * 2;
  }
}

// ── Debris (explosion particles) ─────────────────────────────────

export interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  len: number;
  angle: number;
}

export function createDebris(x: number, y: number, count: number, spread: number): Debris[] {
  const debris: Debris[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = (30 + Math.random() * spread) * RENDER_SCALE;
    debris.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 0.5 + Math.random() * 0.8,
      len: (3 + Math.random() * 6) * RENDER_SCALE,
      angle: Math.random() * Math.PI * 2,
    });
  }
  return debris;
}

export function updateDebris(d: Debris, dt: number): void {
  const dtSec = dt / 1000;
  d.x += d.vx * dtSec;
  d.y += d.vy * dtSec;
  d.life -= dtSec;
}

// ── Collision ────────────────────────────────────────────────────

export function circleCollision(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number,
): boolean {
  return distWrap(x1, y1, x2, y2) < r1 + r2;
}
