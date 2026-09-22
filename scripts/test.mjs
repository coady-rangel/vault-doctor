import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

await build({
  stdin: {
    contents: "import './tests/scanner.test.ts'; import './tests/adapter.test.ts'; import './tests/report.test.ts'; import './tests/settings.test.ts'; import './tests/synthetic.test.ts'; import './tests/report-ui.test.ts';",
    resolveDir: process.cwd(),
    sourcefile: 'test-entry.ts',
  },
  bundle: true,
  platform: 'node',
  packages: 'external',
  alias: { obsidian: './tests/obsidian-ui-stub.ts' },
  format: 'esm',
  outfile: '.test-build/tests.mjs',
});
// node:test runs registered tests on exit; no version-specific isolation flags needed.
const result = spawnSync(process.execPath, ['.test-build/tests.mjs'], {
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
