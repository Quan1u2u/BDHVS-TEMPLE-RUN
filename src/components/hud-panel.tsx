import {
  Badge,
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Activity, Camera, Gauge, Heart, Move3D, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { useGameStore } from '../store/game-store';

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <GridItem bg="bg.panel" borderColor="border" borderRadius="md" borderWidth="1px" p={4}>
      <VStack align="start" gap={2}>
        <HStack color="colorPalette.fg" gap={2}>
          {icon}
          <Text
            color="fg.muted"
            fontFamily="mono"
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
          >
            {label}
          </Text>
        </HStack>
        <Heading color="fg" fontFamily="heading" size="lg">
          {value}
        </Heading>
      </VStack>
    </GridItem>
  );
}

export function HudPanel() {
  const metrics = useGameStore((state) => state.metrics);

  return (
    <VStack align="stretch" gap={4}>
      <Flex align="center" justify="space-between">
        <Box>
          <Text
            color="fg.muted"
            fontFamily="mono"
            fontSize="xs"
            fontWeight="800"
            textTransform="uppercase"
          >
            Runtime Metrics
          </Text>
          <Heading color="fg" fontFamily="heading" size="md">
            Temple Run Lite HUD
          </Heading>
        </Box>
        <Badge colorPalette="blue" borderRadius="full" px={3} py={1} textTransform="capitalize">
          {metrics.phase}
        </Badge>
      </Flex>

      <Grid gap={3} templateColumns={{ base: '1fr 1fr', md: 'repeat(2, 1fr)' }}>
        <MetricCard icon={<Trophy size={16} />} label="Score" value={metrics.score.toString()} />
        <MetricCard
          icon={<Gauge size={16} />}
          label="Speed"
          value={`${metrics.speed.toFixed(2)}x`}
        />
        <MetricCard
          icon={<Move3D size={16} />}
          label="Distance"
          value={`${Math.floor(metrics.distance)}m`}
        />
        <MetricCard
          icon={<Heart size={16} />}
          label="Lives"
          value={'❤'.repeat(Math.max(metrics.lives, 0)) || '—'}
        />
      </Grid>

      <Box bg="bg.panel" borderColor="border" borderRadius="md" borderWidth="1px" p={4}>
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack color="colorPalette.fg" gap={2}>
              <Camera size={16} />
              <Text
                color="fg.muted"
                fontFamily="mono"
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
              >
                Tracking
              </Text>
            </HStack>
            <Badge colorPalette="blue" textTransform="capitalize">
              {metrics.trackingStatus}
            </Badge>
          </HStack>
          <Progress.Root maxW="full" value={metrics.calibrationProgress * 100}>
            <Progress.Track bg="bg.muted" borderRadius="full">
              <Progress.Range bg="colorPalette.solid" borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <Text color="fg.muted" fontSize="sm">
            {metrics.debugMessage}
          </Text>
          <HStack color="fg.muted" fontSize="sm" justify="space-between">
            <Text>Pose: {metrics.poseCommand}</Text>
            <Text>Lane: {metrics.lane}</Text>
            <Text>{metrics.fps} FPS</Text>
          </HStack>
        </VStack>
      </Box>

      <Box bg="bg.panel" borderColor="border" borderRadius="md" borderWidth="1px" p={4}>
        <HStack color="colorPalette.fg" gap={2} mb={2}>
          <Activity size={16} />
          <Text
            color="fg.muted"
            fontFamily="mono"
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
          >
            Controls
          </Text>
        </HStack>
        <Text color="fg.muted" fontSize="sm" lineHeight="1.7">
          Use arrow keys or WASD for keyboard fallback. Raise both hands to jump, lean left to shift
          left, and lean right to shift right when webcam tracking is active.
        </Text>
      </Box>
    </VStack>
  );
}
