import { Application, extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';

import { TILESHEET_PATH } from '../game/tiles/tile-atlas';
import type { GameRenderSnapshot } from '../store/game-store';
import { gameStore } from '../store/game-store';
import { BoardEntityLayer } from './board-entity-layer';
import { BoardFloorLayer } from './board-floor-layer';
import { PlayerLayer } from './player-layer';

extend({
  Container,
  Graphics,
  Sprite,
});

interface GameStageSceneProps {
  height: number;
  render: GameRenderSnapshot;
  tileSize: number;
  visibleRows: number;
  width: number;
}

export function GameStageScene({
  height,
  render,
  tileSize,
  visibleRows,
  width,
}: GameStageSceneProps) {
  const [tileTexture, setTileTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTexture() {
      try {
        const loaded = await Assets.load(TILESHEET_PATH);
        if (active && loaded instanceof Texture) {
          setTileTexture(loaded);
          const current = gameStore.getState().render;
          gameStore.getState().setRender({ ...current, renderError: null });
        }
      } catch {
        const current = gameStore.getState().render;
        gameStore.getState().setRender({ ...current, renderError: 'Tilesheet unavailable' });
      }
    }

    void loadTexture();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Application width={width} height={height} background={'#0a0f17'} antialias>
      <pixiContainer>
        {tileTexture ? (
          <>
            <BoardFloorLayer
              tileSize={tileSize}
              tileTexture={tileTexture}
              visibleRows={visibleRows}
            />
            <BoardEntityLayer
              render={render}
              tileSize={tileSize}
              tileTexture={tileTexture}
              visibleRows={visibleRows}
            />
          </>
        ) : null}
        <PlayerLayer render={render} tileSize={tileSize} visibleRows={visibleRows} />
      </pixiContainer>
    </Application>
  );
}
