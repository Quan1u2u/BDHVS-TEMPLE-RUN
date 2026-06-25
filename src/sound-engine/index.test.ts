import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BACKGROUND_MUSIC_FILES,
  BONK_SFX_FILE,
  RANDOM_SFX_FILES,
  SFX_FILES,
  SoundEngine,
} from './index';

describe('sound manifest', () => {
  it('keeps the bonk sound out of the random SFX pool', () => {
    expect(SFX_FILES).toContain(BONK_SFX_FILE);
    expect(RANDOM_SFX_FILES).not.toContain(BONK_SFX_FILE);
  });

  it('defines at least one looping background music file', () => {
    expect(BACKGROUND_MUSIC_FILES.length).toBeGreaterThan(0);
  });
});

describe('sound engine behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts SFX playback immediately when the buffer is ready', () => {
    const engine = new SoundEngine();
    const start = vi.fn();
    const resume = vi.fn().mockResolvedValue(undefined);
    const createGain = () =>
      ({
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn().mockReturnThis(),
      }) as unknown as GainNode;
    const createBufferSource = () =>
      ({
        connect: vi.fn().mockReturnThis(),
        start,
      }) as unknown as AudioBufferSourceNode;
    const audioContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume,
      createGain,
      createBufferSource,
      decodeAudioData: vi.fn(),
    } as unknown as AudioContext;

    function FakeAudioContext() {
      return audioContext;
    }

    vi.stubGlobal('AudioContext', FakeAudioContext);
    (engine as unknown as { buffers: Map<string, AudioBuffer> }).buffers.set(
      'sfx:SFX_1.mp3',
      {} as AudioBuffer,
    );

    engine.playSfx(0);

    expect(start).toHaveBeenCalledOnce();
  });

  it('stops background music and does not auto-restart after game over style stop', () => {
    const engine = new SoundEngine();
    const start = vi.fn();
    const stop = vi.fn();
    const createGain = () =>
      ({
        gain: {
          value: 0.24,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn().mockReturnThis(),
      }) as unknown as GainNode;
    const createBufferSource = () =>
      ({
        connect: vi.fn().mockReturnThis(),
        start,
        stop,
        onended: null,
        loop: false,
      }) as unknown as AudioBufferSourceNode;
    const audioContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createGain,
      createBufferSource,
      decodeAudioData: vi.fn(),
    } as unknown as AudioContext;

    function FakeAudioContext() {
      return audioContext;
    }

    vi.stubGlobal('AudioContext', FakeAudioContext);
    (engine as unknown as { buffers: Map<string, AudioBuffer> }).buffers.set(
      'bg:BG.mp3',
      {} as AudioBuffer,
    );

    engine.playBackgroundMusic(0);
    engine.stopBackgroundMusic();
    vi.runAllTimers();

    expect(stop).toHaveBeenCalledOnce();
    expect(engine.isBackgroundMusicPlaying()).toBe(false);
  });

  it('preloads audio data without constructing AudioContext until the run starts', async () => {
    const engine = new SoundEngine();
    const arrayBuffer = new ArrayBuffer(8);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
    });
    const audioContextCtor = vi.fn(function FakeAudioContext() {
      return {
        state: 'suspended',
        currentTime: 0,
        destination: {},
        resume: vi.fn().mockResolvedValue(undefined),
        createGain: vi.fn(),
        createBufferSource: vi.fn(),
        decodeAudioData: vi.fn().mockResolvedValue({}),
      };
    });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('AudioContext', audioContextCtor);

    await engine.preloadSfx();

    expect(audioContextCtor).not.toHaveBeenCalled();

    await engine.unlockAudio();

    expect(audioContextCtor).toHaveBeenCalledOnce();
  });

  it('pauses and resumes background music with fade state', async () => {
    const engine = new SoundEngine();
    const suspend = vi.fn().mockResolvedValue(undefined);
    const resume = vi.fn().mockResolvedValue(undefined);
    const createGain = () =>
      ({
        gain: {
          value: 0.24,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn().mockReturnThis(),
      }) as unknown as GainNode;
    const createBufferSource = () =>
      ({
        connect: vi.fn().mockReturnThis(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
        loop: false,
      }) as unknown as AudioBufferSourceNode;
    const audioContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      suspend,
      resume,
      createGain,
      createBufferSource,
      decodeAudioData: vi.fn(),
    } as unknown as AudioContext;

    function FakeAudioContext() {
      return audioContext;
    }

    vi.stubGlobal('AudioContext', FakeAudioContext);
    (engine as unknown as { buffers: Map<string, AudioBuffer> }).buffers.set(
      'bg:BG.mp3',
      {} as AudioBuffer,
    );

    engine.playBackgroundMusic(0);
    engine.pauseBackgroundMusic();
    vi.runAllTimers();
    expect(engine.isBackgroundMusicPaused()).toBe(true);
    expect(suspend).toHaveBeenCalledOnce();

    await engine.resumeBackgroundMusic();
    expect(engine.isBackgroundMusicPaused()).toBe(false);
    expect(resume).toHaveBeenCalled();
  });
});
