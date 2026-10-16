(() => {
 const header=document.querySelector('.site-header'),top=document.querySelector('[data-back-to-top]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
 const paint=()=>{frame=0;const range=document.documentElement.scrollHeight-innerHeight;header?.style.setProperty('--page-progress',range>0?Math.max(0,Math.min(1,scrollY/range)):0);if(top)top.hidden=scrollY<700;};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);top?.addEventListener('click',()=>scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));paint();
 const filters=[...document.querySelectorAll('[data-project-filter]')],cards=[...document.querySelectorAll('[data-project-tags]')],status=document.querySelector('[data-project-count]');
 filters.forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.projectFilter;filters.forEach(el=>el.setAttribute('aria-pressed',String(el===button)));let count=0;cards.forEach(card=>{const show=key==='todos'||card.dataset.projectTags.split(' ').includes(key);card.hidden=!show;if(show)count++;});if(status)status.textContent=`${count} ${count===1?'trabalho':'trabalhos'}`;}));
})();

// A escolha é do visitante: sem rotação automática ou troca durante a leitura.
document.querySelectorAll('[data-knit-editions]').forEach(studio => {
 const tabs = [...studio.querySelectorAll('[role="tab"]')];
 const panels = [...studio.querySelectorAll('[role="tabpanel"]')];
 const select = tab => {
  tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
  panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
 };
 tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', event => {
   let next;
   if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
   if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
   if (event.key === 'Home') next = 0;
   if (event.key === 'End') next = tabs.length - 1;
   if (next === undefined) return;
   event.preventDefault(); select(tabs[next]); tabs[next].focus();
  });
 });
});
