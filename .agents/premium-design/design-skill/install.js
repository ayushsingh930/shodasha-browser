#!/usr/bin/env node

/**
 * @file skills/premium-design/design-skill/install.js
 * @description Premium Design Skill Installer — copies the premium-design skill
 *   to the appropriate agent skill directories (~/.claude/skills/, etc.).
 * @license MIT
 */

'use strict';

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline');

/* ─────────────────────────── Configuration ─────────────────────────── */

const SKILL_NAME = 'premium-design';
const SOURCE_DIR = path.join(__dirname, SKILL_NAME);
const PACKAGED_FILE = path.join(__dirname, 'premium-design.skill');
const SUPPORTED_AGENTS = ['claude', 'opencode', 'codex'];

/* ─────────────────────────── Logger ────────────────────────────────── */

const LOG_LEVELS = { silent: 0, error: 1, warn: 2, info: 3, verbose: 4 };
let currentLogLevel = 'info';

/**
 * Structured logger.
 * @param {string} level - One of 'error','warn','info','verbose'.
 * @param {...*} args - Values to log.
 */
function log(level, ...args) {
  if (LOG_LEVELS[level] === undefined) return;
  if (LOG_LEVELS[level] > LOG_LEVELS[currentLogLevel]) return;
  const prefix = { error: '[ERR]', warn: '[WRN]', info: '[INF]', verbose: '[VRB]' }[level] || '[INF]';
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${prefix} ${args.join(' ')}\n`);
}

const logger = {
  error: (...a) => log('error', ...a),
  warn:  (...a) => log('warn',  ...a),
  info:  (...a) => log('info',  ...a),
  verbose:(...a) => log('verbose', ...a),
};

/* ─────────────────────────── Argument Parser ────────────────────────── */

/**
 * Parse CLI arguments.
 * @param {string[]} argv
 * @returns {{ help: boolean, dryRun: boolean, verbose: boolean, force: boolean, targetDir: ?string }}
 */
function parseArgs(argv) {
  const opts = {
    help: false,
    dryRun: false,
    verbose: false,
    force: false,
    targetDir: null,
  };

  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':    opts.help = true; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--verbose': opts.verbose = true; break;
      case '--force':   opts.force = true; break;
      default:
        if (!opts.targetDir && !args[i].startsWith('--')) {
          opts.targetDir = args[i];
        }
    }
  }
  return opts;
}

/**
 * Print usage and exit.
 * @param {number} [code=0]
 */
function showHelp(code = 0) {
  console.log(`
  🎨 Premium Design Skill Installer  v2.0.0
  ─────────────────────────────────────────

  Usage:  node install.js [options] [target-dir]

  Options:
    --help         Show this help message
    --dry-run      Simulate installation without copying files
    --verbose      Enable detailed logging
    --force        Skip overwrite confirmation prompt

  Examples:
    node install.js
    node install.js --dry-run --verbose
    node install.js --force ~/custom/path
`);
  process.exit(code);
}

/* ─────────────────────────── Platform Helpers ───────────────────────── */

/**
 * Return the user's home directory in a cross-platform way.
 * @returns {string}
 */
function getHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || '';
}

/**
 * Normalise a path for the current platform.
 * @param {string} p
 * @returns {string}
 */
function platformPath(p) {
  return path.normalize(p);
}

/**
 * Check whether a given path is writable.
 * @param {string} dirPath
 * @returns {Promise<boolean>}
 */
async function isWritable(dirPath) {
  try {
    await fsp.access(dirPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/* ─────────────────────────── Prompt ──────────────────────────────────── */

/**
 * Ask the user a yes/no question via stdin.
 * @param {string} question
 * @returns {Promise<boolean>}
 */
function askYesNo(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} (y/N) `, (answer) => {
      rl.close();
      resolve(['y', 'yes'].includes(answer.trim().toLowerCase()));
    });
  });
}

/* ─────────────────────────── Rollback ────────────────────────────────── */

/**
 * Records created files/dirs so they can be cleaned up on failure.
 */
class Rollback {
  constructor() { this.entries = []; }
  record(type, p) { this.entries.push({ type, path: p }); }
  async rollback() {
    for (const entry of this.entries.reverse()) {
      try {
        if (entry.type === 'dir') await fsp.rmdir(entry.path);
        else await fsp.unlink(entry.path);
      } catch { /* best-effort cleanup */ }
    }
    this.entries = [];
  }
}

/* ─────────────────────────── Copy Logic ──────────────────────────────── */

/**
 * Determine target installation directories.
 * @param {Object} opts
 * @param {?string} opts.targetDir
 * @returns {string[]}
 */
function getTargetDirs(opts) {
  if (opts.targetDir) return [platformPath(opts.targetDir)];

  const home = getHomeDir();
  const cwd = process.cwd();
  const dirs = [];

  for (const agent of SUPPORTED_AGENTS) {
    dirs.push(path.join(home, `.${agent}`, 'skills', SKILL_NAME));
    dirs.push(path.join(cwd, `.${agent}`, 'skills', SKILL_NAME));
  }

  return [...new Set(dirs.map((d) => path.resolve(d)))];
}

/**
 * Recursively copy files with progress logging.
 * @param {string} src
 * @param {string} dest
 * @param {Object} ctx
 * @param {Rollback} ctx.rollback
 * @param {boolean} ctx.dryRun
 * @param {boolean} ctx.verbose
 * @returns {Promise<{copied: number, skipped: number}>}
 */
async function copyDir(src, dest, ctx) {
  let copied = 0;
  let skipped = 0;

  const entries = await fsp.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (['node_modules', '__pycache__', '.git'].includes(entry.name)) {
      skipped++;
      continue;
    }

    if (entry.isDirectory()) {
      if (!ctx.dryRun) {
        await fsp.mkdir(destPath, { recursive: true });
        ctx.rollback.record('dir', destPath);
        if (ctx.verbose) logger.verbose(`  dir   ${destPath}`);
      }
      const sub = await copyDir(srcPath, destPath, ctx);
      copied += sub.copied;
      skipped += sub.skipped;
    } else if (entry.isFile()) {
      if (!ctx.dryRun) {
        await fsp.copyFile(srcPath, destPath);
        ctx.rollback.record('file', destPath);
        if (ctx.verbose) logger.verbose(`  file  ${destPath}`);
      }
      copied++;
      if (!ctx.verbose && !ctx.dryRun) process.stdout.write('.');
    }
  }

  return { copied, skipped };
}

/* ─────────────────────────── Permissions ──────────────────────────────── */

/**
 * Ensure the destination tree is writable.
 * @param {string} dir
 * @returns {Promise<void>}
 */
async function ensureWritableTarget(dir) {
  let testPath = dir;
  const stack = [];
  while (!(await pathExists(testPath))) {
    stack.push(testPath);
    testPath = path.dirname(testPath);
    if (testPath === path.dirname(testPath)) break;
  }
  if (!(await isWritable(testPath))) {
    throw new Error(`Cannot write to "${testPath}" — permission denied`);
  }
}

/**
 * Check whether a path exists.
 * @param {string} p
 * @returns {Promise<boolean>}
 */
async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Count files recursively (excluding common artifacts).
 * @param {string} dir
 * @returns {Promise<number>}
 */
async function countFiles(dir) {
  let count = 0;
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (['node_modules', '__pycache__', '.git'].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) count += await countFiles(full);
      else count++;
    }
  } catch { /* ignore */ }
  return count;
}

/* ─────────────────────────── Main ─────────────────────────────────────── */

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.verbose) currentLogLevel = 'verbose';
  if (opts.help) showHelp();

  const targets = getTargetDirs(opts);

  logger.info('');
  logger.info('  🎨 Premium Design Skill Installer  v2.0.0');
  logger.info('  ==========================================\n');

  if (opts.dryRun) logger.info('  [DRY RUN]  No files will be copied.\n');

  // ── Validate source ──
  const sourceExists = await pathExists(SOURCE_DIR);
  const packageExists = await pathExists(PACKAGED_FILE);

  if (!sourceExists && !packageExists) {
    logger.error(`Source not found: ${SOURCE_DIR}`);
    logger.error('Make sure the "premium-design/" directory or "premium-design.skill" file exists.');
    process.exitCode = 1;
    return;
  }

  if (sourceExists) {
    const totalFiles = await countFiles(SOURCE_DIR);
    logger.info(`  Source: ${SOURCE_DIR} (${totalFiles} file(s))`);
  } else {
    logger.info(`  Source: ${PACKAGED_FILE} (packaged skill)`);
  }

  // ── Install to each target ──
  for (const target of targets) {
    const alreadyExists = await pathExists(target);

    if (alreadyExists && !opts.force && !opts.dryRun) {
      const ok = await askYesNo(`  Overwrite existing installation at "${target}"?`);
      if (!ok) {
        logger.info(`  Skipped: ${target}`);
        continue;
      }
    }

    try {
      await ensureWritableTarget(target);
    } catch (err) {
      logger.error(`  Cannot install to "${target}": ${err.message}`);
      continue;
    }

    if (!opts.dryRun) {
      await fsp.mkdir(target, { recursive: true });
    }

    logger.info(`  Installing to: ${target}`);

    const rollback = new Rollback();
    try {
      if (sourceExists) {
        if (!opts.dryRun) process.stdout.write('  Progress: ');
        const result = await copyDir(SOURCE_DIR, target, {
          rollback,
          dryRun: opts.dryRun,
          verbose: opts.verbose,
        });
        if (!opts.dryRun) process.stdout.write(' done\n');

        logger.info(`    Copied: ${result.copied} file(s)`);
        if (result.skipped > 0) logger.info(`    Skipped: ${result.skipped} artifact(s)`);
      } else if (packageExists && !opts.dryRun) {
        await fsp.copyFile(PACKAGED_FILE, path.join(target, 'premium-design.skill'));
        rollback.record('file', path.join(target, 'premium-design.skill'));
        logger.info('    Copied packaged skill file');
      }
    } catch (err) {
      logger.error(`  Copy failed: ${err.message}`);
      logger.info('  Rolling back…');
      await rollback.rollback();
      process.exitCode = 1;
      continue;
    }
  }

  // ── Summary ──
  logger.info('');
  logger.info('  ─────────────────────────────────────────');
  logger.info('  ✅ Premium Design Skill installed!');
  for (const t of targets) {
    logger.info(`     📍 ${t}`);
  }
  logger.info('');
  logger.info('  Restart your agent session to activate the skill.');
  logger.info('  ─────────────────────────────────────────');
  logger.info('');
}

main().catch((err) => {
  logger.error(`Fatal: ${err.stack || err.message}`);
  process.exitCode = 1;
});
