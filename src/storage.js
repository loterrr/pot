import {upsertShelfItem,removeShelfItem} from './shelf.js';
let database;
export const canSaveDraft=status=>status==='ready';
export async function requestPersistentStorage(){
 try{
  const storage=globalThis.navigator?.storage;
  if(!storage?.persisted||!storage?.persist)return false;
  return await storage.persisted()||await storage.persist();
 }catch{return false;}
}
function open(){return database??=(new Promise((resolve,reject)=>{const request=indexedDB.open('bouquet-studio',1);request.onupgradeneeded=()=>request.result.createObjectStore('drafts');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);})).catch(error=>{database=null;throw error;});}
export async function loadDraft(){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get('current');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
export async function saveDraft(draft){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(draft,'current');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Draft save was interrupted.'));});}
const SHELF_INDEX='shelf-index',shelfKey=id=>'shelf:'+id;
function readIndex(store,onValue,onError){
  const request=store.get(SHELF_INDEX);
  request.onsuccess=()=>onValue(Array.isArray(request.result?.items)?request.result.items:[]);
  request.onerror=()=>onError(request.error);
}
function transactionDone(tx,resolve,reject,message){
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error);
  tx.onabort=()=>reject(tx.error||Error(message));
}
export async function loadShelfIndex(){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('drafts','readonly');
    readIndex(tx.objectStore('drafts'),items=>resolve({items}),reject);
  });
}
export async function loadShelfDraft(id){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const request=db.transaction('drafts').objectStore('drafts').get(shelfKey(id));
    request.onsuccess=()=>resolve(request.result||null);
    request.onerror=()=>reject(request.error);
  });
}
export async function saveShelfBouquet(item,draft){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts');
    readIndex(store,items=>{
      try{
        store.put({items:upsertShelfItem(items,item)},SHELF_INDEX);
        store.put(draft,shelfKey(item.id));
      }catch(error){
        reject(error);
        try{tx.abort();}catch{}
      }
    },error=>{reject(error);try{tx.abort();}catch{}});
    transactionDone(tx,resolve,reject,'Shelf save was interrupted.');
  });
}
export async function deleteShelfBouquet(id){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts');
    readIndex(store,items=>{
      try{
        store.put({items:removeShelfItem(items,id)},SHELF_INDEX);
        store.delete(shelfKey(id));
      }catch(error){
        reject(error);
        try{tx.abort();}catch{}
      }
    },error=>{reject(error);try{tx.abort();}catch{}});
    transactionDone(tx,resolve,reject,'Shelf delete was interrupted.');
  });
}
