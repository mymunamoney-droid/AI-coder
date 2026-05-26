import fs from 'fs/promises';
import path from 'path';

export function autoProjectName(prompt) {
  const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'untitled';
  return `${slug}-${Date.now()}`;
}

export async function writeProjectFiles(baseDir, files) {
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(baseDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}
