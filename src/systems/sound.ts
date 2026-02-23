/**
 * Asteroids sound system — procedural Web Audio API synthesis.
 * Recreates the arcade's heartbeat pulse, thrust, shots, explosions,
 * saucer drone, and extra life jingle.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;

  // Looping sounds
  private thrustOsc: OscillatorNode | null = null;
  private thrustGain: GainNode | null = null;
  private saucerOsc: OscillatorNode | null = null;
  private saucerGain: GainNode | null = null;

  // Heartbeat
  private heartbeatTimer = 0;
  private heartbeatInterval = 1.0; // seconds, speeds up as asteroids decrease
  private heartbeatToggle = false;

  ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.ensureContext();
    return this.masterGain!;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.muted) this.stopAllLoops();
  }

  isMuted(): boolean {
    return this.muted;
  }

  // ── Heartbeat (thump-thump that speeds up) ─────────────────────

  setHeartbeatRate(asteroidCount: number): void {
    // Faster heartbeat with fewer asteroids
    if (asteroidCount <= 1) this.heartbeatInterval = 0.15;
    else if (asteroidCount <= 3) this.heartbeatInterval = 0.25;
    else if (asteroidCount <= 5) this.heartbeatInterval = 0.35;
    else if (asteroidCount <= 8) this.heartbeatInterval = 0.5;
    else if (asteroidCount <= 12) this.heartbeatInterval = 0.7;
    else this.heartbeatInterval = 1.0;
  }

  updateHeartbeat(dt: number): void {
    if (this.muted) return;
    this.heartbeatTimer -= dt / 1000;
    if (this.heartbeatTimer <= 0) {
      this.heartbeatTimer = this.heartbeatInterval;
      this.playHeartbeatPulse(this.heartbeatToggle);
      this.heartbeatToggle = !this.heartbeatToggle;
    }
  }

  private playHeartbeatPulse(low: boolean): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const master = this.getMaster();
    const freq = low ? 50 : 60;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  // ── Thrust noise ───────────────────────────────────────────────

  startThrust(): void {
    if (this.muted || this.thrustOsc) return;
    const ctx = this.ensureContext();
    const master = this.getMaster();

    // White noise filtered for thrust rumble
    const bufSize = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    this.thrustGain = ctx.createGain();
    this.thrustGain.gain.value = 0.06;

    noise.connect(filter).connect(this.thrustGain).connect(master);
    noise.start();
    this.thrustOsc = noise as unknown as OscillatorNode;
  }

  stopThrust(): void {
    if (this.thrustOsc) {
      (this.thrustOsc as unknown as AudioBufferSourceNode).stop();
      (this.thrustOsc as unknown as AudioBufferSourceNode).disconnect();
      this.thrustOsc = null;
      this.thrustGain = null;
    }
  }

  // ── Shot ──────────────────────────────────────────────────────

  playShot(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const master = this.getMaster();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  // ── Explosions ────────────────────────────────────────────────

  playExplosionSmall(): void {
    this.playExplosion(0.15, 300, 80);
  }

  playExplosionMedium(): void {
    this.playExplosion(0.3, 200, 50);
  }

  playExplosionLarge(): void {
    this.playExplosion(0.5, 150, 30);
  }

  private playExplosion(duration: number, freqStart: number, freqEnd: number): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const master = this.getMaster();

    // Tone sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);

    // Noise burst
    const nDur = duration * 0.7;
    const bufSize = Math.floor(ctx.sampleRate * nDur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.08, ctx.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + nDur);
    noise.connect(nGain).connect(master);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + nDur);
  }

  // ── Saucer drone ──────────────────────────────────────────────

  startSaucerDrone(small: boolean): void {
    if (this.muted || this.saucerOsc) return;
    const ctx = this.ensureContext();
    const master = this.getMaster();

    this.saucerOsc = ctx.createOscillator();
    this.saucerGain = ctx.createGain();
    this.saucerOsc.type = 'square';
    // Small saucer = higher pitch warble
    this.saucerOsc.frequency.value = small ? 400 : 200;
    this.saucerGain.gain.value = 0.04;

    // LFO for warble effect
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = small ? 8 : 5;
    lfoGain.gain.value = small ? 100 : 50;
    lfo.connect(lfoGain).connect(this.saucerOsc.frequency);
    lfo.start();

    this.saucerOsc.connect(this.saucerGain).connect(master);
    this.saucerOsc.start();
  }

  stopSaucerDrone(): void {
    if (this.saucerOsc) {
      this.saucerOsc.stop();
      this.saucerOsc.disconnect();
      this.saucerOsc = null;
      this.saucerGain = null;
    }
  }

  // ── Extra life ────────────────────────────────────────────────

  playExtraLife(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const master = this.getMaster();

    const notes = [440, 550, 660, 880];
    for (let i = 0; i < notes.length; i++) {
      const t = ctx.currentTime + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = notes[i];
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain).connect(master);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  // ── Hyperspace ────────────────────────────────────────────────

  playHyperspace(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const master = this.getMaster();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  // ── Cleanup ───────────────────────────────────────────────────

  stopAllLoops(): void {
    this.stopThrust();
    this.stopSaucerDrone();
  }
}
