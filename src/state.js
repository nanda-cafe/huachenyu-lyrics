const MARKS_STORAGE_KEY = 'hcy-lyrics-marks';

const DEFAULT_MARKS = {
  hsk: true,
  grammar: true,
  translation: true,
  pinyin: true,
};

function loadMarks() {
  try {
    const raw = localStorage.getItem(MARKS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MARKS };
    // Merge over defaults so a future 5th toggle added later still gets
    // a sane default for users with an older saved value.
    return { ...DEFAULT_MARKS, ...JSON.parse(raw) };
  } catch {
    // Corrupt localStorage value, or localStorage unavailable (private
    // browsing, etc.) — fall back to defaults rather than throwing.
    return { ...DEFAULT_MARKS };
  }
}

function saveMarks(marks) {
  try {
    localStorage.setItem(MARKS_STORAGE_KEY, JSON.stringify(marks));
  } catch {
    // localStorage write can fail (private mode, storage full, disabled).
    // Toggles still work for the current session, they just won't persist.
  }
}

export const state = {
  currentLang: 'en',
  marks: loadMarks(),
};

export function toggleMark(key) {
  state.marks[key] = !state.marks[key];
  saveMarks(state.marks);
}
