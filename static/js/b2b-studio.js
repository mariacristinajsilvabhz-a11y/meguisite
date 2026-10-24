(() => {
  const list = document.querySelector('.uniform-studio-tabs');
  if (!list) return;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const activate = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(tabs[next]);
      tabs[next].focus();
    });
  });
  document.querySelectorAll('[data-uniform-select]').forEach(button => {
    button.addEventListener('click', () => {
      const tab = tabs.find(item => item.id === 'uniform-tab-' + button.dataset.uniformSelect);
      if (!tab) return;
      activate(tab);
      tab.focus({ preventScroll: true });
      list.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    });
  });
})();

(() => {
 const buttons=[...document.querySelectorAll('[data-project]')];
 const cta=document.getElementById('empresa-project-cta');
 const description=document.getElementById('project-description');
 if(!cta||!description)return;
 const projects={
  equipe:{description:'Conte como é a rotina da sua equipe. A gente ajuda a escolher as peças e a personalização.',message:'Olá, Megui! Quero criar uniformes para minha equipe. Podemos conversar sobre os modelos e a personalização?'},
  presentes:{description:'Uma boa ideia para receber, agradecer ou celebrar. Vamos pensar nos produtos e na composição do seu kit.',message:'Olá, Megui! Quero criar brindes ou kits para presentear clientes e colaboradores. Podemos conversar sobre as possibilidades?'},
  especial:{description:'Ainda não encontrou o que imaginou? Conte sua ideia. Vamos avaliar materiais, formatos e possibilidades com você.',message:'Olá, Megui! Tenho uma ideia de personalizado e quero conversar sobre como tirar esse projeto do papel.'}
 };
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const project=projects[button.dataset.project];
  if(!project)return;
  buttons.forEach(item=>{const selected=item===button;item.classList.toggle('is-selected',selected);item.setAttribute('aria-pressed',String(selected));});
  description.textContent=project.description;
  cta.href='https://wa.me/'+cta.dataset.whatsapp+'?text='+encodeURIComponent(project.message);
 }));
})();

(() => {
 const explorer=document.querySelector('.business-explorer');
 if(!explorer)return;
 const tabs=[...explorer.querySelectorAll('[role="tab"]')];
 function activate(tab){tabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;});}
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>activate(tab));
  tab.addEventListener('keydown',event=>{
   let next;
   if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%tabs.length;
   if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index-1+tabs.length)%tabs.length;
   if(event.key==='Home')next=0;
   if(event.key==='End')next=tabs.length-1;
   if(next===undefined)return;
   event.preventDefault();activate(tabs[next]);tabs[next].focus();
  });
 });
 explorer.querySelectorAll('[data-business-item]').forEach(button=>button.addEventListener('click',()=>{
  const selected=button.getAttribute('aria-pressed')!=='true';
  button.setAttribute('aria-pressed',String(selected));button.querySelector('span').textContent=selected?'✓':'+';
  const panel=button.closest('.business-panel');
  const items=[...panel.querySelectorAll('[data-business-item][aria-pressed="true"]')].map(item=>item.dataset.businessItem);
  panel.querySelector('.business-feedback').textContent=items.length?`No seu projeto: ${items.join(' + ')}.`:'Pode combinar opções ou conversar para decidir.';
  const message=`Olá, Megui! Meu segmento é ${panel.dataset.sector}. ${items.length?'Tenho interesse em: '+items.join(', ')+'.':'Quero conhecer as possibilidades.'} Podemos conversar sobre meu projeto?`;
  const cta=panel.querySelector('.business-cta');
  cta.href='https://wa.me/'+explorer.dataset.whatsapp+'?text='+encodeURIComponent(message);
  cta.querySelector('span').textContent=items.length?'Conversar sobre minha seleção':'Planejar meu projeto';
 }));
})();

// Preserve the visitor's stated need in uniform enquiries, without storing personal data.
(() => {
 const buttons = [...document.querySelectorAll('[data-moment]')];
 const title = document.getElementById('moment-title');
 const copy = document.getElementById('moment-copy');
 const finalCta = document.getElementById('empresa-project-cta');
 if (!buttons.length || !title || !copy || !finalCta) return;
 const moments = {
  primeiro: {title:'O primeiro uniforme já pode ter a sua cara.', copy:'Imagine as cores da sua marca no atendimento e nas entregas. Comece pelas funções da equipe: abaixo, explore os modelos e descubra como dar unidade sem abrir mão da rotina de cada pessoa.', message:'Quero desenvolver o primeiro uniforme da minha equipe.'},
  renovar: {title:'Uma nova fase merece uma nova apresentação.', copy:'O que você gostaria de mudar: caimento, cores, conforto ou acabamento? Explore as peças abaixo e veja de perto os detalhes que podemos considerar na renovação.', message:'Quero renovar os uniformes da minha equipe.'},
  crescer: {title:'Sua equipe cresce. A identidade continua.', copy:'Novas pessoas e funções podem pedir peças diferentes com a mesma linguagem. Explore as linhas abaixo e conte quais modelos sua equipe já usa para avaliarmos as possibilidades.', message:'Minha equipe está crescendo e quero planejar os uniformes.'}
 };
 let selected;
 const uniformLinks = [...document.querySelectorAll('.uniform-studio-cta')];
 const originals = new Map(uniformLinks.map(link => [link, link.href]));
 function updateFinal() {
  if (!selected || document.querySelector('[data-project][aria-pressed="true"]')?.dataset.project !== 'equipe') return;
  finalCta.href = 'https://wa.me/' + finalCta.dataset.whatsapp + '?text=' + encodeURIComponent('Olá, Megui! ' + moments[selected].message + ' Podemos conversar sobre modelos, quantidades e prazo para um orçamento?');
 }
 buttons.forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.moment;
  const moment = moments[selected];
  const scene = document.querySelector('[data-moment-scene]');
  if (scene) scene.dataset.momentScene = selected;
  const sceneLabel = document.getElementById('moment-scene-label');
  if (sceneLabel) sceneLabel.textContent = {primeiro:'O começo de uma identidade.',renovar:'Uma nova fase. Um novo olhar.',crescer:'Mais pessoas. A mesma marca.'}[selected];
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  title.textContent = moment.title;
  copy.textContent = moment.copy;
  uniformLinks.forEach(link => {
   const url = new URL(originals.get(link));
   url.searchParams.set('text', url.searchParams.get('text') + ' ' + moment.message);
   link.href = url.toString();
  });
  updateFinal();
 }));
 document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', updateFinal));
})();
