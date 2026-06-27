import { Button, Dialog, Portal, Text } from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { GameRuntime } from '@/game/runtime/game-runtime';
import { gameOverOpenAtom, gameOverScoreAtom } from '@/store/atoms';

export function GameOverDialog() {
  const open = useAtomValue(gameOverOpenAtom);
  const score = useAtomValue(gameOverScoreAtom);
  const closeGameOver = useSetAtom(gameOverOpenAtom);

  return (
    <Dialog.Root open={open} size="sm">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="md">
            <Dialog.Header>
              <Dialog.Title>Game over</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize="lg" fontWeight="semibold">
                Tổng điểm: {score}
              </Text>
            </Dialog.Body>
            <Dialog.Footer gap={3}>
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    closeGameOver(false);
                    GameRuntime.resetToIdle();
                  }}
                >
                  Đóng
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="blue"
                onClick={() => {
                  closeGameOver(false);
                  GameRuntime.restart();
                }}
              >
                Chơi lại
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
