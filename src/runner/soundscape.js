import {areaAt} from './areas.js';
import {playNotes} from './sound.js';

// Original, sparse pentatonic phrases: light woods, hollow bamboo, low redrock,
// flowing oasis, bright crystal and soft mooncap. Effects remain much louder.
export const AREA_MOTIFS=[
  [1046.5,1318.5,1174.7], [440,659.3,587.3], [196,293.7,261.6],
  [659.3,783.99,987.8], [880,1174.7,1568], [329.6,493.9,392],
].map(pitches=>pitches.map((pitch,index)=>({from:pitch,to:pitch,at:index*.38,
  duration:.48,type:'sine',volume:index===0?.006:.004})));

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
