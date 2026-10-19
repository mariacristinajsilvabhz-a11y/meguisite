(() => {
 'use strict';
 const intro = document.querySelector('[data-cinema-intro]');
 if (!intro) return;
 const stage = intro.querySelector('.cinema-stage');
 const sheet = document.querySelector('.home-content-sheet');
 const photos = Array.from(intro.querySelectorAll('.cinema-photo'));
 const controls = intro.querySelector('[data-photo-controls]');
 const toggle = intro.querySelector('[data-cinema-toggle]');
 const label = toggle.querySelector('[data-cinema-toggle-label]');
 const symbol = toggle.querySelector('[data-cinema-toggle-symbol]');
 const caption = intro.querySelector('[data-photo-caption]');
 const counter = intro.querySelector('[data-photo-count]');
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
  label.textContent = playing ? 'Pausar fotos' : 'Reproduzir fotos';
  symbol.textContent = playing ? 'Ⅱ' : '▶';
  toggle.setAttribute('aria-label', playing ? 'Pausar troca de fotos' : 'Reproduzir troca de fotos');
  toggle.setAttribute('aria-pressed', String(playing));
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
   caption.textContent = photos[index].dataset.photoTitle;
   counter.textContent = `${String(index + 1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;
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
  const wasCovered = covered;
  covered = sheetTop <= rect.top + 2;
  stage.style.setProperty('--cinema-photo-shift', reduced.matches ? '0px' : `${(p * rect.height * .08).toFixed(2)}px`);
  stage.inert = covered;
  if (covered !== wasCovered) sync();
 };
 const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
 controls.hidden = false;
 toggle.addEventListener('click', () => {
  if (allowed()) { userPaused = true; userStarted = false; }
  else { userPaused = false; userStarted = true; }
  sync();
 });
 intro.querySelector('[data-photo-prev]').addEventListener('click', () => show(index - 1));
 intro.querySelector('[data-photo-next]').addEventListener('click', () => show(index + 1));
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
