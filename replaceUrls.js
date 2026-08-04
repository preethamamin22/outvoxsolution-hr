import fs from 'fs';
import path from 'path';

const directoryPath = path.join(process.cwd(), 'src/pages');

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('http://localhost:5000/api')) {
    const newContent = content.replace(/http:\/\/localhost:5000\/api/g, '/api');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated ' + filePath);
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

scanDir(directoryPath);
console.log('Done');
