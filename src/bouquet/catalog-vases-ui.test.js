import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {createDraft} from './draft.js';

test('existing wrapping layout adds counts and paper ribbon picker, but vases have no ribbon control',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
 try{
  const {default:WrapPanel}=await server.ssrLoadModule('/src/bouquet/WrapPanel.jsx');
  const render=wrap=>renderToStaticMarkup(React.createElement(WrapPanel,{draft:{...createDraft(),wrap},dispatch(){},onOccasion(){}}));
  const paper=render('segment');assert.ok(paper.includes('aria-label="Custom ribbon color"'));assert.ok(paper.includes('aria-label="Custom stem capacity"'));assert.ok(paper.includes('40 stems'));
  for(const key of ['glass','ceramic']){
   const vase=render(key);assert.ok(!vase.includes('aria-label="Custom ribbon color"'));assert.ok(!vase.includes('Pink accent'));assert.ok(!vase.includes('studio-workspace'));
  }
  const ceramic=render('ceramic');assert.ok(ceramic.includes('aria-label="Custom vase color"'));assert.ok(ceramic.includes('Stripe'));
 }finally{await server.close();}
});
