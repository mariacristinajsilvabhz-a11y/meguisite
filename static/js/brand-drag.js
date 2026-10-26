(() => {
  document.querySelectorAll('[data-brand-drag]').forEach(track => {
    let dragging = false, pointer = null, startX = 0, startScroll = 0;
    track.querySelectorAll('img').forEach(img => { img.draggable = false; });
    track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragging = true;
      pointer = event.pointerId;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture(pointer);
      event.preventDefault();
      track.focus({preventScroll:true});
    });
    track.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== pointer) return;
      track.scrollLeft = startScroll - (event.clientX - startX);
    });
    const end = () => { dragging = false; pointer = null; track.classList.remove('is-dragging'); };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    track.addEventListener('lostpointercapture', end);
    track.addEventListener('keydown', event => {
      const distance = Math.max(180, track.clientWidth * .45);
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const left = event.key === 'Home' ? 0 : event.key === 'End' ? track.scrollWidth : track.scrollLeft + (event.key === 'ArrowRight' ? distance : -distance);
      track.scrollTo({left,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    });
  });
})();
