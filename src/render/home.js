import { loadAlbums, loadSongIndex } from '../data-loader.js';
import { navigate } from '../router.js';
import { coverStyle, isImageCover, songsInAlbum } from './helpers.js';

export async function showHome() {
  document.title = '华晨宇歌词库 · Hua Chenyu Annotated Lyrics';

  const [albums, songIndex] = await Promise.all([loadAlbums(), loadSongIndex()]);
  const singles = songIndex.filter(s => s.single);

  const statEl = document.getElementById('db-stats');
  const totalSongs = songIndex.length;
  const totalAlbums = albums.length;
  statEl.textContent = totalSongs === 0
    ? 'Database empty — add songs under data/songs/'
    : `${totalSongs} song${totalSongs === 1 ? '' : 's'} · ${totalAlbums} album${totalAlbums === 1 ? '' : 's'}` +
      (singles.length ? ` · ${singles.length} single${singles.length === 1 ? '' : 's'}` : '');

  const grid = document.getElementById('album-grid');
  grid.innerHTML = albums.map(album => {
    const available = songsInAlbum(album, songIndex).length;
    const total = album.tracks.length;
    const complete = available === total && total > 0;
    const badge = complete
      ? '<span class="complete-badge">✓ Complete</span>'
      : `<span class="progress-badge">${available}/${total}</span>`;
    const showTitle = !isImageCover(album.cover);
    return `<div class="album-card ${complete ? '' : 'incomplete'}" data-album="${album.id}">
      <div class="album-cover" style="${coverStyle(album.cover)}">
        ${showTitle ? `<div class="cover-hz">${album.title}</div>` : ''}
        ${badge}
      </div>
      <div class="album-info">
        <div class="a-title">${album.title}</div>
        <div class="a-pinyin">${album.pinyin}</div>
        <div class="a-english">${album.english}</div>
        <div class="a-meta">${album.year} · ${total} tracks</div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.album-card').forEach(card => {
    card.addEventListener('click', () => navigate('album/' + card.dataset.album));
  });

  renderSingles(singles);
}

function renderSingles(singles) {
  const section = document.getElementById('singles-section');
  const list = document.getElementById('singles-list');
  if (!section || !list) return;

  if (singles.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  list.innerHTML = singles.map(song => {
    const hskLabel = song.minHsk ? `HSK ${song.minHsk}` : '';
    return `<div class="track-item" data-song="${song.id}">
      <div class="track-info">
        <div class="track-hz">${song.title}</div>
        <div class="track-py">${song.titlePinyin}${song.meta ? ' · ' + song.meta : ''}</div>
      </div>
      ${hskLabel ? `<span class="track-badge available">${hskLabel}</span>` : ''}
    </div>`;
  }).join('');

  list.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', () => navigate('song/' + item.dataset.song));
  });
}
