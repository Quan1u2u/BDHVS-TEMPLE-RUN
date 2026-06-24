const STOP_FADE_MS = 500;

export const BACKGROUND_MUSIC_FILES = ['BG.mp3'] as const;
export const BONK_SFX_FILE = 'SFX_4.mp3' as const;
export const RANDOM_SFX_FILES = [
  'SFX_1.mp3',
  'SFX_2.mp3',
  'SFX_3.mp3',
  'SFX_5.mp3',
  'SFX_6.mp3',
  'SFX_7.mp3',
  'SFX_8.mp3',
  'SFX_9.mp3',
] as const;
export const SFX_FILES = [...RANDOM_SFX_FILES, BONK_SFX_FILE] as const;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private bgSource: AudioBufferSourceNode | null = null;
  private bgGain: GainNode | null = null;
  private bgIndex: number = 0;
  private pendingBgIndex: number | null = null;
  private backgroundMusicVolume = 0.24;
  private sfxVolume = 0.62;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.ctx.resume();
    }
    return this.ctx;
  }

  private async loadToBuffer(url: string, key: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load audio: ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.getContext().decodeAudioData(arrayBuffer);
    this.buffers.set(key, audioBuffer);
  }

  async preloadBackgroundMusic(): Promise<void> {
    await Promise.all(
      BACKGROUND_MUSIC_FILES.map((f) =>
        this.loadToBuffer(`/game/sound/background/${f}`, `bg:${f}`),
      ),
    );
    if (this.pendingBgIndex !== null) {
      this.startBackgroundMusic(this.pendingBgIndex);
      this.pendingBgIndex = null;
    }
  }

  async preloadSfx(): Promise<void> {
    await Promise.all(SFX_FILES.map((f) => this.loadToBuffer(`/game/sound/sfx/${f}`, `sfx:${f}`)));
  }

  private playBuffer(key: string): void {
    const buffer = this.buffers.get(key);
    if (!buffer) return;

    this.ctx?.resume();
    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = this.sfxVolume;

    source.connect(gain).connect(ctx.destination);
    source.start();
  }

  playSfx(index?: number): void {
    const idx = index ?? Math.floor(Math.random() * RANDOM_SFX_FILES.length);
    this.playBuffer(`sfx:${RANDOM_SFX_FILES[idx]}`);
  }

  playBonk(): void {
    this.playBuffer(`sfx:${BONK_SFX_FILE}`);
  }

  isBackgroundMusicPlaying(): boolean {
    return this.bgSource !== null;
  }

  // React StrictMode calls effects twice in dev, so bgIndex advances by 2 per mount
  // Won't happen in production, music will sequence correctly
  playBackgroundMusic(index?: number): void {
    if (this.bgSource && index === undefined) {
      return;
    }

    this.stopBackgroundMusic();

    const playIdx = index ?? this.bgIndex;
    this.bgIndex = (playIdx + 1) % BACKGROUND_MUSIC_FILES.length; // next

    const key = `bg:${BACKGROUND_MUSIC_FILES[playIdx]}`;
    const buffer = this.buffers.get(key);
    if (!buffer) {
      this.pendingBgIndex = playIdx;
      return;
    }

    this.startBackgroundMusic(playIdx);
  }

  private startBackgroundMusic(idx: number): void {
    this.ctx?.resume();
    const ctx = this.getContext();
    const key = `bg:${BACKGROUND_MUSIC_FILES[idx]}`;
    const buffer = this.buffers.get(key);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = false;
    source.onended = () => {
      if (this.bgSource === source) {
        this.playBackgroundMusic();
      }
    };

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(
      this.backgroundMusicVolume,
      ctx.currentTime + STOP_FADE_MS / 1000,
    );

    source.connect(gain).connect(ctx.destination);
    source.start();

    this.bgSource = source;
    this.bgGain = gain;
  }

  stopBackgroundMusic(): void {
    this.pendingBgIndex = null;
    if (this.bgSource && this.bgGain) {
      const ctx = this.getContext();
      this.bgGain.gain.setValueAtTime(this.bgGain.gain.value, ctx.currentTime);
      this.bgGain.gain.linearRampToValueAtTime(0, ctx.currentTime + STOP_FADE_MS / 1000);
      this.bgGain = null;
      const src = this.bgSource;
      this.bgSource = null;
      setTimeout(() => {
        try {
          src.stop();
        } catch {
          // already stopped
        }
      }, STOP_FADE_MS);
    }
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  applyMix(volumes: { backgroundMusicVolume: number; sfxVolume: number }): void {
    this.backgroundMusicVolume = volumes.backgroundMusicVolume;
    this.sfxVolume = volumes.sfxVolume;

    if (this.bgGain && this.ctx) {
      this.bgGain.gain.setValueAtTime(this.backgroundMusicVolume, this.ctx.currentTime);
    }
  }
}

export const soundEngine = new SoundEngine();
