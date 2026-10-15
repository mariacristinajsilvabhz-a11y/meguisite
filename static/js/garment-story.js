import * as T from '../mockups/vendor/three.module.min.js';
import {createGarment} from './garment-models.js';

const story=document.querySelector('[data-garment-story]');
if(story){
 const chapters=[...story.querySelectorAll('[data-garment-chapter]')],host=story.querySelector('[data-garment-canvas]');
 const loading=story.querySelector('[data-garment-loading]'),fallback=story.querySelector('[data-garment-fallback]');
 const count=story.querySelector('[data-garment-count]'),buttons=[...story.querySelectorAll('[data-garment-select]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=0,renderer,scene,camera,models=[],frame=0,visible=false,drag=null,targetY=-.25,targetX=0,initialized=false;
 let width=0,height=0,last=0;
 function select(index){
   if(index===active&&initialized&&models.length)return;
   active=index;targetY=-.25;targetX=0;
   host.classList.remove('model-enter');void host.offsetWidth;host.classList.add('model-enter');
   chapters.forEach((el,i)=>el.classList.toggle('is-active',i===active));
   buttons.forEach((el,i)=>{el.setAttribute('aria-pressed',String(i===active));el.classList.toggle('is-complete',i<active);});

   count.textContent=`0${active+1} — 03`;
   const name=chapters[active].dataset.garmentChapter;
   host.setAttribute('aria-label',`Modelo 3D de ${name}. Arraste na horizontal ou use as setas do teclado para girar.`);
   fallback.querySelector('img').src=`/static/img/inicio/${name==='camiseta'?'babylook-manequim':name}.webp`;
   models.forEach((m,i)=>{m.visible=i===active;});
   if(models[active]){models[active].rotation.set(0,targetY,0);models[active].scale.setScalar(1);}
   paint();
 }
 function paint(){if(renderer&&camera)renderer.render(scene,camera);}
 function resize(){
   if(!renderer)return;const rect=host.getBoundingClientRect();width=rect.width;height=rect.height;
   if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;
   // Frame the complete garment at every aspect ratio, including a full turn.
   const halfHeight=Math.max(2.10,2.0/camera.aspect);
   camera.position.set(0,.82,halfHeight/Math.tan(T.MathUtils.degToRad(camera.fov/2)));
   camera.lookAt(0,.2,0);camera.updateProjectionMatrix();paint();
 }
 function animate(time){
   frame=0;if(!visible||!renderer)return;
   const dt=Math.min(.05,(time-(last||time))/1000);last=time;const model=models[active];
   if(model){const factor=reduced.matches?1:1-Math.exp(-dt*14);model.rotation.y+=(targetY-model.rotation.y)*factor;model.rotation.x+=(targetX-model.rotation.x)*factor;}
   paint();frame=requestAnimationFrame(animate);
 }
 function fail(){loading.hidden=true;fallback.hidden=false;host.hidden=true;story.querySelector('[data-garment-hint]').textContent='Explore os modelos';story.querySelector('[data-garment-reset]').hidden=true;}
 function init(){
   if(initialized)return;initialized=true;
   try{
     renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
     renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
     scene=new T.Scene();camera=new T.PerspectiveCamera(33,1,.1,100);
     scene.add(new T.HemisphereLight(0xffffff,0x74617d,1.25));
     for(const [color,power,x,y,z] of [[0xfff8f3,2.2,3,5,6],[0xe8ddff,1.2,-4,2,3],[0xffffff,2.3,1,4,-4]]){const light=new T.DirectionalLight(color,power);light.position.set(x,y,z);scene.add(light);}
     models=chapters.map(el=>createGarment(el.dataset.garmentChapter));models.forEach((model,i)=>{scene.add(model);model.visible=i===active;});
     renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);fail();});
     resize();loading.hidden=true;select(active);if(visible&&!frame)frame=requestAnimationFrame(animate);
   }catch(error){renderer?.dispose();renderer=null;fail();}
 }
 let scrollFrame=0;
 function sync(){
   scrollFrame=0;const anchor=innerHeight*(innerWidth<=760?.7:.53);
   let nearest=0,distance=Infinity;
   chapters.forEach((el,i)=>{const r=el.getBoundingClientRect(),d=Math.abs((r.top+r.bottom)/2-anchor);if(d<distance){distance=d;nearest=i;}});
   select(nearest);
   const centers=chapters.map(el=>el.offsetTop+el.offsetHeight/2);
   story.style.setProperty('--rail-start',`${centers[0]}px`);
   story.style.setProperty('--rail-height',`${centers.at(-1)-centers[0]}px`);
   story.style.setProperty('--rail-fill',`${centers[active]-centers[0]}px`);
 }
 function onScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(sync);}
 buttons.forEach((button,i)=>button.addEventListener('click',()=>{select(i);const rect=chapters[i].getBoundingClientRect();const anchor=innerHeight*(innerWidth<=760?.7:.53);window.scrollTo({top:scrollY+rect.top+rect.height/2-anchor,behavior:reduced.matches?'instant':'smooth'});}));
 const reset=()=>{targetY=0;targetX=0;paint();};story.querySelector('[data-garment-reset]').addEventListener('click',reset);
 host.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();if(event.key==='Home')reset();else targetY+=(event.key==='ArrowLeft'?-1:1)*Math.PI/6;});
 host.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,ry:targetY,rx:targetX};host.setPointerCapture(event.pointerId);host.classList.add('is-dragging');});
 host.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(event.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx))return;targetY=drag.ry+dx*.012;targetX=T.MathUtils.clamp(drag.rx+dy*.003,-.22,.22);});
 const release=()=>{drag=null;host.classList.remove('is-dragging');};host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.addEventListener('lostpointercapture',release);
 new ResizeObserver(resize).observe(host);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&!document.hidden;if(visible){init();last=0;if(renderer&&!frame)frame=requestAnimationFrame(animate);}else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'150px'}).observe(story);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(visible&&renderer&&!frame){last=0;frame=requestAnimationFrame(animate);}});
 addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);sync();
}
