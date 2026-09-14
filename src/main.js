import { initRouter, goBack, navigate } from './router.js';
import { initSearch } from './search.js';
import { renderSong, getCurrentSong } from './render/index.js';
import { state } from './state.js';

document.getElementById('song-back-btn').onclick = goBack;
document.getElementById('song-breadcrumb').onclick = (e) => {
  const a = e.target.closest('a[data-action]');
  if (!a) return;
  if (a.dataset.action === 'home') navigate('');
  else if (a.dataset.action === 'album') navigate('album/' + a.dataset.album);
};

document.getElementById('lang-toggle').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const lang = btn.dataset.lang;
  if (lang === state.currentLang) return;
  state.currentLang = lang;
  document.querySelectorAll('#lang-toggle button')
    .forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  const song = getCurrentSong();
  if (song) renderSong(song);
});

initSearch();
initRouter();
