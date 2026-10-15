(() => {
 const root=document.querySelector('[data-ev-formats]');if(!root)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const tabs=[...root.querySelectorAll('[data-ev-tab]')],panels=[...root.querySelectorAll('[data-ev-panel]')];
 let eventName=panels[0].dataset.eventName;
 const kit=document.querySelector('[data-ev-kit]'),options=[...kit.querySelectorAll('[data-ev-item]')],kitLink=kit.querySelector('[data-ev-kit-link]');
 function updateKit(){
  const selected=options.filter(el=>el.getAttribute('aria-pressed')==='true').map(el=>el.dataset.evItem);
  kit.querySelector('[data-ev-selection-count]').textContent=selected.length?`${selected.length} ${selected.length===1?'ideia':'ideias'} para começar`:'Escolha os itens do seu encontro';
  kit.querySelector('[data-ev-selection]').textContent=selected.length?selected.join(' · '):'Toque nos itens acima para compor sua ideia.';
  if(selected.length){kitLink.href=`https://wa.me/${kit.dataset.whatsapp}?text=${encodeURIComponent(`Olá! Estou organizando ${eventName.toLowerCase()} e gostaria de planejar estes itens: ${selected.join(', ')}. Quero alinhar quantidades, personalização e prazo com a Megui.`)}`;kitLink.removeAttribute('aria-disabled');kitLink.removeAttribute('tabindex');}
  else{kitLink.removeAttribute('href');kitLink.setAttribute('aria-disabled','true');kitLink.setAttribute('tabindex','-1');}
 }
 function select(key,focus=false){
  tabs.forEach(tab=>{const active=tab.dataset.evTab===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
  panels.forEach(panel=>{panel.hidden=panel.dataset.evPanel!==key;if(!panel.hidden)eventName=panel.dataset.eventName;});updateKit();
 }
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab.dataset.evTab));
  tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(tabs[next].dataset.evTab,true);});
 });
 document.querySelectorAll('[data-ev-start]').forEach(link=>link.addEventListener('click',()=>select(link.dataset.evStart)));
 options.forEach(button=>button.addEventListener('click',()=>{const selected=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(selected));button.querySelector('b').textContent=selected?'✓':'+';updateKit();}));
 updateKit();
 const reveal=[...document.querySelectorAll('[data-ev-reveal]')];document.body.classList.add('ev-enhanced');
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('ev-pending');entry.target.classList.add('ev-visible');observer.unobserve(entry.target);}}),{threshold:.08});
 reveal.forEach(el=>{if(el.getBoundingClientRect().top>innerHeight&&!reduced.matches)el.classList.add('ev-pending');observer.observe(el);});
 const hero=document.querySelector('.ev-hero'),ribbon=document.querySelector('.ev-ribbon');let frame=0;
 function paint(){frame=0;if(reduced.matches)return;const rect=hero.getBoundingClientRect(),progress=Math.max(0,Math.min(1,-rect.top/rect.height));hero.style.setProperty('--ev-art-y',`${progress*-18}px`);hero.style.setProperty('--ev-path-offset',`${(1-progress)*700}`);const band=ribbon.getBoundingClientRect();if(band.bottom>-100&&band.top<innerHeight+100)ribbon.style.setProperty('--ev-ribbon-x',`${-Math.max(0,innerHeight-band.top)*.16}px`);}
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduced.addEventListener('change',()=>{if(reduced.matches)reveal.forEach(el=>el.classList.remove('ev-pending'));schedule();});paint();
})();
