import { Application, extend } from '@pixi/react';
import { useAtomValue } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';
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

import { TILESHEET_PATH } from '../game/tiles/tile-atlas';
import { phaseAtom } from '../store/atoms/metrics-atoms';
import {
  blockedRowsAtom,
  boardScrollOffsetRowsAtom,
  collectiblesAtom,
  obstaclesAtom,
  playerLaneAtom,
  renderErrorAtom,
  tileSizeAtom,
  unitsPerBoardRowAtom,
  visibleRowsAtom,
} from '../store/atoms/render-atoms';
import { BoardEntityLayer } from './board-entity-layer';
import { BoardFloorLayer } from './board-floor-layer';
import { PlayerLayer } from './player-layer';

TextureStyle.defaultOptions.scaleMode = 'nearest';
extensions.add(CullerPlugin);
extend({ Container, Sprite });

interface GameStageSceneProps {
  parentRef: React.RefObject<HTMLDivElement | null>;
}

export function GameStageScene({ parentRef }: GameStageSceneProps) {
  const [tileTexture, setTileTexture] = useState<Texture | null>(null);

  const phase = useAtomValue(phaseAtom);
  const playerLane = useAtomValue(playerLaneAtom);
  const boardScrollOffsetRows = useAtomValue(boardScrollOffsetRowsAtom);
  const unitsPerBoardRow = useAtomValue(unitsPerBoardRowAtom);
  const tileSize = useAtomValue(tileSizeAtom);
  const visibleRows = useAtomValue(visibleRowsAtom);
  const blockedRows = useAtomValue(blockedRowsAtom);
  const obstacles = useAtomValue(obstaclesAtom);
  const collectibles = useAtomValue(collectiblesAtom);

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
      <pixiContainer cullableChildren>
        {tileTexture ? (
          <>
            <BoardFloorLayer
              tileSize={tileSize}
              tileTexture={tileTexture}
              visibleRows={visibleRows}
              phase={phase}
              boardScrollOffsetRows={boardScrollOffsetRows}
              blockedRows={blockedRows}
              unitsPerBoardRow={unitsPerBoardRow}
            />
            <BoardEntityLayer
              tileSize={tileSize}
              tileTexture={tileTexture}
              visibleRows={visibleRows}
              phase={phase}
              obstacles={obstacles}
              collectibles={collectibles}
              unitsPerBoardRow={unitsPerBoardRow}
            />
          </>
        ) : null}
        <PlayerLayer
          tileSize={tileSize}
          tileTexture={tileTexture}
          visibleRows={visibleRows}
          phase={phase}
          playerLane={playerLane}
        />
      </pixiContainer>
    </Application>
  );
}
