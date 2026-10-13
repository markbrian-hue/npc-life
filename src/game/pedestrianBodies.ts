// Small resident set; spatial rejection avoids evaluating distant bodies.
export const pedestrianBodies=new Map<string,{x:number;z:number}>();
export function residentBlocked(x:number,z:number,fromX:number,fromZ:number,exclude=''){
 for(const [id,p]of pedestrianBodies){if(id===exclude||Math.abs(p.x-x)>1||Math.abs(p.z-z)>1)continue;const next=Math.hypot(x-p.x,z-p.z),previous=Math.hypot(fromX-p.x,fromZ-p.z);if(next<.62&&next<previous-1e-5)return true;}return false;
}
