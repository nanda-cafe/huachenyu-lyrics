// Round SVG icon buttons linking to streaming-service search results.
// Deliberately generic (title + artist name → a search URL) rather than
// per-song curated links, so this works for all 58 songs — and any
// future ones — with zero data entry required.

const STREAM_SVG = {
  ytmusic: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>',
  deezer: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="5" width="18" height="3.5" rx="1"/><rect x="3" y="10.25" width="18" height="3.5" rx="1"/><rect x="3" y="15.5" width="18" height="3.5" rx="1"/></svg>',
  bilibili: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.3 2.3a1 1 0 0 1 1.4 0L10 4.6h4l2.3-2.3a1 1 0 1 1 1.4 1.4L15.4 6H18a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2.6L6.3 3.7a1 1 0 0 1 0-1.4zM6 7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H6zm3 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>',
};

const STREAM_LABELS = {
  ytmusic: 'YouTube Music',
  deezer: 'Deezer',
  bilibili: 'Bilibili',
};

function buildStreamUrls(song) {
  // "华晨宇 · Hua Chenyu" -> "华晨宇" (just the Chinese artist name,
  // gives cleaner search results than the full bilingual string).
  const artist = (song.artist || '').split('\u00b7')[0].trim() || song.artist;
  const query = `${song.title} ${artist}`.trim();
  const q = encodeURIComponent(query);
  return {
    ytmusic: `https://music.youtube.com/search?q=${q}`,
    deezer: `https://www.deezer.com/search/${q}`,
    bilibili: `https://search.bilibili.com/all?keyword=${q}`,
  };
}

export function renderStreamButtons(song) {
  const urls = buildStreamUrls(song);
  return Object.entries(urls).map(([key, url]) => {
    const label = STREAM_LABELS[key];
    return `<a class="${key}" href="${url}" target="_blank" rel="noopener noreferrer" title="${label}" aria-label="${label}">${STREAM_SVG[key]}</a>`;
  }).join('');
}
