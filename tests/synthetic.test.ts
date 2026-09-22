import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scanVault } from '../src/scanner';
import { syntheticVault, SYNTHETIC_COUNTS } from './synthetic';

for (const count of [100, 1000, 10000]) {
  test(`deterministic ${count}-note stress fixture preserves contents and produces bounded findings twice`, async () => {
    const fixture = syntheticVault(count);
    const before = [...fixture.contents];
    assert.deepEqual([...syntheticVault(count).contents], before);
    const first = await scanVault(fixture.reader);
    const second = await scanVault(fixture.reader);
    assert.equal(first.notesScanned, count);
    assert.equal(first.attachmentsScanned, Math.ceil(count / 10) + 2);
    assert.deepEqual(first.counts, SYNTHETIC_COUNTS);
    assert.deepEqual(first.findings, second.findings);
    assert.equal(first.issues.length, 0);
    assert.deepEqual([...fixture.contents], before);
  });
}
