import { Box, Flex, Grid, GridItem, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Gamepad2, ScanFace } from 'lucide-react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ControlPanel } from '../components/control-panel';
import { GameSettingsFloatingPanel } from '../components/game-settings-floating-panel';
import { GameViewport } from '../components/game-viewport';
import { HudPanel } from '../components/hud-panel';
import { OverlayCopy } from '../components/overlay-copy';
import { WebcamPreviewPanel } from '../components/webcam-preview-panel';

export function App() {
  return (
    <Box color="fg" minH="100vh" overflow="hidden" px={{ base: 4, xl: 8 }} py={{ base: 4, xl: 7 }}>
      <VStack align="stretch" gap={6} mx="auto" maxW={1600}>
        <Flex
          align={{ base: 'start', lg: 'center' }}
          direction={{ base: 'column', lg: 'row' }}
          gap={4}
          justify="space-between"
        >
          <VStack align="start" gap={2}>
            <HStack color="colorPalette.fg" gap={3}>
              <Gamepad2 size={18} />
              <Text
                color="fg.muted"
                fontFamily="mono"
                fontSize="xs"
                fontWeight="800"
                letterSpacing="0.2em"
                textTransform="uppercase"
              >
                Temple Run Lite Reinitialized
              </Text>
            </HStack>
            <Heading color="fg" fontFamily="heading" size="2xl">
              Game-first Pixi runtime, DOM-first control shell
            </Heading>
            <Text color="fg.muted" fontFamily="body" maxW="4xl">
              React, Chakra UI, and lucide-react handle the text-heavy application layer while
              PixiJS owns gameplay rendering. The hot path stays inside a static runtime backed by
              Zustand metrics mirroring.
            </Text>
          </VStack>
          <HStack color="colorPalette.fg" gap={2}>
            <ScanFace size={18} />
            <Text fontSize="sm">MediaPipe Tasks pose controls with keyboard fallback</Text>
          </HStack>
        </Flex>

        <Grid
          h={{ base: 'auto', xl: 'calc(100vh - 12rem)' }}
          gap={6}
          templateColumns={{
            base: '1fr',
            xl: '2fr 1fr',
          }}
        >
          <GridItem h="full">
            <Box position="relative">
              <GameViewport />
              <OverlayCopy />
            </Box>
          </GridItem>
          <GridItem h="full">
            <Grid gap={4} h="full" templateRows={{ base: 'auto auto', xl: '2fr 1fr' }}>
              <GridItem>
                <VStack align="stretch" gap={4} h="full">
                  <ControlPanel />
                  <HudPanel />
                </VStack>
              </GridItem>
              <GridItem minH={220}>
                <WebcamPreviewPanel />
              </GridItem>
            </Grid>
          </GridItem>
        </Grid>
      </VStack>
      <GameSettingsFloatingPanel />
      <ConfirmDialog />
    </Box>
  );
}
