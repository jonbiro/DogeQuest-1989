// Unsupported/failed preparation never prevents play. Each renderer owns one
// attempt; startup can wait briefly without trusting a driver to finish forever.
export async function prepareFirstFrame(prepare, timeout = 2000) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(prepare).catch(()=>false),
      new Promise(resolve=>{timer=setTimeout(()=>resolve(false),timeout);}),
    ]);
  } finally { clearTimeout(timer); }
}

export function createShaderPreparation(renderer,scene,camera,templates) {
  let status='idle',pending;
  return {
    get status(){return status;},
    start(force=false){
      // A WebGL context can be restored after iOS suspends a tab. Three resets
      // its internal program cache in that case, so the old resolved promise
      // is no longer proof that the restored context has valid programs.
      // Allow the owner to explicitly invalidate this one-shot preparation
      // without creating a second renderer or shader compiler.
      if (force) {
        pending=undefined;
        status='idle';
      }
      if(pending)return pending;
      if(!renderer.extensions.has('KHR_parallel_shader_compile')) {
        status='unsupported';pending=Promise.resolve(false);return pending;
      }
      status='preparing';
      pending=(async()=>{
        try {
          await renderer.compileAsync(scene,camera);
          await renderer.compileAsync(templates,camera,scene);
          status='ready';return true;
        } catch {
          status='failed';return false;
        }
      })();
      return pending;
    },
    reset(){
      pending=undefined;
      status='idle';
    },
  };
}
