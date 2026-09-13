// Local particles communicate what happened without a screen flash or banner.
export function effectColor(type) {
  if(type==='hit')return '#ff896c';
  if(type==='shield-break'||type==='shield')return '#8edfff';
  if(type==='magnet'||type==='fetch')return '#71ead4';
  if(type==='heart')return '#ffa6b4';
  if(type==='zoomies')return '#ceef86';
  if(type==='relic')return '#d9b4ff';
  return '#fff0a6';
}
