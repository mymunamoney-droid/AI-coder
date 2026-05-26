export function parseMultiFileOutput(text) {
  const files = {};
  const regex = /FILE:\s*([^\n]+)\n([\s\S]*?)(?=\nFILE:\s*|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [, name, code] = match;
    files[name.trim()] = code.trim() + '\n';
  }
  return files;
}
