import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=new URL('../static/mockups/',import.meta.url),three=new URL('vendor/three.module.min.js',base).href;
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const rounded=data(readFileSync(new URL('vendor/RoundedBoxGeometry.js',base),'utf8').replace("'three'",JSON.stringify(three)));
const source=readFileSync(new URL('models3d.js',base),'utf8').replace("'three'",JSON.stringify(three)).replace("'./vendor/RoundedBoxGeometry.js'",JSON.stringify(rounded));
const {makeProduct,supported}=await import(data(source));const T=await import(three);
for(const id of supported){
 const model=makeProduct(id,null);model.group.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(model.group);assert(!box.isEmpty());assert(box.getSize(new T.Vector3()).z>.15);
 assert(model.body.isMeshPhysicalMaterial);assert.notEqual(model.body,model.ink);
 model.body.color.set('#7250d4');assert.equal(model.body.color.getHexString(),'7250d4');
 if(['camiseta','almofada'].includes(id))assert(model.body.bumpMap?.isDataTexture);
 let vertices=0;model.group.traverse(node=>{if(node.geometry){vertices+=node.geometry.attributes.position.count;for(const key of ['position','normal','uv'])for(const value of node.geometry.attributes[key]?.array||[])assert(Number.isFinite(value),id+' '+key);}});
 assert(vertices<300000,'Limite de geometria para '+id);console.log(id+': geometria, materiais, textura e cores OK');
}
