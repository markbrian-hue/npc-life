// Isolated browser fixture using the production model, road mesh and solver.
import React,{useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {VehicleModel} from '../src/game/VehicleModels';
import {SpeedTables} from '../src/game/StreetDetail';
import {vehicleState,stepVehicle} from '../shared/vehicles.mjs';
import {groundHeight} from '../shared/playerPhysics.mjs';
function Ride({model}:{model:string}){
 const car=useRef({...vehicleState(model),id:'fixture',x:-64,z:0,heading:0,driver:'local'}),group=useRef<any>(null);
 const environment=useRef<any>({env:{night:0}}),{scene,camera}=useThree();
 useFrame((_,dt)=>{const c=car.current;stepVehicle(c,{throttle:1,steer:0,brake:false},dt,[c]);group.current.position.set(c.x,groundHeight(c.x,c.z),c.z);camera.position.set(c.x+6,3.4,6);camera.lookAt(c.x,.8,0);Object.assign(window,{__ride:{car:c,scene}});},-2);
 return <group ref={group} name="fixture-car"><VehicleModel model={model} color="#417987" motion={()=>car.current} environment={environment}/></group>;
}
function App(){const [model,setModel]=useState('sedan');return <><div style={{position:'absolute',zIndex:2,padding:12,background:'#eee'}}>Production suspension QA <button onClick={()=>setModel('scooter')}>Scooter</button><button onClick={()=>setModel('bus')}>Bus</button></div><Canvas camera={{fov:45}} shadows><color attach="background" args={['#b8d2d9']}/><ambientLight intensity={1.5}/><directionalLight position={[-50,12,9]} intensity={2} castShadow/><mesh rotation={[-Math.PI/2,0,0]} position={[-58,-.01,0]} receiveShadow><planeGeometry args={[180,40]}/><meshStandardMaterial color="#798078"/></mesh><SpeedTables/><Ride key={model} model={model}/></Canvas></>;}
createRoot(document.getElementById('root')!).render(<App/>);
