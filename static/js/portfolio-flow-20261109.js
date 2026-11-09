/* Página de Trabalhos: os blocos aparecem conforme a pessoa desce,
   e o fundo da página muda de cor (com transição) a cada capítulo. */
(() => {
  const root = document.querySelector('.meg-work');
  if (!root || !('IntersectionObserver' in window)) return;
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Fundo que muda de cor ---------- */
  // [seletor da seção, cor no tema claro, cor no tema escuro]
  // As seções escuras (processos e final) mantêm o próprio fundo.
  const palette = [
    ['.ms-opening', '#f3ebf8', '#27212e'],
    ['.mw-recent', '#fbf3ea', '#2a2226'],
    ['.mw-featured', '#efe6f6', '#241b2e'],
    ['.mw-collection', '#fbf8f4', '#211929'],
    ['.mw-origins', '#e8eee1', '#1f2622'],
  ];
  const sections = [];
  palette.forEach(([sel, light, dark]) => {
    const el = root.querySelector(':scope > ' + sel);
    if (el) { el.dataset.mwfBg = ''; sections.push({ el, light, dark }); }
  });
  let active = sections[0];
  const paint = () => {
    if (!active) return;
    const dark = html.dataset.theme === 'dark';
    root.style.setProperty('--mwf-bg', dark ? active.dark : active.light);
  };
  if (sections.length) {
    html.classList.add('mwf-bg');
    paint();
    const bgObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          active = sections.find(s => s.el === entry.target) || active;
          paint();
        }
      });
    }, { rootMargin: '-48% 0px -48% 0px' });
    sections.forEach(s => bgObserver.observe(s.el));
    new MutationObserver(paint).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ---------- Aparecer ao rolar ---------- */
  if (reduced) return;
  const targets = [
    '.ms-opening-copy > *', '.ms-cover', '.ms-story-path > a',
    '.mw-brandproof-inner > p',
    '.mw-recent-head > *', '.mw-recent-photo',
    '.mw-section-opener > *', '.mw-voice-story > *', '.mw-voice-stage', '.mw-mobile-rail-head', '.mw-feature-story',
    '.mw-making-head > *', '.mw-making-stage', '.mw-making-film', '.mw-making-statement',
    '.mw-collection-header > *', '.mw-search', '.mw-piece',
    '.mw-origins-top > *', '.mw-gallery > *',
    '.mw-finale-panel > *', '.mw-finale-seal',
  ].join(',');
  const items = Array.from(root.querySelectorAll(targets));
  if (!items.length) return;
  html.classList.add('mwf-on');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('mwf-in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach(el => {
    // O que já está na tela ao abrir a página fica como está, sem piscar.
    if (el.getBoundingClientRect().top < innerHeight * 0.9) return;
    // Escalonamento entre irmãos: um depois do outro, sem demorar demais.
    const siblings = Array.from(el.parentElement.children).filter(c => items.includes(c));
    const i = siblings.indexOf(el);
    el.style.setProperty('--mwf-d', Math.min(i, 5) * 90 + 'ms');
    el.setAttribute('data-mwf', el.matches('.mw-recent-photo,.mw-piece,.mw-feature-story,.mw-voice-stage,.ms-cover,.mw-making-stage,.mw-making-film,.mw-gallery > *') ? 'photo' : 'text');
    revealObserver.observe(el);
  });
})();
