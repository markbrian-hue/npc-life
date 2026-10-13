/** Hysteresis prevents resolution oscillation. Simulation speed is never changed. */
export const resolutionCap=quality=>quality==='high'?1.5:quality==='low'?1:1.25;
export function budgetState(ratio){return {ratio,total:0,frames:0,stable:0};}
export function sampleBudget(state,dt,cap){
 if(!Number.isFinite(dt)||dt<=0||dt>1)return state; // Ignore tab wakes and long blocking loads.
 const total=state.total+dt,frames=state.frames+1;if(total<2)return {...state,total,frames};
 const fps=frames/total,stable=fps>57?state.stable+total:0;
 let ratio=state.ratio;
 if(fps<46)ratio=Math.max(Math.min(.65,cap),Math.round((ratio-.1)*100)/100);
 else if(stable>8)ratio=Math.min(cap,Math.round((ratio+.05)*100)/100);
 return {ratio,total:0,frames:0,stable:ratio!==state.ratio?0:stable};
}
