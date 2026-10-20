(() => {
 'use strict';
 const root = document.querySelector('[data-services-discovery]');
 if (!root) return;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const precise = matchMedia('(hover: hover) and (pointer: fine)');
 let frame = 0, pending;
 const reset = item => {
  ['--tilt-x','--tilt-y','--drift-x','--drift-y'].forEach(name => item.style.removeProperty(name));
 };
 const paint = () => {
  frame = 0;
  if (!pending || reduced.matches || !precise.matches) return;
  const {item,x,y} = pending;
  item.style.setProperty('--tilt-x', `${(-y * 6).toFixed(2)}deg`);
  item.style.setProperty('--tilt-y', `${(x * 7).toFixed(2)}deg`);
  item.style.setProperty('--drift-x', `${(x * 6).toFixed(2)}px`);
  item.style.setProperty('--drift-y', `${(y * 3).toFixed(2)}px`);
 };
 root.querySelectorAll('[data-service-item]').forEach(item => {
  item.addEventListener('pointermove', event => {
   if (reduced.matches || !precise.matches || event.pointerType === 'touch') return;
   const rect = item.getBoundingClientRect();
   pending = {item,x:Math.max(-1,Math.min(1,(event.clientX - rect.left) / rect.width * 2 - 1)),y:Math.max(-1,Math.min(1,(event.clientY - rect.top) / rect.height * 2 - 1))};
   if (!frame) frame = requestAnimationFrame(paint);
  }, {passive:true});
  item.addEventListener('pointerleave', () => {
   if (pending && pending.item === item) pending = null;
   reset(item);
  });
 });
 reduced.addEventListener('change', () => {
  pending = null;
  root.querySelectorAll('[data-service-item]').forEach(reset);
 });

 // The flight is measured against the actual letter after fonts and layout settle.
 const title = root.querySelector('.services-heading-title');
 const butterfly = title && title.querySelector('.service-butterfly');
 const dot = title && title.querySelector('.service-i-dot');
 if (!butterfly || !dot) return;
 const wings = butterfly.querySelector('svg');
 const duration = 14000;
 let animations = [], layoutFrame = 0, visible = false;
 const syncFlight = () => {
  const play = visible && !document.hidden && !reduced.matches;
  animations.forEach(animation => play ? animation.play() : animation.pause());
 };
 const bezier = d => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  return {path, length:path.getTotalLength()};
 };
 const buildFlight = () => {
  layoutFrame = 0;
  const elapsed = animations[0] ? Number(animations[0].currentTime || 0) % duration : 0;
  animations.forEach(animation => animation.cancel());
  animations = [];
  butterfly.classList.remove('is-ready');
  if (reduced.matches) return;
  const box = title.getBoundingClientRect();
  const lead = title.querySelector('.services-title-lead').getBoundingClientRect();
  const line = title.querySelector('em').getBoundingClientRect();
  const point = dot.getBoundingClientRect();
  const left = Math.min(lead.left,line.left) - box.left;
  const top = lead.top - box.top;
  const right = Math.min(box.width - 10,Math.max(lead.right,line.right) - box.left + 18);
  const bottom = line.bottom - box.top;
  const width = right - left;
  const mid = (top + bottom) / 2;
  const dock = {x:point.left - box.left + point.width / 2,y:point.top - box.top + point.height / 2};
  const start = {x:left + width * .12,y:bottom + 12};
  const approach = bezier(`M${start.x},${start.y} C${left+width*.4},${bottom+24} ${right},${bottom+20} ${right},${mid} C${right},${top-14} ${left+width*.6},${top-18} ${left+width*.48},${top-5} C${left+width*.18},${top-16} ${left-6},${top+12} ${left+10},${mid} C${left+12},${bottom+5} ${left+width*.35},${bottom+8} ${left+width*.35},${mid+8} C${left+width*.42},${mid-15} ${dock.x+28},${dock.y-22} ${dock.x},${dock.y}`);
  const departure = bezier(`M${dock.x},${dock.y} C${dock.x-18},${dock.y-30} ${left-2},${mid} ${left+8},${bottom} C${left+13},${bottom+18} ${start.x-7},${bottom+15} ${start.x},${start.y}`);
  const ox = butterfly.offsetWidth * .77, oy = butterfly.offsetHeight * .73;
  const pose = (x,y,angle,scale=1) => `translate(${(x-ox).toFixed(2)}px,${(y-oy).toFixed(2)}px) rotate(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  const frames = [];
  const sample = (route,from,to,count,departing=false) => {
   for (let n=0;n<=count;n++) {
    const p=n/count, distance=route.length*(.5-.5*Math.cos(Math.PI*p));
    const a=route.path.getPointAtLength(distance);
    const b=route.path.getPointAtLength(Math.min(route.length,distance+1));
    let angle=Math.max(-24,Math.min(24,Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI*.18));
    let scale=1;
    if (!departing && p>.91) { const settle=(p-.91)/.09; angle=angle*(1-settle)-18*settle; scale=1-.32*settle; }
    if (departing && p<.2) { const lift=p/.2; angle=-18*(1-lift)+angle*lift; scale=.68+.32*lift; }
    if ((!departing && n===0) || (departing && n===count)) angle=-8;
    frames.push({offset:from+(to-from)*p,transform:pose(a.x,a.y,angle,scale)});
   }
  };
  sample(approach,0,.64,90);
  frames.push({offset:.84,transform:pose(dock.x,dock.y,-18,.68)});
  sample(departure,.84,1,30,true);
  const flutter=[];
  for(let n=0;n<=280;n++) {
   const offset=n/280, seconds=offset*duration/1000;
   const resting=offset>=.64 && offset<=.84;
   const angle=resting ? Math.sin((seconds-8.96)*Math.PI*2/.85)*25 : Math.sin(seconds*Math.PI*2/.28)*58;
   flutter.push({offset,transform:`perspective(160px) rotateY(${angle.toFixed(2)}deg)`});
  }
  const timing={duration,iterations:Infinity,easing:'linear'};
  animations=[
   butterfly.animate(frames,timing),
   wings.animate(flutter,timing),
   dot.animate([{offset:0,opacity:1},{offset:.62,opacity:1},{offset:.64,opacity:0},{offset:.84,opacity:0},{offset:.86,opacity:1},{offset:1,opacity:1}],timing)
  ];
  animations.forEach(animation=>{animation.pause();animation.currentTime=elapsed;});
  butterfly.classList.add('is-ready');
  syncFlight();
 };
 const scheduleFlight = () => {
  if (!layoutFrame) layoutFrame=requestAnimationFrame(buildFlight);
 };
 new ResizeObserver(scheduleFlight).observe(title);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncFlight();},{rootMargin:'60px'}).observe(title);
 document.addEventListener('visibilitychange',syncFlight);
 reduced.addEventListener('change',scheduleFlight);
 if(document.fonts) {
  document.fonts.ready.then(scheduleFlight);
  document.fonts.addEventListener('loadingdone',scheduleFlight);
 }
 scheduleFlight();
})();
