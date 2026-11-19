// Draws a multi-panel GTA-style cover onto a canvas 2D context.
// Everything is drawn in code: panels, sunset/neon grade, sun glow and
// bold caption lettering. No Rockstar logo, artwork or font is used.
export const LAYOUTS = {
  hero: [
    { x: 0, y: 0, w: 1, h: 0.6 },
    { x: 0, y: 0.615, w: 0.323, h: 0.385 },
    { x: 0.3385, y: 0.615, w: 0.323, h: 0.385 },
    { x: 0.677, y: 0.615, w: 0.323, h: 0.385 },
  ],
  grid: [
    { x: 0, y: 0, w: 0.492, h: 0.492 },
    { x: 0.508, y: 0, w: 0.492, h: 0.492 },
    { x: 0, y: 0.508, w: 0.492, h: 0.492 },
    { x: 0.508, y: 0.508, w: 0.492, h: 0.492 },
  ],
  poster: [
    { x: 0, y: 0, w: 0.615, h: 1 },
    { x: 0.63, y: 0, w: 0.37, h: 0.492 },
    { x: 0.63, y: 0.508, w: 0.37, h: 0.492 },
  ],
};

export const NEON = ['#ff2e88', '#00e5ff', '#ffd319', '#ff2e88'];

function coverFit(img, pw, ph, zoom, ox, oy) {
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const scale = base * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  return {
    dx: (pw - dw) / 2 + ox * dw * 0.25,
    dy: (ph - dh) / 2 + oy * dh * 0.25,
    dw,
    dh,
  };
}

function gradePanel(ctx, px, py, pw, ph, grade) {
  // Warm sun glow from the top right, magenta dusk rising from the bottom.
  const glow = ctx.createRadialGradient(px + pw * 0.8, py + ph * 0.12, 0, px + pw * 0.8, py + ph * 0.12, pw * 0.9);
  glow.addColorStop(0, `rgba(255, 211, 25, ${0.38 * grade})`);
  glow.addColorStop(0.5, `rgba(255, 120, 60, ${0.16 * grade})`);
  glow.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(px, py, pw, ph);
  const dusk = ctx.createLinearGradient(0, py + ph * 0.35, 0, py + ph);
  dusk.addColorStop(0, 'rgba(255, 80, 120, 0)');
  dusk.addColorStop(1, `rgba(180, 30, 130, ${0.45 * grade})`);
  ctx.fillStyle = dusk;
  ctx.fillRect(px, py, pw, ph);
}

function drawSun(ctx, px, py, pw, ph) {
  const r = Math.min(pw, ph) * 0.15;
  const cx = px + pw * 0.9;
  const cy = py + ph * 0.1;
  const sun = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  sun.addColorStop(0, '#fff3b0');
  sun.addColorStop(0.45, '#ffd319');
  sun.addColorStop(0.8, '#ff7a18');
  sun.addColorStop(1, 'rgba(255, 41, 117, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Draws the whole cover for `state` onto `canvas` at its own pixel size. */
export function drawCoverArt(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const rects = LAYOUTS[state.layout] || LAYOUTS.hero;
  const panels = state.panels[state.layout] || [];
  ctx.fillStyle = '#160826';
  ctx.fillRect(0, 0, W, H);

  rects.forEach((r, i) => {
    const px = r.x * W;
    const py = r.y * H;
    const pw = r.w * W;
    const ph = r.h * H;
    const p = panels[i] || { photo: 'A', zoom: 1, ox: 0, oy: 0 };
    const img = state.photos[p.photo];
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    if (img) {
      const d = coverFit(img, pw, ph, p.zoom || 1, p.ox || 0, p.oy || 0);
      ctx.drawImage(img, px + d.dx, py + d.dy, d.dw, d.dh);
    } else {
      ctx.fillStyle = '#2b1445';
      ctx.fillRect(px, py, pw, ph);
    }
    if (i === 0) drawSun(ctx, px, py, pw, ph);
    gradePanel(ctx, px, py, pw, ph, state.grade ?? 1);
    ctx.restore();
    if (state.neon) {
      ctx.strokeStyle = NEON[i % NEON.length];
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
    }
  });

  // Caption band and bold lettering over the foot of the cover.
  const band = ctx.createLinearGradient(0, H * 0.74, 0, H);
  band.addColorStop(0, 'rgba(18, 2, 38, 0)');
  band.addColorStop(1, 'rgba(18, 2, 38, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, H * 0.74, W, H * 0.26);

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let size = Math.min(H * 0.105, W * 0.085);
    ctx.font = `900 ${size}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    while (ctx.measureText(title).width > W * 0.92 && size > 14) {
      size -= 2;
      ctx.font = `900 ${size}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
    }
    const ty = H * 0.92;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#12022a';
    ctx.lineWidth = size * 0.14;
    ctx.strokeText(title, W / 2, ty);
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.25;
    ctx.shadowOffsetY = size * 0.04;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, W / 2, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const size = Math.max(14, H * 0.032);
    ctx.font = `700 ${size}px Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, size * 0.22)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd319';
    ctx.fillText(sub, W / 2, H * 0.985);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}
