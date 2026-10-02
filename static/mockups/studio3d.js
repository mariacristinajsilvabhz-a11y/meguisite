import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DecalGeometry} from './vendor/DecalGeometry.js';
import {makeProduct,supported} from './models3d.js';
const $=id=>document.getElementById(id), stage=$('stage3d');
let renderer,scene,camera,controls,model,productId,active=false,spinning=false,frame,generatedFor=null,decal=null,placing=false,generatedTask=null;
function paint(){if(renderer&&active)renderer.render(scene,camera);}
function animate(){if(!spinning||!active)return;controls.update();paint();frame=requestAnimationFrame(animate);}
function dispose(){if(decal){scene.remove(decal);decal.geometry.dispose();decal.material.dispose();decal=null;}if(!model)return;generatedFor=null;model.group.traverse(node=>{node.geometry?.dispose();if(model.generated){const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(m=>{if(m){Object.values(m).filter(v=>v?.isTexture).forEach(t=>t.dispose());m.dispose();}});}});model.ink.map?.dispose();new Set([model.body,model.trim,model.ink,...model.group.children.map(n=>n.material)]).forEach(m=>m?.dispose());scene.remove(model.group);model=null;generatedTask=null;}
function init(){
  if(renderer)return;
  renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xf4f1f9);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.append(renderer.domElement);
  scene=new T.Scene();camera=new T.PerspectiveCamera(38,1,.1,100);camera.position.set(3,1.8,6);
  controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=3.5;controls.maxDistance=12;controls.enablePan=false;controls.autoRotateSpeed=2;controls.addEventListener('change',paint);
  scene.add(new T.HemisphereLight(0xffffff,0x8d819e,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(4,6,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
  const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.ShadowMaterial({opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.65;floor.receiveShadow=true;scene.add(floor);
  new ResizeObserver(resize).observe(stage);
}
function resize(){if(!renderer||!active)return;const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();paint();}
function texture(){const tex=new T.CanvasTexture(window.MeguiDesign.texture());tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();return tex;}
function sync(){
  const design=window.MeguiDesign?.read();if(!design)return;
  const available=generatedFor===design.product.id||(supported.includes(design.product.id)&&!design.hasCustomBase);
  $('view3d').disabled=!available;
  $('viewMessage').textContent=available?'Modelo ilustrativo · arraste para girar e use zoom.':'3D disponível: caneca, garrafa, caderno e almofada.';
  if(active&&!available)setView(false);
  $('productColor').value=design.state.productColor;$('trimColor').value=design.state.trimColor;
  if(!active)return;
  $('trimColor').disabled=!!model?.generated;
  if(productId!==design.product.id){dispose();model=makeProduct(design.product.id,texture());productId=design.product.id;scene.add(model.group);}
  else {model.ink.map?.dispose();model.ink.map=texture();model.ink.needsUpdate=true;}
  if(model.generated){model.group.traverse(n=>{if(n.isMesh){const materials=Array.isArray(n.material)?n.material:[n.material];materials.forEach(m=>m.color?.set(design.state.productColor));}});}else{model.body.color.set(design.state.productColor);model.trim.color.set(design.state.trimColor);}paint();
}
function setView(value){
  try{if(value)init();}catch(error){$('viewMessage').textContent='Seu navegador não conseguiu abrir o 3D. Continue na prévia 2D.';return;}
  active=value;stage.hidden=!value;$('tools3d').hidden=!value;$('placeDecal').hidden=!model?.generated;$('canvas').style.visibility=value?'hidden':'visible';
  for(const [id,on] of [['view2d',!value],['view3d',value]]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on));}
  $('productColorSection').classList.toggle('disabled',!value);$('productColor').disabled=$('trimColor').disabled=!value;
  $('productSwatches').querySelectorAll('button').forEach(b=>b.disabled=!value);
  if(value){sync();resize();if(spinning)animate();}else cancelAnimationFrame(frame);
}
$('view2d').onclick=()=>setView(false);$('view3d').onclick=()=>setView(true);
for(const [id,z] of [['front3d',6],['back3d',-6]])$(id).onclick=()=>{camera.position.set(0,.4,z);controls.update();paint();};
$('rotate3d').onclick=()=>{spinning=!spinning;controls.autoRotate=spinning;$('rotate3d').setAttribute('aria-pressed',String(spinning));$('rotate3d').textContent=spinning?'Parar giro':'Girar';cancelAnimationFrame(frame);if(spinning)animate();};
const changeColor=()=>window.MeguiDesign.setColors($('productColor').value,$('trimColor').value);
$('productColor').onchange=$('trimColor').onchange=changeColor;
for(const color of ['#ffffff','#19151f','#7250d4','#e2488c','#217eae','#20855d','#e6bc62']){const button=document.createElement('button');button.type='button';button.style.background=color;button.setAttribute('aria-label','Cor '+color);button.onclick=()=>{ $('productColor').value=color;changeColor();};$('productSwatches').append(button);}
window.addEventListener('megui:design-change',sync);
window.Megui3D={get active(){return active;},capture(){paint();const canvas=document.createElement('canvas');canvas.width=canvas.height=1200;const ctx=canvas.getContext('2d');ctx.fillStyle='#f4f1f9';ctx.fillRect(0,0,1200,1200);const source=renderer.domElement,ratio=Math.min(1200/source.width,1200/source.height);ctx.drawImage(source,(1200-source.width*ratio)/2,(1200-source.height*ratio)/2,source.width*ratio,source.height*ratio);return canvas;},getView(){return {template:generatedTask?'foto-gerada':productId,generationTask:generatedTask,bodyColor:$('productColor').value,trimColor:$('trimColor').value,camera:camera.position.toArray(),target:controls.target.toArray()};}};
setView(false);sync();

$('placeDecal').onclick=()=>{placing=!placing;controls.enabled=!placing;$('placeDecal').textContent=placing?'Clique na superfície':'Posicionar arte';};
stage.addEventListener('pointerdown',event=>{
  if(!placing||!model?.generated)return;
  const rect=renderer.domElement.getBoundingClientRect();const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
  const hit=ray.intersectObject(model.group,true)[0];if(!hit?.face)return;
  const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const orientation=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),normal));
  if(decal){scene.remove(decal);decal.geometry.dispose();}
  const geometry=new DecalGeometry(hit.object,hit.point,orientation,new T.Vector3(1.1,1.1,.5));decal=new T.Mesh(geometry,model.ink);scene.add(decal);placing=false;controls.enabled=true;$('placeDecal').textContent='Posicionar arte';paint();
});
async function loadGenerated(url,task){
  init();const gltf=await new GLTFLoader().loadAsync(url);dispose();const group=gltf.scene;
  group.traverse(n=>{if(n.isMesh){n.castShadow=n.receiveShadow=true;const materials=Array.isArray(n.material)?n.material:[n.material];materials.forEach(m=>{m.color?.set(0xffffff);});}});
  const box=new T.Box3().setFromObject(group),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());const scale=3/Math.max(size.x,size.y,size.z);if(!Number.isFinite(scale)||scale<=0)throw new Error('Modelo inválido.');group.scale.multiplyScalar(scale);group.position.sub(center.multiplyScalar(scale));
  model={group,generated:true,ink:new T.MeshStandardMaterial({map:texture(),transparent:true,polygonOffset:true,polygonOffsetFactor:-4,side:T.DoubleSide})};
  scene.add(group);generatedFor=productId=window.MeguiDesign.read().product.id;generatedTask=task;setView(true);$('placeDecal').hidden=false;$('viewMessage').textContent='Modelo estimado pela IA · use Posicionar arte para aplicar sua estampa.';
}
let photo=null,busy=false,csrf=null;
fetch('/api/mockups/3d/config',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.enabled){csrf=data.csrf;$('photo3dSection').hidden=false;}}).catch(()=>{});
$('photo3dUpload').onchange=async event=>{
  const file=event.target.files[0];photo=null;$('generate3d').disabled=true;if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024){$('generationStatus').textContent='Envie PNG, JPG ou WEBP de até 15 MB.';return;}
  try{const bitmap=await createImageBitmap(file);if(Math.min(bitmap.width,bitmap.height)<256){bitmap.close();throw new Error('Use uma foto maior e mais nítida.');}
    const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();photo=canvas.toDataURL('image/jpeg',.9);$('photo3dName').textContent=file.name;$('generate3d').disabled=busy;$('generationStatus').textContent='Foto preparada. A geração pode levar alguns minutos.';
  }catch(error){$('generationStatus').textContent=error.message;}
};
$('generate3d').onclick=async()=>{
  if(busy||!photo)return;busy=true;$('generate3d').disabled=true;
  const status=$('generationStatus');try{
    status.textContent='Enviando foto para gerar o modelo…';const response=await fetch('/api/mockups/3d/tasks',{method:'POST',headers:{'Content-Type':'application/json','X-Mockup-CSRF':csrf},body:JSON.stringify({image:photo})});const result=await response.json();if(!response.ok)throw new Error(result.error);
    const deadline=Date.now()+15*60*1000;let done=false;
    while(Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,5000));const poll=await fetch('/api/mockups/3d/tasks/'+encodeURIComponent(result.task),{cache:'no-store'});const data=await poll.json();if(!poll.ok)throw new Error(data.error);status.textContent='Gerando modelo: '+Math.round(Number(data.progress)||0)+'%';
      if(data.status==='SUCCEEDED'&&data.model){await loadGenerated(data.model,result.task);status.textContent='Modelo pronto. Confira os detalhes antes de solicitar o orçamento.';done=true;break;}
      if(['FAILED','CANCELED'].includes(data.status))throw new Error('A IA não conseguiu gerar o modelo. Tente outra foto.');
    }if(!done)throw new Error('A geração ainda está em andamento. Peça ajuda à Megui.');
  }catch(error){status.textContent=error.message||'Não foi possível gerar o modelo.';}finally{busy=false;$('generate3d').disabled=!photo;}
};
