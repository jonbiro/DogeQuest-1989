import {ShaderMaterial,Color} from 'three';

// A transparent center preserves the dog's silhouette. The bright rim makes
// the protective bubble readable without tinting the entire character blue.
export function createShieldMaterial(){
  return new ShaderMaterial({
    uniforms:{shieldColor:{value:new Color('#147e99')}},
    transparent:true,depthWrite:false,
    vertexShader:`varying vec3 shieldNormal;
      varying vec3 shieldView;
      void main(){
        vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
        shieldNormal=normalize(normalMatrix*normal);
        shieldView=-viewPosition.xyz;
        gl_Position=projectionMatrix*viewPosition;
      }`,
    fragmentShader:`uniform vec3 shieldColor;
      varying vec3 shieldNormal;
      varying vec3 shieldView;
      void main(){
        float rim=pow(1.0-clamp(dot(normalize(shieldNormal),normalize(shieldView)),0.0,1.0),3.0);
        // Keep the center almost invisible and reserve the strongest value for
        // the edge.  A full translucent sphere reads as a blue cage on a
        // phone and hides the puppy's legs, nearby bones and the next hazard.
        // The power HUD already explains the state; the world effect only
        // needs to say “protected” at a glance.
        // The HUD already names the power. Keep the world cue to a restrained
        // edge highlight so the next bone line and obstacle remain visible on
        // a compact phone screen instead of sitting inside a blue bubble.
        gl_FragColor=vec4(shieldColor,0.012+0.32*rim);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
