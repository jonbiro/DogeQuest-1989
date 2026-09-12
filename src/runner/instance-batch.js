import {InstancedMesh,DynamicDrawUsage} from 'three';

// One reusable upload for identical opaque meshes. Growth never drops a pickup
// or disposes the shared geometry/material; retired instance buffers are released.
export function createInstanceBatch(scene,geometry,material,capacity=64) {
  let mesh, count=0;
  function allocate(size) {
    const next=new InstancedMesh(geometry,material,size);
    next.instanceMatrix.setUsage(DynamicDrawUsage);
    next.frustumCulled=false; // Instances bend with the trail each frame.
    next.count=0;next.visible=false;
    if(mesh) {
      next.instanceMatrix.array.set(mesh.instanceMatrix.array.subarray(0,count*16));
      scene.remove(mesh);mesh.dispose();
    }
    mesh=next;capacity=size;scene.add(mesh);
  }
  allocate(capacity);
  return {
    begin(){count=0;},
    add(matrix){
      if(count===capacity)allocate(capacity*2);
      mesh.setMatrixAt(count++,matrix);
    },
    end(){mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;},
    get count(){return count;},
    get capacity(){return capacity;},
  };
}
