import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { scanVault } from '../src/scanner';
import { syntheticVault, SYNTHETIC_COUNTS } from '../tests/synthetic';

const notes = Number(process.argv[2]);
const { reader } = syntheticVault(notes);
(globalThis as typeof globalThis & { gc?: () => void }).gc?.();
const before = process.memoryUsage();
const report = await scanVault(reader);
const after = process.memoryUsage();
assert.equal(report.notesScanned, notes);
assert.deepEqual(report.counts, SYNTHETIC_COUNTS);
assert.equal(report.issues.length, 0);
const mib = (bytes: number) => Number((bytes / 1024 / 1024).toFixed(2));
console.log(JSON.stringify({
  measuredAt: report.startedAt, node: process.version, platform: `${process.platform}/${process.arch}`, cpu: cpus()[0]?.model,
  notes, attachments: report.attachmentsScanned, durationMs: Number(report.durationMs.toFixed(2)),
  heapBeforeMiB: mib(before.heapUsed), heapAfterMiB: mib(after.heapUsed), heapDeltaMiB: mib(after.heapUsed - before.heapUsed),
  rssAfterMiB: mib(after.rss), processPeakRssMiB: Number((process.resourceUsage().maxRSS / 1024).toFixed(2)),
  counts: report.counts, findings: report.findings.length,
}));
