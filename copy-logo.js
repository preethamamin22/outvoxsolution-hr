import fs from 'fs';
import path from 'path';

const source = 'C:/Users/preet/.gemini/antigravity-ide/brain/ed2b7fd1-068d-4661-b32c-492787934acf/media__1786005410413.jpg';
const destDir = './public';
const dest = path.join(destDir, 'logo.jpg');

try {
  if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir);
  }
  fs.copyFileSync(source, dest);
  console.log('Logo copied successfully to ' + dest);
} catch (err) {
  console.error('Error copying logo:', err);
}
