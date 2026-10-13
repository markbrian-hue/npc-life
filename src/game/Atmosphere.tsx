import {useEffect,useMemo,useRef,type MutableRefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Sky} from 'three/examples/jsm/objects/Sky.js';
import {Scene,PMREMGenerator,Mesh,BoxGeometry,MeshBasicMaterial,MathUtils,type WebGLRenderTarget} from 'three';
import type {LivingRuntime} from './LivingCity';
const CLOUD:Record<string,number>={sunny:.22,cloudy:.7,'light-rain':.78,'heavy-rain':.94,thunderstorm:1,fog:.65};
const noise=`
uniform float cloudCoverage;uniform float cloudTime;uniform float nightAmount;uniform float rainfall;
float hashCloud(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float cloudNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hashCloud(i),hashCloud(i+vec2(1,0)),f.x),mix(hashCloud(i+vec2(0,1)),hashCloud(i+vec2(1,1)),f.x),f.y);}
float cloudFbm(vec2 p){float v=0.0,a=.5;for(int i=0;i<5;i++){v+=a*cloudNoise(p);p=mat2(1.6,-1.2,1.2,1.6)*p+7.3;a*=.5;}return v;}
`;
const composite=`
retColor*=mix(vec3(1.0),vec3(.57,.76,1.02),smoothstep(.02,.5,direction.y)*.8);
vec2 cloudUv=direction.xz/max(.075,direction.y)*1.65+vec2(cloudTime*.0018,cloudTime*.0007);
float density=cloudFbm(cloudUv),mask=smoothstep(.62-cloudCoverage*.24,.79-cloudCoverage*.28,density)*smoothstep(.005,.15,direction.y);
float shade=cloudFbm(cloudUv+vSunDirection.xz*.35);
vec3 cloudColor=mix(vec3(.38,.46,.53),vec3(1.65,1.65,1.53),smoothstep(.34,.7,shade));
cloudColor=mix(cloudColor,vec3(.27,.34,.41),rainfall*.67);
retColor=mix(retColor,vec3(.42,.53,.63),rainfall*.55);
retColor=mix(retColor,cloudColor,mask*.94);
vec3 nightSky=mix(vec3(.007,.015,.033),vec3(.034,.06,.09),pow(1.0-max(0.0,direction.y),3.0));
retColor=mix(retColor,nightSky+cloudColor*mask*.016,nightAmount);
float star=step(.9987,hashCloud(floor(direction.xz/max(.1,direction.y)*900.0)))*smoothstep(.1,.4,direction.y)*(1.0-mask)*nightAmount;
retColor+=vec3(.35,.42,.5)*star;
gl_FragColor=vec4(retColor,1.0);`;
/** Analytic atmospheric scattering, moving cloud layers and an amortized reflection probe. */
export function Atmosphere({runtime,quality}:{runtime:MutableRefObject<LivingRuntime>;quality:string}){
 const {gl,scene,camera}=useThree(),lastProbe=useRef(-100),probeKey=useRef('');
 const resources=useMemo(()=>{
  const sky=new Sky();sky.scale.setScalar(4000);sky.frustumCulled=false;sky.renderOrder=-100;
  sky.material.uniforms.cloudCoverage={value:.3};sky.material.uniforms.cloudTime={value:0};sky.material.uniforms.nightAmount={value:0};sky.material.uniforms.rainfall={value:0};
  sky.material.fragmentShader=sky.material.fragmentShader.replace('void main() {',noise+'\nvoid main() {').replace('gl_FragColor = vec4( retColor, 1.0 );',composite);
  const mirror=new Scene(),probeSky=sky.clone();mirror.add(probeSky);
  // A simple original horizon gives glass and paint readable vertical reflections.
  const blocks:Mesh[]=[];for(let i=0;i<14;i++){const a=i/14*Math.PI*2,b=new Mesh(new BoxGeometry(5+i%3*2,8+i%4*4,6),new MeshBasicMaterial({color:i%2?'#687378':'#b7b7ad'}));b.position.set(Math.cos(a)*24,0,Math.sin(a)*24);b.lookAt(0,0,0);mirror.add(b);blocks.push(b);}
  const pmrem=new PMREMGenerator(gl);return {sky,mirror,pmrem,blocks,probe:null as WebGLRenderTarget|null};
 },[gl]);
 useEffect(()=>{const previous=scene.environment;return()=>{scene.environment=previous;resources.probe?.dispose();resources.pmrem.dispose();resources.sky.geometry.dispose();resources.sky.material.dispose();resources.blocks.forEach(b=>{b.geometry.dispose();(b.material as MeshBasicMaterial).dispose();});};},[scene,resources]);
 useFrame(()=>{
  const e=runtime.current.env,u=resources.sky.material.uniforms,angle=(e.minute-360)/1440*Math.PI*2;
  resources.sky.position.copy(camera.position);u.sunPosition.value.set(Math.cos(angle)*40,Math.sin(angle)*50,18);
  u.turbidity.value=2.3+e.rain*5;u.rayleigh.value=1.6;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.82;
  u.cloudCoverage.value=CLOUD[e.previous]+(CLOUD[e.kind]-CLOUD[e.previous])*e.mix;u.cloudTime.value=e.seconds;u.rainfall.value=e.rain;u.nightAmount.value=1-MathUtils.smoothstep(e.daylight,0,.18);
  scene.environmentIntensity=.45*(1-u.nightAmount.value*.65);
  const key=`${Math.floor(e.minute/90)}:${e.kind}:${quality}`;
  if(!resources.probe||(key!==probeKey.current&&e.seconds-lastProbe.current>20)){
   const next=resources.pmrem.fromScene(resources.mirror,.04,.1,500,{size:quality==='high'?128:64});scene.environment=next.texture;resources.probe?.dispose();resources.probe=next;lastProbe.current=e.seconds;probeKey.current=key;
  }
 });
 return <primitive object={resources.sky}/>;
}
