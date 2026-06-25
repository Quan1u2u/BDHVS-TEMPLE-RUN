import { laneToBoardColumn, VERTICAL_PLAYER_ROW_OFFSET } from '../game/rendering/grid-layout';
import type { GameRenderSnapshot } from '../store/game-store';

interface PlayerLayerProps {
  render: GameRenderSnapshot;
  tileSize: number;
  visibleRows: number;
}

export function PlayerLayer({ render, tileSize, visibleRows }: PlayerLayerProps) {
  const column = laneToBoardColumn(render.playerLane);
  const playerRow = Math.max(0, visibleRows - VERTICAL_PLAYER_ROW_OFFSET);

  return (
    <pixiGraphics
      draw={(graphics) => {
        graphics.clear();
        graphics.roundRect(
          column * tileSize + tileSize * 0.1,
          playerRow * tileSize + tileSize * 0.15,
          tileSize * 0.8,
          tileSize * 0.8,
          tileSize * 0.2,
        );
        graphics.fill({ color: '#59d0ff' });
        graphics.circle(
          column * tileSize + tileSize * 0.5,
          playerRow * tileSize + tileSize * 0.25,
          tileSize * 0.2,
        );
        graphics.fill({ color: '#f7fbff' });
      }}
    />
  );
}
