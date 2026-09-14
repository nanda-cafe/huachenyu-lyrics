#!/usr/bin/env node
/**
 * Validates every song JSON file against data/song.schema.json,
 * plus a few project-specific checks a schema alone can't express:
 *   - filename must match the song's `id`
 *   - no duplicate ids
 *   - every `pos` has a matching `posName`
 *   - every album's `tracks` list should ideally resolve to a real song
 *     (warning only — albums can list tracks that aren't transcribed yet)
 *
 * Run with: node scripts/lint-data.js
 * Exits non-zero on any error so it fails CI.
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const ROOT = path.join(__dirname, '..');
const SONGS_DIR = path.join(ROOT, 'data', 'songs');
const SCHEMA_PATH = path.join(ROOT, 'data', 'song.schema.json');
const ALBUMS_PATH = path.join(ROOT, 'data', 'albums.json');

const POS_NAMES = {
  pron: 'pron.', verb: 'v.', noun: 'n.', adj: 'adj.', adv: 'adv.',
  part: 'part.', mw: 'm.w.', num: 'num.', prep: 'prep.', conj: 'conj.', intj: 'intj.'
};

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`✖ ${msg}`);
  errors++;
}
function warn(msg) {
  console.warn(`⚠ ${msg}`);
  warnings++;
}

// --- load schema ---
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

// --- validate every song file ---
const files = fs.readdirSync(SONGS_DIR).filter(f => f.endsWith('.json') && f !== '_index.json');
const seenIds = new Set();
const songIds = new Set();

for (const file of files) {
  const filePath = path.join(SONGS_DIR, file);
  const expectedId = file.replace(/\.json$/, '');
  let data;

  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    fail(`${file}: invalid JSON — ${e.message}`);
    continue;
  }

  if (!validate(data)) {
    for (const err of validate.errors) {
      fail(`${file}: ${err.instancePath || '(root)'} ${err.message}`);
    }
    continue; // don't bother with further checks on a structurally broken file
  }

  if (data.id !== expectedId) {
    fail(`${file}: id "${data.id}" does not match filename "${expectedId}"`);
  }
  if (seenIds.has(data.id)) {
    fail(`${file}: duplicate id "${data.id}"`);
  }
  seenIds.add(data.id);
  songIds.add(data.title);

  data.lines.forEach((line, li) => {
    line.words.forEach((w, wi) => {
      if (w.pos && POS_NAMES[w.pos] !== w.posName) {
        warn(`${file}: line ${li + 1} word ${wi + 1} ("${w.hz}") posName "${w.posName}" doesn't match expected "${POS_NAMES[w.pos]}" for pos "${w.pos}"`);
      }
    });
  });
}

// --- cross-check albums.json tracks against known song titles ---
if (fs.existsSync(ALBUMS_PATH)) {
  const albums = JSON.parse(fs.readFileSync(ALBUMS_PATH, 'utf8'));
  albums.forEach(album => {
    (album.tracks || []).forEach(trackTitle => {
      if (!songIds.has(trackTitle)) {
        warn(`album "${album.id}": track "${trackTitle}" has no matching transcribed song yet`);
      }
    });
  });
}

console.log(`\nChecked ${files.length} song files.`);
if (warnings) console.log(`${warnings} warning(s).`);
if (errors) {
  console.log(`${errors} error(s). Failing.`);
  process.exit(1);
} else {
  console.log('All good ✔');
}
