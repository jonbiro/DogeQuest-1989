import {encodeBackup,decodeBackup,restoreBackup,MAX_BACKUP_BYTES} from './backup.js';

export function installBackupControls(getProfile) {
  const $=id=>document.getElementById(id);
  let pending=null,selection=0;
  const clear=()=>{pending=null;selection++;$('restore-review').hidden=true;$('backup-file').value='';};
  $('backup-export').onclick=()=>{
    try {
      const url=window.URL.createObjectURL(new window.Blob([encodeBackup(getProfile())],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='biscuit-dash-backup.json';
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>window.URL.revokeObjectURL(url),30000);
      $('backup-status').textContent='Backup download requested. Keep the file somewhere safe.';
    } catch { $('backup-status').textContent='A backup could not be created. Your saved data has not changed.'; }
  };
  $('backup-choose').onclick=()=>$('backup-file').click();
  $('backup-file').onchange=async()=>{
    const file=$('backup-file').files?.[0];
    clear();const current=selection;
    if(!file)return;
    try {
      if(file.size>MAX_BACKUP_BYTES)throw Error('This backup is too large.');
      const profile=decodeBackup(await file.text());
      if(current!==selection)return;
      pending=profile;
      $('restore-preview').textContent=`Backup: ${profile.best.toLocaleString()} best score · ${profile.credits.toLocaleString()} points · ${profile.collection.puppies.length} puppies. This replaces this browser’s progress, rather than merging it. Download your current backup first if you want to keep it.`;
      $('restore-review').hidden=false;
      $('backup-status').textContent='Backup checked. Nothing has been changed yet.';
      $('restore-review').scrollIntoView({block:'start'});
      $('backup-restore').focus({preventScroll:true});
    } catch(error) {
      if(current===selection)$('backup-status').textContent=error.message;
    }
  };
  $('backup-cancel').onclick=()=>{clear();$('backup-status').textContent='Restore cancelled. Your progress is unchanged.';$('backup-choose').focus();};
  $('backup-restore').onclick=()=>{
    if(!pending)return;
    $('backup-restore').disabled=true;
    let restored=false;
    try {restored=restoreBackup(localStorage,pending);} catch { /* blocked storage */ }
    if(restored)window.location.reload();
    else {
      $('backup-restore').disabled=false;
      $('backup-status').textContent='Restore failed: storage is unavailable or full. Your previous save has not been replaced.';
    }
  };
}
