// Opportunistic camp work only. Unsupported/failed preparation never prevents
// play, and each renderer owns exactly one preparation attempt.
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
