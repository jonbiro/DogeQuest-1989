// Recognize progress without adding awards or another results panel.
export function resultRecord(receipt,run) {
  if(receipt.personalBest)return 'New personal best! ';
  if(run.rematchBest>0&&run.score>run.rematchBest)return 'Rematch best! ';
  if(receipt.distanceBest&&receipt.bonesBest)return 'New distance and bone bests! ';
  if(receipt.distanceBest)return 'New distance best! ';
  if(receipt.bonesBest)return 'New bone best! ';
  return '';
}
