import { StateMachine } from './states/state-machine.js';
import { InputManager } from './core/input.js';
import { SoundManager } from './systems/sound.js';
import { Renderer } from './rendering/renderer.js';
import {
  Asteroid, AsteroidSize, Saucer, Bullet, Debris,
  createShip, updateShip, createBullet, updateBullet,
  createAsteroid, updateAsteroid, splitAsteroid,
  createSaucer, updateSaucer, saucerFireAngle,
  createDebris, updateDebris, circleCollision,
} from './entities/entities.js';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_TIME, RENDER_SCALE,
  MAX_BULLETS, SHIP_RADIUS,
  WAVE_SIZES, SAUCER_SPAWN_INTERVAL, SAUCER_FIRE_INTERVAL,
  HYPERSPACE_DEATH_CHANCE, HYPERSPACE_COOLDOWN,
  SCORE_LARGE_ASTEROID, SCORE_MEDIUM_ASTEROID, SCORE_SMALL_ASTEROID,
  SCORE_LARGE_SAUCER, SCORE_SMALL_SAUCER, SCORE_EXTRA_LIFE,
} from './core/constants.js';

const STORAGE_KEY = 'asteroids_high_score';

type GameStateKey = 'attract' | 'playing' | 'death' | 'gameOver';

export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly input: InputManager;
  readonly sound: SoundManager;
  readonly renderer: Renderer;
  readonly fsm: StateMachine<GameStateKey, Game>;

  // Game entities
  ship = createShip();
  asteroids: Asteroid[] = [];
  bullets: Bullet[] = [];
  saucer: Saucer | null = null;
  debris: Debris[] = [];

  // Scoring / lives
  score = 0;
  highScore = 0;
  lives = 3;
  wave = 0;

  // Timers
  saucerTimer = SAUCER_SPAWN_INTERVAL;
  hyperspaceCooldown = 0;
  stateTimer = 0;
  attractTime = 0;
  waveDelay = 0; // delay before next wave spawns

  // Fixed timestep
  private lastTime = 0;
  private accumulator = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.input = new InputManager();
    this.sound = new SoundManager();
    this.renderer = new Renderer(this.ctx);
    this.fsm = new StateMachine<GameStateKey, Game>(this);

    this.highScore = this.loadHighScore();

    this.registerStates();
    this.scaleCanvas();
    window.addEventListener('resize', () => this.scaleCanvas());

    this.fsm.transition('attract');
    requestAnimationFrame((t) => this.loop(t));
  }

  // ── High score persistence ──────────────────────────────────────

  private loadHighScore(): number {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v ? parseInt(v, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.highScore.toString());
    } catch { /* ignore */ }
  }

  // ── Scoring ─────────────────────────────────────────────────────

  addScore(points: number): void {
    const oldThreshold = Math.floor(this.score / SCORE_EXTRA_LIFE);
    this.score += points;
    const newThreshold = Math.floor(this.score / SCORE_EXTRA_LIFE);

    if (newThreshold > oldThreshold) {
      this.lives++;
      this.sound.playExtraLife();
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }

  // ── New game ────────────────────────────────────────────────────

  startNewGame(): void {
    this.score = 0;
    this.lives = 3;
    this.wave = 0;
    this.asteroids = [];
    this.bullets = [];
    this.saucer = null;
    this.debris = [];
    this.saucerTimer = SAUCER_SPAWN_INTERVAL;
    this.ship = createShip();
    this.spawnWave();
  }

  // ── Wave spawning ──────────────────────────────────────────────

  private spawnWave(): void {
    const numLarge = WAVE_SIZES[Math.min(this.wave, WAVE_SIZES.length - 1)];
    this.wave++;

    for (let i = 0; i < numLarge; i++) {
      // Spawn far from player
      let x: number, y: number;
      do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
      } while (
        Math.abs(x - this.ship.x) < 150 * RENDER_SCALE &&
        Math.abs(y - this.ship.y) < 150 * RENDER_SCALE
      );

      this.asteroids.push(createAsteroid(x, y, AsteroidSize.Large));
    }
  }

  // ── Input handling ─────────────────────────────────────────────

  private handlePlayingInput(dt: number): void {
    if (!this.ship.alive) return;
    const dtSec = dt / 1000;

    // Rotation
    let turnDir = 0;
    if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('KeyA')) turnDir = -1;
    else if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('KeyD')) turnDir = 1;

    // Thrust
    const thrust = this.input.isKeyDown('ArrowUp') || this.input.isKeyDown('KeyW');

    updateShip(this.ship, dt, turnDir, thrust);

    // Thrust sound
    if (thrust) {
      this.sound.startThrust();
    } else {
      this.sound.stopThrust();
    }

    // Fire
    if (this.input.isAnyKeyPressed('Space')) {
      const playerBullets = this.bullets.filter(b => b.fromPlayer).length;
      if (playerBullets < MAX_BULLETS) {
        const tipX = this.ship.x + Math.cos(this.ship.angle) * SHIP_RADIUS * RENDER_SCALE;
        const tipY = this.ship.y + Math.sin(this.ship.angle) * SHIP_RADIUS * RENDER_SCALE;
        this.bullets.push(createBullet(tipX, tipY, this.ship.angle, true, this.ship.vx, this.ship.vy));
        this.sound.playShot();
      }
    }

    // Hyperspace
    if (this.input.isAnyKeyPressed('ShiftLeft') || this.input.isAnyKeyPressed('ShiftRight') ||
        this.input.isAnyKeyPressed('ArrowDown') || this.input.isAnyKeyPressed('KeyS')) {
      if (this.hyperspaceCooldown <= 0) {
        this.hyperspaceCooldown = HYPERSPACE_COOLDOWN;
        this.sound.playHyperspace();

        if (Math.random() < HYPERSPACE_DEATH_CHANCE) {
          // Hyperspace death
          this.debris.push(...createDebris(this.ship.x, this.ship.y, 8, 60));
          this.ship.alive = false;
          this.sound.stopThrust();
          this.fsm.transition('death');
          return;
        }

        // Teleport to random position
        this.ship.x = Math.random() * CANVAS_WIDTH;
        this.ship.y = Math.random() * CANVAS_HEIGHT;
        this.ship.invulnerable = 1.0;
      }
    }

    if (this.hyperspaceCooldown > 0) {
      this.hyperspaceCooldown -= dtSec;
    }

    // Mute toggle
    if (this.input.isAnyKeyPressed('KeyM')) {
      this.sound.toggleMute();
      if (this.sound.isMuted()) {
        this.sound.stopThrust();
      }
    }
  }

  // ── Collision detection ────────────────────────────────────────

  private checkCollisions(): void {
    // Bullets vs Asteroids
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const a = this.asteroids[ai];
        if (circleCollision(b.x, b.y, 3 * RENDER_SCALE, a.x, a.y, a.radius)) {
          this.bullets.splice(bi, 1);
          this.asteroids.splice(ai, 1);

          // Score (only player bullets score)
          if (b.fromPlayer) {
            switch (a.size) {
              case AsteroidSize.Large:
                this.addScore(SCORE_LARGE_ASTEROID);
                this.sound.playExplosionLarge();
                break;
              case AsteroidSize.Medium:
                this.addScore(SCORE_MEDIUM_ASTEROID);
                this.sound.playExplosionMedium();
                break;
              case AsteroidSize.Small:
                this.addScore(SCORE_SMALL_ASTEROID);
                this.sound.playExplosionSmall();
                break;
            }
          }

          // Split
          const children = splitAsteroid(a);
          this.asteroids.push(...children);

          // Debris
          const debrisCount = a.size === AsteroidSize.Large ? 8 : a.size === AsteroidSize.Medium ? 6 : 4;
          this.debris.push(...createDebris(a.x, a.y, debrisCount, 80));

          break; // bullet consumed
        }
      }
    }

    // Bullets vs Saucer
    if (this.saucer && this.saucer.alive) {
      for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
        const b = this.bullets[bi];
        if (!b.fromPlayer) continue;
        if (circleCollision(b.x, b.y, 3 * RENDER_SCALE, this.saucer.x, this.saucer.y, this.saucer.radius)) {
          this.bullets.splice(bi, 1);
          this.addScore(this.saucer.small ? SCORE_SMALL_SAUCER : SCORE_LARGE_SAUCER);
          this.debris.push(...createDebris(this.saucer.x, this.saucer.y, 10, 100));
          this.sound.playExplosionLarge();
          this.sound.stopSaucerDrone();
          this.saucer.alive = false;
          this.saucer = null;
          break;
        }
      }
    }

    // Ship vs Asteroids
    if (this.ship.alive && this.ship.invulnerable <= 0) {
      for (const a of this.asteroids) {
        if (circleCollision(this.ship.x, this.ship.y, SHIP_RADIUS * RENDER_SCALE, a.x, a.y, a.radius)) {
          this.playerDeath();
          return;
        }
      }
    }

    // Ship vs Saucer
    if (this.ship.alive && this.ship.invulnerable <= 0 && this.saucer && this.saucer.alive) {
      if (circleCollision(this.ship.x, this.ship.y, SHIP_RADIUS * RENDER_SCALE, this.saucer.x, this.saucer.y, this.saucer.radius)) {
        this.playerDeath();
        return;
      }
    }

    // Saucer bullets vs Ship
    if (this.ship.alive && this.ship.invulnerable <= 0) {
      for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
        const b = this.bullets[bi];
        if (b.fromPlayer) continue;
        if (circleCollision(b.x, b.y, 3 * RENDER_SCALE, this.ship.x, this.ship.y, SHIP_RADIUS * RENDER_SCALE)) {
          this.bullets.splice(bi, 1);
          this.playerDeath();
          return;
        }
      }
    }
  }

  private playerDeath(): void {
    if (!this.ship.alive) return;
    this.ship.alive = false;
    this.debris.push(...createDebris(this.ship.x, this.ship.y, 10, 80));
    this.sound.playExplosionMedium();
    this.sound.stopThrust();
    this.fsm.transition('death');
  }

  // ── Saucer management ─────────────────────────────────────────

  private updateSaucer(dt: number): void {
    const dtSec = dt / 1000;

    if (!this.saucer) {
      this.saucerTimer -= dtSec;
      if (this.saucerTimer <= 0) {
        // Small saucer more likely at higher scores
        const isSmall = this.score >= 40000 || (this.score >= 10000 && Math.random() < 0.5);
        this.saucer = createSaucer(isSmall);
        this.sound.startSaucerDrone(isSmall);
        this.saucerTimer = SAUCER_SPAWN_INTERVAL * (0.7 + Math.random() * 0.6);
      }
      return;
    }

    if (!this.saucer.alive) {
      this.saucer = null;
      return;
    }

    updateSaucer(this.saucer, dt);

    // Saucer fires at player
    if (this.saucer.fireTimer <= 0 && this.ship.alive) {
      this.saucer.fireTimer = SAUCER_FIRE_INTERVAL * (0.8 + Math.random() * 0.4);
      const angle = saucerFireAngle(this.saucer, this.ship);
      this.bullets.push(createBullet(this.saucer.x, this.saucer.y, angle, false));
    }

    // Despawn saucer if it's been around too long (off screen check)
    // Simple: after ~15 seconds alive, remove it
  }

  // ── State registration ──────────────────────────────────────────

  private registerStates(): void {
    // ── Attract ──────────────────────
    this.fsm.register('attract', {
      enter: (g) => {
        g.attractTime = 0;
        g.sound.stopAllLoops();
      },
      update: (g, dt) => {
        g.attractTime += dt / 1000;
        if (g.input.isAnyKeyPressed()) {
          g.sound.ensureContext();
          g.startNewGame();
          g.fsm.transition('playing');
        }
      },
      render: (g) => {
        g.renderer.renderAttract(g.highScore, g.attractTime);
      },
    });

    // ── Playing ──────────────────────
    this.fsm.register('playing', {
      update: (g, dt) => {
        const dtSec = dt / 1000;

        // Input
        g.handlePlayingInput(dt);

        // Update bullets
        for (let i = g.bullets.length - 1; i >= 0; i--) {
          updateBullet(g.bullets[i], dt);
          if (g.bullets[i].life <= 0) {
            g.bullets.splice(i, 1);
          }
        }

        // Update asteroids
        for (const a of g.asteroids) {
          updateAsteroid(a, dt);
        }

        // Update saucer
        g.updateSaucer(dt);

        // Update debris
        for (const d of g.debris) {
          updateDebris(d, dt);
        }
        g.debris = g.debris.filter(d => d.life > 0);

        // Collision detection
        g.checkCollisions();

        // Heartbeat
        g.sound.setHeartbeatRate(g.asteroids.length);
        g.sound.updateHeartbeat(dt);

        // Check wave completion
        if (g.asteroids.length === 0 && !g.saucer) {
          g.waveDelay -= dtSec;
          if (g.waveDelay <= 0) {
            g.spawnWave();
            g.waveDelay = 2.0;
          }
        } else {
          g.waveDelay = 2.0;
        }
      },
      render: (g) => {
        g.renderer.renderPlaying(
          g.ship,
          g.asteroids,
          g.bullets,
          g.saucer,
          g.debris,
          g.score,
          g.highScore,
          g.lives,
        );
      },
    });

    // ── Death ────────────────────────
    this.fsm.register('death', {
      enter: (g) => {
        g.stateTimer = 0;
        g.sound.stopSaucerDrone();
        if (g.saucer) {
          g.saucer.alive = false;
          g.saucer = null;
        }
      },
      update: (g, dt) => {
        g.stateTimer += dt;

        // Update debris during death
        for (const d of g.debris) {
          updateDebris(d, dt);
        }
        g.debris = g.debris.filter(d => d.life > 0);

        // Update asteroids still moving
        for (const a of g.asteroids) {
          updateAsteroid(a, dt);
        }

        if (g.stateTimer >= 2000) {
          g.lives--;
          if (g.lives <= 0) {
            g.fsm.transition('gameOver');
          } else {
            // Respawn
            g.ship = createShip();
            g.bullets = [];
            g.saucerTimer = SAUCER_SPAWN_INTERVAL;
            g.fsm.transition('playing');
          }
        }
      },
      render: (g) => {
        g.renderer.renderPlaying(
          g.ship,
          g.asteroids,
          g.bullets,
          g.saucer,
          g.debris,
          g.score,
          g.highScore,
          g.lives,
        );
      },
    });

    // ── Game Over ────────────────────
    this.fsm.register('gameOver', {
      enter: (g) => {
        g.stateTimer = 0;
        g.sound.stopAllLoops();
      },
      update: (g, dt) => {
        g.stateTimer += dt;
        if (g.stateTimer >= 2000 && g.input.isAnyKeyPressed()) {
          g.fsm.transition('attract');
        }
      },
      render: (g) => {
        g.renderer.renderGameOver(g.score, g.highScore);
      },
    });
  }

  // ── Canvas scaling ──────────────────────────────────────────────

  private scaleCanvas(): void {
    const scaleX = window.innerWidth / this.canvas.width;
    const scaleY = window.innerHeight / this.canvas.height;
    const scale = Math.min(scaleX, scaleY);
    this.canvas.style.width = `${this.canvas.width * scale}px`;
    this.canvas.style.height = `${this.canvas.height * scale}px`;
  }

  // ── Main loop ───────────────────────────────────────────────────

  private loop(time: number): void {
    const delta = time - this.lastTime;
    this.lastTime = time;
    this.accumulator += Math.min(delta, 100);

    while (this.accumulator >= FRAME_TIME) {
      this.fsm.update(FRAME_TIME);
      this.input.endFrame();
      this.accumulator -= FRAME_TIME;
    }

    this.fsm.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}
