(() => {
 const root=document.querySelector('[data-ev-formats]');
 const kit=document.querySelector('[data-ev-kit]');
 if(!root||!kit)return;
 const tabs=[...root.querySelectorAll('[data-ev-tab]')];
 const panels=[...root.querySelectorAll('[data-ev-panel]')];
 const options=[...kit.querySelectorAll('[data-ev-item]')];
 const link=kit.querySelector('[data-ev-kit-link]');
 const eventLabel=document.querySelector('[data-ev-event-label]');
 let eventName=(panels.find(panel=>!panel.hidden)||panels[0]).dataset.eventName;
 function updateKit(){
  const selected=options.filter(button=>button.getAttribute('aria-pressed')==='true').map(button=>button.dataset.evItem);
  kit.querySelector('[data-ev-selection-count]').textContent=selected.length?`${selected.length} ${selected.length===1?'item selecionado':'itens selecionados'}`:'Ainda não sabe os itens? Tudo bem.';
  kit.querySelector('[data-ev-selection]').textContent=selected.length?selected.join(' · '):'Podemos pensar nessa escolha juntos no atendimento.';
  const message=selected.length?`Olá, Megui! Estou organizando ${eventName} e quero conversar sobre ${selected.join(', ')}. Podemos alinhar quantidades, personalização e prazo?`:`Olá, Megui! Estou organizando ${eventName} e preciso de ajuda para escolher os personalizados. Podemos conversar?`;
  link.href=`https://wa.me/${kit.dataset.whatsapp}?text=${encodeURIComponent(message)}`;
 }
 function select(key,focus=false){
  tabs.forEach(tab=>{const active=tab.dataset.evTab===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
  panels.forEach(panel=>{panel.hidden=panel.dataset.evPanel!==key;if(!panel.hidden){eventName=panel.dataset.eventName;if(eventLabel)eventLabel.textContent=panel.dataset.eventLabel;}});
  updateKit();
 }
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab.dataset.evTab));
  tab.addEventListener('keydown',event=>{
   let next;
   if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%tabs.length;
   if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index-1+tabs.length)%tabs.length;
   if(event.key==='Home')next=0;
   if(event.key==='End')next=tabs.length-1;
   if(next===undefined)return;
   event.preventDefault();select(tabs[next].dataset.evTab,true);
  });
 });
 options.forEach(button=>button.addEventListener('click',()=>{const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));button.querySelector('b').textContent=active?'✓':'+';updateKit();}));
 document.querySelectorAll('[data-ev-pick]').forEach(trigger=>trigger.addEventListener('click',()=>{const option=options.find(button=>button.dataset.evItem===trigger.dataset.evPick);if(!option)return;option.setAttribute('aria-pressed','true');option.querySelector('b').textContent='✓';updateKit();}));
 updateKit();
})();
