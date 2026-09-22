import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isExcluded, loadSettings, normalizeExcludedFolders } from '../src/settings';
import { scanVault } from '../src/scanner';

test('empty/default settings and normalized deduplicated folder paths', () => {
  assert.deepEqual(loadSettings(null), { excludedFolders: [] });
  assert.deepEqual(normalizeExcludedFolders(['', ' Archive//Old/ ', './Archive/Old', 'Archive\\Old\\Nested', '雪 /资料/']), ['Archive/Old', '雪 /资料']);
  assert.equal(isExcluded('Archive/Old/Deep/Note.md', ['Archive/Old']), true);
  for (const value of ['Archive/Older/Note.md', 'archive/Old/Note.md', 'Archive/Old.md', 'Archive/Old']) assert.equal(isExcluded(value, ['Archive/Old']), false);
});

test('unsafe paths and corrupt settings fail visibly rather than broadening a scan silently', () => {
  for (const value of ['/', '.', '..', 'Archive/../Other', '/Archive', 'C:\\Archive', 'https://example.com', 'A\u0000B']) assert.throws(() => normalizeExcludedFolders([value]));
  for (const value of [{}, { excludedFolders: [5] }, { excludedFolders: ['/Archive'] }, false]) assert.throws(() => loadSettings(value));
});

test('nested exclusions consistently skip notes and attachments, with segment boundaries and full-vault link resolution', async () => {
  const contents: Record<string, string> = {
    'Archive/Nested/Hidden.md': '[[broken excluded]] ![[kept.png]]',
    'Archive/Nested/hidden.png': '',
    'Archive/Nested/deeper/Other.md': '[[also excluded]]',
    'Archives/Keep.md': '[[broken kept]]',
    'Archive-ish/Keep.md': '',
    'Home.md': '[[Archive/Nested/Hidden]] ![[Archive/Nested/hidden.png]]',
    'kept.png': '',
  };
  const read: string[] = [];
  const report = await scanVault({
    listFiles: () => Object.keys(contents),
    readNote: async file => { read.push(file); return contents[file]!; },
    resolveLink: target => target in contents ? target : `${target}.md` in contents ? `${target}.md` : null,
  }, { excludedFolders: ['Archive'] });
  assert.deepEqual(read, ['Archive-ish/Keep.md', 'Archives/Keep.md', 'Home.md']);
  assert.equal(report.notesScanned, 3);
  assert.equal(report.attachmentsScanned, 1);
  assert.equal(report.excludedFiles, 3);
  assert.equal(report.excludedNotes, 2);
  assert.deepEqual(report.counts, { 'broken-link': 1, 'missing-attachment': 0, 'orphan-attachment': 1, 'invalid-frontmatter': 0 });
  assert.equal(report.orphanResultsIncomplete, true);
  assert.equal(report.findings[0]!.target, 'broken kept');
});
