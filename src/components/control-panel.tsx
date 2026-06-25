import { Button, HStack, VStack } from '@chakra-ui/react';
import {
  Camera,
  Keyboard,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { gameSettingsStore } from '@/store/game-settings-store';
import { GamePhase } from '../game/domain/types';
import { GameRuntime } from '../game/runtime/game-runtime';
import { useGameStore } from '../store/game-store';
import { GameHeading } from './game-heading';

export function ControlPanel() {
  const phase = useGameStore((state) => state.metrics.phase);

  return (
    <VStack boxSize="full" p={4} gap={2} align="start">
      <GameHeading>Điều khiển game</GameHeading>

      <HStack
        flexWrap="wrap"
        gap={2}
        css={{
          '& > button': {
            w: 48,
          },
        }}
      >
        <Button
          colorPalette="blue"
          onClick={() => {
            void GameRuntime.enableCameraTracking();
          }}
        >
          <Camera size={16} />
          Bật webcam
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void GameRuntime.recalibrateTracking();
          }}
        >
          <RefreshCcw size={16} />
          Recalibrate AI
        </Button>
        <Button
          onClick={() => {
            void GameRuntime.startKeyboardRun();
          }}
        >
          <Keyboard size={16} />
          Chơi bằng bàn phím
        </Button>
        <Button onClick={() => GameRuntime.togglePause()}>
          {phase === GamePhase.Paused ? <Play size={16} /> : <Pause size={16} />}
          {phase === GamePhase.Paused ? 'Tiếp tục' : 'Tạm dừng'}
        </Button>
        <Button onClick={() => GameRuntime.restart()}>
          <RotateCcw size={16} />
          Khởi động lại
        </Button>
        <Button
          variant="subtle"
          onClick={() => {
            gameSettingsStore.getState().openPanel();
          }}
        >
          <SlidersHorizontal size={16} />
          Điều chỉnh thông số
        </Button>
      </HStack>
    </VStack>
  );
}
