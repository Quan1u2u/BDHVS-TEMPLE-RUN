import { Box, Heading, HStack, Image, Text, VStack } from '@chakra-ui/react';
import { CollectibleType, GamePhase, ObstacleType } from '../game/domain/types';
import {
  getTileFrame,
  TILE_SIZE_PX,
  TILESHEET_COLUMNS,
  TILESHEET_PATH,
  TILESHEET_ROWS,
  TileId,
} from '../game/tiles/tile-atlas';
import { useGameStore } from '../store/game-store';

const idlePhases = new Set<GamePhase>([GamePhase.CameraPermission, GamePhase.GameOver]);
const spriteSheetWidthPx = TILESHEET_COLUMNS * TILE_SIZE_PX;
const spriteSheetHeightPx = TILESHEET_ROWS * TILE_SIZE_PX;
const legendTileScale = 4;

const collectibleLegend = [
  { type: CollectibleType.AI, label: 'AI' },
  { type: CollectibleType.Cloud, label: 'Cloud' },
  { type: CollectibleType.STEM, label: 'STEM' },
  { type: CollectibleType.DigitalCitizen, label: 'Công dân số' },
  { type: CollectibleType.ELearning, label: 'E-learning' },
] as const;

const obstacleLegend = [
  { type: ObstacleType.Virus, label: 'Virus' },
  { type: ObstacleType.Hacker, label: 'Hacker' },
  { type: ObstacleType.Scam, label: 'Lừa đảo' },
  { type: ObstacleType.FakeNews, label: 'Tin giả' },
  { type: ObstacleType.Cyberbullying, label: 'Bắt nạt qua mạng' },
] as const;

export function IdleOverlay() {
  const phase = useGameStore((state) => state.metrics.phase);

  if (!idlePhases.has(phase)) {
    return null;
  }

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      backdropFilter="blur(4px)"
      bg="rgba(0, 0, 0, 0.3)"
      color="white"
      zIndex={1}
    >
      <VStack gap={4} maxW="4xl" px={8}>
        <Heading size="lg">Hướng dẫn chơi</Heading>
        <Text textAlign="center">
          Nhấn "Chơi bằng bàn phím" để bắt đầu ngay hoặc bật webcam để điều khiển bằng cơ thể.
        </Text>
        <Text textAlign="center">Dùng A / D hoặc mũi tên trái / phải để đổi làn.</Text>
        <Text textAlign="center">
          Thu thập vật phẩm để tăng điểm và tránh các chướng ngại vật gây mất điểm.
        </Text>
        <LegendSection
          items={collectibleLegend}
          title="Các vật phẩm có lợi:"
          variant="collectible"
        />
        <LegendSection items={obstacleLegend} title="Các chướng ngại:" variant="obstacle" />
      </VStack>
    </Box>
  );
}

function LegendSection({
  items,
  title,
  variant,
}: {
  items: readonly { label: string; type: CollectibleType | ObstacleType }[];
  title: string;
  variant: 'collectible' | 'obstacle';
}) {
  return (
    <VStack align="center" gap={2} w="full">
      <Text fontSize="md" fontWeight="semibold">
        {title}
      </Text>
      <HStack align="start" flexWrap="wrap" gap={2}>
        {items.map((item) => (
          <VStack
            key={`${variant}-${item.type}`}
            bg="black"
            borderRadius="md"
            gap={2}
            px={2}
            py={1}
          >
            <LegendSprite tileId={legendTileId(item.type, variant)} />
            <Text fontSize="sm" textAlign="center">
              {item.label}
            </Text>
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
}

function LegendSprite({ tileId }: { tileId: TileId }) {
  const frame = getTileFrame(tileId);

  return (
    <Box
      aspectRatio={1}
      bg="rgba(0, 0, 0, 0.24)"
      h={16}
      overflow="hidden"
      position="relative"
      rounded="sm"
      w={16}
    >
      <Image
        alt=""
        aria-hidden
        draggable={false}
        h={`${spriteSheetHeightPx * legendTileScale}px`}
        left={`-${frame.x * legendTileScale}px`}
        maxW="none"
        pointerEvents="none"
        position="absolute"
        src={TILESHEET_PATH}
        style={{ imageRendering: 'pixelated' }}
        top={`-${frame.y * legendTileScale}px`}
        userSelect="none"
        w={`${spriteSheetWidthPx * legendTileScale}px`}
      />
    </Box>
  );
}

function legendTileId(
  type: CollectibleType | ObstacleType,
  variant: 'collectible' | 'obstacle',
): TileId {
  if (variant === 'collectible') {
    switch (type as CollectibleType) {
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

  switch (type as ObstacleType) {
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
