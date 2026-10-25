import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  envDir: false,
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    allowOnly:false,
    environment: 'node',
    // Legacy IDEM fixtures cannot initialize permission/PIN-specific suites.
    // Those contracts retain their dedicated configurations and runtime gates.
    include: [
      'tests/contracts/writeBootstrap.contract.test.ts',
      'tests/contracts/writeCatalog.contract.test.ts',
      'tests/contracts/writeConcurrency.contract.test.ts',
      'tests/contracts/writeFaults.contract.test.ts',
      'tests/contracts/writeNumericWire.contract.test.ts',
      'tests/contracts/writeOperations.contract.test.ts',
      'tests/contracts/writePermissions.contract.test.ts',
      'tests/contracts/writeRecovery.contract.test.ts',
      'tests/contracts/writeSchema.contract.test.ts',
    ],
    globalSetup: ['tests/contracts/globalSetup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    maxWorkers: 1,
    passWithNoTests: false,
  },
});
