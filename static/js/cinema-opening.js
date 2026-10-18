(() => {
 'use strict';
 const intro = document.querySelector('[data-cinema-intro]');
 if (!intro) return;
 const stage = intro.querySelector('.cinema-stage');
 const video = intro.querySelector('[data-cinema-video]');
 const source = video.querySelector('source');
 const sheet = document.querySelector('.home-content-sheet');
 const toggle = intro.querySelector('[data-cinema-toggle]');
 const label = toggle.querySelector('[data-cinema-toggle-label]');
 const symbol = toggle.querySelector('[data-cinema-toggle-symbol]');
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
 let userPaused = false;
 let userStarted = false;
 let inView = true;
 let covered = false;
 let frame = 0;
 let failed = false;
 const updateButton = () => {
  const playing = !video.paused && !video.ended;
  label.textContent = playing ? 'Pausar vídeo' : 'Reproduzir vídeo';
  symbol.textContent = playing ? 'Ⅱ' : '▶';
  toggle.setAttribute('aria-label', playing ? 'Pausar vídeo de produção' : 'Reproduzir vídeo de produção');
  toggle.setAttribute('aria-pressed', String(playing));
 };
 const ensureSource = () => {
  if (!source.getAttribute('src')) {
   source.src = source.dataset.cinemaSrc;
   video.load();
  }
 };
 const syncPlayback = () => {
  if (failed) return;
  const autoAllowed = !reduced.matches && !(connection && connection.saveData);
  if (!inView || covered || document.hidden || userPaused || (!autoAllowed && !userStarted)) {
   video.pause();
  } else {
   ensureSource();
   const promise = video.play();
   if (promise && promise.catch) promise.catch(updateButton);
  }
  updateButton();
 };
 const measure = () => {
  frame = 0;
  const rect = stage.getBoundingClientRect();
  const sheetTop = sheet.getBoundingClientRect().top;
  const progress = Math.max(0, Math.min(1, (rect.bottom - sheetTop) / Math.max(1, rect.height)));
  const wasCovered = covered;
  covered = sheetTop <= rect.top + 2;
  stage.style.setProperty('--cinema-copy-opacity', reduced.matches ? '1' : String(Math.max(0, 1 - progress * 1.65)));
  stage.style.setProperty('--cinema-copy-shift', reduced.matches ? '0px' : `${-progress * 28}px`);
  if (covered !== wasCovered) syncPlayback();
 };
 const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
 toggle.hidden = false;
 toggle.addEventListener('click', () => {
  if (video.paused) { userPaused = false; userStarted = true; }
  else { userPaused = true; userStarted = false; }
  syncPlayback();
 });
 video.addEventListener('playing', () => { video.classList.add('is-playing'); updateButton(); });
 video.addEventListener('pause', updateButton);
 const fail = () => { failed = true; video.classList.remove('is-playing'); toggle.hidden = true; };
 video.addEventListener('error', fail);
 source.addEventListener('error', fail);
 if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncPlayback(); }, {threshold:0}).observe(intro);
 }
 document.addEventListener('visibilitychange', syncPlayback);
 window.addEventListener('scroll', schedule, {passive:true});
 window.addEventListener('resize', schedule, {passive:true});
 if (reduced.addEventListener) reduced.addEventListener('change', () => { userStarted = false; schedule(); syncPlayback(); });
 const header = document.querySelector('.site-header');
 const sizeHeader = () => {
  if (header) document.body.style.setProperty('--cinema-top', `${header.getBoundingClientRect().height}px`);
  schedule();
 };
 if (header && 'ResizeObserver' in window) new ResizeObserver(sizeHeader).observe(header);
 sizeHeader(); measure(); syncPlayback();
})();
