import fs from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_PROVIDERS = ['anthropic', 'openai', 'google'];

export function redact(value) {
  if (!value) return '';
  return value.length < 8 ? '••••' : `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') throw new Error('Profile must be an object');
  if (!profile.name || !/^[a-z0-9][a-z0-9_-]{1,30}$/i.test(profile.name)) throw new Error('Profile name must be 2-31 letters, numbers, _ or -');
  if (!DEFAULT_PROVIDERS.includes(profile.provider)) throw new Error(`Unsupported provider: ${profile.provider}`);
  if (!profile.model) throw new Error('Model is required');
  if (profile.baseUrl && !/^https?:\/\//.test(profile.baseUrl)) throw new Error('baseUrl must start with http:// or https://');
  return { name: profile.name, provider: profile.provider, model: profile.model, baseUrl: profile.baseUrl || null, apiKey: profile.apiKey || null };
}

export async function readStore(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { active: null, profiles: [] }; throw new Error(`Invalid profile store: ${error.message}`); }
}

export async function writeStore(file, store) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
  try { await fs.rename(temp, file); }
  catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EEXIST') throw error;
    await fs.copyFile(temp, file);
    await fs.unlink(temp);
  }
}

export function publicProfile(profile) {
  return { ...profile, apiKey: profile.apiKey ? redact(profile.apiKey) : null };
}

