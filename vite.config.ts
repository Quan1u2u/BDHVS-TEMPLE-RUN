import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // Adapted from https://performance.dev/how-is-linear-so-fast-a-technical-breakdown#linears-bundler-arc-parcel-rollup-vite-rolldown
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            {
              name: 'vendor-chakra',
              test: /node_modules\/@chakra-ui/,
              priority: 100,
            },
            {
              name: 'vendor-react-core',
              test: /node_modules\/(react|react-dom|react-compiler-runtime)/,
              priority: 90,
            },
            {
              name: (id: string) => {
                // Fix path separators for Windows compatibility
                const normalizedId = id.replace(/\\/g, '/');

                if (normalizedId.includes('node_modules')) {
                  // PNPM and Yarn Plug'n'Play can have nested node_modules, so we take the last occurrence to get the actual package
                  const pkg = normalizedId.match(
                    /node_modules\/((?:@[^/]+\/[^/]+)|[^/]+)(?!.*node_modules)/,
                  );
                  if (pkg) {
                    // Clean up scoped package characters (@ and /) for clean filenames
                    const pkgName = pkg[1]?.replace('@', '').replace('/', '-') ?? 'unknown';
                    return `vendor-${pkgName}`;
                  }
                }
                return null;
              },
              entriesAware: true,
              minModuleSize: 5000, // 5 kB seems good for us, Linear uses 3 kB
            },
          ],
        },
      },
    },
  },
});
