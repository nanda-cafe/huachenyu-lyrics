# 华晨宇歌词库 · Hua Chenyu Annotated Lyrics

Annotated, HSK-leveled Hua Chenyu lyrics for Chinese learners, with English and
Portuguese translations.

## Project structure

```
data/
  albums.json          # album metadata + track lists
  hsk.json              # HSK 1–6 vocabulary dictionary
  song.schema.json       # JSON Schema every song file must satisfy
  songs/
    <song-id>.json       # ONE FILE PER SONG — this is what you edit
    _index.json           # generated, do not edit (see below)
src/
  main.js                # app entry point
  router.js              # hash-based routing
  search.js               # search bar logic
  state.js                 # shared app state (current language, etc.)
  data-loader.js            # fetches JSON from /data at runtime
  render/
    home.js                # album grid
    album.js                 # track list
    song.js                    # lyrics view
    helpers.js                  # shared render utilities
styles/main.css              # all CSS
scripts/
  lint-data.cjs               # validates every song against the schema
  build-song-index.cjs          # generates data/songs/_index.json
  copy-data.cjs                   # mirrors data/ → public/data/ for Vite
```

## Editing a song's lyrics or translations

1. Open `data/songs/<song-id>.json` directly — find the file by song title
   or by looking up the `id` in `data/songs/_index.json`.
2. Each line has a `translation` object (`en`, `pt`, ...) and a `words`
   array. Each word has:
   ```json
   { "hz": "沉默", "py": "chén mò", "gloss": "silence", "hsk": 5, "pos": "noun", "posName": "n." }
   ```
3. Run `npm run lint:data` before committing. This is the single most
   important habit for this project — it's what catches typos, broken
   commas, and malformed entries **before** they break the site, instead
   of after. It also runs automatically in CI on every pull request, so a
   broken file will fail the PR check with the exact file and line.

## Adding a new song

1. Copy an existing file in `data/songs/` as a starting template.
2. Give it a unique, lowercase, hyphenated `id` matching the filename
   (e.g. `data/songs/my-new-song.json` → `"id": "my-new-song"`).
3. Add the song's title to the relevant album's `tracks` array in
   `data/albums.json` — **or don't**, if it's a single (see below).
4. Run `npm run lint:data` — it will tell you if the id doesn't match the
   filename, if a field is missing, or if the schema is violated.

## Singles / songs not on any album

You don't need to mark a song as a single explicitly. A song is
automatically treated as one if its title isn't listed in any album's
`tracks` array in `data/albums.json`. Just create the song's JSON file in
`data/songs/` and skip step 3 above — it will:

- appear in a **单曲 · Singles** section on the home page, below the
  album grid (auto-hidden if there are none)
- be fully searchable and directly linkable, exactly like an album track
- show up in the home page's song/album/single count

This is computed automatically by `scripts/build-song-index.cjs` on every
`npm run dev` / `npm run build`, so there's nothing to keep in sync by
hand — if you later add the song to an album's `tracks`, it moves out of
Singles automatically on the next build.

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

## Karaoke / sing-along roadmap

The schema already reserves `startMs` / `endMs` (milliseconds) on both
`line` and `word` objects, and the song renderer (`src/render/song.js`)
already emits `data-start` / `data-end` attributes on each line and word
element. Nothing currently reads them — they're inert until a player
exists. To add sing-along highlighting:

1. **Get timestamps.** Either hand-time lines/words while listening (slow
   but precise), or force-align an audio file against the transcript with
   a tool like [aeneas](https://github.com/readbeyond/aeneas) or
   [Whisper](https://github.com/openai/whisper) word-level timestamps
   (faster, needs manual correction).
2. **Add an `<audio>` element** to the song view and a small
   `src/karaoke.js` module that, on `timeupdate`, finds the line/word
   whose `data-start`–`data-end` range contains `audio.currentTime * 1000`
   and toggles an `.active` class on it (CSS handles the highlight).
3. Populate `startMs`/`endMs` per song incrementally — songs without
   timing data keep working exactly as they do today, since those fields
   are optional in the schema. You don't need to time all 58 songs before
   shipping the feature for one.

## Data integrity

`scripts/lint-data.cjs` checks, for every file in `data/songs/`:
- valid JSON, matching the schema in `data/song.schema.json`
- the `id` field matches the filename
- no duplicate `id`s across songs
- every `pos` has the expected `posName`

It also cross-checks `data/albums.json` track titles against transcribed
song titles and warns (non-fatal) about any that don't match — useful for
catching typos or emoji-suffix mismatches like `疯人院 🔥` vs `疯人院`.
