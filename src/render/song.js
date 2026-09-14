import { loadAlbums, loadSong } from '../data-loader.js';
import { navigate } from '../router.js';
import { state } from '../state.js';

let currentSong = null;

export function getCurrentSong() {
  return currentSong;
}

export async function showSong(songId) {
  const song = await loadSong(songId);
  if (!song) { navigate(''); return; }
  currentSong = song;
  renderSong(song);
  await updateSongBreadcrumb(song);
}

export function renderSong(song) {
  document.getElementById('song-title').textContent = song.title;
  document.getElementById('song-title-pinyin').textContent = song.titlePinyin;
  document.getElementById('song-artist').textContent = song.artist;
  const metaEl = document.getElementById('song-meta');
  if (song.meta) { metaEl.textContent = song.meta; metaEl.style.display = ''; }
  else { metaEl.style.display = 'none'; }
  document.title = `${song.title} · 华晨宇歌词库`;

  let html = '';
  song.lines.forEach((line, li) => {
    // data-start/data-end are reserved for the future karaoke player
    // (see docs/KARAOKE.md) — harmless no-ops until a player attaches.
    const lineTiming = line.startMs != null
      ? ` data-start="${line.startMs}" data-end="${line.endMs ?? ''}"`
      : '';
    html += `<div class="line" data-line="${li}"${lineTiming}><div class="words">`;
    line.words.forEach((w, wi) => {
      const hskClass = w.hsk ? 'hsk' + w.hsk : 'no-hsk';
      const wordTiming = w.startMs != null
        ? ` data-start="${w.startMs}" data-end="${w.endMs ?? ''}"`
        : '';
      html += `<div class="word" data-line="${li}" data-word="${wi}"${wordTiming}>
        <span class="hz-link ${hskClass}" title="${w.gloss}">
          <ruby>${w.hz}<rt>${w.gloss}</rt></ruby>
        </span>
        <div class="py">${w.py}</div>`;
      if (w.pos && w.posName) {
        html += `<a href="#gram-${w.pos}" class="pos pos-${w.pos}">${w.posName}</a>`;
      } else {
        html += `<div class="pos">&nbsp;</div>`;
      }
      html += `</div>`;
    });
    html += `</div><div class="translation">${line.translation[state.currentLang] || line.translation.en}</div></div>`;
  });

  document.getElementById('lyrics-container').innerHTML = html;

  document.querySelectorAll('#lyrics-container .pos[href]').forEach(a => {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      target.style.background = '#fff7d6';
      setTimeout(() => { target.style.background = ''; }, 1400);
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

async function updateSongBreadcrumb(song) {
  const albumMatch = song.meta ? song.meta.match(/"([^"]+)"/) : null;
  const albumName = albumMatch ? albumMatch[1] : '';

  const norm = s => (s || '').replace(/\s+/g, '');
  const albums = await loadAlbums();
  const albumObj = albums.find(a => norm(a.title) === norm(albumName));

  const trackMatch = song.meta ? song.meta.match(/Track\s*(\d+)/) : null;
  const trackNum = trackMatch ? trackMatch[1] : '';

  let crumb = `<a data-action="home">华晨宇歌词库</a>`;
  if (albumObj) {
    crumb += `<span class="sep">/</span><a data-action="album" data-album="${albumObj.id}">${albumObj.title}</a>`;
  } else if (albumName) {
    crumb += `<span class="sep">/</span><span>${albumName}</span>`;
  }
  if (trackNum) crumb += `<span class="sep">/</span><span>Track ${trackNum}</span>`;
  crumb += `<span class="sep">/</span><span class="current">${song.title}</span>`;

  document.getElementById('song-breadcrumb').innerHTML = crumb;
}
