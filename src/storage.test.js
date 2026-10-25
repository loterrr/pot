import test from 'node:test';
import assert from 'node:assert/strict';
import {canSaveDraft} from './storage.js';
test('failed or unfinished hydration never permits writing defaults',()=>{
 assert.equal(canSaveDraft('loading'),false);assert.equal(canSaveDraft('failed'),false);assert.equal(canSaveDraft('ready'),true);
});
