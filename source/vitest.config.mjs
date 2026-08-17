import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.mjs'],
    exclude: [
      'tests/container-scroll-animation.test.mjs',
      'tests/migration/source-contract.test.mjs',
      'tests/seo/validate-baseline-data.test.mjs',
      'tests/seo/import-app-store-evidence.test.mjs'
    ]
  }
});
