(() => {
  // No cursor tracking or canvas: a few tiny marks in the page's own margins.
  const main = document.querySelector('main');
  if (!main || !document.getElementById('megui-butterfly')) return;
  const candidates = [...main.querySelectorAll('section')].filter(section =>
    !section.closest('#malharia, .mockup-page') && !section.parentElement.closest('section')
  );
  const mobile = matchMedia('(max-width: 680px)').matches;
  const count = Math.min(mobile ? 4 : 9, candidates.length * 2);
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting));
  }, {rootMargin: '40px'}) : null;
  const modes = ['still', 'wings', 'flight', 'wings', 'still', 'flight', 'wings', 'still', 'wings'];
  for (let i = 0; i < count; i++) {
    const section = candidates[i % candidates.length];
    const secondVisit = i >= candidates.length;
    section.classList.add('brand-whisper-host');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 112 150');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('brand-whisper', `brand-whisper--${modes[i]}`);
    if ((i % 2 === 1) !== secondVisit) svg.classList.add('brand-whisper--left');
    svg.innerHTML = `${i % 3 === 0 || i === 2 ? '<path class="brand-whisper__trail" d="M37 141C92 126 9 105 38 83S98 78 66 43"/>' : ''}<g class="brand-whisper__flight"><g class="brand-whisper__wings"><use href="#megui-butterfly" x="49" y="13" width="19" height="24"/></g></g>`;
    section.prepend(svg);
    if (observer) observer.observe(svg);
    else svg.classList.add('is-visible');
  }
  document.addEventListener('visibilitychange', () => {
    main.querySelectorAll('.brand-whisper').forEach(svg => {
      svg.style.visibility = document.hidden ? 'hidden' : '';
    });
  });
})();
