// Nova home: setas da fileira de categorias.
(() => {
  const row = document.querySelector('[data-row]');
  if (!row) return;
  const step = () => Math.max(260, row.clientWidth * 0.7);
  const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  document.querySelector('[data-row-prev]')?.addEventListener('click', () => row.scrollBy({ left: -step(), behavior: smooth }));
  document.querySelector('[data-row-next]')?.addEventListener('click', () => row.scrollBy({ left: step(), behavior: smooth }));
})();
