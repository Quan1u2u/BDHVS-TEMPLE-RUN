import { Box } from '@chakra-ui/react';
import { useEffect, useMemo, useRef } from 'react';

import { GameRuntime } from '../game/runtime/game-runtime';
import { createMetricsSink } from '../store/game-store-bridge';

export function GameViewport() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const metricsSink = useMemo(() => createMetricsSink(), []);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    void GameRuntime.bootstrap(host, metricsSink);

    return () => {
      void GameRuntime.destroy();
    };
  }, [metricsSink]);

  return (
    <Box
      ref={hostRef}
      aria-label="Temple Run Lite gameplay viewport"
      bg="bg.panel"
      borderColor="border"
      borderRadius="md"
      borderWidth="1px"
      h="full"
      minH={{ base: '360px', xl: '100%' }}
      overflow="hidden"
      position="relative"
      boxShadow="lg"
    />
  );
}
