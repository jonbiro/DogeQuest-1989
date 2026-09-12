import * as THREE from 'three';

// A connected height field creates several summits and gullies in one shared
// mesh. Unlike a stretched hemisphere, the sides taper into the valley floor.
export function createMountainGeometry() {
  const columns=21,rows=13,positions=[],colors=[],indices=[];
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
    const x=column/(columns-1)*2-1,z=row/(rows-1)*2-1;
    const edge=Math.max(0,1-x*x)*Math.max(0,1-z*z);
    const spine=z-.18*Math.sin(x*3.7);
    const peaks=.56+.23*Math.cos(x*7.8+.6)+.12*Math.sin(x*15.4);
    const gullies=1-.16*Math.abs(Math.sin(x*18+z*5))*Math.abs(z);
    const height=Math.pow(edge,.8)*Math.exp(-spine*spine*3.2)*peaks*gullies;
    positions.push(x,height-.5,z);
    const shade=.8+.18*height+.025*Math.sin(height*38+x*2);
    colors.push(shade,shade,shade);
    if(row<rows-1&&column<columns-1){
      const a=row*columns+column,b=a+1,c=a+columns,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
