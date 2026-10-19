(() => {
 'use strict';
 const root = document.querySelector('[data-services-discovery]');
 if (!root) return;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const precise = matchMedia('(hover: hover) and (pointer: fine)');
 let frame = 0, pending;
 const reset = item => {
  ['--tilt-x','--tilt-y','--drift-x','--drift-y'].forEach(name => item.style.removeProperty(name));
 };
 const paint = () => {
  frame = 0;
  if (!pending || reduced.matches || !precise.matches) return;
  const {item,x,y} = pending;
  item.style.setProperty('--tilt-x', `${(-y * 6).toFixed(2)}deg`);
  item.style.setProperty('--tilt-y', `${(x * 7).toFixed(2)}deg`);
  item.style.setProperty('--drift-x', `${(x * 6).toFixed(2)}px`);
  item.style.setProperty('--drift-y', `${(y * 3).toFixed(2)}px`);
 };
 root.querySelectorAll('[data-service-item]').forEach(item => {
  item.addEventListener('pointermove', event => {
   if (reduced.matches || !precise.matches || event.pointerType === 'touch') return;
   const rect = item.getBoundingClientRect();
   pending = {item,x:Math.max(-1,Math.min(1,(event.clientX - rect.left) / rect.width * 2 - 1)),y:Math.max(-1,Math.min(1,(event.clientY - rect.top) / rect.height * 2 - 1))};
   if (!frame) frame = requestAnimationFrame(paint);
  }, {passive:true});
  item.addEventListener('pointerleave', () => {
   if (pending && pending.item === item) pending = null;
   reset(item);
  });
 });
 reduced.addEventListener('change', () => {
  pending = null;
  root.querySelectorAll('[data-service-item]').forEach(reset);
 });
})();
