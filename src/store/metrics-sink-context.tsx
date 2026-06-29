import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { MetricsSink } from './atoms/sink';

const MetricsSinkContext = createContext<MetricsSink | null>(null);

export function MetricsSinkProvider({
  value,
  children,
}: {
  value: MetricsSink;
  children: ReactNode;
}) {
  return <MetricsSinkContext.Provider value={value}>{children}</MetricsSinkContext.Provider>;
}

export function useMetricsSink(): MetricsSink {
  const value = useContext(MetricsSinkContext);
  if (!value) {
    throw new Error('MetricsSinkProvider is missing');
  }
  return value;
}
