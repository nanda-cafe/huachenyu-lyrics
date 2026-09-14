#!/usr/bin/env node
/**
 * Builds data/songs/_index.json — a lightweight manifest of every song
 * (id, title, titlePinyin, meta, minHsk) used for search-as-you-type
 * without fetching all 58 full song files on page load.
 *
 * Run automatically by `npm run build`, or manually with:
 *   node scripts/build-song-index.js
 */
const fs = require('fs');
const path = require('path');

const SONGS_DIR = path.join(__dirname, '..', 'data', 'songs');
const ALBUMS_PATH = path.join(__dirname, '..', 'data', 'albums.json');
const OUT_PATH = path.join(SONGS_DIR, '_index.json');

// Mirrors src/render/helpers.js stripAnnotations() — strips trailing
// emoji/annotations so '好想爱这个世界啊 🔥' matches song title '好想爱这个世界啊'.
function stripAnnotations(t) {
  return t.replace(/\s*[\p{Extended_Pictographic}\u{FE0F}\u{200D}]+.*$/u, '').trim();
}

const albums = fs.existsSync(ALBUMS_PATH)
  ? JSON.parse(fs.readFileSync(ALBUMS_PATH, 'utf8'))
  : [];

// Every song title referenced by some album's tracks list.
const titlesInAlbums = new Set();
albums.forEach(album => {
  (album.tracks || []).forEach(t => titlesInAlbums.add(stripAnnotations(t)));
});

const files = fs.readdirSync(SONGS_DIR).filter(f => f.endsWith('.json') && f !== '_index.json');

const index = files.map(file => {
  const song = JSON.parse(fs.readFileSync(path.join(SONGS_DIR, file), 'utf8'));
  const levels = new Set();
  song.lines.forEach(l => l.words.forEach(w => { if (w.hsk) levels.add(w.hsk); }));
  const minHsk = levels.size ? Math.min(...levels) : null;
  return {
    id: song.id,
    title: song.title,
    titlePinyin: song.titlePinyin,
    meta: song.meta || '',
    minHsk,
    // A song with no album referencing its title is a single — it gets
    // its own card in the "Singles" section on the home page instead of
    // needing to be added to an album's `tracks` array.
    single: !titlesInAlbums.has(song.title)
  };
});

fs.writeFileSync(OUT_PATH, JSON.stringify(index, null, 2));
const singleCount = index.filter(s => s.single).length;
console.log(`Wrote index for ${index.length} songs (${singleCount} singles) to ${path.relative(process.cwd(), OUT_PATH)}`);
