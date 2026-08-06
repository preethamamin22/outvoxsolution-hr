import { execSync } from 'child_process';
import fs from 'fs';

try {
  const log = execSync('git log -n 5 --oneline', { encoding: 'utf8' });
  const status = execSync('git status', { encoding: 'utf8' });
  const result = `=== LOG ===\n${log}\n=== STATUS ===\n${status}`;
  fs.writeFileSync('git-output.txt', result);
} catch (err) {
  fs.writeFileSync('git-output.txt', 'Error running git log: ' + err.message);
}
