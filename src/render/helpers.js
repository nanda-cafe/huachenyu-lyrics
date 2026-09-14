// Strips trailing emoji + annotations so '好想爱这个世界啊 🔥' → '好想爱这个世界啊'
export function stripAnnotations(t) {
  return t.replace(/\s*[\p{Extended_Pictographic}\u{FE0F}\u{200D}]+.*$/u, '').trim();
}

export function isImageCover(cover) {
  return /^(https?:|data:|\.\/|\/)/i.test(cover);
}

export function coverStyle(cover) {
  return isImageCover(cover)
    ? `background-image:url('${cover}');background-size:cover;background-position:center;`
    : `background:${cover};`;
}

// Given an album (with `.tracks` titles) and the song index, returns
// the subset of index entries that have a transcribed lyrics page.
export function songsInAlbum(album, songIndex) {
  return album.tracks
    .map(t => songIndex.find(s => s.title === stripAnnotations(t)))
    .filter(Boolean);
}
