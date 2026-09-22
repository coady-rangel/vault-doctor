import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { localTarget, parseNote } from '../src/parse';
import { ATTACHMENT_EXTENSIONS, scanVault } from '../src/scanner';
import type { VaultReader } from '../src/types';

// Test-only resolver: fixture names are unambiguous. Production delegates to Obsidian.
function resolve(files: readonly string[], target: string, source: string): string | null {
  const clean = target.replace(/^\//, '');
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(source), target));
  for (const candidate of [relative, `${relative}.md`, clean, `${clean}.md`]) {
    if (files.includes(candidate)) return candidate;
  }
  return files.find(file => path.posix.basename(file) === target || path.posix.basename(file) === `${target}.md`) ?? null;
}

function memoryReader(contents: Record<string, string>): VaultReader {
  const files = Object.freeze(Object.keys(contents));
  return Object.freeze({
    listFiles: () => files,
    readNote: async (file: string) => {
      if (!(file in contents)) throw new Error('Unreadable');
      return contents[file]!;
    },
    resolveLink: (target: string, source: string) => resolve(files, target, source),
  });
}

async function filesIn(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const child of await filesIn(path.join(root, entry.name))) files.push(`${entry.name}/${child}`);
    } else files.push(entry.name);
  }
  return files.sort();
}

async function snapshot(root: string) {
  return Promise.all((await filesIn(root)).map(async file => {
    const full = path.join(root, file);
    const info = await stat(full);
    return { file, size: info.size, mtime: info.mtimeMs, mode: info.mode, hash: createHash('sha256').update(await readFile(full)).digest('hex') };
  }));
}

test('fixture scan finds all four categories and marks incomplete orphan coverage', async () => {
  const root = path.resolve('tests/fixtures/vault');
  const files = await filesIn(root);
  const report = await scanVault({
    listFiles: () => files,
    readNote: file => readFile(path.join(root, file), 'utf8'),
    resolveLink: (target, source) => resolve(files, target, source),
  });
  assert.equal(report.notesScanned, 3);
  assert.equal(report.attachmentsScanned, 2);
  assert.deepEqual(report.counts, { 'broken-link': 1, 'missing-attachment': 1, 'orphan-attachment': 1, 'invalid-frontmatter': 1 });
  assert.equal(report.orphanResultsIncomplete, true);
  assert.match(report.findings.find(item => item.category === 'orphan-attachment')!.explanation, /only an orphan candidate/);
  assert.deepEqual(report.findings.map(item => item.target).filter(Boolean).sort(), ['Does Not Exist', 'assets/missing.png']);
  assert.equal(report.issues.length, 0);
});

test('scanning a real fixture copy twice preserves file paths, bytes, sizes, modes, and modification times', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vault-doctor-test-'));
  try {
    await cp(path.resolve('tests/fixtures/vault'), root, { recursive: true });
    const before = await snapshot(root);
    const files = Object.freeze(await filesIn(root));
    const reader = Object.freeze({
      listFiles: () => files,
      readNote: (file: string) => readFile(path.join(root, file), 'utf8'),
      resolveLink: (target: string, source: string) => resolve(files, target, source),
    });
    const first = await scanVault(reader);
    const second = await scanVault(reader);
    assert.deepEqual(second.findings, first.findings);
    assert.deepEqual(second.counts, first.counts);
    const excluded = await scanVault(reader, { excludedFolders: ['Notes'] });
    assert.deepEqual((await scanVault(reader, { excludedFolders: ['Notes'] })).findings, excluded.findings);
    assert.deepEqual(await snapshot(root), before);
  } finally {
    // Only the test harness creates/removes its own temporary copy.
    await rm(root, { recursive: true, force: true });
  }
});

test('orphans exclude attachments referenced by wiki, Markdown, reference-style, and property links', async () => {
  const report = await scanVault(memoryReader({
    'Home.md': '---\nasset: "[[a.svg]]"\n---\n![[b.png|80]]\n[pdf](c.pdf)\n![d][asset]\n\n[asset]: d.JPG\n',
    'a.svg': '', 'b.png': '', 'c.pdf': '', 'd.JPG': '', 'orphan.webp': '', 'ignored.zip': '',
  }));
  assert.deepEqual(report.findings.map(item => item.path), ['orphan.webp']);
  assert.equal(report.counts['orphan-attachment'], 1);
  assert.equal(report.attachmentsScanned, 5);
  assert.equal(report.unsupportedFiles, 1);
});

test('links handle aliases, transclusions, headings, blocks, relative paths, escaped and encoded filenames', async () => {
  const report = await scanVault(memoryReader({
    'folder/Source.md': '[[Target|alias]]\n![[Target#Heading]]\n[[Target#^block]]\n[space](../Space%20Note.md)\n[parens](../A\\(B\\).md)\n[[#Heading]]\n[block](#^block)\n[[missing]] [[missing|repeat]]\n![[missing-note]]\n',
    'Target.md': '', 'Space Note.md': '', 'A(B).md': '',
  }));
  assert.equal(report.counts['broken-link'], 2);
  assert.equal(report.counts['missing-attachment'], 0);
});

test('code, escaped wikilinks, HTML comments, and Obsidian comments do not produce links', () => {
  const note = '`[[inline]]`\n\n```md\n[[fenced]]\n```\n\n    [[indented]]\n\n\\[\\[escaped]]\n<!-- [[html]] -->\n\n%% [[comment]] %%\n\nText %% [[inline-comment]] %% after\n';
  assert.deepEqual(parseNote(note).references, []);
});

test('external destinations never reach the vault resolver', async () => {
  const reader = memoryReader({ 'Home.md': '[web](https://example.com/no.md)\n[mail](mailto:a@b.com)\n[app](obsidian://open)\n![image](//cdn.example.com/no.png)\n[[https://example.com]]\n' });
  let calls = 0;
  const report = await scanVault({ ...reader, resolveLink: () => { calls++; return null; } });
  assert.equal(calls, 0);
  assert.equal(report.findings.length, 0);
  for (const value of ['https://a', 'HTTP://a', '//a/b', 'mailto:a', 'data:image/png,x', 'file:///tmp/a', 'tel:123']) assert.equal(localTarget(value), null);
  assert.equal(localTarget('a%23b.png#section'), 'a#b.png');
  assert.equal(localTarget('100%.png'), '100%.png');
});

test('actual YAML syntax errors and missing delimiters are flagged, not metadata style', () => {
  for (const content of [
    '---\ntitle: [unclosed\n---\n',
    '---\ntitle: one\ntitle: two\n---\n',
    '---\ntitle: okay\n',
    '---\nvalue: *missing\n---\n',
    '---\na:\n\tbad: indentation\n---\n',
  ]) assert.ok(parseNote(content).frontmatterError, content);
  for (const content of [
    'No frontmatter\n---\ntext',
    '---\n---\n',
    '---\n[one, two]\n---\n',
    '---\ntitle: plain\nnumber: 3\nblock: |\n  line one\n  line two\n---\n',
    '\uFEFF---\r\ntitle: Windows\r\n---\r\n',
    '---\na: &a [*a]\n---\n',
  ]) assert.equal(parseNote(content).frontmatterError, undefined, content);
});

test('a bad note does not prevent scanning later notes and orphan results disclose incomplete coverage', async () => {
  const reader = memoryReader({ 'A.md': '', 'B.md': '[[broken]]', 'asset.png': '' });
  const report = await scanVault({ ...reader, readNote: async file => { if (file === 'A.md') throw new Error('Permission denied'); return reader.readNote(file); } });
  assert.equal(report.issues.length, 1);
  assert.equal(report.notesScanned, 1);
  assert.equal(report.counts['broken-link'], 1);
  assert.equal(report.counts['orphan-attachment'], 1);
  assert.equal(report.orphanResultsIncomplete, true);
});

test('every supported asset suffix is classified as missing in a normal link or embed', async () => {
  const content = [...ATTACHMENT_EXTENSIONS].map(ext => `[asset](missing.${ext.toUpperCase()})`).join('\n');
  const report = await scanVault(memoryReader({ 'Home.md': content }));
  assert.equal(report.counts['missing-attachment'], ATTACHMENT_EXTENSIONS.size);
  assert.equal(report.counts['broken-link'], 0);
});

test('resolver receives source context and only inventory destinations are accepted', async () => {
  const calls: string[][] = [];
  const report = await scanVault({
    listFiles: () => ['folder/Note.md'],
    readNote: async () => '[[Gone]]',
    resolveLink: (target, source) => { calls.push([target, source]); return 'Gone.md'; },
  });
  assert.deepEqual(calls, [['Gone', 'folder/Note.md']]);
  assert.equal(report.counts['broken-link'], 1);
});

test('nested Unicode and space filenames resolve, while headings and display aliases only check files', async () => {
  const report = await scanVault(memoryReader({
    '深い folder/Nested/Source.md': '[雪](../../資料/雪%20note.md#missing-heading)\n[[資料/雪 note|別名]]\n[[資料/雪 note#^missing-block]]',
    '資料/雪 note.md': '---\naliases: [別名]\n---\n',
  }));
  assert.equal(report.findings.length, 0);
});

test('bare frontmatter alias names have no custom alias lookup', async () => {
  const report = await scanVault(memoryReader({ 'Home.md': '[[Nickname]]', 'Real.md': '---\naliases: [Nickname]\n---\n' }));
  assert.equal(report.counts['broken-link'], 1);
});

test('cancelled scans stop reading and never return a partial healthy report', async () => {
  const controller = new AbortController();
  let reads = 0;
  await assert.rejects(scanVault({
    listFiles: () => ['A.md', 'B.md'],
    readNote: async () => { reads++; controller.abort(); return ''; },
    resolveLink: () => null,
  }, { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(reads, 1);
});
