import { Box, Heading, Text, VStack } from '@chakra-ui/react';

import { GamePhase } from '../game/domain/types';
import { useGameStore } from '../store/game-store';

const phase: Record<GamePhase, { title: string; body: string }> = {
  [GamePhase.Boot]: {
    title: 'Đang tải game',
    body: 'Đang tải các tài nguyên',
  },
  [GamePhase.CameraPermission]: {
    title: 'Chọn cách điều khiển',
    body: 'Bật webcam để điều khiển bằng cơ thể, hoặc dùng WASD',
  },
  [GamePhase.ModelLoading]: {
    title: 'Đang tải mô hình tư thế',
    body: 'Đang tải MediaPipe Tasks Vision',
  },
  [GamePhase.Calibration]: {
    title: 'Cân bằng tư thế',
    body: 'Đứng thẳng với tay thả lỏng',
  },
  [GamePhase.Running]: {
    // TODO: Dummy, should be hidden
    title: '',
    body: '',
  },
  [GamePhase.Paused]: {
    title: 'Đã tạm dừng',
    body: '',
  },
  [GamePhase.GameOver]: {
    title: 'Game over',
    body: '',
  },
  [GamePhase.Recovery]: {
    title: 'Recovery mode',
    body: 'Tracking reported an error. Restart camera mode or use keyboard fallback.',
  },
};

export function GameOverlay() {
  const metrics = useGameStore((state) => state.metrics);
  const copy = phase[metrics.phase];

  return (
    <Box
      borderWidth={1}
      borderRadius="md"
      maxW="sm"
      p={4}
      position="absolute"
      top={6}
      left={6}
      zIndex={2}
      bg="bg"
    >
      <VStack align="start" gap={2}>
        <Heading color="colorPalette.fg" size="md">
          {copy.title}
        </Heading>
        <Text color="fg.muted" fontSize="sm" lineHeight="1.7">
          {copy.body}
        </Text>
        {metrics.phase === GamePhase.Boot ? (
          <Box w="full">
            <Text color="fg.muted" fontFamily="mono" fontSize="xs" textTransform="uppercase">
              {metrics.bootStage}
            </Text>
            <Box
              bg="bg.muted"
              borderColor="border"
              borderRadius="md"
              borderWidth="1px"
              h={2}
              mt={2}
              overflow="hidden"
              w="full"
            >
              <Box
                bg="colorPalette.solid"
                h="full"
                w={`${Math.round(metrics.bootProgress * 100)}%`}
              />
            </Box>
          </Box>
        ) : null}
      </VStack>
    </Box>
  );
}
