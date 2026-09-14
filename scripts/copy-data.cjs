#!/usr/bin/env node
/**
 * `data/` is the single source of truth contributors edit (song lyrics,
 * albums, HSK dictionary). Vite serves static assets from `public/`, so
 * this script mirrors data/ → public/data/ before dev/build.
 *
 * Run automatically via the predev/prebuild npm scripts.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data');
const DEST = path.join(__dirname, '..', 'public', 'data');

fs.rmSync(DEST, { recursive: true, force: true });
fs.cpSync(SRC, DEST, { recursive: true });

console.log(`Copied ${path.relative(process.cwd(), SRC)} → ${path.relative(process.cwd(), DEST)}`);
