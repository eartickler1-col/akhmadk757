// Fixed scenes for screenshots. `?shot=editor` shows the page with a sample
// photo loaded; `?shot=cover` shows the cover alone, as the app draws it.
// `photo` picks the sample (akhmad, boulevard or pier), `caption` the words,
// `layout` the panel layout and `size` the export size. window.__shotReady
// is set once the scene is painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await apply({
    photo: query.get('photo') || 'akhmad',
    caption: query.get('caption') || 'Sunset Heist',
    layout: query.get('layout') || 'hero',
    size: query.get('size') || '1080x1080',
  });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
