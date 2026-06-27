import { Box, Grid, Heading, HStack, Image, Separator } from '@chakra-ui/react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { GameOverDialog } from '@/components/game-over-dialog';
import { GameOverlay } from '@/components/game-overlay';
import { GameViewport } from '@/components/game-viewport';
import { IdleOverlay } from '@/components/idle-overlay';
import { ControlPanel } from '../components/control-panel';
import { GameSettingsFloatingPanel } from '../components/game-settings-floating-panel';
import { HudPanel } from '../components/hud-panel';
import { WebcamPreviewPanel } from '../components/webcam-preview-panel';

export function App() {
  return (
    <Box h="100dvh" w="100dvw" overflow="hidden">
      <Grid templateColumns="2fr auto 1fr" boxSize="full">
        <Grid boxSize="full" templateRows="auto auto 1fr" alignItems="center">
          <HStack h="fit" alignItems="center" gap={2}>
            {/* Kinda hacky way to align the image, but it's because the original logo not being centered */}
            <Image
              fit="cover"
              w={96}
              h={20}
              mt={4}
              aspectRatio="auto"
              src={`${import.meta.env.BASE_URL}logo.png`}
            />
            <Heading color="colorPalette.fg" fontFamily="bangers" fontSize="4xl">
              Temple Run Lite, điều khiển bằng cơ thể
            </Heading>
          </HStack>
          <Separator w="full" />
          <Box position="relative" boxSize="full">
            <GameViewport />
            <IdleOverlay />
            <GameOverlay />
          </Box>
        </Grid>

        <Separator orientation="vertical" h="full" />

        <Grid templateRows="auto auto auto auto 1fr" boxSize="full">
          <HudPanel />
          <Separator w="full" />
          <ControlPanel />
          <Separator w="full" />
          <WebcamPreviewPanel />
        </Grid>
      </Grid>

      <GameSettingsFloatingPanel />
      <ConfirmDialog />
      <GameOverDialog />
    </Box>
  );
}
