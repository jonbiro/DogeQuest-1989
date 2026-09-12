// Recognize progress without adding awards or another results panel.
import {validTrailTarget} from './trail-link.js';

export function resultChallenge(run) {
  if(!Number.isSafeInteger(run.score)||run.score<0)return '';
  const shared=validTrailTarget(run.challengeTarget);
  const target=shared?run.challengeTarget:run.rematchBest;
  if(!validTrailTarget(target))return '';
  if(run.score>target)return shared?'Target beaten! ':'';
  // Match the in-run chase window. A tied score still needs one more point.
  const needed=target-run.score+1;
  if(needed>Math.min(500,Math.max(150,target*.1)))return '';
  return `${needed.toLocaleString()} more ${needed===1?'point':'points'} to beat ${shared?'the shared target':'your rematch best'}. `;
}

export function resultRecord(receipt,run) {
  if(receipt.personalBest)return 'New personal best! ';
  if(run.rematchBest>0&&run.score>run.rematchBest)return 'Rematch best! ';
  if(receipt.distanceBest&&receipt.bonesBest)return 'New distance and bone bests! ';
  if(receipt.distanceBest)return 'New distance best! ';
  if(receipt.bonesBest)return 'New bone best! ';
  return '';
}
