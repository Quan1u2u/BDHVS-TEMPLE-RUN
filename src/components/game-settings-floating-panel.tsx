import {
  Button,
  Field,
  FloatingPanel,
  Grid,
  HStack,
  IconButton,
  Input,
  Portal,
  Text,
} from '@chakra-ui/react';
import { GripHorizontal, X } from 'lucide-react';
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

  return (
    <FloatingPanel.Root
      closeOnEscape
      minSize={{ width: 640, height: 480 }}
      size={{ width: 640, height: 480 }}
      allowOverflow={false}
      defaultOpen={false}
      open={isOpen}
      onOpenChange={({ open }) => {
        if (open) {
          gameSettingsStore.getState().openPanel();
          return;
        }

        void handleCloseRequest();
      }}
    >
      <Portal>
        <FloatingPanel.Positioner>
          <FloatingPanel.Content>
            <FloatingPanel.Header>
              <FloatingPanel.DragTrigger>
                <GripHorizontal />
                <FloatingPanel.Title>Game Settings</FloatingPanel.Title>
              </FloatingPanel.DragTrigger>

              <FloatingPanel.Control>
                {/* We're not using CloseTrigger here, as it will trigger the internal close event before we can even intercept*/}
                <IconButton variant="ghost" size="2xs" onClick={handleCloseRequest}>
                  <X />
                </IconButton>
              </FloatingPanel.Control>
            </FloatingPanel.Header>

            <FloatingPanel.Body>
              <Grid boxSize="full" templateRows="1fr auto">
                <Grid overflowY="auto" gap={4} p={4} templateColumns="repeat(3, 1fr)">
                  {settingFields.map((field) => (
                    <SettingsInput key={field.key} field={field} />
                  ))}
                </Grid>

                <HStack borderTopWidth={1} justify="space-between" py={4}>
                  <Text color="fg.muted" fontSize="sm">
                    {isDirty
                      ? 'Unsaved changes will restart the run on save.'
                      : 'No pending changes.'}
                  </Text>

                  <HStack h={8}>
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
              </Grid>
            </FloatingPanel.Body>

            <FloatingPanel.ResizeTriggers />
          </FloatingPanel.Content>
        </FloatingPanel.Positioner>
      </Portal>
    </FloatingPanel.Root>
  );
}

function SettingsInput({ field }: { field: SettingField }) {
  const draftSettings = useGameSettingsStore((state) => state.draftSettings);
  const updateDraftSetting = useGameSettingsStore((state) => state.updateDraftSetting);
  return (
    <Field.Root orientation="horizontal" minW={32} gap={4}>
      <Field.Label>{field.label}</Field.Label>
      <Input
        fontFamily="mono"
        min={field.min}
        size="sm"
        step={field.step}
        type="number"
        value={draftSettings[field.key]}
        onChange={(event) => {
          updateDraftSetting(field.key, Number(event.currentTarget.value));
        }}
      />
    </Field.Root>
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
