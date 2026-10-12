import { blocked } from '../shared/world.mjs';
import { createFleet, pedestrianBlocked } from '../shared/vehicles.mjs';
const fleet = createFleet();
// Test driver follows actual collision geometry instead of crossing the fountain.
export function walkingRoute(start, target) {
  const origin=[Math.round(start.x),Math.round(start.z)], goal=[Math.round(target.x),Math.round(target.z)];
  const key=p=>p.join(','), parents=new Map([[key(origin),null]]), queue=[origin];
  for(let i=0;i<queue.length&&!parents.has(key(goal));i++) {
    const p=queue[i];
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const next=[p[0]+dx,p[1]+dz], k=key(next);
      if(!parents.has(k)&&!blocked(...next,.65)&&!pedestrianBlocked(...next,fleet)) {parents.set(k,p);queue.push(next);}
    }
  }
  if(!parents.has(key(goal)))throw new Error(`No walkable test route to ${key(goal)}`);
  const path=[];for(let p=goal;p;p=parents.get(key(p)))path.push(p);path.reverse();
  // Keep corners and short intermediate waypoints to limit camera-relative drift.
  return path.filter((p,i)=>i===path.length-1||i%3===0||(i>0&&i<path.length-1&&(path[i-1][0]!==path[i+1][0]&&path[i-1][1]!==path[i+1][1])));
}
