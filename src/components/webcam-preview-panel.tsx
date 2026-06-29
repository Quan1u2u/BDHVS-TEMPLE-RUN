import { Box, Text, VStack } from '@chakra-ui/react';
import { useAtomValue } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';
import { useEffect, useRef } from 'react';

import type { PoseLandmark } from '@/game/domain/types';
import {
  previewLandmarksAtom,
  previewStreamAtom,
  previewVideoHeightAtom,
  previewVideoWidthAtom,
  trackingStatusAtom,
} from '@/store/atoms';
import { GameHeading } from './game-heading';

const POSE_CONNECTIONS: Array<[number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

export function WebcamPreviewPanel() {
  const stream = useAtomValue(previewStreamAtom);
  const trackingStatus = useAtomValue(trackingStatusAtom);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    let raf = 0;
    let lastW = 0;
    let lastH = 0;
    let lastCtx: CanvasRenderingContext2D | null = null;

    function frame() {
      const c = canvasRef.current;
      if (!c) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const cx = lastCtx || c.getContext('2d', { willReadFrequently: false });
      if (!cx) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastCtx = cx;

      const store = getDefaultStore();
      const landmarks = store.get(previewLandmarksAtom);
      const w = store.get(previewVideoWidthAtom) || 320;
      const h = store.get(previewVideoHeightAtom) || 180;

      if (w !== lastW || h !== lastH) {
        c.width = w;
        c.height = h;
        lastW = w;
        lastH = h;
      }

      cx.clearRect(0, 0, w, h);
      drawPoseOverlay(cx, landmarks, w, h);
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <VStack align="stretch" gap={2} boxSize="full" overflow="hidden" p={4}>
      <GameHeading>Webcam</GameHeading>
      <Box
        bg="bg.muted"
        borderColor="border"
        borderRadius="md"
        borderStyle="dashed"
        borderWidth={2}
        aspectRatio="16 / 9"
        h="50%"
        w="fit"
        overflow="hidden"
        position="relative"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            width: '100%',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            height: '100%',
            inset: 0,
            pointerEvents: 'none',
            position: 'absolute',
            transform: 'scaleX(-1)',
            width: '100%',
          }}
        />
        {!stream ? (
          <Box
            alignItems="center"
            bg="bg/80"
            color="fg.muted"
            display="flex"
            fontSize="sm"
            inset={0}
            justifyContent="center"
            position="absolute"
          >
            Camera preview
          </Box>
        ) : null}
      </Box>
      <Text color="fg.muted" fontSize="sm">
        Tracking status: {trackingStatus}
      </Text>
    </VStack>
  );
}

function drawPoseOverlay(
  context: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
): void {
  context.strokeStyle = '#38bdf8';
  context.lineWidth = 2;

  for (const [from, to] of POSE_CONNECTIONS) {
    const start = landmarks[from];
    const end = landmarks[to];
    if (!start || !end) continue;
    context.beginPath();
    context.moveTo(start.x * width, start.y * height);
    context.lineTo(end.x * width, end.y * height);
    context.stroke();
  }

  context.fillStyle = '#f97316';
  context.beginPath();
  const r = 4;
  for (const landmark of landmarks) {
    const lx = landmark.x * width;
    const ly = landmark.y * height;
    context.moveTo(lx + r, ly);
    context.arc(lx, ly, r, 0, Math.PI * 2);
  }
  context.fill();
}
