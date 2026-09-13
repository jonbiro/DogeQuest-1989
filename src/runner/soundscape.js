import {areaAt} from './areas.js';
import {playNotes} from './sound.js';

// Original, restrained call-and-response phrases: light woods, hollow bamboo,
// low redrock, flowing oasis, bright crystal and soft mooncap. A quiet
// triangle reply adds character while effects remain much louder.
const motif=(notes)=>notes.map(([from,to,at,duration,type,volume])=>
  ({from,to:to??from,at,duration,type:type||'sine',volume:volume??.004}));
export const AREA_MOTIFS=[
  [[1046.5,null,0,.42,'sine',.006],[1318.5,null,.24,.34,'triangle',.0045],
    [1174.7,null,.48,.38,'sine',.0045],[880,null,.82,.46,'sine',.004],
    [1046.5,null,1.13,.3,'triangle',.0035]],
  [[440,null,0,.42,'sine',.006],[659.3,null,.22,.34,'triangle',.0045],
    [587.3,null,.46,.38,'sine',.0045],[783.99,null,.78,.46,'triangle',.004],
    [659.3,null,1.12,.3,'sine',.0035]],
  [[196,null,0,.42,'sine',.006],[293.7,null,.25,.34,'sine',.0045],
    [261.6,null,.5,.38,'triangle',.0045],[220,null,.83,.46,'sine',.004],
    [196,null,1.12,.3,'triangle',.0035]],
  [[659.3,null,0,.42,'sine',.006],[783.99,null,.22,.34,'triangle',.0045],
    [987.8,null,.46,.38,'sine',.0045],[880,null,.78,.46,'sine',.004],
    [659.3,null,1.13,.3,'triangle',.0035]],
  [[880,null,0,.42,'sine',.006],[1174.7,null,.2,.34,'triangle',.0045],
    [1568,null,.42,.38,'sine',.0045],[1318.5,null,.75,.46,'triangle',.004],
    [1174.7,null,1.1,.3,'sine',.0035]],
  [[329.6,null,0,.42,'sine',.006],[493.9,null,.24,.34,'triangle',.0045],
    [392,null,.48,.38,'sine',.0045],[293.7,null,.82,.46,'triangle',.004],
    [329.6,null,1.14,.3,'sine',.0035]],
].map(motif);

export function createAreaSoundscape(play=playNotes){
  let area=null,next=0,last=0,context=null,cancel=null;
  function stop(){cancel?.();cancel=null;area=null;context=null;next=0;}
  return {
    stop,
    update(audio,{enabled,time,distance,quiet=true}){
      if(!enabled||!audio||!Number.isFinite(time)||!Number.isFinite(distance)){stop();return;}
      const current=areaAt(distance);
      if(current!==area||audio!==context||time<last){
        stop();area=current;context=audio;next=time+1.25;
      }
      last=time;
      // Don't introduce a phrase during a decision, or burst after it clears.
      if(!quiet){next=Math.max(next,time+.8);return;}
      if(time<next)return;
      cancel?.();cancel=play(audio,AREA_MOTIFS[area]);next=time+4.8;
    },
  };
}
