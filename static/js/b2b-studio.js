(() => {
  const list = document.querySelector('.empresa-tabs');
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
