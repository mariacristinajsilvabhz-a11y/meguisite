(() => {
 const opening=document.querySelector('#megui-opening');if(!opening)return;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let visible=false;
 const refresh=()=>opening.classList.toggle('is-opening-visible',visible&&!document.hidden&&!reduced.matches);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh();},{threshold:.12}).observe(opening);
 document.addEventListener('visibilitychange',refresh);reduced.addEventListener('change',refresh);
 if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
 opening.querySelectorAll('[data-depth-scene]').forEach(scene=>{
  let frame=0,x=0,y=0;
  scene.addEventListener('pointermove',e=>{
   if(reduced.matches||!visible)return;
   const rect=scene.getBoundingClientRect();x=(e.clientX-rect.left)/rect.width-.5;y=(e.clientY-rect.top)/rect.height-.5;
   if(!frame)frame=requestAnimationFrame(()=>{scene.style.setProperty('--scene-ry',`${x*13}deg`);scene.style.setProperty('--scene-rx',`${-y*9}deg`);scene.style.setProperty('--scene-x',`${(x+.5)*100}%`);scene.style.setProperty('--scene-y',`${(y+.5)*100}%`);frame=0;});
  },{passive:true});
  const reset=()=>{if(frame)cancelAnimationFrame(frame);frame=0;['--scene-ry','--scene-rx','--scene-x','--scene-y'].forEach(p=>scene.style.removeProperty(p));};
  scene.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);
 });
})();
