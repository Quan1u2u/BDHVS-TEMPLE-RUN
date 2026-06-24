import { Button, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Camera, Pause, Play, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { gameSettingsStore } from '@/store/game-settings-store';
import { GamePhase } from '../game/domain/types';
import { GameRuntime } from '../game/runtime/game-runtime';
import { useGameStore } from '../store/game-store';

export function ControlPanel() {
  const phase = useGameStore((state) => state.metrics.phase);

  return (
    <VStack
      align="stretch"
      bg="bg.panel"
      borderColor="border"
      borderRadius="md"
      borderWidth="1px"
      gap={4}
      h="full"
      p={5}
    >
      <VStack align="start" gap={1}>
        <Text color="fg.muted" fontFamily="mono" fontSize="xs" textTransform="uppercase">
          Gameplay Controls
        </Text>
        <Heading fontFamily="heading" size="sm">
          Runner Actions
        </Heading>
      </VStack>
      <HStack flexWrap="wrap" gap={3}>
        <Button
          colorPalette="blue"
          onClick={() => {
            void GameRuntime.enableCameraTracking();
          }}
        >
          <Camera size={16} />
          Enable Camera
        </Button>
        <Button onClick={() => GameRuntime.startKeyboardRun()}>
          <Play size={16} />
          Keyboard Fallback
        </Button>
        <Button onClick={() => GameRuntime.togglePause()}>
          {phase === GamePhase.Paused ? <Play size={16} /> : <Pause size={16} />}
          {phase === GamePhase.Paused ? 'Resume' : 'Pause'}
        </Button>
        <Button onClick={() => GameRuntime.restart()}>
          <RotateCcw size={16} />
          Restart
        </Button>
        <Button
          variant="subtle"
          onClick={() => {
            gameSettingsStore.getState().openPanel();
          }}
        >
          <SlidersHorizontal size={16} />
          Tune Runtime
        </Button>
      </HStack>
      <Text color="fg.muted" fontSize="sm">
        Use keyboard fallback while calibrating, or keep the webcam feed live to demonstrate the CV
        control loop in real time.
      </Text>
    </VStack>
  );
}
