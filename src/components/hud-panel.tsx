import {
  Badge,
  Box,
  Code,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  List,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Camera, Gauge, Heart, Move3D, Notebook, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { useGameStore } from '../store/game-store';
import { GameHeading } from './game-heading';

function MetricCard({
  icon,
  label,
  value: content,
}: {
  icon: ReactNode;
  label: string;
  value: string | ReactNode;
}) {
  return (
    <GridItem borderRadius="md" borderWidth={1} p={2}>
      <VStack align="start" gap={1}>
        <HStack color="colorPalette.fg" gap={2}>
          {icon}
          <Text color="fg.muted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
            {label}
          </Text>
        </HStack>
        <Heading size="lg" fontFamily="mono">
          {content}
        </Heading>
      </VStack>
    </GridItem>
  );
}

export function HudPanel() {
  const metrics = useGameStore((state) => state.metrics);

  return (
    <VStack align="stretch" boxSize="full" gap={4} p={4}>
      <Flex align="center" justify="space-between">
        <GameHeading>Các chỉ số</GameHeading>
        <Badge textTransform="capitalize">{metrics.phase}</Badge>
      </Flex>

      <Grid gap={3} templateColumns={{ base: '1fr 1fr', md: 'repeat(2, 1fr)' }}>
        <MetricCard icon={<Trophy size={16} />} label="ĐIỂM" value={metrics.score.toString()} />
        <MetricCard
          icon={<Gauge size={16} />}
          label="TỐC ĐỘ"
          value={`${metrics.speed.toFixed(2)}x`}
        />
        <MetricCard
          icon={<Move3D size={16} />}
          label="Khoảng cách"
          value={`${Math.floor(metrics.distance)}m`}
        />
        <MetricCard icon={<Heart size={16} />} label="Trái tim" value={metrics.lives.toString()} />
      </Grid>

      <Box>
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack color="colorPalette.fg" gap={2}>
              <Camera size={16} />
              <Text color="fg.muted" fontSize="xs" fontWeight="700" textTransform="uppercase">
                AI
              </Text>
            </HStack>
            <Badge textTransform="capitalize">{metrics.trackingStatus}</Badge>
          </HStack>
          <Progress.Root maxW="full" value={metrics.calibrationProgress * 100}>
            <Progress.Track bg="bg.muted" borderRadius="full">
              <Progress.Range bg="colorPalette.solid" borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <Text color="fg.muted" fontSize="sm">
            {metrics.debugMessage}
          </Text>
          <HStack
            color="fg.muted"
            fontSize="sm"
            justify="space-between"
            fontFamily="mono"
            fontVariant="tabular-nums"
          >
            <Text>Pose: {metrics.poseCommand}</Text>
            <Text>Lane: {metrics.lane}</Text>
            <Text>{metrics.fps} FPS</Text>
          </HStack>
        </VStack>
      </Box>

      <Box>
        <HStack color="colorPalette.fg" gap={2} mb={2}>
          <Notebook size={16} />
          <Text color="fg.muted" fontSize="xs" fontWeight="700" textTransform="uppercase">
            Hướng dẫn
          </Text>
        </HStack>
        <List.Root color="fg.muted" fontSize="sm" ps={4}>
          <List.Item>
            Dùng <Code>WASD</Code> hoặc các phím mũi tên để di chuyển bằng bàn phím
          </List.Item>
          <List.Item>Giơ cả hai tay lên để nhảy</List.Item>
          <List.Item>Ngả về bên trái để sang trái, tương tự với bên phải</List.Item>
        </List.Root>
      </Box>
    </VStack>
  );
}
