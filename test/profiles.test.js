import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { publicProfile, readStore, validateProfile, writeStore } from '../src/profiles.js';

test('validates supported providers and redacts secrets', () => {
  const p = validateProfile({ name: 'work', provider: 'openai', model: 'gpt-5', apiKey: 'sk-secret-1234' });
  assert.equal(publicProfile(p).apiKey, 'sk-s••••1234');
  assert.throws(() => validateProfile({ name: 'bad', provider: 'local', model: 'x' }));
});
test('writes and reads atomically', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'model-orchestrator-'));
  const file = path.join(dir, 'profiles.json');
  await writeStore(file, { active: 'work', profiles: [{ name: 'work', provider: 'google', model: 'gemini-2.5-pro' }] });
  assert.equal((await readStore(file)).active, 'work');
});

