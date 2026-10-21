(() => {
  const root = document.querySelector('[data-work-exhibit]');
  if (!root) return;
  const choices = [...root.querySelectorAll('[data-work-choice]')];
  const panels = [...root.querySelectorAll('.work-exhibit-panel')];
  const status = root.querySelector('.work-exhibit-status');
  const select = (choice, focus = false) => {
    root.querySelector('[data-work-position]').textContent = String(choices.indexOf(choice) + 1).padStart(2, '0') + ' / ' + String(choices.length).padStart(2, '0');
    const panelId = choice.getAttribute('aria-controls');
    choices.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
    panels.forEach(panel => { panel.hidden = panel.id !== panelId; });
    const panel = panels.find(item => item.id === panelId);
    status.textContent = 'Em destaque: ' + panel.querySelector('h3').textContent + (panel.querySelector('.work-exhibit-piece') ? ' — ' + panel.querySelector('.work-exhibit-piece').textContent : '');
    if (focus) choice.focus({preventScroll:true});
    const reel = root.querySelector('.work-exhibit-reel');
    const bounds = choice.getBoundingClientRect(), rail = reel.getBoundingClientRect();
    if (bounds.left < rail.left) reel.scrollLeft -= rail.left - bounds.left + 8;
    else if (bounds.right > rail.right) reel.scrollLeft += bounds.right - rail.right + 8;
  };
  root.querySelectorAll('[data-work-step]').forEach(button => {
    button.addEventListener('click', () => {
      const current = choices.findIndex(choice => choice.getAttribute('aria-pressed') === 'true');
      select(choices[(current + Number(button.dataset.workStep) + choices.length) % choices.length]);
    });
  });
  const dialog = root.querySelector('.work-exhibit-lightbox');
  root.querySelectorAll('[data-work-enlarge]').forEach(button => {
    button.addEventListener('click', () => {
      const source = button.closest('.work-exhibit-panel').querySelector('.work-exhibit-image > img');
      const enlarged = dialog.querySelector('img');
      enlarged.src = source.currentSrc || source.src;
      enlarged.alt = source.alt;
      dialog.querySelector('h3').textContent = source.alt;
      dialog.showModal();
    });
  });
  dialog.querySelector('[data-work-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  choices.forEach((choice,index) => {
    choice.addEventListener('click', () => {
      select(choice);
      if (window.matchMedia('(max-width: 700px)').matches) {
        root.querySelector('.work-exhibit-stage').scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    });
    choice.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % choices.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + choices.length) % choices.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = choices.length - 1;
      if (next !== undefined) {event.preventDefault(); select(choices[next],true);}
    });
  });
})();
