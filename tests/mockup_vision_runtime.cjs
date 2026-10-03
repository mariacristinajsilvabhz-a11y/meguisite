const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const root=__dirname+'/../static/mockups/';
const sandbox={atob,btoa,TextEncoder,TextDecoder,fetch,performance,setTimeout,clearTimeout,console};sandbox.self=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync(root+'vision/runtime.js','utf8'),sandbox,{filename:'vision-runtime.js'});const MeguiVisionRuntime=sandbox.MeguiVisionRuntime;
const json=JSON.parse(fs.readFileSync(root+'vision/model.json')),weights=fs.readFileSync(root+'vision/weights.bin');
const handler={load:async()=>({modelTopology:json.modelTopology,weightSpecs:json.weightsManifest.flatMap(g=>g.weights),weightData:weights.buffer.slice(weights.byteOffset,weights.byteOffset+weights.byteLength)})};
(async()=>{
 const model=await MeguiVisionRuntime.create(handler);
 const recognitionSandbox={window:{},document:{}};vm.createContext(recognitionSandbox);vm.runInContext(fs.readFileSync(root+'recognition.js','utf8'),recognitionSandbox);
 for(const name of ['camiseta','caneca','almofada']){
  const pixels=zlib.gunzipSync(fs.readFileSync(__dirname+'/fixtures/mockups/'+name+'.rgb.gz'));
  const predictions=await MeguiVisionRuntime.classify(model,pixels,224,224);
  assert.equal(recognitionSandbox.window.MeguiRecognition.suggest(predictions)?.productId,name);
  console.log('Inferência real no worker CPU:',name,'OK');
 }
})().catch(e=>{console.error(e.message);process.exit(1)});
