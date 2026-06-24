'use client';

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode';

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: 'blue',
    },
  },
  theme: {
    recipes: {
      button: {
        defaultVariants: { rounded: 'md' },
      },
      input: {
        defaultVariants: { rounded: 'md' },
      },
    },
    tokens: {
      fonts: {
        bangers: { value: '"Bangers", serif' },
        heading: { value: '"Inter Variable", sans-serif' },
        body: { value: '"Inter Variable", sans-serif' },
        mono: { value: '"JetBrains Mono Variable", monospace' },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  );
}
