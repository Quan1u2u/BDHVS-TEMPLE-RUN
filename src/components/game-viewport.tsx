import { Box } from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { computeTileSize, computeVisibleRows } from '../game/rendering/grid-layout';
import { GameRuntime } from '../game/runtime/game-runtime';
import { createMetricsSink } from '../store/atoms/sink';
import { GameStageScene } from './game-stage-scene';

export function GameViewport() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const metricsSink = useMemo(() => createMetricsSink(), []);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    void GameRuntime.bootstrap(host, metricsSink);
    return () => {
      void GameRuntime.destroy();
    };
  }, [metricsSink]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const tileSize = size.width > 0 ? computeTileSize(size.width) : 0;
  const visibleRows = tileSize > 0 ? computeVisibleRows(size.height, tileSize) : 0;

  return (
    <Box
      ref={hostRef}
      aria-label="Temple Run Lite gameplay viewport"
      boxSize="full"
      overflow="hidden"
    >
      {size.width > 0 && size.height > 0 && tileSize > 0 && visibleRows > 0 ? (
        <GameStageScene
          width={size.width}
          height={size.height}
          tileSize={tileSize}
          visibleRows={visibleRows}
        />
      ) : null}
    </Box>
  );
}
