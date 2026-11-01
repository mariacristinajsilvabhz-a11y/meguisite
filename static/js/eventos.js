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
 function syncAll(){
  const allOpen=panels.every(panel=>!panel.hidden);
  const all=root.querySelector('[data-ev-expand-all]');
  all.setAttribute('aria-expanded',String(allOpen));
  all.innerHTML=allOpen?'Recolher todos os formatos <span aria-hidden="true">−</span>':'Abrir todos os formatos <span aria-hidden="true">+</span>';
 }
 function expand(tab,open){
  const panel=panels.find(panel=>panel.dataset.evPanel===tab.dataset.evTab);
  tab.setAttribute('aria-expanded',String(open));panel.hidden=!open;
  tab.querySelector('.ev-format-arrow').textContent=open?'−':'+';
  if(open){eventName=panel.dataset.eventName;if(eventLabel)eventLabel.textContent=panel.dataset.eventLabel;}
 }
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>{expand(tab,tab.getAttribute('aria-expanded')!=='true');syncAll();updateKit();});
  tab.addEventListener('keydown',event=>{
   let next;
   if(event.key==='ArrowDown')next=(index+1)%tabs.length;
   if(event.key==='ArrowUp')next=(index-1+tabs.length)%tabs.length;
   if(event.key==='Home')next=0;
   if(event.key==='End')next=tabs.length-1;
   if(next!==undefined){event.preventDefault();tabs[next].focus();}
  });
 });
 root.querySelector('[data-ev-expand-all]').addEventListener('click',()=>{
  const open=panels.some(panel=>panel.hidden);
  tabs.forEach(tab=>expand(tab,open));syncAll();updateKit();
 });
 syncAll();
 if(eventLabel)eventLabel.textContent=(panels.find(panel=>!panel.hidden)||panels[0]).dataset.eventLabel;
 options.forEach(button=>button.addEventListener('click',()=>{const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));button.querySelector('b').textContent=active?'✓':'+';updateKit();}));
 document.querySelectorAll('[data-ev-pick]').forEach(trigger=>trigger.addEventListener('click',()=>{const option=options.find(button=>button.dataset.evItem===trigger.dataset.evPick);if(!option)return;option.setAttribute('aria-pressed','true');option.querySelector('b').textContent='✓';updateKit();}));
 updateKit();
})();
