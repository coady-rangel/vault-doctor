import assert from 'node:assert/strict';
import { test } from 'node:test';
import MarkdownIt from 'markdown-it';
import { emptyMessage, overallStatus, reportMarkdown } from '../src/report';
import { scanVault } from '../src/scanner';

const healthy = () => scanVault({ listFiles: () => ['Home.md'], readNote: async () => '# Home', resolveLink: () => null });

test('report status distinguishes healthy, detected issues, candidates, incomplete and empty scans', async () => {
  const report = await healthy();
  assert.equal(overallStatus(report), 'Healthy');
  assert.equal(overallStatus({ ...report, counts: { ...report.counts, 'broken-link': 1 } }), 'Issues found');
  assert.equal(overallStatus({ ...report, findings: [{ category: 'orphan-attachment', path: 'a.png', explanation: '' }] }), 'Needs attention');
  assert.equal(overallStatus({ ...report, issues: [{ path: 'A.md', explanation: 'Unreadable' }] }), 'Needs attention');
  assert.equal(overallStatus({ ...report, orphanResultsIncomplete: true }), 'Needs attention');
  const empty = { ...report, filesInspected: 0 };
  assert.equal(overallStatus(empty), 'Needs attention');
  assert.match(emptyMessage(empty), /No supported files/);
  assert.match(emptyMessage(report), /No problems/);
  assert.match(emptyMessage({ ...report, orphanResultsIncomplete: true }), /coverage is incomplete/);
});

test('Markdown export contains snapshot metadata, scope, counts, errors and every finding', async () => {
  const report = await scanVault({ listFiles: () => ['Home.md', 'a.png'], readNote: async () => '---\na: [bad\n---\n[[missing]] ![[missing.png]]', resolveLink: () => null });
  const text = reportMarkdown({ ...report, issues: [{ path: 'Bad.md', explanation: 'Unreadable' }] }, '0.1.0');
  for (const expected of [report.startedAt, 'Scan duration:', '0\\.1\\.0', 'Files inspected: 2', 'Notes scanned: 1 of 1', 'inventory only): 1', 'provisional', 'Broken internal note links | 1', 'Missing attachments | 1', 'Orphan attachment candidates | 1', 'Invalid frontmatter | 1', 'Scan errors', 'Unreadable']) assert.ok(text.includes(expected), expected);
  assert.equal(report.findings.length, 4);
  for (const finding of report.findings) assert.ok(text.includes(finding.path.replaceAll('.', '\\.')));
  assert.equal(reportMarkdown(report, '0.1.0'), reportMarkdown(report, '0.1.0'));
});

test('vault-controlled export text cannot inject HTML, image fetches or Markdown links', async () => {
  const report = await healthy();
  const attack = '<img src="https://example.invalid/pixel"> ![x](https://example.invalid/pixel) [x](https://example.invalid)\n# heading';
  const text = reportMarkdown({ ...report, findings: [{ category: 'broken-link', path: attack, target: attack, explanation: attack }] }, '0.1.0');
  const html = new MarkdownIt({ html: true }).render(text);
  assert.doesNotMatch(html, /<img|<a href|<h1>heading/);
});

test('scan timing and inspected totals describe the completed snapshot', async () => {
  const report = await healthy();
  assert.ok(Number.isFinite(Date.parse(report.startedAt)));
  assert.ok(report.durationMs >= 0);
  assert.equal(report.filesInspected, 1);
  assert.equal(report.notesDiscovered, 1);
  assert.equal(report.excludedFiles, 0);
});
