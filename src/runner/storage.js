export function readStoredProfile(storage) {
  let raw;
  try { raw=storage.getItem("biscuit-dash-v1"); }
  catch { return {available:false,readable:false,value:null}; }
  if (raw === null) return {available:true,readable:true,value:null};
  try {
    const value=JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return {available:true,readable:false,value:null};
    return {available:true,readable:true,value};
  } catch { return {available:true,readable:false,value:null}; }
}
export function writeStoredProfile(storage,value,readable=true) {
  if(!readable)return false;
  try {storage.setItem("biscuit-dash-v1",JSON.stringify(value));return true;}
  catch {return false;}
}
