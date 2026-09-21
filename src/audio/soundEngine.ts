// Web Audio API procedural sound engine (Zero external audio assets required, guaranteed instant playback)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];

  constructor() {
    // Pure in-memory state (Zero persistent data stored)
    this.isMuted = false;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Soft organic bubble tap pop
  public playTap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Warm marimba note (freq in Hz)
  public playNote(freq: number, duration: number = 0.4, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    // Warm wooden marimba envelope: fast attack, warm exponential decay
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Add subtle warm overtone
    const overtone = this.ctx.createOscillator();
    const overtoneGain = this.ctx.createGain();
    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, now);
    overtoneGain.gain.setValueAtTime(0.001, now);
    overtoneGain.gain.linearRampToValueAtTime(0.06, now + 0.01);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.5);

    overtone.connect(overtoneGain);
    overtoneGain.connect(this.ctx.destination);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + duration);
    overtone.stop(now + duration);
  }

  // Cheerful correct chime arpeggio
  public playCorrect() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 0.45, 'sine');
      }, idx * 70);
    });
  }

  // Soft neutral wooden thud (gentle, not harsh or buzzing)
  public playIncorrect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Victory fanfare
  public playVictory() {
    if (this.isMuted) return;
    const melody = [
      { f: 523.25, d: 90 }, // C5
      { f: 659.25, d: 90 }, // E5
      { f: 783.99, d: 90 }, // G5
      { f: 1046.5, d: 250 }, // C6
    ];
    let time = 0;
    melody.forEach((item) => {
      setTimeout(() => {
        this.playNote(item.f, item.d / 1000 + 0.3, 'sine');
      }, time);
      time += item.d + 30;
    });
  }

  // Calming ambient chord for Breathing Bubble
  public startAmbientHum() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.stopAmbientHum();

    const now = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, now);
    this.ambientGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
    this.ambientGain.connect(this.ctx.destination);

    // Warm chord (F3, C4, A4)
    const freqs = [174.61, 261.63, 440.0];
    this.ambientOscs = freqs.map((f) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.connect(this.ambientGain!);
      osc.start(now);
      return osc;
    });
  }

  public stopAmbientHum() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.linearRampToValueAtTime(0.001, now + 1.0);
    setTimeout(() => {
      this.ambientOscs.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // ignore if already stopped
        }
      });
      this.ambientOscs = [];
      this.ambientGain = null;
    }, 1100);
  }
}

export const sounds = new SoundEngine();
