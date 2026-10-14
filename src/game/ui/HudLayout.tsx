import {createContext,useCallback,useContext,useMemo,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** Screen regions of the in-game HUD. Widgets stack inside a region instead of
 * using hand-tuned pixel offsets, so two widgets can never be placed on top of
 * each other. The region grid lives in hud-layout.css. */
export type HudRegion='top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right';
export const HUD_REGIONS:HudRegion[]=['top-left','top-center','top-right','bottom-left','bottom-center','bottom-right'];
type Regions=Partial<Record<HudRegion,HTMLElement>>;
type Hud={regions:Regions;attach:(name:HudRegion)=>(element:HTMLDivElement|null)=>void};
const HudContext=createContext<Hud|null>(null);

/** Holds the region elements. Wrap every component that renders HUD widgets. */
export function HudProvider({children}:{children:ReactNode}){
 const [regions,setRegions]=useState<Regions>({});
 const attach=useCallback((name:HudRegion)=>(element:HTMLDivElement|null)=>{
  if(element)setRegions(old=>old[name]===element?old:{...old,[name]:element});
 },[]);
 const value=useMemo(()=>({regions,attach}),[regions,attach]);
 return <HudContext.Provider value={value}>{children}</HudContext.Provider>;
}

/** The region grid. Render once inside the game shell, beneath dialogs. */
export function HudRegions(){
 const hud=useContext(HudContext);
 if(!hud)return null;
 return <div className="hud-layout">
  {HUD_REGIONS.map(name=><div key={name} className={`hud-region hud-${name}`} data-hud-region={name} ref={hud.attach(name)}/>)}
 </div>;
}

/** Renders a HUD widget into a screen region. `order` sorts widgets within the region:
 * lower values sit closer to the screen edge the region is anchored to. Outside a
 * HudProvider the widget renders in place, so components stay usable in tests. */
export function HudSlot({region,order=0,children}:{region:HudRegion;order?:number;children:ReactNode}){
 const hud=useContext(HudContext);
 if(!hud)return <>{children}</>;
 const target=hud.regions[region];
 if(!target)return null;
 return createPortal(<div className="hud-slot" style={{order}}>{children}</div>,target);
}
