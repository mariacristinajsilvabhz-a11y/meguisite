/* Eventos editorial — ampliador acessível para imagens do acervo.
   A foto original abre sem cortes; nenhuma imagem é recriada ou substituída. */
(() => {
  'use strict';
  const page = document.querySelector('.ev-artdirection');
  const dialog = document.querySelector('[data-ev-dialog]');
  if (!page || !dialog) return;
  const photo = dialog.querySelector('img');
  const heading = dialog.querySelector('#ev-dialog-title');
  const close = dialog.querySelector('[data-ev-dialog-close]');
  let opener = null;

  const open = button => {
    const src = button.dataset.evImage;
    if (!src) return;
    if (typeof dialog.showModal !== 'function') {
      window.open(src, '_blank', 'noopener,noreferrer');
      return;
    }
    opener = button;
    heading.textContent = button.dataset.evTitle || 'Detalhes do trabalho';
    photo.alt = button.querySelector('img')?.alt || heading.textContent;
    photo.src = src;
    dialog.showModal();
  };

  page.querySelectorAll('[data-ev-enlarge]').forEach(button => {
    button.addEventListener('click', () => open(button));
  });
  close?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    photo.removeAttribute('src');
    opener?.focus({preventScroll: true});
  });
})();