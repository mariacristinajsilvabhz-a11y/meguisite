import * as T from 'three';
export const supported = ['caneca','garrafa','caderno','almofada'];
export function makeProduct(id, texture) {
  const group=new T.Group();
  const body=new T.MeshStandardMaterial({color:0xffffff,roughness:id==='almofada'?.95:.38});
  const trim=new T.MeshStandardMaterial({color:0xc8c4cf,roughness:.45});
  const ink=new T.MeshStandardMaterial({map:texture,transparent:true,roughness:.6,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
  const add=(geometry,material,x=0,y=0,z=0)=>{const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;};
  const lathe=points=>new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),96);
  const patch=(r,h,arc,y)=>add(new T.CylinderGeometry(r,r,h,96,1,true,-arc/2,arc),ink,0,y,0);
  if(id==='caneca') {
    add(lathe([[0,-1],[.78,-1],[.86,-.94],[.86,.94],[.82,1],[.72,1],[.72,-.83],[0,-.83]]),body);
    const handle=add(new T.TorusGeometry(.55,.13,16,64),trim,1.03,0,0);handle.scale.set(.8,1,1);
    patch(.865,1.45,1.45,0);
  } else if(id==='garrafa') {
    add(lathe([[0,-1.4],[.52,-1.4],[.6,-1.32],[.6,.85],[.56,1],[.3,1.18],[.3,1.4],[0,1.4]]),body);
    add(new T.CylinderGeometry(.33,.33,.3,64),trim,0,1.45,0);patch(.605,1.5,1.4,-.2);
  } else if(id==='caderno') {
    add(new T.BoxGeometry(1.8,2.5,.04),body,0,0,.105);add(new T.BoxGeometry(1.8,2.5,.04),body,0,0,-.105);add(new T.BoxGeometry(.08,2.5,.25),body,-.86,0,0);add(new T.BoxGeometry(1.67,2.35,.15),new T.MeshStandardMaterial({color:0xf2efea}),.04,0,0);
    add(new T.PlaneGeometry(1.35,2.05),ink,.08,0,.131);
    for(let y=-1;y<=1;y+=.25){const ring=add(new T.TorusGeometry(.09,.025,8,20),trim,-.91,y,0);ring.rotation.y=Math.PI/2;}
  } else if(id==='almofada') {
    const cushion=add(new T.SphereGeometry(1,64,48),body);cushion.scale.set(1.2,1.1,.4);
    const geometry=new T.PlaneGeometry(1.65,1.5,40,40);const pos=geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,.4*Math.sqrt(Math.max(0,1-(x/1.2)**2-(y/1.1)**2))+.009);}
    geometry.computeVertexNormals();add(geometry,ink);
    const seam=add(new T.TorusGeometry(1,.012,8,96),trim);seam.scale.set(1.2,1.1,1);
  } else throw new Error('Produto sem modelo 3D');
  return {group,body,trim,ink};
}
