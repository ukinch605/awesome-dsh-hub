import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const writers = ['update-registry.yml', 'compat.yml', 'weekly.yml'];

for (const workflow of writers) {
  test(`${workflow}: queued writer checks out current main, not trigger SHA`, () => {
    const yaml = fs.readFileSync(path.join(root, '.github/workflows', workflow), 'utf8');
    assert.match(yaml, /concurrency:\\s*\\n\\s*group: registry-main-writer\\s*\\n\\s*cancel-in-progress: false/);
    assert.match(yaml, /- uses: actions\\/checkout@v4\\s*\\n\\s*with:\\s*\\n\\s*ref: main/);
    assert.doesNotMatch(yaml, /git push\\s+(-f|--force)/);
  });
}
