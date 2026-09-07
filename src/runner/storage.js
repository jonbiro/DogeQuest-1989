export function readStoredProfile(storage) {
  let raw;
  try { raw=storage.getItem("biscuit-dash-v1"); }
  catch { return {available:false,value:null}; }
  try { return {available:true,value:JSON.parse(raw)}; }
  catch { return {available:true,value:null}; }
}
export function writeStoredProfile(storage,value,readable=true) {
  if(!readable)return false;
  try {storage.setItem("biscuit-dash-v1",JSON.stringify(value));return true;}
  catch {return false;}
}
