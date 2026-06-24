import { Box, Heading, Text, VStack } from '@chakra-ui/react';

import { GamePhase } from '../game/domain/types';
import { useGameStore } from '../store/game-store';

const phaseCopy: Record<GamePhase, { title: string; body: string }> = {
  [GamePhase.Boot]: {
    title: 'Booting temple runtime',
    body: 'Loading the canvas shell, asset bundles, and gameplay services.',
  },
  [GamePhase.CameraPermission]: {
    title: 'Choose your control path',
    body: 'Enable the webcam for MediaPipe pose controls, or start the run with keyboard fallback.',
  },
  [GamePhase.ModelLoading]: {
    title: 'Loading pose model',
    body: 'The Tasks Vision backend is warming up for real-time detection.',
  },
  [GamePhase.Calibration]: {
    title: 'Calibrating stance',
    body: 'Stand centered with your arms relaxed while tracking locks in.',
  },
  [GamePhase.Running]: {
    title: 'Temple Run Lite',
    body: 'Stay alive, collect coins, and keep your score climbing.',
  },
  [GamePhase.Paused]: {
    title: 'Run paused',
    body: "Resume when you're ready, or step back into frame to recover tracking.",
  },
  [GamePhase.GameOver]: {
    title: 'Game over',
    body: 'Restart the run to reset score, lives, and spawn cadence.',
  },
  [GamePhase.Recovery]: {
    title: 'Recovery mode',
    body: 'Tracking reported an error. Restart camera mode or use keyboard fallback.',
  },
};

export function OverlayCopy() {
  const metrics = useGameStore((state) => state.metrics);
  const copy = phaseCopy[metrics.phase];

  return (
    <Box
      backdropFilter="blur(14px)"
      bg="bg/80"
      borderColor="border"
      borderWidth="1px"
      borderRadius="md"
      left={6}
      maxW="sm"
      p={6}
      position="absolute"
      top={6}
      zIndex="2"
    >
      <VStack align="start" gap={2}>
        <Heading color="fg" fontFamily="heading" size="md">
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
