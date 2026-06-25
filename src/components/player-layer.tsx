import { useTick } from '@pixi/react';
import type { Sprite, Texture } from 'pixi.js';
import { useRef } from 'react';

import { GamePhase } from '../game/domain/types';
import { laneToBoardColumn, VERTICAL_PLAYER_ROW_OFFSET } from '../game/rendering/grid-layout';
import { createTileTextureOrThrow } from '../game/rendering/tile-textures';
import { TileId } from '../game/tiles/tile-atlas';
import type { GameRenderSnapshot } from '../store/game-store';

interface PlayerLayerProps {
  render: GameRenderSnapshot;
  phase: GamePhase;
  tileSize: number;
  tileTexture: Texture | null;
  visibleRows: number;
}

const hiddenPhases = new Set<GamePhase>([GamePhase.CameraPermission, GamePhase.GameOver]);

export function PlayerLayer({
  render,
  phase,
  tileSize,
  tileTexture,
  visibleRows,
}: PlayerLayerProps) {
  const column = laneToBoardColumn(render.playerLane);
  const playerRow = Math.max(0, visibleRows - VERTICAL_PLAYER_ROW_OFFSET);
  const texture = tileTexture ? createTileTextureOrThrow(tileTexture, TileId.MAIN_NPC) : null;
  const spriteRef = useRef<Sprite | null>(null);
  const baseY = playerRow * tileSize - tileSize * 0.35;

  useTick(() => {
    if (!spriteRef.current || hiddenPhases.has(phase)) {
      return;
    }

    spriteRef.current.y = baseY + Math.sin(performance.now() / 280) * tileSize * 0.08;
  });

  if (!texture || hiddenPhases.has(phase)) {
    return null;
  }

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
}
