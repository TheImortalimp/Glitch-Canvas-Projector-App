'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('live-source effects bound history and release it when disabled',()=>{
 let allocations=0,draws=0,now=0,strength=.8;const ctx={save(){},restore(){},drawImage(){draws++},clearRect(){}};
 const box={gctx:ctx,sourceVideo:{readyState:3,videoWidth:1920,videoHeight:1080},glitchCanvas:{width:1200,height:800},customTime:0,document:{createElement(){allocations++;return {width:0,height:0,getContext(){return ctx}}}},createTimedEffect:f=>f,Math};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/renderer/projector-effects.js'),'utf8'),box);
 box.getStrength=()=>strength;const slices=vm.runInContext('temporalSlicesFactory(getStrength,true)',box);const echo=vm.runInContext('chromaticEchoFactory(getStrength,true)',box);
 for(let i=0;i<1000;i++){box.customTime=now+=34;slices();}assert.equal(allocations,6);assert(draws>1000);box.glitchCanvas.width=1600;slices();assert.equal(allocations,6,'resize should reuse the six frame buffers');
 strength=0;slices();strength=.8;slices();assert.equal(allocations,12,'buffers should be recreated after being released');const before=draws;echo();assert(draws>=before+2);
});
