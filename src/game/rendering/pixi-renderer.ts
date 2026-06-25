import {
  Application,
  Assets,
  Color,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from 'pixi.js';

import { WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { type Lane, ObstacleType } from '../domain/types';
import type { WorldRuntimeState } from '../domain/world';
import { getTileFrame, TILE_SIZE_PX, TileId } from '../tiles/tile-atlas';

export interface RendererPort {
  mount: (host: HTMLElement) => Promise<void>;
  render: (world: WorldRuntimeState) => void;
  destroy: () => Promise<void>;
}

export class PixiRenderer implements RendererPort {
  private static app: Application | null = null;
  private static root: Container | null = null;
  private static background: Graphics | null = null;
  private static lanes: Graphics | null = null;
  private static runner: Graphics | null = null;
  private static entities: Container | null = null;
  private static tileTexture: Texture | null = null;

  public async mount(host: HTMLElement): Promise<void> {
    if (PixiRenderer.app) {
      return;
    }

    const app = new Application();
    await app.init({
      antialias: true,
      autoDensity: true,
      backgroundColor: new Color('#09111d'),
      resizeTo: host,
    });

    const root = new Container();
    const background = new Graphics();
    const lanes = new Graphics();
    const runner = new Graphics();
    const entities = new Container();

    root.addChild(background, lanes, entities, runner);
    app.stage.addChild(root);
    host.appendChild(app.canvas);

    PixiRenderer.app = app;
    PixiRenderer.root = root;
    PixiRenderer.background = background;
    PixiRenderer.lanes = lanes;
    PixiRenderer.runner = runner;
    PixiRenderer.entities = entities;
    const tileSource = Assets.get('tilesheet');
    if (tileSource instanceof Texture) {
      PixiRenderer.tileTexture = tileSource;
    }
  }

  public render(world: WorldRuntimeState): void {
    if (
      !PixiRenderer.app ||
      !PixiRenderer.background ||
      !PixiRenderer.lanes ||
      !PixiRenderer.runner ||
      !PixiRenderer.entities
    ) {
      return;
    }

    const width = PixiRenderer.app.renderer.width || WORLD_WIDTH;
    const height = PixiRenderer.app.renderer.height || WORLD_HEIGHT;
    const laneWidth = width / 3;
    const horizonY = height * 0.35;
    const groundY = height * 0.8;

    PixiRenderer.background
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: '#08111a' })
      .rect(0, 0, width, horizonY)
      .fill({ color: '#10253b' })
      .rect(0, horizonY, width, groundY - horizonY)
      .fill({ color: '#17304d' })
      .rect(0, groundY, width, height - groundY)
      .fill({ color: '#070d14' });

    PixiRenderer.lanes.clear();
    for (let lane = 0; lane < 4; lane += 1) {
      const x = laneWidth * lane;
      PixiRenderer.lanes
        .moveTo(x, groundY)
        .lineTo(width / 2 + (x - width / 2) * 0.25, horizonY)
        .stroke({ color: '#2f5d88', width: 2 });
    }

    PixiRenderer.entities.removeChildren();
    const laneTileIds = [TileId.RED_SAND_3, TileId.RED_SAND_WALL_BL, TileId.RED_SAND_WALL_B];
    const tileSize = world.settings.tileScale * TILE_SIZE_PX;

    for (let row = 0; row < 6; row += 1) {
      for (let lane = 0; lane < 3; lane += 1) {
        const tileId = laneTileIds[lane] ?? TileId.RED_SAND_3;
        const tileSprite = createTileSprite(PixiRenderer.tileTexture, tileId, tileSize);
        tileSprite.x = laneWidth * lane + laneWidth * 0.5 - tileSize * 0.5;
        tileSprite.y = groundY - tileSize * (row + 1);
        PixiRenderer.entities.addChild(tileSprite);
      }
    }

    for (const obstacle of world.obstacles) {
      const x = laneToX(obstacle.lane, laneWidth) + obstacle.x - world.player.trackPosition;
      const obstacleTile = createTileSprite(
        PixiRenderer.tileTexture,
        obstacle.type === ObstacleType.FireTrap ? TileId.OBSTACLE_5 : TileId.TILE_78,
        tileSize * 1.4,
      );
      obstacleTile.x = x - obstacleTile.width * 0.5;
      obstacleTile.y = groundY - obstacle.height;
      PixiRenderer.entities.addChild(obstacleTile);
    }

    for (const collectible of world.collectibles) {
      const x = laneToX(collectible.lane, laneWidth) + collectible.x - world.player.trackPosition;
      const collectibleTile = createTileSprite(PixiRenderer.tileTexture, TileId.BORDER_C, tileSize);
      collectibleTile.x = x - collectibleTile.width * 0.5;
      collectibleTile.y = groundY - 110;
      PixiRenderer.entities.addChild(collectibleTile);
    }

    const playerX = laneToX(Math.round(world.player.currentLane) as Lane, laneWidth);
    const playerY = groundY - 60 - world.player.jumpHeight;
    PixiRenderer.runner
      .clear()
      .circle(playerX, groundY - 12, 28)
      .fill({ color: '#0b1118', alpha: 0.3 })
      .roundRect(
        playerX - world.settings.playerBodyWidth * 0.5,
        playerY - world.settings.playerBodyHeight,
        world.settings.playerBodyWidth,
        world.settings.playerBodyHeight,
        12,
      )
      .fill({ color: '#59d0ff' })
      .circle(playerX, playerY - 76, world.settings.playerHeadRadius)
      .fill({ color: '#f7fbff' });
  }

  public async destroy(): Promise<void> {
    PixiRenderer.root?.removeChildren();
    PixiRenderer.app?.destroy(true, { children: true });
    PixiRenderer.app = null;
    PixiRenderer.root = null;
    PixiRenderer.background = null;
    PixiRenderer.lanes = null;
    PixiRenderer.runner = null;
    PixiRenderer.entities = null;
    PixiRenderer.tileTexture = null;
  }
}

function laneToX(lane: Lane, laneWidth: number): number {
  return laneWidth * lane + laneWidth * 0.5;
}

function createTileSprite(tileTexture: Texture | null, tileId: TileId, size: number): Sprite {
  if (!tileTexture) {
    const fallback = Sprite.from(Texture.WHITE);
    fallback.width = size;
    fallback.height = size;
    fallback.tint = 0x90cdf4;
    return fallback;
  }

  const frame = getTileFrame(tileId);
  const texture = new Texture({
    source: tileTexture.source,
    frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
  });
  const sprite = new Sprite(texture);
  sprite.width = size;
  sprite.height = size;
  return sprite;
}
