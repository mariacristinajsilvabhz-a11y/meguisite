(() => {
 const root = document.querySelector('[data-pouch-studio]');
 if (!root) return;
 const tabs = [...root.querySelectorAll('[role="tab"]')];
 const panels = [...root.querySelectorAll('[role="tabpanel"]')];
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
