import * as THREE from 'three';

// Large, low-contrast patches belong to trail stations, not the camera. They
// travel with the banks and need no image texture or decorative ground objects.
export function createTerrainMaterial(surface){
  const material=new THREE.MeshStandardMaterial({roughness:.94,map:surface});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float terrainStation;\nvarying vec2 terrainCoord;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nterrainCoord=vec2(position.x*60.0,terrainStation-position.z*5.4);');
    shader.fragmentShader=`varying vec2 terrainCoord;
      float terrainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float terrainNoise(vec2 p){
        vec2 cell=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(terrainHash(cell),terrainHash(cell+vec2(1,0)),f.x),
          mix(terrainHash(cell+vec2(0,1)),terrainHash(cell+vec2(1,1)),f.x),f.y);
      }
    `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float terrainPatch=terrainNoise(terrainCoord*.095)*.72+terrainNoise(terrainCoord*.24)*.28;
      diffuseColor.rgb*=mix(.78,1.12,smoothstep(.18,.82,terrainPatch));
    `);
  };
  material.customProgramCacheKey=()=> 'station-terrain-v1';
  return material;
}

export function terrainStation(distance,z){return distance-z;}
