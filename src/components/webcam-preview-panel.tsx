import { Box, Text, VStack } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';

import type { PoseLandmark } from '@/game/domain/types';
import { useGameStore } from '@/store/game-store';
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
  const preview = useGameStore((state) => state.preview);
  const trackingStatus = useGameStore((state) => state.metrics.trackingStatus);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = preview.stream;
    }
  }, [preview.stream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const width = preview.videoWidth || 320;
    const height = preview.videoHeight || 180;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    drawPoseOverlay(context, preview.landmarks, width, height);
  }, [preview.landmarks, preview.videoHeight, preview.videoWidth]);

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
        h={40}
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
        {!preview.stream ? (
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
            Camera preview will appear here
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

    if (!start || !end) {
      continue;
    }

    context.beginPath();
    context.moveTo(start.x * width, start.y * height);
    context.lineTo(end.x * width, end.y * height);
    context.stroke();
  }

  for (const landmark of landmarks) {
    context.beginPath();
    context.fillStyle = '#f97316';
    context.arc(landmark.x * width, landmark.y * height, 4, 0, Math.PI * 2);
    context.fill();
  }
}
