(function(){
 'use strict';
 const rules=[
  {id:'camiseta',match:/\b(jersey|t-shirt|tee shirt)\b/i},
  {id:'moletom',match:/\bsweatshirt\b/i},
  {id:'caneca',match:/\b(coffee mug|cup)\b/i},
  {id:'garrafa',match:/\b(water bottle|pop bottle|soda bottle|wine bottle|beer bottle|vacuum bottle)\b/i},
  {id:'mochila',match:/\b(backpack|knapsack|rucksack|haversack)\b/i},
  {id:'ecobag',match:/\b(shopping bag|tote bag|mailbag)\b/i},
  {id:'avental',match:/\bapron\b/i},
  {id:'almofada',match:/\bpillow\b/i},
  {id:'bone',match:/\b(baseball|bonnet|cowboy hat)\b/i},
  {id:'caderno',match:/\b(comic book|book jacket|dust cover|dust jacket|dust wrapper|binder)\b/i},
  {id:'saquinho',match:/\b(pouch|purse)\b/i}
 ];
 function suggest(predictions){
  if(!Array.isArray(predictions))return null;
  const candidates=[];for(const p of predictions){if(typeof p.className!=='string'||!Number.isFinite(p.probability)||p.probability<.18)continue;const rule=rules.find(r=>r.match.test(p.className));if(rule)candidates.push({id:rule.id,score:p.probability});}
  candidates.sort((a,b)=>b.score-a.score);const first=candidates[0];if(!first)return null;
  const top=predictions[0];if(top?.probability>first.score*1.6)return null;
  return {productId:first.id,confidence:first.score,strong:first.score>=.35};
 }
 // Estimate a contour only on an evenly coloured background; no semantic claims.
 function bounds(pixels,width,height){
  const sample=[];for(const [cx,cy] of [[0,0],[width-1,0],[0,height-1],[width-1,height-1]])for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){const x=Math.max(0,Math.min(width-1,cx+(cx? -dx:dx))),y=Math.max(0,Math.min(height-1,cy+(cy? -dy:dy))),i=(y*width+x)*4;sample.push([pixels[i],pixels[i+1],pixels[i+2]]);}
  const bg=[0,1,2].map(c=>sample.map(s=>s[c]).sort((a,b)=>a-b)[Math.floor(sample.length/2)]);
  const noise=sample.reduce((n,s)=>n+Math.hypot(s[0]-bg[0],s[1]-bg[1],s[2]-bg[2]),0)/sample.length;if(noise>28)return null;
  const mask=new Uint8Array(width*height),visited=new Uint8Array(mask.length),threshold=Math.max(14,noise*3+10);
  for(let i=0;i<mask.length;i++){const j=i*4;mask[i]=pixels[j+3]>30&&Math.hypot(pixels[j]-bg[0],pixels[j+1]-bg[1],pixels[j+2]-bg[2])>threshold?1:0;}
  let best=null;const stack=new Int32Array(mask.length);
  for(let start=0;start<mask.length;start++){
   if(!mask[start]||visited[start])continue;let tail=0,head=0,count=0,minX=width,maxX=0,minY=height,maxY=0;stack[tail++]=start;visited[start]=1;
   while(head<tail){const at=stack[head++],x=at%width,y=Math.floor(at/width);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const n=ny*width+nx;if(mask[n]&&!visited[n]){visited[n]=1;stack[tail++]=n;}}
   }if(!best||count>best.count)best={count,minX,maxX,minY,maxY};
  }
  if(!best||best.count<mask.length*.015)return null;
  const x=Math.max(0,best.minX/width-.015),y=Math.max(0,best.minY/height-.015),w=Math.min(1-x,(best.maxX-best.minX+1)/width+.03),h=Math.min(1-y,(best.maxY-best.minY+1)/height+.03);
  if(w<.12||h<.12||w*h>.90)return null;return [x,y,w,h];
 }
 function applicationArea(box,id,imageWidth,imageHeight){
  // Fractions of the visible object, independent from the atlas photo layout.
  const surfaces={camiseta:[.29,.28,.42,.45],polo:[.29,.33,.42,.40],moletom:[.27,.30,.46,.34],caneca:[.13,.16,.48,.64],garrafa:[.19,.34,.62,.48],mochila:[.20,.48,.60,.30],ecobag:[.16,.37,.68,.50],avental:[.29,.30,.42,.35],almofada:[.17,.17,.66,.66],bone:[.27,.24,.46,.30],caderno:[.18,.14,.66,.70],saquinho:[.18,.23,.64,.58]};
  const b=box||[.10,.10,.80,.80],s=surfaces[id]||[.20,.23,.60,.54],ratio=Math.min(1000/imageWidth,1000/imageHeight),w=imageWidth*ratio/1000,h=imageHeight*ratio/1000;
  return [(1-w)/2+(b[0]+s[0]*b[2])*w,(1-h)/2+(b[1]+s[1]*b[3])*h,s[2]*b[2]*w,s[3]*b[3]*h].map(v=>Math.max(.005,Math.min(.99,v)));
 }
 let worker=null,next=0;const pending=new Map();
 function classify(image){return new Promise((resolve,reject)=>{
  if(!window.Worker){reject(new Error('Reconhecimento indisponível.'));return;}
  if(!worker){worker=new Worker('recognition-worker.js');worker.onmessage=event=>{const job=pending.get(event.data.id);if(!job)return;clearTimeout(job.timer);pending.delete(event.data.id);event.data.error?job.reject(new Error(event.data.error)):job.resolve(event.data.predictions);};worker.onerror=()=>{pending.forEach(job=>{clearTimeout(job.timer);job.reject(new Error('Reconhecimento indisponível.'));});pending.clear();worker.terminate();worker=null;};}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=224;const g=canvas.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,224,224);const ratio=Math.min(224/image.width,224/image.height);g.drawImage(image,(224-image.width*ratio)/2,(224-image.height*ratio)/2,image.width*ratio,image.height*ratio);const rgba=g.getImageData(0,0,224,224).data,rgb=new Uint8Array(224*224*3);for(let i=0,j=0;i<rgba.length;i+=4){rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2];}
  const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(new Error('O reconhecimento demorou. Escolha o tipo manualmente.'));},30000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,pixels:rgb.buffer,width:224,height:224},[rgb.buffer]);
 });}
 async function recognize(image){
  const canvas=document.createElement('canvas'),ratio=Math.min(1,240/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));const g=canvas.getContext('2d',{willReadFrequently:true});g.fillStyle='#fff';g.fillRect(0,0,canvas.width,canvas.height);g.drawImage(image,0,0,canvas.width,canvas.height);
  const contour=bounds(g.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
  try{return {...suggest(await classify(image)),bounds:contour,error:null};}catch(error){return {productId:null,bounds:contour,error:error.message};}
 }
 window.MeguiRecognition={recognize,suggest,bounds,applicationArea};
})();
