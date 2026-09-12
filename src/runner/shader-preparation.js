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
    start(){
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
  };
}
