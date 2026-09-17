import { initRouter, goBack, navigate } from './router.js';
import { initSearch } from './search.js';
import { renderSong, getCurrentSong } from './render/index.js';
import { state, toggleMark } from './state.js';

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

// Mark toggles (HSK colours / Grammar tags / Translation / Pinyin).
// Visibility itself is pure CSS (see body.hide-* rules in styles/main.css)
// driven by classes on <body>, so this only needs to run once per toggle
// and once on boot — it does NOT need to re-run on every song navigation,
// since body-level classes survive #lyrics-container being replaced.
function applyMarks() {
  document.body.classList.toggle('hide-hsk', !state.marks.hsk);
  document.body.classList.toggle('hide-grammar', !state.marks.grammar);
  document.body.classList.toggle('hide-translation', !state.marks.translation);
  document.body.classList.toggle('hide-pinyin', !state.marks.pinyin);
  document.querySelectorAll('#mark-toggle button[data-mark]').forEach(btn => {
    btn.classList.toggle('active', !!state.marks[btn.dataset.mark]);
  });
}

document.getElementById('mark-toggle').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-mark]');
  if (!btn) return;
  toggleMark(btn.dataset.mark);
  applyMarks();
});

applyMarks();

// ── Theme (dark/light) ──
// The <head> inline script already set the initial data-theme attribute
// before first paint (avoids a flash of the wrong theme). This just
// wires up the toggle button and keeps the icon in sync.
const THEME_KEY = 'hcy-theme';
const themeBtn = document.getElementById('theme-toggle');

function syncThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeBtn.textContent = isDark ? '☀️' : '🌙';
  themeBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}
syncThemeIcon();

themeBtn.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  syncThemeIcon();
});

initSearch();
initRouter();
