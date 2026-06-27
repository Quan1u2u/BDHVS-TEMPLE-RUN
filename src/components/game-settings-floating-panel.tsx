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
import { useAtomValue, useSetAtom } from 'jotai';
import { GripHorizontal, X } from 'lucide-react';
import type { GameSettings } from '@/game/config';
import { GameRuntime } from '@/game/runtime/game-runtime';
import {
  confirmAction,
  discardDraftAtom,
  draftSettingsAtom,
  isDirtyAtom,
  isSettingsPanelOpenAtom,
  openSettingsPanelAtom,
  saveDraftAtom,
  updateDraftSettingAtom,
} from '@/store/atoms';

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
  { key: 'obstacleWidth', label: 'Obstacle Width', step: 1, min: 1 },
  { key: 'obstacleHeight', label: 'Obstacle Height', step: 1, min: 1 },
  { key: 'startingLives', label: 'Starting Lives', step: 1, min: 1 },
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
  { key: 'collectibleCollisionRadius', label: 'Coin Collision Radius', step: 1, min: 1 },
  { key: 'distanceScale', label: 'Distance Scale', step: 0.01, min: 0.01 },
  { key: 'passiveScorePerSecond', label: 'Passive Score', step: 1, min: 0 },
  {
    key: 'obstacleCollisionWidthFactor',
    label: 'Obstacle Collision Factor',
    step: 0.05,
    min: 0.05,
  },
  { key: 'backgroundMusicVolume', label: 'BGM Volume', step: 0.01, min: 0 },
  { key: 'sfxVolume', label: 'SFX Volume', step: 0.01, min: 0 },
];

export function GameSettingsFloatingPanel() {
  const isOpen = useAtomValue(isSettingsPanelOpenAtom);
  const isDirty = useAtomValue(isDirtyAtom);
  const openSettingsPanel = useSetAtom(openSettingsPanelAtom);
  const saveDraft = useSetAtom(saveDraftAtom);

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
          openSettingsPanel();
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
                    <Button size="sm" variant="outline" onClick={handleDiscardRequest}>
                      Discard
                    </Button>
                    <Button
                      colorPalette="blue"
                      size="sm"
                      onClick={() => {
                        saveDraft();
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
  const draftSettings = useAtomValue(draftSettingsAtom);
  const updateDraft = useSetAtom(updateDraftSettingAtom);
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
          updateDraft({ key: field.key, value: Number(event.currentTarget.value) });
        }}
      />
    </Field.Root>
  );
}

async function handleCloseRequest(): Promise<void> {
  const store = (await import('jotai/vanilla')).getDefaultStore();
  if (!store.get(isDirtyAtom)) {
    store.set(isSettingsPanelOpenAtom, false);
    return;
  }
  await handleDiscardRequest();
}

async function handleDiscardRequest(): Promise<void> {
  const store = (await import('jotai/vanilla')).getDefaultStore();
  if (!store.get(isDirtyAtom)) {
    store.set(discardDraftAtom);
    return;
  }

  const shouldDiscard = await confirmAction({
    title: 'Discard unsaved settings?',
    message: 'Any tuning changes in the floating panel will be lost.',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
  });

  if (shouldDiscard) {
    store.set(discardDraftAtom);
  }
}
