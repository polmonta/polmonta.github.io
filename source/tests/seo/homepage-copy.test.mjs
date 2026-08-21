import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const featuresPath = fileURLToPath(new URL('../../src/components/Features.jsx', import.meta.url));

test('describes the verified export format as XLSX', () => {
  const source = readFileSync(featuresPath, 'utf8');

  assert.match(source, /"XLSX Exports"/);
  assert.doesNotMatch(source, /"CSV Exports"/);
});
