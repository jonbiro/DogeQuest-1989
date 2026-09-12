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
  // Absolute morph targets retain one shared geometry and smooth area changes.
  // The perimeter stays on the valley floor for every destination.
  const targets=[];
  for(let area=0;area<6;area++){
    const target=geometry.clone(),p=target.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i),edge=Math.max(0,1-x*x)*Math.max(0,1-z*z);
      const ridge=Math.exp(-Math.pow(z-.12*Math.sin(x*4),2)*3);
      let height=p.getY(i)+.5;
      if(area===1)height=Math.pow(edge,.65)*ridge*(.46+.13*Math.cos(x*6));
      if(area===2)height=Math.min(.58,Math.pow(edge,1.4)*ridge*(.95+.22*Math.cos(x*8)));
      if(area===3)height=edge*ridge*(.52+.045*Math.sin(x*5+z*2));
      if(area===4)height=Math.pow(edge,1.1)*ridge*(.32+.7*Math.pow(Math.max(0,Math.cos(x*9)),5));
      if(area===5)height=Math.pow(edge,.8)*ridge*(.52+.09*Math.cos(x*5-.7));
      p.setY(i,height-.5);
    }
    target.computeVertexNormals();targets.push(target);
  }
  geometry.morphAttributes.position=targets.map(target=>target.attributes.position);
  geometry.morphAttributes.normal=targets.map(target=>target.attributes.normal);
  geometry.computeBoundingSphere();
  return geometry;
}

export function blendMountainArea(mesh,{previous,index,blend}){
  mesh.morphTargetInfluences.fill(0);
  mesh.morphTargetInfluences[previous]=1-blend;
  mesh.morphTargetInfluences[index]+=blend;
}
