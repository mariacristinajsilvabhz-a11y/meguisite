const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{},document:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/../static/mockups/recognition.js','utf8'),sandbox);
const r=sandbox.window.MeguiRecognition;
assert.equal(r.suggest([{className:'jersey, T-shirt, tee shirt',probability:.8}]).productId,'camiseta');
assert.equal(r.suggest([{className:'coffee mug',probability:.65}]).productId,'caneca');
assert.equal(r.suggest([{className:'notebook, notebook computer',probability:.92}]),null);
assert.equal(r.suggest([{className:'coffee mug',probability:.05}]),null);
assert.equal(r.suggest([{className:'dog',probability:.80},{className:'water bottle',probability:.2}]),null);
const width=100,height=100,pixels=new Uint8ClampedArray(width*height*4).fill(255);
for(let y=20;y<80;y++)for(let x=30;x<70;x++){const at=(y*width+x)*4;pixels[at]=pixels[at+1]=pixels[at+2]=80;}
const box=r.bounds(pixels,width,height);assert(box);assert(box[0]>.27&&box[0]<.31);assert(box[2]>.39&&box[2]<.46);
assert.equal(r.bounds(new Uint8ClampedArray(width*height*4).fill(255),width,height),null);
for(const id of ['camiseta','garrafa','caneca','almofada',''])for(const [w,h] of [[600,1200],[1600,600],[1000,1000]]){const a=r.applicationArea(box,id,w,h);assert(a.every(Number.isFinite));assert(a[0]>=0&&a[1]>=0&&a[0]+a[2]<=1&&a[1]+a[3]<=1);}
console.log('Sugestões, rejeição de baixa confiança, contorno e proporções da área OK.');
