import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('1. Checking TypeScript types (tsc -b)...');
execSync(`"${process.execPath}" "${path.join(root, 'node_modules', 'typescript', 'bin', 'tsc')}" -b`, {
  cwd: root,
  stdio: 'inherit',
});

console.log('2. Running Vite production bundle (vite build)...');
execSync(`"${process.execPath}" "${path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')}" build`, {
  cwd: root,
  stdio: 'inherit',
});

console.log('Build completed successfully!');
