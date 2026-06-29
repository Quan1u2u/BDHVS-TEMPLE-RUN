import {
  Badge,
  Box,
  Code,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  List,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Camera, Fullscreen, Gauge, Heart, Minimize, Move3D, Notebook, Trophy } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { fullscreenAtom, toggleFullscreenAtom } from '@/store/atoms/fullscreen-atoms';
import { Lane, PoseCommand } from '../game/domain/types';
import { calibrationProgressAtom, livesAtom, phaseAtom, trackingStatusAtom } from '../store/atoms';
import type { GameMetricsSnapshot, MetricsSink } from '../store/atoms/sink';
import { useMetricsSink } from '../store/metrics-sink-context';
import { GameHeading } from './game-heading';

const DEFAULT_HUD_METRICS = {
  score: '0',
  speed: '0.00x',
  distance: '0m',
  debugMessage: 'Booting runtime',
  poseCommand: PoseCommand.Idle,
  lane: Lane.Center,
  fps: '60 FPS',
};

function formatScore(value: number): string {
  return String(value);
}

function formatSpeed(value: number): string {
  return `${value.toFixed(2)}x`;
}

function formatDistance(value: number): string {
  return `${Math.floor(value)}m`;
}

function formatDebugMessage(value: string): string {
  return value;
}

function formatPose(value: PoseCommand): string {
  return `Pose: ${value}`;
}

function formatLane(value: Lane): string {
  return `Lane: ${value}`;
}

function formatFps(value: number): string {
  return `${value} FPS`;
}

type TargetRef<T extends HTMLElement> = { current: T | null };

function setTextContent<T extends HTMLElement>(ref: TargetRef<T>, value: string): void {
  const node = ref.current;
  if (node && node.textContent !== value) {
    node.textContent = value;
  }
}

function registerTextTarget<Key extends keyof GameMetricsSnapshot, T extends HTMLElement>(
  sink: MetricsSink,
  key: Key,
  ref: TargetRef<T>,
  format: (value: GameMetricsSnapshot[Key]) => string,
): () => void {
  return sink.registerMetricTarget(key, (value) => {
    setTextContent(ref, format(value));
  });
}

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
  const sink = useMetricsSink();
  const calibrationProgress = useAtomValue(calibrationProgressAtom);
  const lives = useAtomValue(livesAtom);
  const phase = useAtomValue(phaseAtom);
  const trackingStatus = useAtomValue(trackingStatusAtom);
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const speedRef = useRef<HTMLSpanElement | null>(null);
  const distanceRef = useRef<HTMLSpanElement | null>(null);
  const debugMessageRef = useRef<HTMLSpanElement | null>(null);
  const poseCommandRef = useRef<HTMLSpanElement | null>(null);
  const laneRef = useRef<HTMLSpanElement | null>(null);
  const fpsRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const cleanups = [
      registerTextTarget(sink, 'score', scoreRef, formatScore),
      registerTextTarget(sink, 'speed', speedRef, formatSpeed),
      registerTextTarget(sink, 'distance', distanceRef, formatDistance),
      registerTextTarget(sink, 'debugMessage', debugMessageRef, formatDebugMessage),
      registerTextTarget(sink, 'poseCommand', poseCommandRef, formatPose),
      registerTextTarget(sink, 'lane', laneRef, formatLane),
      registerTextTarget(sink, 'fps', fpsRef, formatFps),
    ];

    return () => {
      cleanups.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [sink]);

  return (
    <VStack align="stretch" boxSize="full" gap={4} p={4}>
      <Flex align="center" justify="space-between">
        <GameHeading>Các chỉ số</GameHeading>
        <HStack gap={2}>
          <Badge textTransform="capitalize">{phase}</Badge>
          <FullscreenButton />
        </HStack>
      </Flex>

      <Grid gap={3} templateColumns={{ base: '1fr 1fr', md: 'repeat(2, 1fr)' }}>
        <MetricCard
          icon={<Trophy size={16} />}
          label="ĐIỂM"
          value={<span ref={scoreRef}>{DEFAULT_HUD_METRICS.score}</span>}
        />
        <MetricCard
          icon={<Gauge size={16} />}
          label="TỐC ĐỘ"
          value={<span ref={speedRef}>{DEFAULT_HUD_METRICS.speed}</span>}
        />
        <MetricCard
          icon={<Move3D size={16} />}
          label="Khoảng cách"
          value={<span ref={distanceRef}>{DEFAULT_HUD_METRICS.distance}</span>}
        />
        <MetricCard icon={<Heart size={16} />} label="Trái tim" value={String(lives)} />
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
            <Badge textTransform="capitalize">{trackingStatus}</Badge>
          </HStack>
          <Progress.Root maxW="full" value={calibrationProgress * 100}>
            <Progress.Track bg="bg.muted" borderRadius="full">
              <Progress.Range bg="colorPalette.solid" borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <Text color="fg.muted" fontSize="sm">
            <span ref={debugMessageRef}>{DEFAULT_HUD_METRICS.debugMessage}</span>
          </Text>
          <HStack
            color="fg.muted"
            fontSize="sm"
            justify="space-between"
            fontFamily="mono"
            fontVariant="tabular-nums"
          >
            <Text>
              <span ref={poseCommandRef}>{formatPose(DEFAULT_HUD_METRICS.poseCommand)}</span>
            </Text>
            <Text>
              <span ref={laneRef}>{formatLane(DEFAULT_HUD_METRICS.lane)}</span>
            </Text>
            <Text>
              <span ref={fpsRef}>{DEFAULT_HUD_METRICS.fps}</span>
            </Text>
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

function FullscreenButton() {
  const isFullscreen = useAtomValue(fullscreenAtom);
  const toggleFullscreen = useSetAtom(toggleFullscreenAtom);

  return (
    <IconButton variant="ghost" onClick={() => toggleFullscreen()} aria-label="Toggle fullscreen">
      {isFullscreen ? <Minimize /> : <Fullscreen />}
    </IconButton>
  );
}
