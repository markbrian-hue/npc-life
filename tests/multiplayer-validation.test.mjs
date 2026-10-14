// QA audit M2 (docs/qa-audit-2026-10.md): room movement must be plausible.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer,acceptMove,MAX_FOOT_SPEED,FAST_TRAVEL_POINTS} from '../server/multiplayer.mjs';

test('first report after joining is trusted; then speed is limited',()=>{
 const p={x:6,z:16,placed:false,lastAccepted:0,pending:null};
 assert.equal(acceptMove(p,{x:-150,z:-300},0),true,'join from anywhere');
 Object.assign(p,{x:0,z:0,placed:true,lastAccepted:0});
 assert.equal(acceptMove(p,{x:MAX_FOOT_SPEED*.5,z:0},500),true,'sprint pace');
 assert.equal(acceptMove(p,{x:60,z:0},500),false,'60 m in half a second');
});

test('fast travel to spawn, the bus and explorer sites is allowed',()=>{
 for(const point of FAST_TRAVEL_POINTS){
  const p={x:400,z:-400,placed:true,lastAccepted:0,pending:null};
  assert.equal(acceptMove(p,{x:point.x+1,z:point.z},100),true,JSON.stringify(point));
 }
});

test('a client that keeps reporting the same rejected spot is resynced after 1.5 s',()=>{
 const p={x:0,z:0,placed:true,lastAccepted:0,pending:null};
 assert.equal(acceptMove(p,{x:200,z:-200},100),false);
 assert.equal(acceptMove(p,{x:200.2,z:-200},900),false);
 assert.equal(acceptMove(p,{x:200.1,z:-200},1700),true);
 assert.equal(acceptMove({...p,pending:null},{x:-200,z:-200},100),false,'a new jump restarts the wait');
});

test('server rejects a teleporting resident over HTTP and keeps the last valid position',async()=>{
 let time=Date.now();
 const server=createGameServer({now:()=>time});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data,token)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});return {status:r.status,...await r.json()};};
 try{
  const host=await post('/api/join',{name:'Host'});
  time+=100;assert.equal((await post('/api/move',{x:18,y:0,z:4,heading:0},host.token)).status,200);
  time+=100;assert.equal((await post('/api/move',{x:-150,y:0,z:-300,heading:0},host.token)).status,409);
  const view=await post('/api/join',{name:'Viewer',code:host.code});
  const me=view.players.find(p=>p.id===host.id);
  assert.equal(me.x,18);assert.equal(me.z,4);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
