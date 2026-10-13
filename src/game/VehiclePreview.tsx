import {useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {PMREMGenerator} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {VehicleModel} from './VehicleModels';
import {VEHICLE_BY_ID} from '../../shared/vehicleCatalog.mjs';
import {vehicleState} from '../../shared/vehicles.mjs';
import {freshLiving,environmentAt} from '../../shared/livingCity.mjs';
import type {LivingRuntime} from './LivingCity';
function Showroom({model,color,rim}:{model:string;color:string;rim:string}){
 const {gl,scene,camera,invalidate}=useThree(),v=VEHICLE_BY_ID[model],scale=4.4/Math.max(3.2,v.length);
 const motion=useMemo(()=>vehicleState(model),[model]),runtime=useRef<LivingRuntime>({record:freshLiving(),env:{...environmentAt(120),night:0},activity:{moving:false,running:false,resting:false,driving:false},consuming:null});
 const orbit=useRef<OrbitControls|null>(null);
 useEffect(()=>{const redraw=()=>invalidate();const controls=new OrbitControls(camera,gl.domElement),room=new RoomEnvironment(),pmrem=new PMREMGenerator(gl),map=pmrem.fromScene(room,.04,.1,100,{size:64});orbit.current=controls;scene.environment=map.texture;scene.environmentIntensity=.65;controls.target.set(0,.65,0);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.autoRotate=false;controls.autoRotateSpeed=.6;controls.minPolarAngle=.45;controls.maxPolarAngle=1.45;controls.addEventListener('change',redraw);controls.update();invalidate();return()=>{orbit.current=null;scene.environment=null;map.dispose();pmrem.dispose();room.dispose();controls.removeEventListener('change',redraw);controls.dispose();};},[gl,scene,camera,invalidate]);
 useFrame((_,dt)=>{const controls=orbit.current;if(controls){controls.dampingFactor=1-Math.exp(-14*Math.min(dt,.1));controls.update(dt);}});
 return <><group scale={scale}><VehicleModel key={model+color+rim} model={model} color={color} rim={rim} motion={()=>motion} environment={runtime}/></group><mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.012,0]}><circleGeometry args={[5,64]}/><meshStandardMaterial color="#b0b4b2" roughness={.8}/></mesh><ambientLight intensity={.35}/><directionalLight castShadow position={[3,7,4]} intensity={2.1} shadow-mapSize={[512,512]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-normalBias={.02}/></>;
}
export function VehiclePreview({model,color,rim}:{model:string;color:string;rim:string}){const v=VEHICLE_BY_ID[model];return <section className="vehicle-preview" aria-label={`${v.name} 3D preview`}><Canvas frameloop="demand" shadows dpr={[1,1.2]} camera={{position:[5,2.6,5],fov:38}} gl={{antialias:true,toneMappingExposure:.9}}><color attach="background" args={['#b0b4b2']}/><Showroom model={model} color={color} rim={rim}/></Canvas><div><b>{v.name}</b><span>Drag to inspect · Actual driveable model</span></div></section>;}
