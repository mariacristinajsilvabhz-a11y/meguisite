(() => {
 const root = document.querySelector('[data-pouch-studio]');
 if (!root) return;
 const tabs = [...root.querySelectorAll('[role="tab"]')];
 const panels = [...root.querySelectorAll('[role="tabpanel"]')];
 const scene = root.querySelector('.pouch-scene');
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const precise = matchMedia('(hover: hover) and (pointer: fine)');
 let frame = 0;
 let point;
 const clearDrift = () => { point = null; scene.style.removeProperty('--pouch-x'); scene.style.removeProperty('--pouch-y'); };
 root.querySelector('.pouch-experience').addEventListener('pointermove', event => {
  if (reduced.matches || !precise.matches || event.pointerType === 'touch') return;
  const rect = scene.getBoundingClientRect();
  point = {x:Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1)),y:Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1))};
  if (frame) return;
  frame = requestAnimationFrame(() => {
   frame = 0;
   if (!point || reduced.matches || !precise.matches) return;
   scene.style.setProperty('--pouch-x', `${(point.x*5).toFixed(1)}px`);
   scene.style.setProperty('--pouch-y', `${(point.y*4).toFixed(1)}px`);
  });
 }, {passive:true});
 root.querySelector('.pouch-experience').addEventListener('pointerleave', clearDrift);
 reduced.addEventListener('change', clearDrift);
 precise.addEventListener('change', clearDrift);
 const select = tab => {
  tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
  panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
 };
 tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', event => {
   let next;
   if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
   if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
   if (event.key === 'Home') next = 0;
   if (event.key === 'End') next = tabs.length - 1;
   if (next === undefined) return;
   event.preventDefault(); select(tabs[next]); tabs[next].focus();
  });
 });
})();
