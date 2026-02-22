/** Asteroids native resolution (vector display, approximated to 4:3) */
export const NATIVE_WIDTH = 341;
export const NATIVE_HEIGHT = 256;

export const RENDER_SCALE = 3;
export const CANVAS_WIDTH = NATIVE_WIDTH * RENDER_SCALE;   // 1024 (approx)
export const CANVAS_HEIGHT = NATIVE_HEIGHT * RENDER_SCALE;  // 768

export const TARGET_FPS = 60;
export const FRAME_TIME = 1000 / TARGET_FPS;

/** Ship physics */
export const ROTATION_STEPS = 72;
export const ROTATION_ANGLE = (Math.PI * 2) / ROTATION_STEPS; // 5 degrees
export const THRUST_ACCEL = 150;
export const MAX_SPEED = 300;
export const DRAG = 0.002;
export const BULLET_SPEED = 500;
export const MAX_BULLETS = 4;
export const BULLET_LIFETIME = 18; // frames

/** Hyperspace */
export const HYPERSPACE_DEATH_CHANCE = 0.25;

/** Asteroid speeds (pixels/sec at native) */
export const ASTEROID_SPEED_LARGE = 30;
export const ASTEROID_SPEED_MEDIUM = 60;
export const ASTEROID_SPEED_SMALL = 100;

/** Wave sizes: number of starting large asteroids */
export const WAVE_SIZES = [4, 6, 8, 10, 11];

/** Colors — white vector on black */
export const COLORS = {
  background: '#000000',
  vector: '#FFFFFF',
  text: '#FFFFFF',
};

/** Scoring */
export const SCORE_LARGE_ASTEROID = 20;
export const SCORE_MEDIUM_ASTEROID = 50;
export const SCORE_SMALL_ASTEROID = 100;
export const SCORE_LARGE_SAUCER = 200;
export const SCORE_SMALL_SAUCER = 1000;
export const SCORE_EXTRA_LIFE = 10000;
