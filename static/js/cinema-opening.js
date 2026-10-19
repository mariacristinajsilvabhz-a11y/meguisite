(() => {
 'use strict';
 const intro = document.querySelector('[data-cinema-intro]');
 if (!intro) return;
 const stage = intro.querySelector('.cinema-stage');
 const sheet = document.querySelector('.home-content-sheet');
 const photos = Array.from(intro.querySelectorAll('.cinema-photo'));
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
 const loaded = new Map();
 let index = 0;
 let userPaused = false;
 let userStarted = false;
 let inView = true;
 let covered = false;
 let frame = 0;
 let timer;
 let request = 0;
 const allowed = () => !userPaused && !document.hidden && inView && !covered &&
  (userStarted || (!reduced.matches && !(connection && connection.saveData)));
 const load = n => {
  if (loaded.has(n)) return loaded.get(n);
  const img = photos[n];
  const promise = new Promise(resolve => {
   if (img.complete && img.naturalWidth) { resolve(true); return; }
   img.addEventListener('load', () => resolve(true), {once:true});
   img.addEventListener('error', () => resolve(false), {once:true});
   if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
   else if (img.complete) resolve(false);
  });
  loaded.set(n, promise);
  return promise;
 };
 const sync = () => {
  clearTimeout(timer);
  const playing = allowed();
  if (playing) {
   load((index + 1) % photos.length);
   timer = setTimeout(() => show(index + 1), 2200);
  }
 };
 const show = async target => {
  clearTimeout(timer);
  const token = ++request;
  for (let tries = 0; tries < photos.length; tries++) {
   const next = ((target + tries) % photos.length + photos.length) % photos.length;
   const ready = await load(next);
   if (token !== request) return;
   if (!ready) continue;
   photos[index].classList.remove('is-active');
   photos[next].classList.add('is-active');
   index = next;
   sync();
   return;
  }
  userPaused = true;
  sync();
 };
 const measure = () => {
  frame = 0;
  const rect = stage.getBoundingClientRect();
  const sheetTop = sheet.getBoundingClientRect().top;
  const p = Math.max(0, Math.min(1, (rect.bottom - sheetTop) / Math.max(1, rect.height)));
  const blend = p * p * (3 - 2 * p);
  stage.style.setProperty('--cinema-scroll-blur', `${(reduced.matches ? 0 : blend * 14).toFixed(2)}px`);
  stage.style.setProperty('--cinema-scroll-opacity', (1 - blend * .45).toFixed(3));
  stage.style.setProperty('--cinema-tint-opacity', (blend * .48).toFixed(3));
  stage.style.setProperty('--cinema-text-opacity', Math.max(0, 1 - p * 1.5).toFixed(3));
  stage.style.setProperty('--cinema-text-blur', `${(reduced.matches ? 0 : blend * 4).toFixed(2)}px`);
  const wasCovered = covered;
  covered = sheetTop <= rect.top + 2;
  stage.style.setProperty('--cinema-photo-shift', reduced.matches ? '0px' : `${(p * rect.height * .08).toFixed(2)}px`);
  stage.inert = covered;
  if (covered !== wasCovered) sync();
 };
 const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
 stage.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.target !== stage) return;
  event.preventDefault();
  if (allowed()) { userPaused = true; userStarted = false; }
  else { userPaused = false; userStarted = true; }
  sync();
 });
 if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, {threshold:0}).observe(intro);
 }
 document.addEventListener('visibilitychange', sync);
 window.addEventListener('scroll', schedule, {passive:true});
 window.addEventListener('resize', schedule, {passive:true});
 if (reduced.addEventListener) reduced.addEventListener('change', () => { userStarted = false; schedule(); sync(); });
 const header = document.querySelector('.site-header');
 const sizeHeader = () => {
  document.body.style.setProperty('--cinema-entry-top', `${Math.max(0, intro.getBoundingClientRect().top + window.scrollY)}px`);
  if (header) document.body.style.setProperty('--cinema-top', `${header.getBoundingClientRect().height}px`);
  schedule();
 };
 if (header && 'ResizeObserver' in window) new ResizeObserver(sizeHeader).observe(header);
 sizeHeader(); measure(); sync();
})();
