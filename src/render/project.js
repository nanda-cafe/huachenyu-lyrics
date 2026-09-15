import { loadProjects, loadSongIndex } from '../data-loader.js';
import { navigate } from '../router.js';
import { state } from '../state.js';
import { coverStyle } from './helpers.js';

export async function showProject(projectId) {
  const [projects, songIndex] = await Promise.all([loadProjects(), loadSongIndex()]);
  const project = projects.find(p => p.id === projectId);
  if (!project) { navigate(''); return; }

  document.title = `${project.title} · 华晨宇歌词库`;

  document.getElementById('project-breadcrumb').innerHTML =
    `<a data-action="home">华晨宇歌词库</a><span class="sep">/</span><span class="current">${project.title}</span>`;

  const knownTitles = new Set(songIndex.map(s => s.title));
  const uniqueTrackTitles = [...new Set(project.tracks.map(t => t.title))];
  const available = uniqueTrackTitles.filter(t => knownTitles.has(t)).length;
  const total = uniqueTrackTitles.length;

  document.getElementById('project-header').innerHTML = `
    <div class="avh-top">
      <div class="avh-cover" style="${coverStyle(project.cover)}"></div>
      <div>
        <h2>${project.title}</h2>
        <div class="avh-py">${project.pinyin}</div>
        <div class="avh-en">${project.english}</div>
        <div class="avh-meta">${available} / ${total} tracks in database</div>
      </div>
    </div>`;

  const contextText = project.context[state.currentLang] || project.context.en;
  document.getElementById('project-context').innerHTML =
    `<p class="album-context-text">${contextText}</p>`;

  const list = document.getElementById('project-tracks');
  list.innerHTML = project.tracks.map((t, i) => {
    const song = songIndex.find(s => s.title === t.title);
    const isAvailable = !!song;
    const num = String(i + 1).padStart(2, '0');
    return `<div class="track-item ${isAvailable ? '' : 'missing'}" data-song="${song ? song.id : ''}">
      <span class="track-num">${num}</span>
      <div class="track-info">
        <div class="track-hz">${t.title}</div>
        <div class="track-context">${t.year} · ${t.context}</div>
      </div>
      <span class="track-badge ${isAvailable ? 'available' : ''}">${isAvailable ? '✓ Available' : 'Missing'}</span>
    </div>`;
  }).join('');

  list.querySelectorAll('.track-item:not(.missing)').forEach(item => {
    item.addEventListener('click', () => navigate('song/' + item.dataset.song));
  });

  document.getElementById('project-back-btn').onclick = () => navigate('');
  document.getElementById('project-breadcrumb').onclick = (e) => {
    if (e.target.dataset.action === 'home') navigate('');
  };
}
