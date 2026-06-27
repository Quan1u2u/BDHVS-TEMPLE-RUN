import { Box, Heading, Show, Text, VStack } from '@chakra-ui/react';
import { useAtomValue } from 'jotai';
import { GamePhase } from '../game/domain/types';
import { bootProgressAtom, bootStageAtom, phaseAtom } from '../store/atoms';

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
  const phaseValue = useAtomValue(phaseAtom);
  const bootStage = useAtomValue(bootStageAtom);
  const bootProgress = useAtomValue(bootProgressAtom);
  const isRunning = phaseValue === GamePhase.Running;
  const copy = phase[phaseValue];
  const shouldShowCopy = copy.title.length > 0 || copy.body.length > 0;

  return (
    <Show when={!isRunning}>
      <Box
        borderWidth={1}
        borderRadius="md"
        w={64}
        p={4}
        position="absolute"
        top={6}
        left={6}
        zIndex={2}
        bg="bg"
      >
        <VStack align="start" gap={2}>
          {shouldShowCopy ? (
            <>
              <Heading color="colorPalette.fg" size="md">
                {copy.title}
              </Heading>
              <Text color="fg.muted" fontSize="sm" lineHeight="1.7">
                {copy.body}
              </Text>
            </>
          ) : null}
          {phaseValue === GamePhase.Boot ? (
            <Box w="full">
              <Text color="fg.muted" fontFamily="mono" fontSize="xs" textTransform="uppercase">
                {bootStage}
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
                <Box bg="colorPalette.solid" h="full" w={`${Math.round(bootProgress * 100)}%`} />
              </Box>
            </Box>
          ) : null}
        </VStack>
      </Box>
    </Show>
  );
}
