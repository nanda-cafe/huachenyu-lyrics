import { loadSongIndex } from './data-loader.js';
import { navigate } from './router.js';

let activeSuggestionIndex = -1;

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Strips tone marks/diacritics and ignores spaces/apostrophes/middle-dots,
// while keeping a map back to the original string's character positions —
// so a match found in the normalized text can still be highlighted at the
// correct spot in the real (accented) pinyin string.
function pinyinIndex(s) {
  let text = '', map = [];
  for (let i = 0; i < s.length; i++) {
    const d = s[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (const c of d) {
      if (c === ' ' || c === '\u2019' || c === "'" || c === '\u00b7') continue;
      text += c;
      map.push(i);
    }
  }
  return { text, map };
}

function highlightPlain(text, q) {
  const nq = q.trim().toLowerCase();
  if (!nq) return esc(text);
  const i = text.toLowerCase().indexOf(nq);
  if (i === -1) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + nq.length)) +
    '</mark>' + esc(text.slice(i + nq.length));
}

function highlightPinyin(py, q) {
  const { text, map } = pinyinIndex(py);
  const nq = pinyinIndex(q).text;
  if (!nq) return esc(py);
  const i = text.indexOf(nq);
  if (i === -1) return esc(py);
  const s = map[i], e = map[i + nq.length - 1] + 1;
  return esc(py.slice(0, s)) + '<mark>' + esc(py.slice(s, e)) +
    '</mark>' + esc(py.slice(e));
}

// Hanzi + Pinyin only — English titles are intentionally display-only,
// never matched against, per the site's search design.
function matches(song, q) {
  const nq = q.trim().toLowerCase();
  if (!nq) return false;
  if (song.title.toLowerCase().includes(nq)) return true;
  const py = pinyinIndex(song.titlePinyin).text;
  const query = pinyinIndex(nq).text;
  return query.length > 0 && py.includes(query);
}

async function searchSongs(query) {
  if (!query.trim()) return [];
  const songIndex = await loadSongIndex();
  return songIndex.filter(song => matches(song, query)).slice(0, 8);
}

function renderSuggestions(suggestionsEl, results, query) {
  if (results.length === 0) {
    suggestionsEl.innerHTML = '<div class="no-results">No songs found.</div>';
    suggestionsEl.classList.add('open');
    return;
  }
  suggestionsEl.innerHTML = results.map((song, i) => `
    <div class="suggestion-item" data-index="${i}" data-id="${song.id}">
      <span class="sg-hz">${highlightPlain(song.title, query)}</span>
      <span class="sg-py">${highlightPinyin(song.titlePinyin, query)}</span>
      <span class="sg-english">${esc(song.english || '')}</span>
      <span class="sg-album">${esc((song.meta || '').split('\u00b7')[0].trim())}</span>
    </div>`).join('');
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
