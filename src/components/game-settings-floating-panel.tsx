import {
  Button,
  CloseButton,
  Field,
  FloatingPanel,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { GameSettings } from '@/game/config';
import { GameRuntime } from '@/game/runtime/game-runtime';
import { confirmAction } from '@/store/confirm-action-store';
import { gameSettingsStore, useGameSettingsStore } from '@/store/game-settings-store';

interface SettingField {
  key: keyof GameSettings;
  label: string;
  step: number;
  min: number;
}

const settingFields: SettingField[] = [
  { key: 'playerTrackPosition', label: 'Track Position', step: 10, min: 0 },
  { key: 'laneSnapSpeed', label: 'Lane Snap Speed', step: 0.5, min: 0.5 },
  { key: 'baseRunSpeed', label: 'Base Speed', step: 10, min: 50 },
  { key: 'maxRunSpeed', label: 'Max Speed', step: 10, min: 100 },
  { key: 'speedRampPerSecond', label: 'Speed Ramp', step: 0.5, min: 0 },
  { key: 'jumpVelocity', label: 'Jump Velocity', step: 10, min: 100 },
  { key: 'gravity', label: 'Gravity', step: 25, min: 100 },
  { key: 'obstacleWidth', label: 'Obstacle Width', step: 1, min: 1 },
  { key: 'obstacleHeight', label: 'Obstacle Height', step: 1, min: 1 },
  { key: 'obstacleSpawnCooldownMs', label: 'Obstacle Cooldown', step: 10, min: 100 },
  { key: 'obstacleSpawnMinCooldownMs', label: 'Obstacle Min Cooldown', step: 10, min: 50 },
  { key: 'obstacleSpawnDistanceFactor', label: 'Obstacle Distance Factor', step: 0.01, min: 0 },
  { key: 'collectibleSpawnCooldownMs', label: 'Coin Cooldown', step: 10, min: 100 },
  { key: 'collectibleSpawnMinCooldownMs', label: 'Coin Min Cooldown', step: 10, min: 50 },
  {
    key: 'collectibleSpawnDistanceFactor',
    label: 'Coin Distance Factor',
    step: 0.01,
    min: 0,
  },
  { key: 'collectibleValue', label: 'Coin Value', step: 1, min: 1 },
  { key: 'collectibleCollisionRadius', label: 'Coin Collision Radius', step: 1, min: 1 },
  { key: 'startingLives', label: 'Starting Lives', step: 1, min: 1 },
  { key: 'distanceScale', label: 'Distance Scale', step: 0.01, min: 0.01 },
  { key: 'passiveScorePerSecond', label: 'Passive Score', step: 1, min: 0 },
  {
    key: 'obstacleCollisionWidthFactor',
    label: 'Obstacle Collision Factor',
    step: 0.05,
    min: 0.05,
  },
  { key: 'playerBodyWidth', label: 'Player Body Width', step: 1, min: 1 },
  { key: 'playerBodyHeight', label: 'Player Body Height', step: 1, min: 1 },
  { key: 'playerHeadRadius', label: 'Player Head Radius', step: 1, min: 1 },
  { key: 'playerShadowRadius', label: 'Player Shadow Radius', step: 1, min: 1 },
  { key: 'tileScale', label: 'Tile Scale', step: 0.25, min: 1 },
  { key: 'backgroundMusicVolume', label: 'BGM Volume', step: 0.01, min: 0 },
  { key: 'sfxVolume', label: 'SFX Volume', step: 0.01, min: 0 },
];

export function GameSettingsFloatingPanel() {
  const isOpen = useGameSettingsStore((state) => state.isPanelOpen);
  const isDirty = useGameSettingsStore((state) => state.isDirty);
  const draftSettings = useGameSettingsStore((state) => state.draftSettings);
  const updateDraftSetting = useGameSettingsStore((state) => state.updateDraftSetting);

  return (
    <FloatingPanel.Root
      defaultOpen={false}
      ids={{ content: 'game-settings-panel', title: 'game-settings-title' }}
      open={isOpen}
      onOpenChange={({ open }) => {
        if (open) {
          gameSettingsStore.getState().openPanel();
          return;
        }

        void handleCloseRequest();
      }}
    >
      <FloatingPanel.Positioner insetEnd={4} maxW="min(96vw, 1200px)" position="fixed" top={24}>
        <FloatingPanel.Content
          bg="bg.panel"
          borderColor="border"
          borderRadius="md"
          borderWidth="1px"
          w="min(96vw, 1200px)"
        >
          <FloatingPanel.Header px={4} py={3}>
            <HStack justify="space-between" w="full">
              <VStack align="start" gap={0}>
                <Text color="fg.muted" fontFamily="mono" fontSize="xs" textTransform="uppercase">
                  Runtime Tuning
                </Text>
                <FloatingPanel.Title asChild>
                  <Heading fontFamily="heading" id="game-settings-title" size="sm">
                    Game Settings
                  </Heading>
                </FloatingPanel.Title>
              </VStack>
              <HStack>
                <FloatingPanel.DragTrigger asChild>
                  <Button size="xs" variant="subtle">
                    Drag
                  </Button>
                </FloatingPanel.DragTrigger>
                <CloseButton
                  onClick={() => {
                    void handleCloseRequest();
                  }}
                  size="sm"
                />
              </HStack>
            </HStack>
          </FloatingPanel.Header>
          <FloatingPanel.Body px={4} py={4}>
            <Grid
              columnGap={4}
              maxH="70vh"
              overflowY="auto"
              pr={1}
              rowGap={3}
              templateColumns={{
                base: '1fr',
                lg: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              }}
            >
              {settingFields.map((field) => (
                <Field.Root key={field.key}>
                  <HStack align="center" gap={3}>
                    <Field.Label flex="0 0 12rem" mb="0">
                      {field.label}
                    </Field.Label>
                    <Input
                      bg="bg"
                      borderColor="border"
                      fontFamily="mono"
                      min={field.min}
                      size="sm"
                      step={field.step}
                      type="number"
                      value={draftSettings[field.key]}
                      onChange={(event) => {
                        updateDraftSetting(
                          field.key,
                          Number(event.currentTarget.value) as GameSettings[typeof field.key],
                        );
                      }}
                    />
                  </HStack>
                </Field.Root>
              ))}
            </Grid>
            <HStack
              bg="bg.panel"
              borderTopColor="border"
              borderTopWidth="1px"
              justify="space-between"
              mt={4}
              pt={4}
            >
              <Text color="fg.muted" fontSize="sm">
                {isDirty ? 'Unsaved changes will restart the run on save.' : 'No pending changes.'}
              </Text>
              <HStack>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void handleDiscardRequest();
                  }}
                >
                  Discard
                </Button>
                <Button
                  colorPalette="blue"
                  size="sm"
                  onClick={() => {
                    gameSettingsStore.getState().saveDraft();
                    GameRuntime.applySettingsAndRestart();
                  }}
                >
                  Save
                </Button>
              </HStack>
            </HStack>
          </FloatingPanel.Body>
          <FloatingPanel.ResizeTriggers />
        </FloatingPanel.Content>
      </FloatingPanel.Positioner>
    </FloatingPanel.Root>
  );
}

async function handleCloseRequest(): Promise<void> {
  if (!gameSettingsStore.getState().isDirty) {
    gameSettingsStore.getState().closePanel();
    return;
  }

  await handleDiscardRequest();
}

async function handleDiscardRequest(): Promise<void> {
  if (!gameSettingsStore.getState().isDirty) {
    gameSettingsStore.getState().discardDraft();
    return;
  }

  const shouldDiscard = await confirmAction({
    title: 'Discard unsaved settings?',
    message: 'Any tuning changes in the floating panel will be lost.',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
  });

  if (shouldDiscard) {
    gameSettingsStore.getState().discardDraft();
  }
}
