import test from 'node:test';
import assert from 'node:assert/strict';
import {parseYouTubeUrl,validateImage,validatePhotos,limitMessage,youTubeStart,startVoiceRecording} from './media.js';
test('YouTube accepts genuine video links and rejects deceptive hosts',()=>{
  for(const url of ['https://youtu.be/dQw4w9WgXcQ','https://www.youtube.com/watch?v=dQw4w9WgXcQ','https://youtube.com/shorts/dQw4w9WgXcQ']) assert.equal(parseYouTubeUrl(url),'dQw4w9WgXcQ');
  for(const url of ['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','javascript:alert(1)','https://youtu.be/bad','http://example.com']) assert.equal(parseYouTubeUrl(url),null);
});
test('recorder errors discard partial audio and always stop tracks',()=>{
 let stopped=0,completed=0,errors=0,instance;
 const original=globalThis.MediaRecorder;
 globalThis.MediaRecorder=class {static isTypeSupported(){return true;} constructor(){instance=this;this.state='inactive';this.mimeType='audio/webm';}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['partial'])});this.onstop();}};
 try{
 const capture=startVoiceRecording({getTracks:()=>[{stop:()=>stopped++}]},{onComplete:()=>completed++,onError:()=>errors++,onTick:()=>{}});
 instance.onerror();if(instance.state==='recording')capture.stop();
 assert.equal(completed,0);assert.equal(errors,1);assert.ok(stopped>0);
 capture.cancel();
 }finally{globalThis.MediaRecorder=original;}
});
test('recording stops at sixty seconds and returns a complete local blob',t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});let instance,stops=0,blob;
 const original=globalThis.MediaRecorder;
 globalThis.MediaRecorder=class {static isTypeSupported(){return true;}constructor(){instance=this;this.state='inactive';this.mimeType='audio/webm';}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['recorded audio'])});this.onstop();}};
 try{startVoiceRecording({getTracks:()=>[{stop:()=>stops++}]},{onComplete:value=>blob=value,onTick:()=>{},onError:()=>assert.fail('unexpected recording error')});
 t.mock.timers.tick(59999);assert.equal(instance.state,'recording');t.mock.timers.tick(1);assert.equal(instance.state,'inactive');assert.equal(stops,1);assert.ok(blob.size>0);
 }finally{globalThis.MediaRecorder=original;t.mock.timers.reset();}
});
test('song timestamps retain original starting positions',()=>{
  assert.equal(youTubeStart('https://youtube.com/watch?v=N9bashij_7c&t=60s'),60);
  assert.equal(youTubeStart('https://youtu.be/N9bashij_7c?t=1m10s'),70);
  assert.equal(youTubeStart('https://youtube.com/watch?v=N9bashij_7c&start=42'),42);
  assert.equal(youTubeStart('not a link'),0);
});
test('media limits reject oversized, invalid and excessive images',()=>{
  assert.equal(validateImage({type:'image/png',size:100}),null);
  assert.ok(validateImage({type:'text/html',size:100}));
  assert.ok(validateImage({type:'image/png',size:11*1024*1024}));
  assert.ok(validatePhotos(3,2)); assert.equal(validatePhotos(3,1),null);
  assert.equal(limitMessage('a'.repeat(90)).length,70);
});
