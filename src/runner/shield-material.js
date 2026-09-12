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
        gl_FragColor=vec4(shieldColor,0.025+0.82*rim);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
