(() => {
 const root=document.documentElement;
 const key='megui-theme';
 let choice='light';
 try{if(localStorage.getItem(key)==='dark')choice='dark';}catch(_){}
 root.dataset.theme=choice;
 const sync=()=>{
  const dark=root.dataset.theme==='dark';
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro');button.title=dark?'Ativar modo claro':'Ativar modo escuro';});
  // Only editorial assets explicitly opted in can change. Catalog and client work stay faithful.
  document.querySelectorAll('img[data-theme-light][data-theme-dark]').forEach(image=>{
   const source=dark?image.dataset.themeDark:image.dataset.themeLight;
   if(image.getAttribute('src')!==source)image.setAttribute('src',source);
   const alt=dark?image.dataset.altDark:image.dataset.altLight;
   if(alt!==undefined)image.alt=alt;
  });
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#1b1522':'#f6f0f7';
 };
 document.addEventListener('DOMContentLoaded',()=>{
  sync();
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,root.dataset.theme);}catch(_){}sync();}));
 });
 window.addEventListener('storage',event=>{if(event.key===key){root.dataset.theme=event.newValue==='dark'?'dark':'light';sync();}});
})();
