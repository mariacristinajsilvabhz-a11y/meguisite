(() => {
 const main = document.querySelector('[data-catalog-main]');
 if (!main) return;
 const buttons = [...document.querySelectorAll('[data-catalog-photo]')];
 const select = document.querySelector('[data-catalog-variant]');
 const originalAlt = main.alt;
 function show(url, color = '') {
  if (!url) return;
  main.src = url;
  main.alt = originalAlt + (color ? ` — ${color}` : '');
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.catalogPhoto === url)));
 }
 buttons.forEach(button => button.addEventListener('click', () => {
  // Photos can be shared by colours: viewing one must not silently change the requested SKU.
  show(button.dataset.catalogPhoto);
 }));
 if (select) select.addEventListener('change', () => {
  const option = select.selectedOptions[0];
  if (option) show(option.dataset.image, option.dataset.color);
 });
 if (select) {
  const requested = new URLSearchParams(location.search).get('opcao');
  const option = [...select.options].find(option => option.value === requested && !option.disabled);
  if (option) { select.value = option.value; select.dispatchEvent(new Event('change')); }
 }
})();
