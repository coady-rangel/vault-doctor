import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { App } from 'obsidian';
import { createVaultReader } from '../src/obsidian-reader';
import { scanVault } from '../src/scanner';

test('the production Obsidian adapter scans using only inventory, read, and resolve capabilities', async () => {
  const files = Object.freeze([Object.freeze({ path: 'Home.md' }), Object.freeze({ path: 'used.svg' }), Object.freeze({ path: 'orphan.png' })]);
  const calls: string[] = [];
  // Reject every unapproved API access, including writes, adapter access, and network access.
  const readOnly = (allowed: Record<string, unknown>) => new Proxy(allowed, {
    get(object, key) {
      assert.equal(typeof key, 'string');
      assert.ok(Object.hasOwn(object, key), `Unexpected capability: ${String(key)}`);
      calls.push(String(key));
      return object[key as string];
    },
    set() { assert.fail('Mutation attempted'); },
  });
  const vault = readOnly({
    getFiles: () => files,
    read: async (file: { path: string }) => { assert.equal(file.path, 'Home.md'); return '![[used.svg]] [[Missing]]'; },
  });
  const metadataCache = readOnly({
    getFirstLinkpathDest: (target: string, source: string) => {
      assert.equal(source, 'Home.md');
      return files.find(file => file.path === target) ?? null;
    },
  });
  const app = readOnly({ vault, metadataCache }) as unknown as Pick<App, 'vault' | 'metadataCache'>;
  const report = await scanVault(createVaultReader(app));
  assert.equal(report.counts['broken-link'], 1);
  assert.equal(report.counts['orphan-attachment'], 1);
  assert.deepEqual([...new Set(calls)].sort(), ['getFiles', 'getFirstLinkpathDest', 'metadataCache', 'read', 'vault']);
});

test('duplicate basenames delegate each source context to Obsidian without guessing', async () => {
  const files = ['One/Home.md', 'Two/Home.md', 'One/Same.md', 'Two/Same.md'].map(path => ({ path }));
  const calls: string[][] = [];
  const app = {
    vault: { getFiles: () => files, read: async (file: { path: string }) => file.path.endsWith('Home.md') ? '[[Same|display]] [[Same#Heading]] [[Same#^block]]' : '' },
    metadataCache: { getFirstLinkpathDest: (target: string, source: string) => {
      calls.push([target, source]);
      return files.find(file => file.path === source.replace('Home.md', 'Same.md')) ?? null;
    } },
  } as unknown as Pick<App, 'vault' | 'metadataCache'>;
  const report = await scanVault(createVaultReader(app));
  assert.equal(report.findings.length, 0);
  assert.deepEqual(calls, [
    ['Same', 'One/Home.md'], ['Same', 'One/Home.md'], ['Same', 'One/Home.md'],
    ['Same', 'Two/Home.md'], ['Same', 'Two/Home.md'], ['Same', 'Two/Home.md'],
  ]);
});
