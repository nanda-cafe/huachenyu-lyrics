import { loadAlbums, loadSong } from '../data-loader.js';
import { navigate } from '../router.js';
import { state } from '../state.js';
import { renderStreamButtons } from './streaming.js';

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
  const englishEl = document.getElementById('song-title-english');
  if (song.english) { englishEl.textContent = song.english; englishEl.style.display = ''; }
  else { englishEl.style.display = 'none'; }
  document.getElementById('song-artist').textContent = song.artist;
  const metaEl = document.getElementById('song-meta');
  if (song.meta) { metaEl.textContent = song.meta; metaEl.style.display = ''; }
  else { metaEl.style.display = 'none'; }
  document.getElementById('stream-icons').innerHTML = renderStreamButtons(song);
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
      // Only real Hanzi tokens link out to MDBG — non-Hanzi tokens like
      // "Follow follow" or "Mer" render as plain (non-clickable) spans.
      const isHanzi = /[\u4e00-\u9fff]/.test(w.hz);
      // Same fallback pattern as line-level translation: use the
      // Portuguese gloss if this word has one, otherwise fall back to
      // English. Most words don't have glossPt yet (see data audit).
      const glossKey = state.currentLang === 'pt' ? 'glossPt' : 'gloss';
      const gloss = w[glossKey] || w.gloss;
      const hzTag = isHanzi
        ? `<a href="https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodeURIComponent(w.hz)}"
              target="_blank" rel="noopener noreferrer"
              class="hz-link ${hskClass}" title="${gloss}">
             <ruby>${w.hz}<rt>${gloss}</rt></ruby></a>`
        : `<span class="hz-link ${hskClass}" title="${gloss}">
             <ruby>${w.hz}<rt>${gloss}</rt></ruby></span>`;
      html += `<div class="word" data-line="${li}" data-word="${wi}"${wordTiming}>
        ${hzTag}
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
      // The glossary is now inside a collapsible <details> panel — open it
      // if collapsed, otherwise the scroll-to below would land on a hidden element.
      const parentDetails = target.closest('details.collapsible');
      if (parentDetails && !parentDetails.open) parentDetails.open = true;
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
