import { loadAlbums, loadSongIndex } from '../data-loader.js';
import { navigate } from '../router.js';
import { state } from '../state.js';
import { coverStyle, isImageCover, songsInAlbum, stripAnnotations } from './helpers.js';

export async function showAlbum(albumId) {
  const [albums, songIndex] = await Promise.all([loadAlbums(), loadSongIndex()]);
  const album = albums.find(a => a.id === albumId);
  if (!album) { navigate(''); return; }

  document.title = `${album.title} · 华晨宇歌词库`;

  document.getElementById('album-breadcrumb').innerHTML =
    `<a data-action="home">华晨宇歌词库</a><span class="sep">/</span><span class="current">${album.title}</span>`;

  const available = songsInAlbum(album, songIndex).length;
  const total = album.tracks.length;
  const showTitle = !isImageCover(album.cover);
  document.getElementById('album-header').innerHTML = `
    <div class="avh-top">
      <div class="avh-cover" style="${coverStyle(album.cover)}">
        ${showTitle ? album.title : ''}
      </div>
      <div>
        <h2>${album.title}</h2>
        <div class="avh-py">${album.pinyin}</div>
        <div class="avh-en">${album.english}</div>
        <div class="avh-meta">${album.year} · ${available} / ${total} tracks in database</div>
      </div>
    </div>`;

  renderAlbumContext(album);

  const list = document.getElementById('track-list');
  list.innerHTML = album.tracks.map((title, i) => {
    const cleanTitle = stripAnnotations(title);
    const song = songIndex.find(s => s.title === cleanTitle);
    const isAvailable = !!song;
    const num = String(i + 1).padStart(2, '0');
    const py = song ? song.titlePinyin : '—';
    return `<div class="track-item ${isAvailable ? '' : 'missing'}" data-song="${song ? song.id : ''}">
      <span class="track-num">${num}</span>
      <div class="track-info">
        <div class="track-hz">${title}</div>
        <div class="track-py">${py}</div>
      </div>
      <span class="track-badge ${isAvailable ? 'available' : ''}">${isAvailable ? '✓ Available' : 'Missing'}</span>
    </div>`;
  }).join('');

  list.querySelectorAll('.track-item:not(.missing)').forEach(item => {
    item.addEventListener('click', () => navigate('song/' + item.dataset.song));
  });

  document.getElementById('album-back-btn').onclick = () => navigate('');
  document.getElementById('album-breadcrumb').onclick = (e) => {
    if (e.target.dataset.action === 'home') navigate('');
  };
}

function renderAlbumContext(album) {
  const contextEl = document.getElementById('album-context');
  if (!contextEl) return;

  const contextText = album.context ? (album.context[state.currentLang] || album.context.en) : '';
  const referencesHtml = album.references
    ? album.references.map(ref =>
        `[<a href="${ref.url}" target="_blank" rel="noopener noreferrer">${ref.id}</a>]`
      ).join(' ')
    : '';

  contextEl.innerHTML = `
    <p class="album-context-text">
      ${contextText} ${referencesHtml}
    </p>
  `;
}
