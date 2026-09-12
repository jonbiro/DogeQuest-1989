// Small opposed fans distinguish bamboo foliage from the broad Oasis crowns.
// Reuse the same leaf geometry and instanced material pipeline.
export function addBambooLeaves(parent,geometry,mesh,x,height){
  for(const [level,direction,color] of [[.8,0,'#487445'],[.57,Math.PI,'#71954d']]){
    for(const spread of [-.45,0,.45]){
      const angle=direction+spread,length=spread===0?1.05:.8;
      const leaf=mesh(parent,geometry,color,x+Math.cos(angle)*length,height*level,
        Math.sin(angle)*length,length,.4,.55);
      leaf.rotation.y=-angle;
    }
  }
}
