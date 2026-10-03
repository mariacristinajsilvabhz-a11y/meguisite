// Classification is local. This worker only downloads same-origin model assets.
importScripts('./vision/runtime.js');
let model,queue=Promise.resolve();
self.onmessage=event=>{const {id,pixels,width,height}=event.data;queue=queue.then(async()=>{
 try{model??=MeguiVisionRuntime.create(new URL('./vision/model.json',self.location.href).href);const predictions=await MeguiVisionRuntime.classify(await model,pixels,width,height);self.postMessage({id,predictions});}
 catch(error){model=null;self.postMessage({id,error:'Reconhecimento indisponível. Escolha o tipo da peça.'});}
});};
