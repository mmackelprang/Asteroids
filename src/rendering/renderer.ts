/**
 * Asteroids renderer — white vector lines on black, with wrap-around drawing.
 */

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, RENDER_SCALE, COLORS,
} from '../core/constants.js';
import {
  Ship, Asteroid, Saucer, Bullet, Debris,
} from '../entities/entities.js';

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  // ── Main gameplay render ──────────────────────────────────────

  renderPlaying(
    ship: Ship,
    asteroids: Asteroid[],
    bullets: Bullet[],
    saucer: Saucer | null,
    debris: Debris[],
    score: number,
    highScore: number,
    lives: number,
  ): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Asteroids
    for (const a of asteroids) {
      this.drawAsteroid(a);
    }

    // Saucer
    if (saucer && saucer.alive) {
      this.drawSaucer(saucer);
    }

    // Bullets
    for (const b of bullets) {
      this.drawBullet(b);
    }

    // Ship
    if (ship.alive) {
      this.drawShip(ship);
    }

    // Debris
    for (const d of debris) {
      if (d.life > 0) {
        this.drawDebris(d);
      }
    }

    // HUD
    this.drawHud(score, highScore, lives);
  }

  // ── Ship ──────────────────────────────────────────────────────

  private drawShip(ship: Ship): void {
    const { ctx } = this;

    // Blink during invulnerability
    if (ship.invulnerable > 0 && Math.sin(ship.invulnerable * 20) > 0) return;

    const size = 12 * RENDER_SCALE;
    const cos = Math.cos(ship.angle);
    const sin = Math.sin(ship.angle);

    // Ship triangle: nose, left wing, notch, right wing
    const nose = { x: cos * size, y: sin * size };
    const leftWing = {
      x: Math.cos(ship.angle + 2.4) * size * 0.9,
      y: Math.sin(ship.angle + 2.4) * size * 0.9,
    };
    const rightWing = {
      x: Math.cos(ship.angle - 2.4) * size * 0.9,
      y: Math.sin(ship.angle - 2.4) * size * 0.9,
    };
    const notch = {
      x: -cos * size * 0.4,
      y: -sin * size * 0.4,
    };

    ctx.strokeStyle = COLORS.vector;
    ctx.lineWidth = 1.5 * RENDER_SCALE;
    ctx.shadowColor = COLORS.vector;
    ctx.shadowBlur = 3;

    ctx.beginPath();
    ctx.moveTo(ship.x + nose.x, ship.y + nose.y);
    ctx.lineTo(ship.x + leftWing.x, ship.y + leftWing.y);
    ctx.lineTo(ship.x + notch.x, ship.y + notch.y);
    ctx.lineTo(ship.x + rightWing.x, ship.y + rightWing.y);
    ctx.closePath();
    ctx.stroke();

    // Thrust flame
    if (ship.thrusting && Math.random() > 0.3) {
      const flameLen = (8 + Math.random() * 8) * RENDER_SCALE;
      ctx.strokeStyle = COLORS.thrust;
      ctx.shadowColor = COLORS.thrust;
      ctx.beginPath();
      ctx.moveTo(
        ship.x + Math.cos(ship.angle + 2.6) * size * 0.5,
        ship.y + Math.sin(ship.angle + 2.6) * size * 0.5,
      );
      ctx.lineTo(
        ship.x - cos * flameLen,
        ship.y - sin * flameLen,
      );
      ctx.lineTo(
        ship.x + Math.cos(ship.angle - 2.6) * size * 0.5,
        ship.y + Math.sin(ship.angle - 2.6) * size * 0.5,
      );
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  // ── Asteroid ──────────────────────────────────────────────────

  private drawAsteroid(a: Asteroid): void {
    const { ctx } = this;
    const verts = a.shape.length;

    ctx.strokeStyle = COLORS.vector;
    ctx.lineWidth = 1.5 * RENDER_SCALE;
    ctx.shadowColor = COLORS.vector;
    ctx.shadowBlur = 2;

    ctx.beginPath();
    for (let i = 0; i <= verts; i++) {
      const idx = i % verts;
      const angle = a.rotAngle + (idx / verts) * Math.PI * 2;
      const r = a.radius * a.shape[idx];
      const px = a.x + Math.cos(angle) * r;
      const py = a.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Saucer ────────────────────────────────────────────────────

  private drawSaucer(s: Saucer): void {
    const { ctx } = this;
    const r = s.radius;
    const h = r * 0.5;

    ctx.strokeStyle = COLORS.vector;
    ctx.lineWidth = 1.5 * RENDER_SCALE;
    ctx.shadowColor = COLORS.vector;
    ctx.shadowBlur = 3;

    // Body (top half ellipse + bottom half)
    ctx.beginPath();
    // Main body — flat ellipse
    ctx.moveTo(s.x - r, s.y);
    ctx.lineTo(s.x - r * 0.5, s.y - h);
    ctx.lineTo(s.x + r * 0.5, s.y - h);
    ctx.lineTo(s.x + r, s.y);
    ctx.lineTo(s.x + r * 0.5, s.y + h * 0.6);
    ctx.lineTo(s.x - r * 0.5, s.y + h * 0.6);
    ctx.closePath();
    ctx.stroke();

    // Dome
    ctx.beginPath();
    ctx.moveTo(s.x - r * 0.3, s.y - h);
    ctx.lineTo(s.x - r * 0.15, s.y - h * 1.6);
    ctx.lineTo(s.x + r * 0.15, s.y - h * 1.6);
    ctx.lineTo(s.x + r * 0.3, s.y - h);
    ctx.stroke();

    // Center line
    ctx.beginPath();
    ctx.moveTo(s.x - r, s.y);
    ctx.lineTo(s.x + r, s.y);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  // ── Bullet ────────────────────────────────────────────────────

  private drawBullet(b: Bullet): void {
    const { ctx } = this;
    const size = 2 * RENDER_SCALE;
    ctx.fillStyle = COLORS.vector;
    ctx.shadowColor = COLORS.vector;
    ctx.shadowBlur = 4;
    ctx.fillRect(b.x - size / 2, b.y - size / 2, size, size);
    ctx.shadowBlur = 0;
  }

  // ── Debris ────────────────────────────────────────────────────

  private drawDebris(d: Debris): void {
    const { ctx } = this;
    const alpha = Math.max(0, d.life);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1 * RENDER_SCALE;
    ctx.beginPath();
    ctx.moveTo(
      d.x + Math.cos(d.angle) * d.len * 0.5,
      d.y + Math.sin(d.angle) * d.len * 0.5,
    );
    ctx.lineTo(
      d.x - Math.cos(d.angle) * d.len * 0.5,
      d.y - Math.sin(d.angle) * d.len * 0.5,
    );
    ctx.stroke();
  }

  // ── HUD ───────────────────────────────────────────────────────

  private drawHud(score: number, highScore: number, lives: number): void {
    const { ctx } = this;
    const fontSize = 14 * RENDER_SCALE;
    const smallFontSize = 10 * RENDER_SCALE;

    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLORS.text;
    ctx.shadowBlur = 0;

    // Score — top-left
    const pad = 10 * RENDER_SCALE;
    ctx.textAlign = 'left';
    ctx.fillText(score.toString().padStart(6, ' '), pad, pad);

    // High score — top-center
    ctx.textAlign = 'center';
    ctx.font = `bold ${smallFontSize}px "Courier New", monospace`;
    ctx.fillStyle = COLORS.vectorDim;
    ctx.fillText(highScore.toString().padStart(6, ' '), CANVAS_WIDTH / 2, pad);

    // Lives — small ship icons below score
    ctx.strokeStyle = COLORS.vector;
    ctx.lineWidth = 1 * RENDER_SCALE;
    const lifeSize = 8 * RENDER_SCALE;
    for (let i = 0; i < Math.min(lives - 1, 5); i++) {
      const lx = pad + 15 * RENDER_SCALE + i * 22 * RENDER_SCALE;
      const ly = pad + fontSize + 5 * RENDER_SCALE;

      // Small ship icon pointing up
      ctx.beginPath();
      ctx.moveTo(lx, ly - lifeSize);
      ctx.lineTo(lx - lifeSize * 0.6, ly + lifeSize * 0.5);
      ctx.lineTo(lx, ly + lifeSize * 0.15);
      ctx.lineTo(lx + lifeSize * 0.6, ly + lifeSize * 0.5);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // ── Attract screen ────────────────────────────────────────────

  renderAttract(highScore: number, time: number): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    const titleSize = 48 * RENDER_SCALE;
    ctx.font = `bold ${titleSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.vector;
    ctx.shadowColor = COLORS.vector;
    ctx.shadowBlur = 15;
    ctx.fillText('ASTEROIDS', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.25);
    ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.3;
    ctx.fillText('ASTEROIDS', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.25);
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // Scoring table
    const tableSize = 12 * RENDER_SCALE;
    ctx.font = `${tableSize}px "Courier New", monospace`;
    ctx.fillStyle = COLORS.vectorDim;
    const tableY = CANVAS_HEIGHT * 0.42;
    const lineH = 18 * RENDER_SCALE;
    const items = [
      ['LARGE ASTEROID', '20'],
      ['MEDIUM ASTEROID', '50'],
      ['SMALL ASTEROID', '100'],
      ['LARGE SAUCER', '200'],
      ['SMALL SAUCER', '1000'],
    ];
    for (let i = 0; i < items.length; i++) {
      ctx.textAlign = 'right';
      ctx.fillText(items[i][0], CANVAS_WIDTH * 0.52, tableY + i * lineH);
      ctx.textAlign = 'left';
      ctx.fillText(items[i][1], CANVAS_WIDTH * 0.55, tableY + i * lineH);
    }

    // High score
    const scoreFontSize = 14 * RENDER_SCALE;
    ctx.font = `bold ${scoreFontSize}px "Courier New", monospace`;
    ctx.fillStyle = COLORS.vectorDim;
    ctx.textAlign = 'center';
    ctx.fillText(`HIGH SCORE  ${highScore.toString().padStart(6, ' ')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.72);

    // Blink prompt
    if (Math.sin(time * 4) > 0) {
      ctx.fillStyle = COLORS.vector;
      ctx.shadowColor = COLORS.vector;
      ctx.shadowBlur = 4;
      ctx.fillText('PUSH START', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.82);
      ctx.shadowBlur = 0;
    }

    // Copyright
    const smallSize = 10 * RENDER_SCALE;
    ctx.font = `${smallSize}px "Courier New", monospace`;
    ctx.fillStyle = COLORS.vectorDim;
    ctx.fillText('\u00A9 1979 ATARI INC', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.92);
  }

  // ── Game Over ─────────────────────────────────────────────────

  renderGameOver(score: number, highScore: number): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const titleSize = 32 * RENDER_SCALE;
    ctx.font = `bold ${titleSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.vector;
    ctx.shadowColor = COLORS.vector;
    ctx.shadowBlur = 10;
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.35);
    ctx.shadowBlur = 0;

    const scoreFontSize = 16 * RENDER_SCALE;
    ctx.font = `bold ${scoreFontSize}px "Courier New", monospace`;
    ctx.fillText(`SCORE  ${score.toString().padStart(6, ' ')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.50);

    const isNewHigh = score >= highScore && score > 0;
    ctx.fillStyle = isNewHigh ? '#FFFF00' : COLORS.vectorDim;
    if (isNewHigh) {
      ctx.fillText('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.58);
    } else {
      ctx.fillText(`HIGH   ${highScore.toString().padStart(6, ' ')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.58);
    }

    const smallSize = 12 * RENDER_SCALE;
    ctx.font = `bold ${smallSize}px "Courier New", monospace`;
    ctx.fillStyle = COLORS.vector;
    ctx.fillText('PRESS ANY KEY', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.72);
  }
}
