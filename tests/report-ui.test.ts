import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { App } from 'obsidian';
import { ReportModal } from '../src/main';
import { PROVISIONAL_WARNING, reportMarkdown } from '../src/report';
import type { Finding, ScanReport } from '../src/types';
import { TestElement } from './obsidian-ui-stub';

function makeReport(count: number): ScanReport {
  return {
    startedAt: '2026-09-22T00:00:00.000Z', durationMs: 12,
    filesInspected: 1, notesScanned: 1, notesDiscovered: 1, attachmentsScanned: 0,
    excludedFiles: 0, excludedNotes: 0, excludedFolders: [], unsupportedFiles: 0,
    counts: { 'broken-link': count, 'missing-attachment': 0, 'orphan-attachment': 0, 'invalid-frontmatter': 0 },
    findings: Array.from({ length: count }, (_, index): Finding => ({
      category: 'broken-link', path: 'Home.md', target: `Missing ${index}`, explanation: 'Target could not be resolved.',
    })),
    issues: [], orphanResultsIncomplete: false,
  };
}

function render(report: ScanReport): TestElement {
  const modal = new ReportModal({} as App, '0.1.0', () => {});
  modal.onOpen();
  modal.showReport(report);
  return modal.contentEl as unknown as TestElement;
}

const pagination = (root: TestElement) => root.all().filter(el => el.tag === 'button' && el.text.startsWith('Show next'));

for (const count of [0, 1, 4, 99, 100]) {
  test(`report with ${count} findings creates no unnecessary pagination control`, () => {
    const root = render(makeReport(count));
    assert.equal(pagination(root).length, 0);
    assert.equal(root.all().filter(el => el.tag === 'button').length, 1 + count); // Copy + file buttons only.
    assert.equal(root.all().filter(el => el.tag === 'li').length, count);
  });
}

for (const count of [101, 200, 201]) {
  test(`pagination for ${count} findings removes the control after the last page`, () => {
    const root = render(makeReport(count));
    const button = pagination(root)[0]!;
    assert.equal(pagination(root).length, 1);
    assert.equal(root.all().filter(el => el.tag === 'li').length, 100);
    let shown = 100;
    while (shown < count) {
      assert.equal(button.text, `Show next ${Math.min(100, count - shown)} (${count - shown} remaining)`);
      button.click();
      shown = Math.min(shown + 100, count);
      assert.equal(root.all().filter(el => el.tag === 'li').length, shown);
      assert.equal(pagination(root).length, shown < count ? 1 : 0);
    }
    assert.ok(!root.all().includes(button), 'Completed pagination must be removed, not CSS-hidden');
    assert.ok(button.textHistory.every(text => !/Show next 0|\(0 remaining\)/.test(text)));
  });
}

test('report keeps result hierarchy and full accessible caveat without repeated issue labels', () => {
  const base = makeReport(1);
  const report: ScanReport = {
    ...base, orphanResultsIncomplete: true, attachmentsScanned: 1, filesInspected: 2,
    counts: { ...base.counts, 'orphan-attachment': 1 },
    findings: [...base.findings, { category: 'orphan-attachment', path: 'orphan.svg', explanation: 'No supported reference found; provisional candidate.' }],
  };
  const before = JSON.stringify(report);
  const markdown = reportMarkdown(report, '0.1.0');
  const root = render(report);
  const [status, counts, metadata, summary, copy] = root.children;
  assert.equal(status!.text, 'Issues found');
  assert.equal(counts!.text, '1 notes scanned · 1 attachments checked · 2 findings');
  assert.match(metadata!.text, /Scan started .*12\.0 ms · Vault Doctor 0\.1\.0/);
  assert.equal(summary!.cls, 'vault-doctor-summary');
  assert.equal(copy!.text, 'Copy report as Markdown');
  assert.ok(!root.all().some(el => el.text === 'Issue · detected'));
  assert.equal(root.all().filter(el => el.text === 'Review · provisional candidate').length, 1);
  const warning = root.all().find(el => el.cls === 'vault-doctor-warning')!;
  assert.equal(warning.text, PROVISIONAL_WARNING);
  assert.equal(warning.attr.role, 'note');
  assert.equal(warning.attr['aria-label'], 'Reference coverage caveat');
  assert.ok(root.children.indexOf(warning) > root.children.indexOf(copy!));
  assert.ok(root.children.indexOf(warning) < root.children.findIndex(el => el.tag === 'section'));
  for (const section of root.children.filter(el => el.tag === 'section')) {
    assert.deepEqual(section.children.map(el => el.tag), ['h3', 'ul']);
  }
  assert.equal(JSON.stringify(report), before);
  assert.equal(reportMarkdown(report, '0.1.0'), markdown);
});
