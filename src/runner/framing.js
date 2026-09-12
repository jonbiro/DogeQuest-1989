import {Vector3} from 'three';

// Tall phones must retain enough horizontal view to read the opposite lane.
// Preserve the established 52-degree view everywhere it is already wide enough.
export function gameplayFov(aspect) {
  if (!Number.isFinite(aspect) || aspect<=0) return 52;
  return Math.max(52,2*Math.atan(Math.tan(Math.PI/12)/Math.max(.35,aspect))*180/Math.PI);
}

// A conservative puppy/outfit envelope, not a collision box. Translate only
// along the camera's right vector, preserving pitch, yaw and the normal follow.
// Reused vectors avoid mesh traversal or new geometry in the animation loop.
export function createPuppyFramer(limit=.84) {
  const point=new Vector3(),points=Array.from({length:8},()=>new Vector3());
  const result={minX:0,maxX:0,shift:0};
  return (camera,center)=>{
    camera.updateMatrixWorld(true);
    const scale=camera.projectionMatrix.elements[0];
    let lower=-Infinity,upper=Infinity,index=0;
    for(const x of [-1.2,1.2])for(const y of [0,2.7])for(const z of [-1.2,1.2]){
      const p=points[index++].set(center.x+x,center.y+y,center.z+z).applyMatrix4(camera.matrixWorldInverse);
      const depth=-p.z;
      lower=Math.max(lower,p.x-limit*depth/scale);
      upper=Math.min(upper,p.x+limit*depth/scale);
    }
    const shift=lower>upper?(lower+upper)/2:Math.max(lower,Math.min(upper,0));
    if(shift)camera.translateX(shift);
    camera.updateMatrixWorld(true);
    result.minX=Infinity;result.maxX=-Infinity;result.shift=shift;
    for(const p of points){
      // A local-right translation changes view x only; depth is preserved.
      point.copy(p);point.x-=shift;
      const x=point.x*scale/-point.z;
      result.minX=Math.min(result.minX,x);result.maxX=Math.max(result.maxX,x);
    }
    return result;
  };
}
