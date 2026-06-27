import type { Texture } from 'pixi.js';
import { useMemo } from 'react';
import { CollectibleType, GamePhase, ObstacleType } from '../game/domain/types';
import { laneToBoardColumn, trackOffsetToBoardY } from '../game/rendering/grid-layout';
import { createTileTextureOrThrow } from '../game/rendering/tile-textures';
import { TileId } from '../game/tiles/tile-atlas';
import type { CollectibleRender, ObstacleRender } from '../store/atoms/render-atoms';

interface BoardEntityLayerProps {
  tileSize: number;
  tileTexture: Texture;
  visibleRows: number;
  phase: GamePhase;
  obstacles: ObstacleRender[];
  collectibles: CollectibleRender[];
  unitsPerBoardRow: number;
}

export function BoardEntityLayer({
  tileSize,
  tileTexture,
  visibleRows,
  phase,
  obstacles,
  collectibles,
  unitsPerBoardRow,
}: BoardEntityLayerProps) {
  const sprites = useMemo(() => {
    if (phase !== GamePhase.Running) return [];

    const nextSprites: React.ReactElement[] = [];

    for (const obstacle of obstacles) {
      const column = laneToBoardColumn(obstacle.lane);
      const row = trackOffsetToBoardY(obstacle.trackOffset, visibleRows, unitsPerBoardRow);
      nextSprites.push(
        <pixiSprite
          key={obstacle.id}
          texture={createTileTextureOrThrow(tileTexture, obstacleTileId(obstacle.type))}
          x={column * tileSize}
          y={row * tileSize}
          width={tileSize}
          height={tileSize}
          cullable
        />,
      );
    }

    for (const collectible of collectibles) {
      const column = laneToBoardColumn(collectible.lane);
      const row = trackOffsetToBoardY(collectible.trackOffset, visibleRows, unitsPerBoardRow);
      nextSprites.push(
        <pixiSprite
          key={collectible.id}
          texture={createTileTextureOrThrow(tileTexture, collectibleTileId(collectible.type))}
          x={column * tileSize}
          y={row * tileSize}
          width={tileSize}
          height={tileSize}
          cullable
        />,
      );
    }

    return nextSprites;
  }, [phase, obstacles, collectibles, unitsPerBoardRow, tileSize, tileTexture, visibleRows]);

  return <pixiContainer cullableChildren>{sprites}</pixiContainer>;
}

function obstacleTileId(obstacleType: ObstacleType): TileId {
  switch (obstacleType) {
    case ObstacleType.Virus:
      return TileId.OBSTACLE_1;
    case ObstacleType.Hacker:
      return TileId.OBSTACLE_2;
    case ObstacleType.Scam:
      return TileId.OBSTACLE_3;
    case ObstacleType.FakeNews:
      return TileId.OBSTACLE_4;
    case ObstacleType.Cyberbullying:
      return TileId.OBSTACLE_5;
  }
}

function collectibleTileId(collectibleType: CollectibleType): TileId {
  switch (collectibleType) {
    case CollectibleType.AI:
      return TileId.AWARD_1;
    case CollectibleType.Cloud:
      return TileId.AWARD_2;
    case CollectibleType.STEM:
      return TileId.AWARD_3;
    case CollectibleType.DigitalCitizen:
      return TileId.AWARD_4;
    case CollectibleType.ELearning:
      return TileId.AWARD_5;
  }
}
