/** Asteroids native resolution (vector display, approximated to 4:3) */
export const NATIVE_WIDTH = 341;
export const NATIVE_HEIGHT = 256;

export const RENDER_SCALE = 3;
export const CANVAS_WIDTH = NATIVE_WIDTH * RENDER_SCALE;   // 1023
export const CANVAS_HEIGHT = NATIVE_HEIGHT * RENDER_SCALE;  // 768

export const TARGET_FPS = 60;
export const FRAME_TIME = 1000 / TARGET_FPS;

/** Ship physics */
export const ROTATION_SPEED = 4.5; // radians per second
export const THRUST_ACCEL = 300;   // pixels/sec^2 at native scale
export const MAX_SPEED = 400;
export const DRAG = 0.005;         // velocity decay per frame
export const SHIP_RADIUS = 10;

/** Bullets */
export const BULLET_SPEED = 600;
export const MAX_BULLETS = 4;
export const BULLET_LIFETIME = 1.0; // seconds (roughly 18 frames at 60fps)

/** Hyperspace */
export const HYPERSPACE_DEATH_CHANCE = 0.25;
export const HYPERSPACE_COOLDOWN = 1.0;

/** Asteroid sizes (radius in native pixels) */
export const ASTEROID_RADIUS_LARGE = 35;
export const ASTEROID_RADIUS_MEDIUM = 18;
export const ASTEROID_RADIUS_SMALL = 9;

/** Asteroid speeds (pixels/sec at native scale) */
export const ASTEROID_SPEED_LARGE = 40;
export const ASTEROID_SPEED_MEDIUM = 70;
export const ASTEROID_SPEED_SMALL = 120;

/** Wave sizes: number of starting large asteroids per wave */
export const WAVE_SIZES = [4, 6, 8, 10, 11];

/** Saucer */
export const SAUCER_SPEED = 80;
export const SAUCER_RADIUS_LARGE = 18;
export const SAUCER_RADIUS_SMALL = 9;
export const SAUCER_SPAWN_INTERVAL = 12; // seconds
export const SAUCER_FIRE_INTERVAL = 1.5; // seconds
export const SAUCER_DIRECTION_CHANGE_INTERVAL = 1.5; // seconds

/** Colors — white vector on black */
export const COLORS = {
  background: '#000000',
  vector: '#FFFFFF',
  vectorDim: '#888888',
  text: '#FFFFFF',
  thrust: '#FF8800',
};

/** Scoring */
export const SCORE_LARGE_ASTEROID = 20;
export const SCORE_MEDIUM_ASTEROID = 50;
export const SCORE_SMALL_ASTEROID = 100;
export const SCORE_LARGE_SAUCER = 200;
export const SCORE_SMALL_SAUCER = 1000;
export const SCORE_EXTRA_LIFE = 10000;
