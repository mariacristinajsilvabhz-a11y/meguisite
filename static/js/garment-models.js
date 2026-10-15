import * as T from 'three';

// Closed-volume cloth surfaces with open neck, sleeves and hem.
// These are illustrative model patterns, independent of photography.
export function createGarment(kind) {
  const group = new T.Group();
  const hoodie = kind === 'moletom', polo = kind === 'polo';
  const fabric = new T.MeshPhysicalMaterial({color:hoodie?0x746185:polo?0x303039:0xb99dcc,roughness:.94,metalness:0,sheen:.65,sheenColor:0xded0ed,sheenRoughness:.9,side:T.DoubleSide});
  const rib = fabric.clone(); rib.color.multiplyScalar(.87);
  const thread = fabric.clone(); thread.color.multiplyScalar(.8);
  const size=128,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const n=128+24*Math.sin(x*Math.PI)*Math.cos(y*Math.PI/2)+12*Math.sin(x*2.7+y*3.1);
    const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=n;data[i+3]=255;
  }
  const weave=new T.DataTexture(data,size,size);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(9,9);weave.needsUpdate=true;
  for(const m of [fabric,rib,thread]){m.bumpMap=weave;m.bumpScale=.004;}
  const add=(geometry,material=fabric)=>{const mesh=new T.Mesh(geometry,material);group.add(mesh);return mesh;};
  function surface(rows,cols,point,material=fabric){
    const vertices=[],uv=[],indices=[];
    for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){vertices.push(...point(r/rows,c/cols));uv.push(c/cols,r/rows);}
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;indices.push(a,a+1,b,a+1,b+1,b);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return add(g,material);
  }
  const profile=[[-1.3,.76,.28],[-1.19,.77,.29],[-.5,.73,.3],[.15,.78,.33],[.72,.84,.32],[.95,.76,.28],[1.17,.44,.22],[1.26,.31,.185]];
  function sample(v){const p=v*(profile.length-1),i=Math.min(profile.length-2,Math.floor(p)),t=p-i,a=profile[i],b=profile[i+1];return a.map((n,k)=>T.MathUtils.lerp(n,b[k],t));}
  function torso(v,u){const [y,w,d]=sample(v),a=u*Math.PI*2;const fold=Math.sin(a*7+y*2)*.012*Math.sin(v*Math.PI)+Math.sin(a*13-y*3)*.006;const neckDip=Math.pow(v,12)*Math.max(0,Math.sin(a))*.18;return [(w+fold)*Math.cos(a),y-neckDip,(d+fold)*Math.sin(a)];}
  surface(90,96,torso);
  const seam=(points,r=.003,material=thread)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(32,points.length*2),r,5,false),material);
  const ring=(fn,r=.006,material=rib)=>{const pts=Array.from({length:97},(_,i)=>new T.Vector3(...fn(i/96)));return seam(pts,r,material);};
  ring(u=>torso(.018,u),.004);ring(u=>torso(.034,u),.003);
  // Ribbed neck follows the actual opening; it is hollow from all angles.
  surface(8,96,(v,u)=>{const a=u*Math.PI*2,r=.312+.014*Math.sin(v*Math.PI);return [r*Math.cos(a),1.247-Math.max(0,Math.sin(a))*.18+v*(polo?.13:.067),(.185+.007*Math.sin(v*Math.PI))*Math.sin(a)];},rib);
  ring(u=>{const a=u*Math.PI*2;return [.313*Math.cos(a),1.25-Math.max(0,Math.sin(a))*.18,.185*Math.sin(a)];},.005);
  for(const side of [-1,1]){
    const start=new T.Vector3(side*.55,.69,0),end=new T.Vector3(side*(hoodie?1.18:1.28),hoodie?-1.02:.24,0);
    const axis=end.clone().sub(start).normalize(),across=new T.Vector3(-axis.y,axis.x,0).normalize();
    const sleeve=(v,u)=>{const a=u*Math.PI*2,center=start.clone().lerp(end,v);const radius=T.MathUtils.lerp(.33,hoodie?.15:.245,v),wave=.008*Math.sin(v*26+a*3)*Math.sin(v*Math.PI);center.addScaledVector(across,(radius+wave)*Math.cos(a));center.z=(radius*.87+wave)*Math.sin(a);return center.toArray();};
    surface(60,64,sleeve);
    if(hoodie||polo)surface(10,64,(v,u)=>{const p=sleeve(.91+v*.09,u);p[2]*=1.012;return p;},rib);
    ring(u=>sleeve(.97,u),.004);ring(u=>sleeve(.94,u),.0025);
    const points=Array.from({length:40},(_,i)=>new T.Vector3(...torso(.06+i/39*.65,side===1?0:.5)));
    seam(points,.0025);
  }
  if(polo){
    // Soft folded collar and a short button placket.
    for(const side of [-1,1]){
      const shape=new T.Shape();shape.moveTo(side*.025,1.27);shape.lineTo(side*.29,1.31);shape.quadraticCurveTo(side*.48,1.18,side*.3,.94);shape.lineTo(side*.055,1.12);shape.closePath();
      const collar=add(new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:3,steps:1}),rib);collar.position.z=.205;
    }
    const placket=add(new T.BoxGeometry(.105,.42,.018),rib);placket.position.set(0,.93,.325);
    const button=new T.MeshStandardMaterial({color:0xbbb5c1,roughness:.6});
    for(const y of [.79,.95,1.10]){const m=add(new T.SphereGeometry(.021,14,8),button);m.scale.z=.3;m.position.set(0,y,.342);}
  }
  if(hoodie){
    // Hood shell open towards the face, rather than a solid sphere.
    const hoodPoint=(v,u)=>{const a=Math.PI+u*Math.PI,p=v*Math.PI*.52;return [.43*Math.sin(p)*Math.cos(a),1.22+.65*Math.cos(p),.03+.44*Math.sin(p)*Math.sin(a)];};
    const hoodOuter=fabric.clone();hoodOuter.side=T.FrontSide;
    const hoodInner=fabric.clone();hoodInner.side=T.BackSide;hoodInner.color.multiplyScalar(.55);
    const hood=surface(36,64,hoodPoint,hoodOuter);add(hood.geometry.clone(),hoodInner);
    const rimPoints=[];for(let i=32;i>=0;i--)rimPoints.push(new T.Vector3(...hoodPoint(i/32,0)));for(let i=1;i<=32;i++)rimPoints.push(new T.Vector3(...hoodPoint(i/32,1)));seam(rimPoints,.013,rib);
    for(const x of [-.16,.16])seam([new T.Vector3(x,1.28,.23),new T.Vector3(x*1.12,1.03,.34),new T.Vector3(x*.9,.72,.35)],.012,rib);
    const pocket=new T.Shape();pocket.moveTo(-.46,-1.08);pocket.lineTo(.46,-1.08);pocket.lineTo(.46,-.67);pocket.quadraticCurveTo(.21,-.58,.24,-.37);pocket.lineTo(-.24,-.37);pocket.quadraticCurveTo(-.21,-.58,-.46,-.67);pocket.closePath();const m=add(new T.ExtrudeGeometry(pocket,{depth:.015,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2}),fabric);m.position.z=.303;
    surface(12,96,(v,u)=>{const p=torso(v*.07,u);p[0]*=1.002;p[2]*=1.015;return p;},rib);
  }
  // Small monochrome chest signature, with a transparent texture.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=polo?'#e5d5ed':'#45364f';ctx.font='600 66px sans-serif';ctx.textAlign='center';ctx.fillText('MEGUI',256,132);ctx.font='22px sans-serif';ctx.fillText('PERSONALIZADOS',256,174);
  const signature=new T.CanvasTexture(canvas);signature.colorSpace=T.SRGBColorSpace;
  const logo=add(new T.PlaneGeometry(.29,.145),new T.MeshStandardMaterial({map:signature,transparent:true,depthWrite:false,roughness:1,side:T.FrontSide}));logo.position.set(.36,.57,.328);logo.rotation.y=.13;
  group.rotation.y=-.25;
  group.userData.kind=kind;
  return group;
}
