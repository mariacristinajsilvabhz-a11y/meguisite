(() => {
 const main = document.querySelector('[data-catalog-main]');

 const buttons = [...document.querySelectorAll('[data-catalog-photo]')];
 const select = document.querySelector('[data-catalog-variant]');
 const originalAlt = main?.alt || 'Produto';
 function show(url, color = '') {
  if (!url) return;
  if (main) main.src = url;
  if (main) main.alt = originalAlt + (color ? ` — ${color}` : '');
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.catalogPhoto === url)));
 }
 buttons.forEach(button => button.addEventListener('click', () => {
  // Photos can be shared by colours: viewing one must not silently change the requested SKU.
  show(button.dataset.catalogPhoto);
 }));
 const swatches=[...document.querySelectorAll('[data-variant-choice]')];
 const selectedLabel=document.querySelector('[data-variant-selected]');
 const palette=[
  [/preto|black|grafite|carbono|chumbo/, '#29282e'],
  [/branco|white|off.white|natural/, '#fff'],
  [/azul marinho|navy/, '#243c67'],
  [/azul|blue/, '#3579c3'],
  [/vermelho|red|bordô|vinho/, '#b83d46'],
  [/verde|green/, '#43845d'],
  [/amarelo|yellow/, '#edc951'],
  [/rosa|pink/, '#df8da9'],
  [/lilás|lilas|roxo|purple/, '#9a70b2'],
  [/laranja|orange/, '#e7934d'],
  [/cinza|grey|gray|prata/, '#a5a5a9'],
  [/bege|areia|creme/, '#ddceb5'],
  [/marrom|brown/, '#80573e'],
  [/dourado|gold/, '#cb9b40']
 ];
 swatches.forEach(button=>{
  const name=button.dataset.variantName||'';
  const item=palette.find(([re])=>re.test(name.toLocaleLowerCase('pt-BR')));
  const dot=button.querySelector('.variant-swatch-dot');
  if(item){dot.style.backgroundColor=item[1];dot.classList.add('has-color');}
  else {dot.classList.add('is-option');dot.textContent='◉';}
  button.addEventListener('click',()=>{
   if(!select||button.disabled)return;
   select.value=button.dataset.variantChoice;
   select.dispatchEvent(new Event('change',{bubbles:true}));
  });
 });
 function syncChoice(){
  if(!select)return;
  const option=select.selectedOptions[0];
  swatches.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variantChoice===select.value)));
  if(selectedLabel)selectedLabel.textContent=select.value ? (option?.dataset.color || option?.textContent.trim() || 'Selecionada') : 'Selecione uma opção';
  if(option)show(option.dataset.image,option.dataset.color);
 }
 if(select)select.addEventListener('change',syncChoice);
 if(select)syncChoice();
 if (select) {
  const requested = new URLSearchParams(location.search).get('opcao');
  const option = [...select.options].find(option => option.value === requested && !option.disabled);
  if (option) { select.value = option.value; select.dispatchEvent(new Event('change')); }
 }
})();
