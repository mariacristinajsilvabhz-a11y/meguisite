import * as T from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
export const supported=['camiseta','caneca','garrafa','caderno','almofada'];
// A repeatable weave, shared by garment, cushion and their print layer.
function weave(){
  const size=256,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const grain=(Math.sin(x*127.1+y*311.7)*43758.5453)%1;
    const thread=128+35*Math.sin(x*Math.PI/2)*Math.cos(y*Math.PI/2)+grain*9;
    const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=thread;data[i+3]=255;
  }
  const map=new T.DataTexture(data,size,size);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(6,6);map.needsUpdate=true;return map;
}
function shirtDepth(x,y){
 const torso=.14*Math.exp(-Math.pow(x/.85,4))*Math.max(0,1-Math.pow((y+.05)/1.65,4));
 const envelope=Math.max(0,1-((y+.3)/1.8)**2);
 const folds=envelope*(.022*Math.exp(-Math.pow((x-.58-y*.045)/.075,2))-.018*Math.exp(-Math.pow((x+.57+y*.025)/.065,2)));
 const armpit=.016*Math.exp(-Math.pow((y-.32-Math.abs(x)*.38)/.10,2))*Math.min(1,Math.abs(x));
 return .035+torso+folds+armpit;
}
function cushionDepth(x,y){
 const u=Math.min(1,Math.abs(x)/1.15),v=Math.min(1,Math.abs(y)/1.05);
 const puff=.37*Math.sqrt(Math.max(0,1-u**4))*Math.sqrt(Math.max(0,1-v**4));
 return puff+.008*Math.cos(x*24+y*9)*u**8*(1-u)*(1-v);
}
function refine(geometry){
 const g=geometry.index?geometry.toNonIndexed():geometry,p=g.attributes.position,uv=g.attributes.uv,n=g.attributes.normal;
 const positions=[],coords=[],normals=[];
 const vertex=i=>({p:new T.Vector3().fromBufferAttribute(p,i),uv:new T.Vector2().fromBufferAttribute(uv,i),n:new T.Vector3().fromBufferAttribute(n,i)});
 const mid=(a,b)=>({p:a.p.clone().add(b.p).multiplyScalar(.5),uv:a.uv.clone().add(b.uv).multiplyScalar(.5),n:a.n.clone().add(b.n).normalize()});
 function split(a,b,c,depth){
  if(depth<6&&Math.max(a.p.distanceTo(b.p),b.p.distanceTo(c.p),c.p.distanceTo(a.p))>.12){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);split(a,ab,ca,depth+1);split(ab,b,bc,depth+1);split(ca,bc,c,depth+1);split(ab,bc,ca,depth+1);return;}
  for(const v of [a,b,c]){positions.push(...v.p.toArray());coords.push(...v.uv.toArray());normals.push(...v.n.toArray());}
 }
 for(let i=0;i<p.count;i+=3)split(vertex(i),vertex(i+1),vertex(i+2),0);
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(positions,3));out.setAttribute('uv',new T.Float32BufferAttribute(coords,2));out.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.dispose();if(g!==geometry)g.dispose();return out;
}
function surface(width,height,n,fn){const g=new T.PlaneGeometry(width,height,n,n);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,fn(p.getX(i),p.getY(i)));g.computeVertexNormals();return g;}
export function makeProduct(id,texture){
 const group=new T.Group(),fabric=['camiseta','almofada'].includes(id),bump=fabric?weave():null;
 const body=new T.MeshPhysicalMaterial({color:0xffffff,roughness:fabric?.88:id==='caneca'?.19:.38,metalness:id==='garrafa'?.15:0,clearcoat:id==='caneca'?1:id==='garrafa'?.3:0,clearcoatRoughness:.12,sheen:fabric?.7:0,sheenColor:0xffffff,sheenRoughness:.8,bumpMap:bump,bumpScale:.003});
 const trim=new T.MeshPhysicalMaterial({color:0xc8c4cf,roughness:id==='garrafa'?.25:.6,metalness:id==='garrafa'?.8:id==='caderno'?.9:0,bumpMap:bump,bumpScale:.008});
 const ink=new T.MeshPhysicalMaterial({map:texture,transparent:true,roughness:fabric?.88:id==='caneca'?.23:.5,clearcoat:id==='caneca'?1:0,clearcoatRoughness:.15,bumpMap:bump,bumpScale:.003,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false});
 const add=(geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=mat!==ink;m.receiveShadow=true;group.add(m);return m;};
 const lathe=pts=>new T.LatheGeometry(pts.map(p=>new T.Vector2(...p)),128);
 const curve=(points,r,material,closed=false)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points,closed),points.length*5,r,8,closed),material);
 const cylinderPatch=(r,h,arc,y)=>add(new T.CylinderGeometry(r,r,h,96,20,true,-arc/2,arc),ink,0,y);
 if(id==='caneca'){
   // Rounded lip, ceramic thickness, inner cavity and inset base foot.
   add(lathe([[0,-1.02],[.63,-1.02],[.69,-1.035],[.73,-1.02],[.77,-.97],[.805,-.88],[.81,-.75],[.824,.75],[.823,.94],[.812,.987],[.792,1.003],[.765,.992],[.753,.967],[.748,.91],[.737,-.77],[.71,-.85],[.65,-.88],[0,-.88]]),body);
   const handle=new T.Shape();handle.moveTo(.79,.69);handle.bezierCurveTo(1.8,.88,1.84,-.84,.79,-.65);handle.lineTo(.79,-.46);handle.bezierCurveTo(1.49,-.58,1.51,.61,.79,.49);handle.closePath();
   const mesh=add(new T.ExtrudeGeometry(handle,{depth:.12,bevelEnabled:true,bevelSegments:6,steps:1,bevelSize:.055,bevelThickness:.055,curveSegments:40}),body,0,0,-.06);
   cylinderPatch(.823,1.35,1.45,0);
 }else if(id==='garrafa'){
   add(lathe([[0,-1.42],[.42,-1.42],[.53,-1.40],[.59,-1.34],[.602,-1.24],[.602,.80],[.59,.94],[.55,1.03],[.47,1.10],[.35,1.17],[.30,1.23],[.30,1.39],[0,1.39]]),body);
   add(lathe([[0,1.30],[.32,1.30],[.34,1.33],[.34,1.52],[.31,1.56],[0,1.56]]),trim);
   const gasket=new T.MeshStandardMaterial({color:0x28262b,roughness:.9});add(new T.TorusGeometry(.318,.016,8,64),gasket,0,1.315).rotation.x=Math.PI/2;
   for(let y=1.36;y<1.50;y+=.03)add(new T.TorusGeometry(.340,.004,6,64),trim,0,y).rotation.x=Math.PI/2;
   add(new T.CylinderGeometry(.565,.565,.035,96),trim,0,-1.41);cylinderPatch(.607,1.55,1.45,-.14);
 }else if(id==='caderno'){
   add(new RoundedBoxGeometry(1.82,2.5,.045,5,.022),body,0,0,.13);add(new RoundedBoxGeometry(1.82,2.5,.045,5,.022),body,0,0,-.13);
   add(new RoundedBoxGeometry(1.67,2.35,.19,4,.018),new T.MeshStandardMaterial({color:0xf8f5ee,roughness:.95}),.025,0,0);
   const paper=new T.MeshStandardMaterial({color:0xd2cec5,roughness:1});
   for(let z=-.084;z<.09;z+=.012){add(new T.BoxGeometry(.002,2.31,.0015),paper,.861,0,z);add(new T.BoxGeometry(1.65,.0015,.0015),paper,.025,-1.176,z);}
   add(new T.PlaneGeometry(1.35,2.05),ink,.08,0,.155);
   for(let y=-1.08;y<=1.09;y+=.19){const ring=add(new T.TorusGeometry(.105,.018,10,32),trim,-.9,y,0);ring.rotation.y=Math.PI/2;}
 }else if(id==='almofada'){
   const grid=surface(2.30,2.10,96,(x,y)=>cushionDepth(x,y));add(grid,body);
   const back=grid.clone();const p=back.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,-p.getZ(i));back.setIndex([...back.index.array].reduce((a,_,i,all)=>{if(i%3===0)a.push(all[i],all[i+2],all[i+1]);return a;},[]));back.computeVertexNormals();add(back,body);
   const pts=[];for(let i=0;i<160;i++){const a=i/160*Math.PI*2;pts.push(new T.Vector3(1.15*Math.sign(Math.cos(a))*Math.sqrt(Math.abs(Math.cos(a))),1.05*Math.sign(Math.sin(a))*Math.sqrt(Math.abs(Math.sin(a))),0));}curve(pts,.025,trim,true);
   add(surface(1.65,1.5,64,(x,y)=>cushionDepth(x,y)+.006),ink);
 }else if(id==='camiseta'){
   const shape=new T.Shape();const outline=[[-.78,-1.4],[.78,-1.4],[.85,.12],[1.17,-.07],[1.52,.62],[.82,1.39],[.42,1.53],[-.42,1.53],[-.82,1.39],[-1.52,.62],[-1.17,-.07],[-.85,.12]];
   outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const hole=new T.Path();hole.absellipse(0,1.27,.35,.205,0,Math.PI*2,true);shape.holes.push(hole);
   const geo=refine(new T.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:4,curveSegments:64}));const p=geo.attributes.position,normals=geo.attributes.normal;
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const sign=z>=.04?1:-1;p.setZ(i,sign*shirtDepth(x,y));if(Math.abs(normals.getZ(i))>.65){const dx=(shirtDepth(x+.001,y)-shirtDepth(x-.001,y))/.002,dy=(shirtDepth(x,y+.001)-shirtDepth(x,y-.001))/.002,normal=new T.Vector3(-dx,-dy,sign).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);}}add(geo,body);
   const collar=[];for(let i=0;i<96;i++){const a=i/96*Math.PI*2,x=.368*Math.cos(a),y=1.27+.22*Math.sin(a);collar.push(new T.Vector3(x,y,shirtDepth(x,y)+.008));}curve(collar,.017,body,true);
   const stitch=new T.MeshStandardMaterial({color:0xbbb8b4,roughness:1});
   const hem=[];for(let i=0;i<=60;i++){const x=-.75+i*.025;hem.push(new T.Vector3(x,-1.34,shirtDepth(x,-1.34)+.003));}curve(hem,.0025,stitch);
   for(const side of [-1,1]){const seam=[];for(let i=0;i<=30;i++){const t=i/30,x=side*(1.16+t*.32),y=-.035+t*.64;seam.push(new T.Vector3(x,y,shirtDepth(x,y)+.004));}curve(seam,.0025,stitch);}
   add(surface(1.14,1.48,72,(x,y)=>shirtDepth(x,y)+.005),ink,0,-.08);
   // Move patch sampling into the same coordinates as the garment.
   const print=group.children[group.children.length-1],positions=print.geometry.attributes.position;for(let i=0;i<positions.count;i++)positions.setZ(i,shirtDepth(positions.getX(i),positions.getY(i)-.08)+.005);print.geometry.computeVertexNormals();
 }else throw new Error('Produto sem modelo 3D');
 group.userData.illustrative=true;group.userData.materials=fabric?'malha':'acabamento';
 return {group,body,trim,ink};
}
