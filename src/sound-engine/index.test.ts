import { describe, expect, it } from 'vitest';

import { BACKGROUND_MUSIC_FILES, BONK_SFX_FILE, RANDOM_SFX_FILES, SFX_FILES } from './index';

describe('sound manifest', () => {
  it('keeps the bonk sound out of the random SFX pool', () => {
    expect(SFX_FILES).toContain(BONK_SFX_FILE);
    expect(RANDOM_SFX_FILES).not.toContain(BONK_SFX_FILE);
  });

  it('defines at least one looping background music file', () => {
    expect(BACKGROUND_MUSIC_FILES.length).toBeGreaterThan(0);
  });
});
