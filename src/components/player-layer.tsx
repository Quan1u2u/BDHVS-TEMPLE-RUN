import { useTick } from '@pixi/react';
import type { Sprite, Texture } from 'pixi.js';
import { memo, useRef } from 'react';

import { GamePhase, type Lane } from '../game/domain/types';
import { laneToBoardColumn, VERTICAL_PLAYER_ROW_OFFSET } from '../game/rendering/grid-layout';
import { createTileTextureOrThrow } from '../game/rendering/tile-textures';
import { TileId } from '../game/tiles/tile-atlas';

interface PlayerLayerProps {
  tileSize: number;
  tileTexture: Texture | null;
  visibleRows: number;
  phase: GamePhase;
  playerLane: Lane;
}

const hiddenPhases = new Set<GamePhase>([GamePhase.Boot]);

export const PlayerLayer = memo(function PlayerLayer({
  tileSize,
  tileTexture,
  visibleRows,
  phase,
  playerLane,
}: PlayerLayerProps) {
  const column = laneToBoardColumn(playerLane);
  const playerRow = Math.max(0, visibleRows - VERTICAL_PLAYER_ROW_OFFSET);
  const texture = tileTexture ? createTileTextureOrThrow(tileTexture, TileId.MAIN_NPC) : null;
  const spriteRef = useRef<Sprite | null>(null);
  const baseY = playerRow * tileSize - tileSize * 0.35;

  useTick(() => {
    if (!spriteRef.current || hiddenPhases.has(phase)) return;
    spriteRef.current.y = baseY + Math.sin(performance.now() / 280) * tileSize * 0.08;
  });

  if (!texture || hiddenPhases.has(phase)) return null;

  return (
    <pixiSprite
      ref={spriteRef}
      texture={texture}
      x={column * tileSize - tileSize * 0.1}
      y={baseY}
      width={tileSize * 1.2}
      height={tileSize * 1.2}
    />
  );
});
