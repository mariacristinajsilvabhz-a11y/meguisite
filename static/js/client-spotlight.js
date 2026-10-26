(() => {
  const wall = document.querySelector('.home-clients .client-logo-wall');
  if (!wall || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = [...wall.children];
  const play = () => cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('is-spotlit');
      setTimeout(() => card.classList.remove('is-spotlit'), 1400);
    }, index * 850);
  });
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      play();
    }
  }, {threshold: .25});
  observer.observe(wall);
})();
