import fs from 'fs/promises';

const MEMORY_PATH = new URL('../memory/memory.json', import.meta.url);

function defaultMemory() {
  return { history: [], projects: [] };
}

export async function readMemory() {
  try {
    const raw = await fs.readFile(MEMORY_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed?.history) ? parsed.history : [],
      projects: Array.isArray(parsed?.projects) ? parsed.projects : []
    };
  } catch {
    return defaultMemory();
  }
}

export async function writeMemory(memory) {
  const safe = {
    history: Array.isArray(memory?.history) ? memory.history : [],
    projects: Array.isArray(memory?.projects) ? memory.projects : []
  };
  await fs.writeFile(MEMORY_PATH, JSON.stringify(safe, null, 2), 'utf-8');
}
