import { showHome, showAlbum, showProject, showSong } from './render/index.js';

const homeView    = document.getElementById('home-view');
const albumView   = document.getElementById('album-view');
const projectView = document.getElementById('project-view');
const songView    = document.getElementById('song-view');

function showView(name) {
  homeView.hidden    = name !== 'home';
  albumView.hidden   = name !== 'album';
  projectView.hidden = name !== 'project';
  songView.hidden    = name !== 'song';
  window.scrollTo(0, 0);
}

export function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [section, id, trackNum] = hash.split('/');

  if (!section) {
    showView('home');
    showHome();
  } else if (section === 'album' && id) {
    showView('album');
    showAlbum(id);
  } else if (section === 'project' && id) {
    showView('project');
    showProject(id);
  } else if (section === 'song' && id) {
    showView('song');
    showSong(id, trackNum);
  } else {
    showView('home');
    showHome();
  }
}

export function navigate(hash) {
  location.hash = hash;
}

export function goBack() {
  // Falls back to home if there's no meaningful history entry
  // (e.g. user landed directly on a song link).
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate('');
  }
}

export function initRouter() {
  window.addEventListener('hashchange', route);
  route();
}
