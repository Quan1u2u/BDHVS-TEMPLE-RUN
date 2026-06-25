import type { PropsWithChildren } from 'react';
import { Provider as ChakraProvider } from '@/components/ui/provider';

export function AppProvider({ children }: PropsWithChildren) {
  return <ChakraProvider>{children}</ChakraProvider>;
}
