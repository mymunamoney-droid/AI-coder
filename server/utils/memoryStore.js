import fs from 'fs/promises';

const MEMORY_PATH = new URL('../memory/memory.json', import.meta.url);

export async function readMemory() {
  const raw = await fs.readFile(MEMORY_PATH, 'utf-8');
  return JSON.parse(raw);
}

export async function writeMemory(memory) {
  await fs.writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2), 'utf-8');
}
