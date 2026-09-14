import { loadSongIndex } from './data-loader.js';
import { navigate } from './router.js';

const HSK_COLORS = {
  1: '#E53935', 2: '#FB8C00', 3: '#F9A825',
  4: '#43A047', 5: '#1E88E5', 6: '#8E24AA'
};

let activeSuggestionIndex = -1;

function normalizePinyin(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

async function searchSongs(query) {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  const qNorm = normalizePinyin(q);
  const qHanzi = /[\u4e00-\u9fff]/.test(q);
  const songIndex = await loadSongIndex();

  return songIndex.filter(song => {
    const titleMatch = song.title.toLowerCase().includes(q);
    const pinyinMatch = normalizePinyin(song.titlePinyin).includes(qNorm);
    const hanziMatch = qHanzi && song.title.includes(q);
    return titleMatch || pinyinMatch || hanziMatch;
  }).slice(0, 8);
}

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx) + '<mark style="background:#fff3cd;padding:0 2px;border-radius:2px;">' +
    text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
}

function renderSuggestions(suggestionsEl, results, query) {
  if (results.length === 0) {
    suggestionsEl.innerHTML = '<div class="no-results">No songs found. Try another title.</div>';
    suggestionsEl.classList.add('open');
    return;
  }
  suggestionsEl.innerHTML = results.map((song, i) => {
    const minHsk = song.minHsk || 1;
    const hskColor = HSK_COLORS[minHsk] || HSK_COLORS[1];
    return `<div class="suggestion-item" data-index="${i}" data-id="${song.id}">
      <span class="sg-hz">${highlightMatch(song.title, query)}</span>
      <span class="sg-py">${highlightMatch(song.titlePinyin, query)}</span>
      <span class="sg-hsk" style="background:${hskColor}">HSK ${minHsk}</span>
      <span class="sg-album">${(song.meta || '').split('·')[0].trim()}</span>
    </div>`;
  }).join('');
  suggestionsEl.classList.add('open');
  activeSuggestionIndex = -1;
}

export function initSearch() {
  const searchInput = document.getElementById('search-input');
  const suggestionsEl = document.getElementById('suggestions');
  const clearBtn = document.getElementById('clear-btn');

  searchInput.addEventListener('input', async () => {
    const val = searchInput.value;
    clearBtn.classList.toggle('visible', val.length > 0);
    if (val.trim().length === 0) { suggestionsEl.classList.remove('open'); return; }
    renderSuggestions(suggestionsEl, await searchSongs(val), val);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsEl.querySelectorAll('.suggestion-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle('active', i === activeSuggestionIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, 0);
      items.forEach((it, i) => it.classList.toggle('active', i === activeSuggestionIndex));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      items[activeSuggestionIndex].click();
    } else if (e.key === 'Escape') {
      suggestionsEl.classList.remove('open');
      searchInput.blur();
    }
  });

  suggestionsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    suggestionsEl.classList.remove('open');
    navigate('song/' + item.dataset.id);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    suggestionsEl.classList.remove('open');
    searchInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) suggestionsEl.classList.remove('open');
  });
}
