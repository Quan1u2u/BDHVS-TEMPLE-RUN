import { Application, extend } from '@pixi/react';
import {
  Assets,
  Container,
  CullerPlugin,
  extensions,
  Sprite,
  Texture,
  TextureStyle,
} from 'pixi.js';
import { useEffect, useState } from 'react';
import { GamePhase } from '../game/domain/types';
import { TILESHEET_PATH } from '../game/tiles/tile-atlas';
import type { GameRenderSnapshot } from '../store/game-store';
import { gameStore } from '../store/game-store';
import { BoardEntityLayer } from './board-entity-layer';
import { BoardFloorLayer } from './board-floor-layer';
import { PlayerLayer } from './player-layer';

TextureStyle.defaultOptions.scaleMode = 'nearest';
extensions.add(CullerPlugin);

extend({
  Container,
  Sprite,
});

interface GameStageSceneProps {
  height: number;
  phase: GamePhase;
  render: GameRenderSnapshot;
  tileSize: number;
  visibleRows: number;
  width: number;
}

export function GameStageScene({
  height,
  phase,
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
    <Application
      width={width}
      height={height}
      background="black"
      antialias
      preference="webgpu"
      roundPixels
      sharedTicker={false}
    >
      <pixiContainer cullableChildren>
        {tileTexture && phase !== GamePhase.CameraPermission && phase !== GamePhase.GameOver ? (
          <>
            <BoardFloorLayer
              render={render}
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
        <PlayerLayer
          phase={phase}
          render={render}
          tileSize={tileSize}
          tileTexture={tileTexture}
          visibleRows={visibleRows}
        />
      </pixiContainer>
    </Application>
  );
}
