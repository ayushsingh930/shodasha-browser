/**
 * Desktop build helper.
 *
 * Compiles TypeScript and then copies static assets (preload script and
 * renderer HTML/CSS) that are not handled by the TypeScript compiler into the
 * dist output tree.
 */

import { copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');
const repoRoot = path.resolve(root, '..', '..');
const tscEntry = path.join(
  repoRoot,
  'node_modules',
  'typescript',
  'bin',
  'tsc',
);

function ensureDir(target) {
  mkdirSync(target, { recursive: true });
}

function copy(relFrom, relTo) {
  const from = path.join(srcDir, relFrom);
  const to = path.join(distDir, relTo);
  ensureDir(path.dirname(to));
  copyFileSync(from, to);
  process.stdout.write(`copied ${relFrom} -> ${relTo}\n`);
}

// 1) Type-check and compile. Invoke tsc through node to be cross-platform.
execFileSync(process.execPath, [tscEntry, '-p', 'tsconfig.json'], {
  cwd: root,
  stdio: 'inherit',
});

// 2) Copy static assets that the TypeScript compiler does not handle.
//    (copyFileSync overwrites existing files; tsc output is preserved.)
copy(path.join('preload', 'preload.cjs'), path.join('preload', 'preload.cjs'));
copy(path.join('renderer', 'index.html'), path.join('renderer', 'index.html'));
copy(path.join('renderer', 'styles.css'), path.join('renderer', 'styles.css'));
