(() => {
  const story = document.querySelector('[data-garment-story]');
  if (!story) return;
  const chapters = [...story.querySelectorAll('[data-garment-chapter]')];
  const photos = [...story.querySelectorAll('[data-garment-photo]')];
  const buttons = [...story.querySelectorAll('[data-garment-select]')];
  const count = story.querySelector('[data-garment-count]');
  const name = story.querySelector('[data-garment-name]');
  const names = {camiseta: 'Camiseta babylook', polo: 'Polo', moletom: 'Moletom'};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1, frame = 0;
  function select(index) {
    if (active === index) return;
    active = index;
    const model = chapters[index].dataset.garmentChapter;
    chapters.forEach((chapter, i) => chapter.classList.toggle('is-active', i === index));
    buttons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === index));
      button.classList.toggle('is-complete', i < index);
    });
    photos.forEach(photo => {
      const selected = photo.dataset.garmentPhoto === model;
      photo.classList.toggle('is-active', selected);
      photo.setAttribute('aria-hidden', String(!selected));
    });
    count.textContent = `0${index + 1} — 03`;
    name.textContent = names[model];
  }
  function sync() {
    frame = 0;
    const anchor = innerHeight * (innerWidth <= 760 ? .7 : .53);
    let nearest = 0, distance = Infinity;
    chapters.forEach((chapter, i) => {
      const rect = chapter.getBoundingClientRect();
      const delta = Math.abs((rect.top + rect.bottom) / 2 - anchor);
      if (delta < distance) { distance = delta; nearest = i; }
    });
    select(nearest);
    const centers = chapters.map(chapter => chapter.offsetTop + chapter.offsetHeight / 2);
    story.style.setProperty('--rail-start', `${centers[0]}px`);
    story.style.setProperty('--rail-height', `${centers.at(-1) - centers[0]}px`);
    story.style.setProperty('--rail-fill', `${centers[active] - centers[0]}px`);
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
  buttons.forEach((button, i) => button.addEventListener('click', () => {
    select(i);
    const rect = chapters[i].getBoundingClientRect();
    const anchor = innerHeight * (innerWidth <= 760 ? .7 : .53);
    scrollTo({top: scrollY + rect.top + rect.height / 2 - anchor, behavior: reduced.matches ? 'instant' : 'smooth'});
  }));
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(story);
  if (document.fonts) document.fonts.ready.then(schedule);
  sync();
})();
