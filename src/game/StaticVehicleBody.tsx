import {useLayoutEffect,type ReactNode,type RefObject} from 'react';
import {Matrix4,Mesh,type Group,type MeshStandardMaterial} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Merge static bodywork by material; animated emissive lamps remain independent. */
export function StaticVehicleBody({target,children}:{target:RefObject<Group|null>;children:ReactNode}){
 useLayoutEffect(()=>{const root=target.current;if(!root)return;root.updateWorldMatrix(true,true);const inverse=new Matrix4().copy(root.matrixWorld).invert(),groups=new Map<string,{material:MeshStandardMaterial;meshes:Mesh[]}>();
  root.traverse(o=>{const mesh=o as Mesh,mat=mesh.material as MeshStandardMaterial;if(!mesh.isMesh||!mat?.isMeshStandardMaterial||mat.emissive.getHex()!==0||mat.transparent)return;
   const physical=mat as MeshStandardMaterial&{clearcoat?:number;clearcoatRoughness?:number};const key=[mat.type,mat.color.getHex(),mat.roughness,mat.metalness,mat.envMapIntensity,physical.clearcoat,physical.clearcoatRoughness,mat.map?.uuid].join(':');const group=groups.get(key)||{material:mat,meshes:[]};group.meshes.push(mesh);groups.set(key,group);
  });
  const merged:Mesh[]=[];
  for(const group of groups.values()){
   if(group.meshes.length<2)continue;
   const parts=group.meshes.map(mesh=>{const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));g.deleteAttribute('uv');return g;});
   const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!geometry)continue;
   const batch=new Mesh(geometry,group.material);batch.name='batched-bodywork';batch.castShadow=true;batch.receiveShadow=true;root.add(batch);merged.push(batch);group.meshes.forEach(m=>m.visible=false);
  }
  return()=>{merged.forEach(m=>{root.remove(m);m.geometry.dispose();});groups.forEach(g=>g.meshes.forEach(m=>m.visible=true));};
 },[target]);
 return <group name="sprung-body" ref={target}>{children}</group>;
}
