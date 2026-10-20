#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PROVIDERS, publicProfile, readStore, validateProfile, writeStore } from './profiles.js';

const storeFile = process.env.MODEL_ORCHESTRATOR_FILE || path.join(os.homedir(), '.model-orchestrator', 'profiles.json');
const args = process.argv.slice(2);

function help() {
  console.log(`model-orchestrator\n\nCommands:\n  add <name> --provider <anthropic|openai|google> --model <id> [--base-url <url>] [--api-key <key>]\n  list\n  use <name> [--dry-run]\n  current\n  remove <name>\n\nSecrets are only stored when explicitly supplied and are redacted in output.`);
}
function flag(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }
const envNames = { anthropic: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY', google: 'GEMINI_API_KEY' };
async function checkHealth(profile) {
  const url = profile.baseUrl || ({ anthropic: 'https://api.anthropic.com', openai: 'https://api.openai.com', google: 'https://generativelanguage.googleapis.com' }[profile.provider]);
  try { const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: profile.apiKey ? { authorization: `Bearer ${profile.apiKey}`, 'x-api-key': profile.apiKey } : {} }); return { ok: response.status < 500, status: response.status, url }; }
  catch (error) { return { ok: false, status: null, url, error: error.message }; }
}
async function main() {
  const command = args[0];
  if (!command || command === 'help' || command === '--help') return help();
  const store = await readStore(storeFile);
  if (!Array.isArray(store.profiles)) throw new Error('Profile store must contain profiles[]');
  if (command === 'add') {
    const profile = validateProfile({ name: args[1], provider: flag('--provider'), model: flag('--model'), baseUrl: flag('--base-url'), apiKey: flag('--api-key') });
    store.profiles = [...store.profiles.filter(p => p.name !== profile.name), profile];
    await writeStore(storeFile, store); console.log(`Saved ${profile.name} (${profile.provider}/${profile.model})`); return;
  }
  if (command === 'list') { store.profiles.forEach(p => console.log(`${p.name}\t${p.provider}\t${p.model}${p.name === store.active ? '\t(active)' : ''}`)); return; }
  if (command === 'current') { const p = store.profiles.find(x => x.name === store.active); console.log(p ? JSON.stringify(publicProfile(p), null, 2) : 'No active profile'); return; }
  if (command === 'health') { const p = args[1] ? store.profiles.find(x => x.name === args[1]) : store.profiles.find(x => x.name === store.active); if (!p) throw new Error('Profile not found or no active profile'); const r = await checkHealth(p); console.log(`${p.name}: ${r.ok ? 'reachable' : 'unreachable'}${r.status ? ` (HTTP ${r.status})` : ''} — ${r.url}`); return; }
  if (command === 'env') { const p = args[1] ? store.profiles.find(x => x.name === args[1]) : store.profiles.find(x => x.name === store.active); if (!p) throw new Error('Profile not found or no active profile'); console.log(`$env:${envNames[p.provider]} = \"${p.apiKey || ''}\"`); console.log(`$env:AI_MODEL = \"${p.model}\"`); if (p.baseUrl) console.log(`$env:AI_BASE_URL = \"${p.baseUrl}\"`); return; }
  if (command === 'use') {
    const p = store.profiles.find(x => x.name === args[1]); if (!p) throw new Error(`Profile not found: ${args[1]}`);
    if (args.includes('--dry-run')) { console.log(`Would activate ${p.name} (${p.provider}/${p.model})`); return; }
    store.active = p.name; await writeStore(storeFile, store); console.log(`Active profile: ${p.name}`); return;
  }
  if (command === 'remove') { const before = store.profiles.length; store.profiles = store.profiles.filter(p => p.name !== args[1]); if (before === store.profiles.length) throw new Error(`Profile not found: ${args[1]}`); if (store.active === args[1]) store.active = null; await writeStore(storeFile, store); console.log(`Removed ${args[1]}`); return; }
  throw new Error(`Unknown command: ${command}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch(error => { console.error(`Error: ${error.message}`); process.exitCode = 1; });
export { main, storeFile };

