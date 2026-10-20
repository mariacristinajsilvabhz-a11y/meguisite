(() => {
  const tabs = [...document.querySelectorAll('[data-occasion]')];
  const panels = [...document.querySelectorAll('[data-occasion-panel]')];
  const tablist = document.querySelector('.catalog-occasion-tabs');
  function select(tab, focus = false) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.occasionPanel !== tab.dataset.occasion; });
    if (focus) tab.focus();
  }
  if (tabs.length) {
    tablist.setAttribute('role', 'tablist');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.id = `occasion-tab-${tab.dataset.occasion}`;
      tab.setAttribute('aria-controls', `occasion-${tab.dataset.occasion}`);
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', tab.id);
      panels[index].tabIndex = 0;
      tab.addEventListener('click', event => { event.preventDefault(); select(tab); });
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
      });
    });
    const linked = tabs.find(tab => tab.getAttribute('href') === location.hash);
    select(linked || tabs[0]);
  }
  document.querySelector('[data-catalog-category]')?.addEventListener('change', event => {
    location.assign(event.target.value + '#escolher-produtos');
  });
})();
