import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

await build({ entryPoints: ['scripts/benchmark.ts'], bundle: true, platform: 'node', packages: 'external', format: 'esm', outfile: '.test-build/benchmark.mjs' });
// A fresh process per size prevents cross-size heap retention and JIT warming.
for (const size of [100, 1000, 10000]) {
  const result = spawnSync(process.execPath, ['--expose-gc', '.test-build/benchmark.mjs', String(size)], { stdio: 'inherit' });
  if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
}
