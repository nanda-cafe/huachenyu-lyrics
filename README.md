# 华晨宇歌词库 · Hua Chenyu Annotated Lyrics

Annotated, HSK-leveled Hua Chenyu lyrics for Chinese learners, with English and
Portuguese translations, dictionary links, dark/light theming, and coverage
extending beyond studio albums into TV shows, films, games, and singles.

## Project structure

```
data/
  albums.json              # album metadata + track lists
  projects.json              # non-album groupings: TV shows, films, games, singles
  project.schema.json          # JSON Schema every entry in projects.json must satisfy
  hsk.json                       # HSK 1–6 vocabulary dictionary
  song.schema.json                 # JSON Schema every song file must satisfy
  songs/
    <song-id>.json                 # ONE FILE PER SONG — this is what you edit
    _index.json                      # generated, do not edit (see below)
src/
  main.js                    # app entry point — wires up theme toggle, mark toggles, search, router
  router.js                    # hash-based routing (home / album / project / song)
  search.js                      # search bar logic — Hanzi + Pinyin only (see below)
  state.js                         # shared app state: current language, mark-toggle state
  data-loader.js                     # fetches JSON from /data at runtime
  render/
    home.js                          # album grid + projects grid + singles section
    album.js                           # album track list
    project.js                           # show/film/game/singles track list
    song.js                                # lyrics view, toggle-driven visibility, MDBG links
    streaming.js                             # generates YouTube Music / Deezer / Bilibili buttons
    helpers.js                                 # shared render utilities
styles/main.css                              # all CSS — theme variables, every component style
scripts/
  lint-data.cjs                                # validates every song + project against its schema
  build-song-index.cjs                           # generates data/songs/_index.json
  copy-data.cjs                                    # mirrors data/ → public/data/ for Vite
  karaoke/                                           # backlogged feature, see "Karaoke roadmap" below
    align_core.py
    run_alignment.py
```

## Editing a song's lyrics or translations

1. Open `data/songs/<song-id>.json` directly — find the file by song title
   or by looking up the `id` in `data/songs/_index.json`.
2. Each line has a `translation` object (`en`, `pt`, ...) and a `words`
   array. Each word has:
   ```json
   {
     "hz": "沉默", "py": "chén mò",
     "gloss": "silence", "glossPt": "silêncio",
     "hsk": 5, "pos": "noun", "posName": "n."
   }
   ```
   `glossPt` is optional — the ruby text above each character falls back to
   the English `gloss` when it's absent, so partial coverage is fine.
3. Run `npm run lint:data` before committing. This is the single most
   important habit for this project — it's what catches typos, broken
   commas, and malformed entries **before** they break the site, instead
   of after. It also runs automatically in CI on every pull request, so a
   broken file will fail the PR check with the exact file and line.

### Optional fields

| Field | Where | Effect when present | Effect when absent |
|---|---|---|---|
| `song.english` | top level of a song file | Shown as a subtitle in the header and in search suggestion rows | Line simply doesn't render — no error |
| `word.glossPt` | on any word | Shown instead of `gloss` when the Português toggle is active | Falls back to the English `gloss` |
| `word.startMs` / `endMs`, `line.startMs` / `endMs` | on any word/line | Reserved for the karaoke feature (backlogged) | Ignored |

None of these are backfilled in bulk — they're meant to be added gradually,
song by song, as you review each one. The site degrades gracefully with or
without them.

## Adding a new song

1. Copy an existing file in `data/songs/` as a starting template.
2. Give it a unique, lowercase, hyphenated `id` matching the filename
   (e.g. `data/songs/my-new-song.json` → `"id": "my-new-song"`).
3. Add the song's title to the relevant album's `tracks` array in
   `data/albums.json`, or a project's `tracks` array in `data/projects.json`
   — **or neither**, if it's a standalone single (see below).
4. Run `npm run lint:data` — it will tell you if the id doesn't match the
   filename, if a field is missing, or if the schema is violated.

## Singles / songs not on any album

You don't need to mark a song as a single explicitly. A song is
automatically treated as one if its title isn't listed in any album's
`tracks` array in `data/albums.json`. Just create the song's JSON file in
`data/songs/` and skip step 3 above — it will:

- appear in a **单曲 · Singles** section on the home page, below the
  projects grid (auto-hidden if there are none)
- be fully searchable and directly linkable, exactly like an album track
- show up in the home page's song/album/project/single count

This is computed automatically by `scripts/build-song-index.cjs` on every
`npm run dev` / `npm run build`, so there's nothing to keep in sync by
hand — if you later add the song to an album's `tracks`, it moves out of
Singles automatically on the next build.

## Projects: TV shows, films, games, and other non-album performances

Not every performance belongs on a studio album — competition shows,
soundtrack contributions, game themes, and promotional singles all live in
`data/projects.json` instead, validated against `data/project.schema.json`.
Each entry looks like:

```json
{
  "id": "singer-2020",
  "title": "歌手·当打之年 2020",
  "pinyin": "Gē Shǒu · Dāng Dǎ Zhī Nián 2020",
  "english": "Singer: Year of the Hit",
  "cover": "https://...",
  "context": { "en": "One or two sentences of background on this project." },
  "tracks": [
    { "title": "斗牛", "year": 2020, "context": "第二期 · 2020.02.14" }
  ]
}
```

- `cover` follows the same convention as `albums.json`: either an image URL
  or a CSS gradient/color string.
- Each track's `title` is cross-checked against your transcribed songs the
  same way album tracks are — a matching song becomes a clickable link with
  a "✓ Available" badge; anything not yet transcribed shows as "Missing"
  without blocking the rest of the project page.
- A song can appear in more than one project (e.g. a song performed on two
  different shows) — you only transcribe it once, in `data/songs/`, and
  reference its title from as many projects as apply.
- Currently several project entries in this repo use placeholder cover
  images (solid color blocks) rather than real photos — swap the `cover`
  field for a real licensed image URL whenever you have one, same as with
  albums.

## Toggle controls (HSK colours / Grammar tags / Translation / Pinyin)

Every song page has four independent toggle buttons above the lyrics:

- **📊 HSK colours** — the colored underline under each character
- **📖 Grammar tags** — the part-of-speech tag under each word, and the
  Grammar Glossary panel
- **🌐 Translation** — both the line-level sentence translation and the
  small gloss shown above each character
- **🔤 Pinyin** — the pinyin line under each character

All four are pure CSS, driven by classes (`hide-hsk`, `hide-grammar`, etc.)
added to `<body>` — see the `body.hide-*` rules in `styles/main.css`. State
is held in `src/state.js` and persisted to `localStorage`
(`hcy-lyrics-marks`), so your choices carry over between songs and across
page reloads.

The HSK legend and Grammar Glossary are collapsible (`<details>` elements,
collapsed by default) independently of whether their toggle is on — turning
a toggle off hides the panel entirely; when it's on, you can still expand
or collapse it manually. Clicking a part-of-speech tag under a word jumps
to its glossary entry and auto-expands the panel if it was collapsed.

## Dictionary links (MDBG)

Every rendered Hanzi word links out to its MDBG dictionary entry
(`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=<word>`)
in a new tab. Non-Hanzi tokens — English words, interjections like "Growl",
onomatopoeia — render as plain, non-clickable text instead. This is decided
per-word in `src/render/song.js` with a simple Unicode range test
(`/[\u4e00-\u9fff]/`), so it applies uniformly across every song without
any manual tagging.

## Theme (dark / light)

The whole site — not just the song page — uses CSS custom properties for
every color, defined twice in `styles/main.css` (`:root` / `[data-theme="dark"]`
and `[data-theme="light"]`). Defaults to dark, or to the visitor's OS-level
preference on first visit, then remembers their explicit choice via
`localStorage` (`hcy-theme`). A small inline script in `<head>` sets the
theme attribute before first paint, so there's no flash of the wrong theme.
The ☀️/🌙 button lives next to the search bar.

## Search

Search matches **Hanzi and Pinyin only** — English titles are intentionally
display-only and never searched against. Pinyin matching strips tone marks
and ignores spaces/apostrophes/middle-dots, so "douniu", "dou niu", and
"dòu niú" all find 斗牛. Matches are highlighted in the results, keyboard
navigation (↑/↓/Enter/Esc) is supported, and each suggestion row shows the
title, pinyin, English title (if the song has one), and album/context.

## Streaming service links

Each song page shows three round icon buttons — YouTube Music, Deezer,
Bilibili — linking to a search for that song on each platform
(`src/render/streaming.js`). These are generated generically from the
song's `title` + `artist` fields, so every song gets working links
automatically; no per-song URL curation needed.

## Local development

```bash
npm install
npm run dev       # starts Vite dev server, usually at http://localhost:5173
```

```bash
npm run build      # validates data, builds to dist/
npm run preview     # serves the production build locally
```

## Deploying

Pushing to `main` automatically validates the data, builds the site, and
deploys it to GitHub Pages via `.github/workflows/ci.yml`. Pull requests
only run validation + build (no deploy), so a broken PR fails visibly
before it can reach main.

To enable this the first time: **Settings → Pages → Source → GitHub
Actions** in the repo settings.

## Karaoke / sing-along — backlogged

Deferred in favor of the layout/search/theme rollout and the projects
feature, but the groundwork already exists rather than being purely
theoretical:

- The schema reserves `startMs` / `endMs` (milliseconds) on both `line`
  and `word` objects, and `src/render/song.js` already emits
  `data-start` / `data-end` attributes on each line/word element. Nothing
  reads them yet — they're inert until a player exists.
- `scripts/karaoke/align_core.py` and `run_alignment.py` are a working,
  tested forced-alignment pipeline (using `faster-whisper` — `aeneas` was
  tried first but is incompatible with modern Python) that generates
  per-character timestamps from real audio plus your existing verified
  lyric text, writing the result as a copy of the song's JSON with
  `startMs`/`endMs` populated. See the docstring in `run_alignment.py` for
  usage.
- Still needed: an `<audio>` element and a small `src/karaoke.js` module
  that, on `timeupdate`, finds the line/word whose range contains
  `audio.currentTime * 1000` and toggles a highlight class — plus actually
  running the pipeline against real audio for each song (only possible
  locally, since it needs both the audio file and a Whisper model
  download, neither available in a sandboxed environment).

## Flashcards — backlogged

A full spaced-repetition flashcard system (review sessions, Anki `.apkg`
export, per-word pronunciation) was scoped from a draft but intentionally
deferred — not started. If revisited, note that the draft's per-word gloss
rendering used a different DOM structure (`<span class="literal">`) than
the current `<ruby>/<rt>` markup, which would need reconciling.

## Data integrity

`scripts/lint-data.cjs` checks, for every file in `data/songs/`:
- valid JSON, matching the schema in `data/song.schema.json`
- the `id` field matches the filename
- no duplicate `id`s across songs
- every `pos` has the expected `posName`

It also validates `data/projects.json` against `data/project.schema.json`,
and cross-checks both `data/albums.json` and `data/projects.json` track
titles against transcribed song titles, warning (non-fatal) about any that
don't match yet — useful for catching typos or emoji-suffix mismatches like
`疯人院 🔥` vs `疯人院`, or a project track that hasn't been transcribed.

One known, unfixed data-quality note: `異類` (the 2015 album/song) is
stored in traditional characters throughout, which won't auto-match
simplified `异类` if that spelling appears elsewhere (e.g. in project track
lists). Worth normalizing eventually, not currently enforced by the linter.
