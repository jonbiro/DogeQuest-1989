// Current fixed renderer catalog includes surface grain and shadow resources.
// These are allocation/draw budgets, not a promise of any device's frame rate.
// Bamboo retains its broad leaf; Oasis adds one shared 438-vertex feathered frond.
// The mood sky adds two batches: a 140-point star dome and a 28-instance
// two-puff cloud layer. Textures are small static canvases/data maps, measured 2026-09-18 on a
// mobile profile (camp 8, gameplay 10): surface grain, menu sheets, Mochi
// grain and puppy-artwork maps, plus the route-label atlas and pickup badge
// that upload on first gameplay render. No streaming.
export const RENDERER_BUDGET = Object.freeze({geometries:39,textures:10,drawCalls:262,objects:202});
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
