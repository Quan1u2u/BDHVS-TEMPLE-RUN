import { Button, HStack, VStack } from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Camera, Pause, Play, RefreshCcw, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { openSettingsPanelAtom, phaseAtom } from '@/store/atoms';
import { GamePhase } from '../game/domain/types';
import { GameRuntime } from '../game/runtime/game-runtime';
import { GameHeading } from './game-heading';

export function ControlPanel() {
  const phase = useAtomValue(phaseAtom);
  const openSettingsPanel = useSetAtom(openSettingsPanelAtom);

  return (
    <VStack boxSize="full" p={4} gap={2} align="start" h={52}>
      <GameHeading>Điều khiển game</GameHeading>

      <HStack
        flexWrap="wrap"
        gap={2}
        css={{
          '& > button': {
            w: 36,
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
          colorPalette="green"
          onClick={() => {
            void GameRuntime.startGame();
          }}
        >
          <Play size={16} />
          Bắt đầu game
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
            openSettingsPanel();
          }}
        >
          <SlidersHorizontal size={16} />
          Thông số
        </Button>
      </HStack>
    </VStack>
  );
}
