'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const dir=path.join(__dirname,'../src/renderer');let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_match,file)=>'<script>'+fs.readFileSync(path.join(dir,file),'utf8')+'</script>');
test('renderer capture controls, 250 fixed presets, glyph banks and save/reload',async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));let stopCount=0,selected='',target='',cancelled=0,fullscreen=0;
 const track={stop(){stopCount++},addEventListener(){}};const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const dom=new JSDOM(html,{url:'https://local.test/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.confirm=()=>true;w.alert=msg=>errors.push(msg);w.requestAnimationFrame=()=>1;
  w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.play=async function(){};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.HTMLCanvasElement.prototype.getContext=function(type){if(type!=='2d')return null;return new Proxy({canvas:this},{get(o,k){if(k in o)return o[k];if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});if(k==='measureText')return v=>({width:String(v).length*8});return ()=>{}},set(o,k,v){o[k]=v;return true}})};
  Object.defineProperty(w.navigator,'mediaDevices',{value:{getDisplayMedia:async opts=>{assert.equal(opts.audio,false);return stream;}}});
  w.projector={listSources:async()=>[{id:'screen:1:0',name:'Screen one',thumbnail:''}],selectSource:async id=>{selected=id},cancelSourceList:async()=>{cancelled++},displays:async()=>[{id:'123',label:'Projector',width:1920,height:1080}],moveDisplay:async id=>{target=id},fullscreen:async()=>{fullscreen++},minimize:async()=>{},close:async()=>{},shortcutStatus:async()=>true,onDisplaysChanged:()=>{},onFullscreenChanged:()=>{}};
 }});
 const w=dom.window,d=w.document;await new Promise(r=>w.setTimeout(r,10));assert.equal(errors.length,0,errors.map(String).join('\n'));
 assert.equal(d.querySelectorAll('#machine-select option').length,251);assert(d.querySelectorAll('#glyph-bank option').length>=120);const copy=d.body.cloneNode(true);copy.querySelectorAll('script').forEach(x=>x.remove());assert(!/youtube|playlist/i.test(copy.textContent));
 d.getElementById('open-source').click();await new Promise(r=>w.setTimeout(r,5));assert.equal(d.querySelectorAll('.source-card').length,1);d.querySelector('.source-card').click();await new Promise(r=>w.setTimeout(r,10));assert.equal(selected,'screen:1:0');assert(d.body.classList.contains('playing'));assert(cancelled>0);
 let m=d.getElementById('machine-select');m.value='M250';m.dispatchEvent(new w.Event('change'));assert.match(d.getElementById('preset-status').textContent,/M250/);assert.match(d.getElementById('continualRandomizeBtn').textContent,/OFF/);
 let range=d.querySelector('input[aria-label="Scanlines"]');range.value='.77';range.dispatchEvent(new w.Event('input'));d.getElementById('user-preset-name').value='Test settings';d.getElementById('user-save').click();assert.equal(JSON.parse(w.localStorage.getItem('glitchCanvasPresets_v2'))[0].settings.effects.Scanlines,.77);
 w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'g',ctrlKey:true,altKey:true,bubbles:true}));
 const restored=w.eval('snapshot()');const egg=w.eval('GHOST_OF_ME_EASTER_EGG');
 for(const [name,value] of Object.entries(egg.settings.effects)) assert.equal(restored.effects[name],value,`Easter egg effect ${name}`);
 assert.equal(restored.masterOpacity,egg.settings.masterOpacity);assert.equal(restored.isContinuallyRandomizing,true);assert.equal(restored.isAiWarpActive,true);assert.equal(restored.sliderLocks.ASCII,true);assert.match(d.getElementById('preset-status').textContent,/GHOST \/ OF ME/);
 let glyph=d.getElementById('glyph-bank');glyph.value='CJK Extension B';glyph.dispatchEvent(new w.Event('change'));for(let i=0;i<20;i++)assert.equal(Array.from(w.SignalGlyphs.pick()).length,1);
 let display=d.getElementById('display-select');display.value='123';display.dispatchEvent(new w.Event('change'));await new Promise(r=>w.setTimeout(r,1));assert.equal(target,'123');d.getElementById('fullscreen-window').click();assert.equal(fullscreen,1);
 d.getElementById('stop-source').click();assert.equal(stopCount,1);assert(!d.body.classList.contains('playing'));assert.equal(errors.length,0,errors.map(String).join('\n'));dom.window.close();
});
