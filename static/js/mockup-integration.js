(() => {
  const frame = document.getElementById('mockup-studio');
  if (!frame) return;
  const origin = new URL(frame.src, window.location.href).origin;
  window.addEventListener('message', event => {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'MEGUI_STUDIO_FOCUS') {
      frame.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
    if (event.data?.type === 'MEGUI_STUDIO_HEIGHT') {
      const height = event.data.height;
      if (Number.isFinite(height) && height >= 400 && height <= 7000) {
        frame.style.height = `${Math.ceil(height)}px`;
      }
    }
  });
})();
