// Current fixed renderer catalog includes surface grain and shadow resources.
// These are allocation/draw budgets, not a promise of any device's frame rate.
export const RENDERER_BUDGET = Object.freeze({geometries:32,textures:8,drawCalls:260,objects:200});
export function checkRendererResources(sample,warmed=null) {
  const values={geometries:sample.geometries,textures:sample.textures,drawCalls:sample.drawCalls,
    objects:sample.activeObjects+sample.pooledObjects};
  for(const [key,limit] of Object.entries(RENDERER_BUDGET)) {
    if(!Number.isInteger(values[key])||values[key]<0||values[key]>limit)
      throw Error(`Renderer ${key} budget exceeded: ${values[key]} / ${limit}`);
  }
  if(warmed)for(const key of ['geometries','textures']) {
    if(values[key]>warmed[key])throw Error(`Renderer ${key} grew on the repeat lap: ${warmed[key]} → ${values[key]}`);
  }
}
