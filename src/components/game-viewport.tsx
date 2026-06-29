import { Box } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';

import { GameRuntime } from '../game/runtime/game-runtime';
import { useMetricsSink } from '../store/metrics-sink-context';
import { GameStageScene } from './game-stage-scene';

export function GameViewport() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const metricsSink = useMetricsSink();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    void GameRuntime.bootstrap(host, metricsSink);
    return () => {
      void GameRuntime.destroy();
    };
  }, [metricsSink]);

  return (
    <Box
      ref={hostRef}
      aria-label="Temple Run Lite gameplay viewport"
      boxSize="full"
      overflow="hidden"
    >
      <GameStageScene parentRef={hostRef} />
    </Box>
  );
}
