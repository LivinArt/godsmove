const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\308712e5-ff10-4ed7-89b5-4719e576db97';
const tempDir = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\tempmediaStorage';

console.log('--- BRAIN DIRECTORY ---');
if (fs.existsSync(brainDir)) {
  fs.readdirSync(brainDir).forEach(file => {
    if (file.startsWith('media__') || file.includes('logo')) {
      console.log(`File: ${file}, Size: ${fs.statSync(path.join(brainDir, file)).size} bytes`);
    }
  });
}

console.log('\n--- TEMP MEDIA DIRECTORY ---');
if (fs.existsSync(tempDir)) {
  fs.readdirSync(tempDir).forEach(file => {
    console.log(`File: ${file}, Size: ${fs.statSync(path.join(tempDir, file)).size} bytes`);
  });
}
