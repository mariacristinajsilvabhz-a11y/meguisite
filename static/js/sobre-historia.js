(() => {
 document.querySelectorAll('[data-memory]').forEach(control => {
  const button=control.querySelector('button'), section=control.closest('.mh-memory'), image=section.querySelector('.mh-memory-image img'), note=control.querySelector('small'), originalAlt=image.alt;
  button.addEventListener('click',()=>{
   const showOriginal=button.getAttribute('aria-pressed')!=='true';
   image.src=showOriginal?button.dataset.original:button.dataset.recreation;
   image.alt=showOriginal?'Registro original do trabalho no acervo da Megui':originalAlt;
   button.setAttribute('aria-pressed',String(showOriginal));
   button.textContent=showOriginal?'Ver nova apresentação':'Ver registro original';
   note.textContent=showOriginal?'Fotografia original preservada do nosso acervo.':'Recriação visual baseada no trabalho do acervo.';
   section.classList.toggle('mh-original',showOriginal);
  });
 });
})();
