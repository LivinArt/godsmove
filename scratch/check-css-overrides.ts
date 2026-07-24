import fs from 'fs';
import path from 'path';

function walk(dir: string, files: string[] = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(fullPath, files);
      }
    } else if (file.endsWith('.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

const cssFiles = walk('.');
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('background') || content.includes('opacity')) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('image') || line.includes('img') || line.includes('card') || line.includes('pic')) {
        console.log(`${file}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
}
