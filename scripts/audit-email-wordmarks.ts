import fs from 'fs';
import path from 'path';

function findFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const emailDirs = [
  path.resolve(process.cwd(), 'src/notifications'),
  path.resolve(process.cwd(), 'src/lib/notification.ts'),
];

console.log('\n============================================================');
console.log('AUDITING ALL EMAIL FILES FOR GODSMOVE OCCURRENCES');
console.log('============================================================\n');

let totalOccurrences = 0;
let fileCount = 0;

for (const entry of emailDirs) {
  const files = fs.statSync(entry).isDirectory() ? findFiles(entry) : [entry];
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(/GODSMOVE/g);
    if (matches) {
      fileCount++;
      totalOccurrences += matches.length;
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`[${matches.length} matches] ${relativePath}`);
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('GODSMOVE')) {
          console.log(`   L${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

console.log('\n------------------------------------------------------------');
console.log(`TOTAL FILES WITH GODSMOVE: ${fileCount}`);
console.log(`TOTAL OCCURRENCES: ${totalOccurrences}`);
console.log('============================================================\n');
