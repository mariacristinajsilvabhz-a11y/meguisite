/* Megui · recorte visual progressivo das fotos de estúdio no portfólio.
   Remove só o fundo claro conectado às bordas. Preserva rótulos/estampas
   claros internos e não altera a fotografia original no servidor.
   Sem dependências externas; em caso de dúvida mantém o arquivo intacto. */
(() => {
  'use strict';
  const photos = [...document.querySelectorAll('.meg-work img[data-mw-cutout]')];
  if (!photos.length || !('HTMLCanvasElement' in window)) return;
  const processed = new WeakSet();
  const maxDimension = 1050;
  const clamp = n => Math.max(0, Math.min(255, n));
  const colorDistance = (d, i, ref) => Math.max(
    Math.abs(d[i] - ref[0]), Math.abs(d[i + 1] - ref[1]), Math.abs(d[i + 2] - ref[2])
  );
  function sampleBackground(data, width, height) {
    const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
    const samples = [];
    for (const [cx, cy] of corners) {
      let r = 0, g = 0, b = 0, total = 0;
      const dx = cx ? -1 : 1, dy = cy ? -1 : 1;
      for (let y = 2; y < 11 && y < height; y++) {
        for (let x = 2; x < 11 && x < width; x++) {
          const i = ((cy + dy * y) * width + cx + dx * x) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; total++;
        }
      }
      if (!total) continue;
      const color = [r / total, g / total, b / total];
      const bright = color[0] * .3 + color[1] * .59 + color[2] * .11;
      const chroma = Math.max(...color) - Math.min(...color);
      if (bright > 188 && chroma < 51) samples.push({color, bright});
    }
    if (samples.length < 2) return null;
    samples.sort((a, b) => b.bright - a.bright);
    const use = samples.slice(0, 3);
    return [
      use.reduce((s, x) => s + x.color[0], 0) / use.length,
      use.reduce((s, x) => s + x.color[1], 0) / use.length,
      use.reduce((s, x) => s + x.color[2], 0) / use.length
    ];
  }
  function transparentize(image) {
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) return;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const w = Math.max(2, Math.round(image.naturalWidth * scale));
    const h = Math.max(2, Math.round(image.naturalHeight * scale));
    const surface = document.createElement('canvas');
    surface.width = w; surface.height = h;
    const context = surface.getContext('2d', {willReadFrequently:true});
    if (!context) return;
    try {
      context.drawImage(image, 0, 0, w, h);
      const frame = context.getImageData(0, 0, w, h);
      const data = frame.data;
      const bg = sampleBackground(data, w, h);
      if (!bg) return;
      const count = w * h;
      const marks = new Uint8Array(count);
      const queue = new Uint32Array(count);
      let head = 0, tail = 0;
      const isBackdrop = index => {
        const i = index * 4;
        const light = data[i] * .3 + data[i + 1] * .59 + data[i + 2] * .11;
        return light > 171 && colorDistance(data, i, bg) < 68;
      };
      const enqueue = index => {
        if (marks[index] || !isBackdrop(index)) return;
        marks[index] = 1;
        queue[tail++] = index;
      };
      for (let x = 0; x < w; x++) {
        enqueue(x); enqueue((h - 1) * w + x);
      }
      for (let y = 1; y < h - 1; y++) {
        enqueue(y * w); enqueue(y * w + w - 1);
      }
      while (head < tail) {
        const p = queue[head++];
        const x = p % w;
        if (x) enqueue(p - 1);
        if (x < w - 1) enqueue(p + 1);
        if (p >= w) enqueue(p - w);
        if (p < count - w) enqueue(p + w);
      }
      // Only cut images clearly photographed against a studio backdrop.
      const ratio = tail / count;
      if (ratio < .12 || ratio > .83) return;
      for (let p = 0; p < count; p++) {
        if (marks[p]) {
          data[p * 4 + 3] = 0;
          continue;
        }
        const y = (p / w) | 0, x = p - y * w;
        const touchingBackground =
          (x && marks[p - 1]) ||
          (x < w - 1 && marks[p + 1]) ||
          (y && marks[p - w]) ||
          (y < h - 1 && marks[p + w]);
        if (!touchingBackground) continue;
        const i = p * 4;
        const light = data[i] * .3 + data[i + 1] * .59 + data[i + 2] * .11;
        if (light > 175) {
          const diff = colorDistance(data, i, bg);
          data[i + 3] = Math.min(data[i + 3], clamp((diff - 51) * 7));
        }
      }
      context.putImageData(frame, 0, 0);
      surface.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = image.closest('a[data-mw-zoom]');
        image.dataset.mwOriginalSrc = image.src;
        image.dataset.mwCutoutReady = 'true';
        image.src = url;
        if (a) a.href = url;
        image.closest('.mw-lead-photo, .mw-feature-image, .mw-piece-image, .mw-hero-small')?.classList.add('mw-has-cutout');
      }, 'image/webp', .94);
    } catch (_) {
      // A problem decoding an image must never hide it from the page.
    }
  }
  const run = image => {
    if (processed.has(image)) return;
    if (!image.complete || !image.naturalWidth) {
      image.addEventListener('load', () => run(image), {once:true});
      return;
    }
    processed.add(image);
    const perform = () => transparentize(image);
    if ('requestIdleCallback' in window) window.requestIdleCallback(perform, {timeout:1600});
    else window.setTimeout(perform, 25);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        run(entry.target);
      });
    }, {rootMargin:'500px', threshold:0.01});
    photos.forEach(photo => observer.observe(photo));
  } else photos.forEach(run);
})();