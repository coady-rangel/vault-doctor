import { build, context } from 'esbuild';
import { readFile } from 'node:fs/promises';

const notices = await readFile(new URL('./THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8');
const license = await readFile(new URL('./LICENSE', import.meta.url), 'utf8');

const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  outfile: 'main.js',
  logLevel: 'info',
  treeShaking: true,
  banner: { js: `/*\n${license.replaceAll('*/', '* /')}\n${notices.replaceAll('*/', '* /')}\n*/` },
};

if (process.argv.includes('--watch')) {
  await (await context(options)).watch();
} else {
  await build(options);
}
