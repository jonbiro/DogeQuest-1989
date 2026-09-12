import {levels} from './progression.js';
import {collectionFrom} from './collection.js';
import {masteryFrom} from './mastery.js';
import {preferencesFrom} from './preferences.js';

export const MAX_BACKUP_BYTES = 64000;
const record = value => value && typeof value === 'object' && !Array.isArray(value);
function cleanProfile(profile) {
  if (!record(profile)) throw Error('This backup has no saved progress.');
  const clean={};
  for(const key of ['best','bones','bestRunBones','distance','credits','challenges']) {
    const value=profile[key];
    if(!Number.isFinite(value) || value<0 || value>Number.MAX_SAFE_INTEGER)
      throw Error('This backup contains invalid progress.');
    clean[key]=key==='distance'?value:Math.floor(value);
  }
  for(const key of ['upgrades','collection','mastery','preferences'])
    if(!record(profile[key]))throw Error('This backup is incomplete.');
  clean.upgrades=levels(profile.upgrades);
  clean.collection=collectionFrom(profile.collection);
  clean.mastery=masteryFrom(profile.mastery);
  clean.preferences=preferencesFrom(profile.preferences);
  return clean;
}
export function encodeBackup(profile) {
  return JSON.stringify({format:'biscuit-dash-backup',version:1,profile:cleanProfile(profile)},null,2);
}
export function decodeBackup(text) {
  if(typeof text!=='string' || text.length>MAX_BACKUP_BYTES)throw Error('This backup is too large.');
  let data;
  try {data=JSON.parse(text);} catch {throw Error('Choose a valid Biscuit Dash backup file.');}
  if(data?.format!=='biscuit-dash-backup' || data.version!==1)
    throw Error('This file is not a supported Biscuit Dash backup.');
  return cleanProfile(data.profile);
}
export function restoreBackup(storage, profile) {
  const next=JSON.stringify(cleanProfile(profile));
  // Preserve the exact previous bytes, including a damaged save, before replacing.
  // If storage cannot retain that safety copy, do not touch the original.
  try {
    const previous=storage.getItem('biscuit-dash-v1');
    if(previous!==null)storage.setItem('biscuit-dash-before-restore',previous);
    storage.setItem('biscuit-dash-v1',next);
    return true;
  } catch {return false;}
}
