// Wires the Vice Cover Studio editor: photo slots, layouts, per-panel crop,
// caption and grade, live preview, and PNG export in the three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCoverArt, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const SAMPLES = { akhmad: 'samples/akhmad.jpg', boulevard: 'samples/boulevard.jpg', pier: 'samples/pier.jpg' };

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');

function defaultPanels() {
  return {
    hero: [
      { photo: 'A', zoom: 1, ox: 0, oy: 0 },
      { photo: 'A', zoom: 1.25, ox: 0, oy: 0 },
      { photo: 'B', zoom: 1, ox: 0, oy: 0 },
      { photo: 'A', zoom: 1.4, ox: 0.2, oy: 0 },
    ],
    grid: [
      { photo: 'A', zoom: 1, ox: 0, oy: 0 },
      { photo: 'B', zoom: 1, ox: 0, oy: 0 },
      { photo: 'C', zoom: 1, ox: 0, oy: 0 },
      { photo: 'A', zoom: 1.5, ox: -0.2, oy: 0 },
    ],
    poster: [
      { photo: 'A', zoom: 1, ox: 0, oy: 0 },
      { photo: 'B', zoom: 1, ox: 0, oy: 0 },
      { photo: 'C', zoom: 1, ox: 0, oy: 0 },
    ],
  };
}

const state = {
  layout: 'hero',
  size: '1080x1080',
  title: 'Sunset Heist',
  subtitle: 'Neon Nights',
  grade: 1,
  neon: true,
  photos: { A: null, B: null, C: null },
  panels: defaultPanels(),
};

let selectedPanel = 0;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const [w, h] = SIZES[state.size];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCoverArt(canvas, state);
}

function refreshPanelControls() {
  const rects = LAYOUTS[state.layout];
  const select = document.getElementById('panel-select');
  select.innerHTML = '';
  rects.forEach((_, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `Panel ${i + 1} of ${rects.length}`;
    select.appendChild(o);
  });
  if (selectedPanel >= rects.length) selectedPanel = 0;
  select.value = String(selectedPanel);
  const p = state.panels[state.layout][selectedPanel];
  document.getElementById('panel-photo').value = p.photo;
  document.getElementById('panel-zoom').value = String(p.zoom);
  document.getElementById('panel-x').value = String(p.ox);
  document.getElementById('panel-y').value = String(p.oy);
  document.getElementById('zoom-val').textContent = `${p.zoom.toFixed(2)}×`;
}

function currentPanel() {
  return state.panels[state.layout][selectedPanel];
}

async function setSample(slot, name) {
  state.photos[slot] = await loadImage(SAMPLES[name]);
  redraw();
}

document.querySelectorAll('input[type=file]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const slot = e.target.id.replace('photo-', '').toUpperCase();
    state.photos[slot] = await loadImage(URL.createObjectURL(file));
    statusEl.textContent = `Photo ${slot} loaded from your computer — never uploaded.`;
    redraw();
  });
});

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    await setSample(btn.dataset.slot, btn.dataset.sample);
    statusEl.textContent = `Photo ${btn.dataset.slot} is the ${btn.dataset.sample} sample.`;
  });
});

document.querySelectorAll('input[name=layout]').forEach((r) => {
  r.addEventListener('change', () => {
    state.layout = r.value;
    refreshPanelControls();
    redraw();
  });
});

document.querySelectorAll('input[name=size]').forEach((r) => {
  r.addEventListener('change', () => {
    state.size = r.value;
    redraw();
  });
});

document.getElementById('panel-select').addEventListener('change', (e) => {
  selectedPanel = Number(e.target.value);
  refreshPanelControls();
});
document.getElementById('panel-photo').addEventListener('change', (e) => {
  currentPanel().photo = e.target.value;
  redraw();
});
document.getElementById('panel-zoom').addEventListener('input', (e) => {
  currentPanel().zoom = Number(e.target.value);
  document.getElementById('zoom-val').textContent = `${currentPanel().zoom.toFixed(2)}×`;
  redraw();
});
document.getElementById('panel-x').addEventListener('input', (e) => {
  currentPanel().ox = Number(e.target.value);
  redraw();
});
document.getElementById('panel-y').addEventListener('input', (e) => {
  currentPanel().oy = Number(e.target.value);
  redraw();
});
document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('grade').addEventListener('input', (e) => {
  state.grade = Number(e.target.value);
  document.getElementById('grade-val').textContent = `${Math.round(state.grade * 100)}%`;
  redraw();
});
document.getElementById('neon').addEventListener('change', (e) => {
  state.neon = e.target.checked;
  redraw();
});

function exportPng(sizeKey) {
  const [w, h] = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCoverArt(off, { ...state, size: sizeKey });
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${w}x${h}.png`;
    a.click();
    statusEl.textContent = `Saved cover-${w}x${h}.png`;
    window.__exported = { w, h, bytes: blob.size };
  }, 'image/png');
}

document.querySelectorAll('[data-export]').forEach((btn) => {
  btn.addEventListener('click', () => exportPng(btn.dataset.export));
});

/** Applies a fixed screenshot scene; used by shots.js. */
export async function applyShotScene(scene) {
  if (scene.layout && LAYOUTS[scene.layout]) state.layout = scene.layout;
  if (scene.size && SIZES[scene.size]) state.size = scene.size;
  if (scene.caption) {
    state.title = scene.caption;
    document.getElementById('title').value = scene.caption;
  }
  const name = scene.photo || 'akhmad';
  const img = await loadImage(SAMPLES[name]);
  state.photos.A = img;
  state.photos.B = await loadImage(SAMPLES.boulevard);
  state.photos.C = await loadImage(SAMPLES.pier);
  document.querySelectorAll('input[name=layout]').forEach((r) => { r.checked = r.value === state.layout; });
  document.querySelectorAll('input[name=size]').forEach((r) => { r.checked = r.value === state.size; });
  refreshPanelControls();
  redraw();
  window.__shotReady = true;
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), applyShotScene);
} else {
  (async () => {
    state.photos.A = await loadImage(SAMPLES.akhmad);
    state.photos.B = await loadImage(SAMPLES.boulevard);
    state.photos.C = await loadImage(SAMPLES.pier);
    refreshPanelControls();
    redraw();
  })();
}
