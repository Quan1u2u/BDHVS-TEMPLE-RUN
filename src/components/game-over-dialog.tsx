import { Button, Dialog, Portal, Text } from '@chakra-ui/react';
import { GameRuntime } from '@/game/runtime/game-runtime';
import { useGameOverStore } from '@/store/game-over-store';

export function GameOverDialog() {
  const { open, score, close } = useGameOverStore();

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
                <Button variant="outline" onClick={close}>
                  Đóng
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="blue"
                onClick={() => {
                  close();
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
