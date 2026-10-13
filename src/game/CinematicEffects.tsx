import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/examples/jsm/postprocessing/SSAOPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {Vector2} from 'three';
/** High preset only: local contact shading and restrained emissive bloom. */
export function CinematicEffects({quality,enabled=false}:{quality:string;enabled?:boolean}){
 const {gl,scene,camera,size,viewport}=useThree();
 const effects=useRef<{composer:EffectComposer;ao:SSAOPass}|null>(null);
 useEffect(()=>{if(quality!=='high'||!enabled)return;const composer=new EffectComposer(gl),render=new RenderPass(scene,camera),ao=new SSAOPass(scene,camera,Math.ceil(size.width*.6),Math.ceil(size.height*.6),12),bloom=new UnrealBloomPass(new Vector2(size.width,size.height),.15,.45,1.35),output=new OutputPass();ao.kernelRadius=.8;ao.minDistance=.001;ao.maxDistance=.065;composer.addPass(render);composer.addPass(ao);composer.addPass(bloom);composer.addPass(output);effects.current={composer,ao};return()=>{effects.current=null;ao.dispose();bloom.dispose();output.dispose();composer.dispose();};},[gl,scene,camera,quality,enabled]);
 useEffect(()=>{const fx=effects.current;if(fx){fx.composer.setPixelRatio(viewport.dpr);fx.composer.setSize(size.width,size.height);fx.ao.setSize(Math.ceil(size.width*.6),Math.ceil(size.height*.6));}},[size,quality,enabled,viewport.dpr]);
 useFrame((_,dt)=>{if(effects.current)effects.current.composer.render(dt);else gl.render(scene,camera);},1);
 return null;
}
