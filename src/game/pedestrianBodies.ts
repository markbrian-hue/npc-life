import {PERSONAL_SPACE} from '../../shared/avatarDimensions.mjs';
// Small resident set; spatial rejection avoids evaluating distant bodies.
export const pedestrianBodies=new Map<string,{x:number;z:number}>();
export function residentBlocked(x:number,z:number,fromX:number,fromZ:number,exclude=''){
 for(const [id,p]of pedestrianBodies){if(id===exclude||Math.abs(p.x-x)>PERSONAL_SPACE||Math.abs(p.z-z)>PERSONAL_SPACE)continue;const next=Math.hypot(x-p.x,z-p.z),previous=Math.hypot(fromX-p.x,fromZ-p.z);if(next<PERSONAL_SPACE&&next<previous-1e-5)return true;}return false;
}
