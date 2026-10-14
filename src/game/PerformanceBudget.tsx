import {useEffect,useRef,useState} from 'react';
import {HudSlot} from './ui/HudLayout';
import {useFrame,useThree} from '@react-three/fiber';
import {budgetState,resolutionCap,sampleBudget} from '../../shared/renderBudget.mjs';
export function PerformanceBudget({quality,automatic}:{quality:string;automatic:boolean}){
 const {gl,setDpr,setFrameloop}=useThree(),budget=useRef(budgetState(1)),sample=useRef({time:0,frames:0,shadow:1});
 useEffect(()=>{const ratio=Math.min(window.devicePixelRatio||1,resolutionCap(quality));budget.current=budgetState(ratio);setDpr(ratio);},[quality,automatic,setDpr]);
 useEffect(()=>{const prior=gl.shadowMap.autoUpdate;gl.shadowMap.autoUpdate=false;const visibility=()=>setFrameloop(document.hidden?'never':'always');document.addEventListener('visibilitychange',visibility);return()=>{document.removeEventListener('visibilitychange',visibility);gl.shadowMap.autoUpdate=prior;};},[gl,setFrameloop]);
 useFrame((_,dt)=>{sample.current.shadow+=Math.min(dt,.1);if(sample.current.shadow>1/(quality==='high'?30:20)){gl.shadowMap.needsUpdate=true;sample.current.shadow=0;}},-2);
 useFrame((_,dt)=>{
  if(document.hidden)return;
  const s=sample.current;if(dt<=1){s.time+=dt;s.frames++;}
  if(automatic){const next=sampleBudget(budget.current,dt,Math.min(window.devicePixelRatio||1,resolutionCap(quality)));if(next.ratio!==budget.current.ratio)setDpr(next.ratio);budget.current=next;}
  if(s.time>=1){window.dispatchEvent(new CustomEvent('npc-life:performance',{detail:{fps:Math.round(s.frames/s.time),scale:Math.round(gl.getPixelRatio()*100)}}));s.time=0;s.frames=0;}
 },2);
 return null;
}
export function PerformanceHUD({visible}:{visible:boolean}){
 const [stats,setStats]=useState({fps:0,scale:100});useEffect(()=>{if(!visible)return;const update=(e:Event)=>setStats((e as CustomEvent).detail);window.addEventListener('npc-life:performance',update);return()=>window.removeEventListener('npc-life:performance',update);},[visible]);
 return visible?<HudSlot region="bottom-left" order={1}><output className="performance-hud" aria-label="Rendering performance">{stats.fps||'—'} FPS <span>· {stats.scale}% render scale</span></output></HudSlot>:null;
}
