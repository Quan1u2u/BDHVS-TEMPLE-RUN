import { Application, extend } from '@pixi/react';
import { getDefaultStore } from 'jotai/vanilla';
import { Assets, Container, Sprite, Texture, TextureStyle } from 'pixi.js';
import { useEffect, useState } from 'react';

import { TILESHEET_PATH } from '../game/tiles/tile-atlas';
import { renderErrorAtom } from '../store/atoms/render-atoms';
import { BoardEntityLayer } from './board-entity-layer';
import { BoardFloorLayer } from './board-floor-layer';
import { PlayerLayer } from './player-layer';

TextureStyle.defaultOptions.scaleMode = 'nearest';
extend({ Container, Sprite });

interface GameStageSceneProps {
  parentRef: React.RefObject<HTMLDivElement | null>;
}

export function GameStageScene({ parentRef }: GameStageSceneProps) {
  const [tileTexture, setTileTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let active = true;
    async function loadTexture() {
      try {
        const loaded = await Assets.load(TILESHEET_PATH);
        if (active && loaded instanceof Texture) {
          setTileTexture(loaded);
          getDefaultStore().set(renderErrorAtom, null);
        }
      } catch {
        getDefaultStore().set(renderErrorAtom, 'Tilesheet unavailable');
      }
    }
    void loadTexture();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Application
      resizeTo={parentRef}
      background="black"
      antialias
      preference="webgpu"
      roundPixels
      sharedTicker={false}
    >
      <pixiContainer>
        {tileTexture ? (
          <>
            <BoardFloorLayer tileTexture={tileTexture} />
            <BoardEntityLayer tileTexture={tileTexture} />
          </>
        ) : null}
        <PlayerLayer tileTexture={tileTexture} />
      </pixiContainer>
    </Application>
  );
}
