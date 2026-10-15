(() => {
 const header=document.querySelector('.site-header'),top=document.querySelector('[data-back-to-top]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
 const paint=()=>{frame=0;const range=document.documentElement.scrollHeight-innerHeight;header?.style.setProperty('--page-progress',range>0?Math.max(0,Math.min(1,scrollY/range)):0);if(top)top.hidden=scrollY<700;};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);top?.addEventListener('click',()=>scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));paint();
 const filters=[...document.querySelectorAll('[data-project-filter]')],cards=[...document.querySelectorAll('[data-project-tags]')],status=document.querySelector('[data-project-count]');
 filters.forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.projectFilter;filters.forEach(el=>el.setAttribute('aria-pressed',String(el===button)));let count=0;cards.forEach(card=>{const show=key==='todos'||card.dataset.projectTags.split(' ').includes(key);card.hidden=!show;if(show)count++;});if(status)status.textContent=`${count} ${count===1?'trabalho':'trabalhos'}`;}));
})();
