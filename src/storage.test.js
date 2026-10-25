import test from 'node:test';
import assert from 'node:assert/strict';
import {canSaveDraft,requestPersistentStorage} from './storage.js';
test('failed or unfinished hydration never permits writing defaults',()=>{
 assert.equal(canSaveDraft('loading'),false);assert.equal(canSaveDraft('failed'),false);assert.equal(canSaveDraft('ready'),true);
});


test('storage persistence is optional and refusal does not prevent local saving',async()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'navigator');let requests=0;
 const storage={persisted:async()=>false,persist:async()=>{requests++;return false;}};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{storage}});
 try{
  assert.equal(await requestPersistentStorage(),false);assert.equal(requests,1);
  storage.persisted=async()=>true;assert.equal(await requestPersistentStorage(),true);assert.equal(requests,1);
  storage.persisted=async()=>{throw new Error('Blocked');};assert.equal(await requestPersistentStorage(),false);
  delete globalThis.navigator.storage;assert.equal(await requestPersistentStorage(),false);
 }finally{if(previous)Object.defineProperty(globalThis,'navigator',previous);else delete globalThis.navigator;}
});
