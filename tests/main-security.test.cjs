'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{EventEmitter}=require('node:events');
test('capture requires trusted sender, explicit fresh source and video-only request',async()=>{
 const handlers=new Map(),app=new EventEmitter(),display=new EventEmitter();app.whenReady=()=>Promise.resolve();app.quit=()=>{};
 let instance,mediaHandler,permissionHandler,full=false;const frame={};class BrowserWindow extends EventEmitter{constructor(options){super();this.options=options;this.webContents=new EventEmitter();this.webContents.mainFrame=frame;this.webContents.setWindowOpenHandler=()=>{};this.webContents.send=()=>{};instance=this;}loadFile(){}setMenuBarVisibility(){}show(){}isDestroyed(){return false}getTitle(){return 'Glitch Canvas Projector App'}isFullScreen(){return full}setFullScreen(v){full=v;this.emit(v?'enter-full-screen':'leave-full-screen')}isMaximized(){return false}getSize(){return [900,600]}setBounds(b){this.bounds=b}minimize(){}close(){}static getAllWindows(){return [instance]}}
 const target={id:22,label:'Projector',bounds:{x:1920,y:0,width:1920,height:1080},workArea:{x:1920,y:0,width:1920,height:1040}};display.getPrimaryDisplay=()=>target;display.getAllDisplays=()=>[target];
 const source={id:'screen:0:0',name:'Screen A',display_id:'22',thumbnail:{isEmpty:()=>false,toDataURL:()=> 'data:image/png;base64,AAA'}};
 const electron={app,BrowserWindow,desktopCapturer:{getSources:async()=>[source]},ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},session:{defaultSession:{setPermissionRequestHandler:fn=>permissionHandler=fn,setDisplayMediaRequestHandler:fn=>mediaHandler=fn}},screen:display,globalShortcut:{register:()=>true,unregisterAll(){}}};
 const code=fs.readFileSync(require('node:path').join(__dirname,'../src/main/main.cjs'),'utf8');vm.runInNewContext(code,{require:n=>n==='electron'?electron:require(n),__dirname:'/src/main',setTimeout,clearTimeout,console,Date});await new Promise(r=>setImmediate(r));
 const event={sender:instance.webContents,senderFrame:frame},untrusted={sender:{},senderFrame:frame};assert.equal(instance.options.frame,false);assert.equal(instance.options.webPreferences.nodeIntegration,false);assert.equal(instance.options.webPreferences.sandbox,true);assert.equal(instance.options.webPreferences.contextIsolation,true);
 await assert.rejects(()=>handlers.get('projector:list-sources')(untrusted),/Untrusted/);
 let result;mediaHandler({frame,videoRequested:true,audioRequested:false},r=>result=r);assert.equal(result,null);
 let list=await handlers.get('projector:list-sources')(event);assert.equal(list.length,1);assert.throws(()=>handlers.get('projector:select-source')(event,'bogus'),/expired/);handlers.get('projector:select-source')(event,source.id);mediaHandler({frame,videoRequested:true,audioRequested:true},r=>result=r);assert.equal(result,null);
 await handlers.get('projector:list-sources')(event);handlers.get('projector:select-source')(event,source.id);mediaHandler({frame:{},videoRequested:true,audioRequested:false},r=>result=r);assert.equal(result,null);
 await handlers.get('projector:list-sources')(event);handlers.get('projector:select-source')(event,source.id);mediaHandler({frame,videoRequested:true,audioRequested:false},r=>result=r);assert.equal(result.video,source);
 await handlers.get('projector:list-sources')(event);handlers.get('projector:cancel-source-list')(event);assert.throws(()=>handlers.get('projector:select-source')(event,source.id),/expired/);
 let granted;permissionHandler(instance.webContents,'media',v=>granted=v);assert.equal(granted,false);permissionHandler(instance.webContents,'display-capture',v=>granted=v);assert.equal(granted,true);
 await handlers.get('projector:move-display')(event,'22');assert(instance.bounds.x>=1920);await assert.rejects(()=>handlers.get('projector:move-display')(event,'bad'),/no longer available/);handlers.get('projector:fullscreen')(event);assert.equal(full,true);
});
function loadMain({globalRegister,startFullscreen=false}={}){
 const handlers=new Map(),shortcuts=new Map(),sent=[],app=new EventEmitter(),display=new EventEmitter();app.whenReady=()=>Promise.resolve();app.quit=()=>{};
 const clock={now:1000},frame={},state={full:startFullscreen,opacity:1,top:false,level:''};let instance;
 class BrowserWindow extends EventEmitter{constructor(){super();this.webContents=new EventEmitter();this.webContents.mainFrame=frame;this.webContents.setWindowOpenHandler=()=>{};this.webContents.send=(channel,value)=>sent.push([channel,value]);instance=this;}loadFile(){}setMenuBarVisibility(){}show(){}isDestroyed(){return false}getTitle(){return 'Glitch Canvas Projector App'}isFullScreen(){return state.full}setFullScreen(v){state.full=v}setOpacity(v){state.opacity=v}isAlwaysOnTop(){return state.top}setAlwaysOnTop(v,level){state.top=v;state.level=v?level||'floating':''}static getAllWindows(){return [instance]}}
 const target={id:1,bounds:{x:0,y:0,width:1920,height:1080},workArea:{x:0,y:0,width:1920,height:1040}};display.getPrimaryDisplay=()=>target;display.getAllDisplays=()=>[target];
 const electron={app,BrowserWindow,desktopCapturer:{getSources:async()=>[]},ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},session:{defaultSession:{setPermissionRequestHandler(){},setDisplayMediaRequestHandler(){}}},screen:display,globalShortcut:{register:(key,fn)=>{shortcuts.set(key,fn);return globalRegister?globalRegister(key):true},unregisterAll(){}}};
 const code=fs.readFileSync(require('node:path').join(__dirname,'../src/main/main.cjs'),'utf8');vm.runInNewContext(code,{require:n=>n==='electron'?electron:require(n),__dirname:'/src/main',setTimeout,clearTimeout,console,Date:{now:()=>clock.now}});
 const key=(input,type='keyDown')=>{let prevented=false;instance.webContents.emit('before-input-event',{preventDefault(){prevented=true}},{type,...input});return prevented;};
 return {handlers,shortcuts,sent,state,clock,key,frame,get instance(){return instance}};
}
test('VJ mode: Ctrl+Alt+T goes fullscreen at 50% opacity and ESC/Ctrl+Alt+T always restore',async()=>{
 const m=loadMain();await new Promise(r=>setImmediate(r));
 const event={sender:m.instance.webContents,senderFrame:m.frame},untrusted={sender:{},senderFrame:m.frame},vj=m.handlers.get('projector:vj-mode');
 assert(m.shortcuts.has('Control+Alt+T'));
 assert.throws(()=>vj(untrusted,true),/Untrusted/);for(const bad of [1,'true',null,undefined,{}])assert.throws(()=>vj(event,bad),/Invalid/);
 assert.equal(m.state.opacity,1);assert.equal(m.state.full,false);
 m.shortcuts.get('Control+Alt+T')();assert.deepEqual(m.sent.pop(),['projector:vj-request',undefined]);assert.equal(m.state.opacity,1,'the renderer must confirm before the window changes');
 assert.equal(vj(event,true),true);assert.equal(m.state.opacity,0.5);assert.equal(m.state.full,true);assert.equal(m.state.top,true);assert.equal(m.state.level,'screen-saver');assert.deepEqual(m.sent.pop(),['projector:vj-mode-changed',true]);
 assert.equal(m.key({key:'a'}),false);assert.equal(m.key({key:'Escape'},'keyUp'),false);assert.equal(m.state.opacity,0.5);
 assert.equal(m.key({key:'Escape'}),true);assert.equal(m.state.opacity,1);assert.equal(m.state.full,false);assert.equal(m.state.top,false);assert.deepEqual(m.sent.pop(),['projector:vj-mode-changed',false]);
 assert.equal(m.key({key:'Escape'}),false);assert.equal(m.sent.length,0);
 vj(event,true);m.sent.length=0;m.clock.now+=1000;m.shortcuts.get('Control+Alt+T')();assert.equal(m.state.opacity,1);assert.equal(m.state.full,false);assert.deepEqual(m.sent.pop(),['projector:vj-mode-changed',false]);
 m.clock.now+=1000;m.shortcuts.get('Control+Alt+T')();m.shortcuts.get('Control+Alt+T')();assert.equal(m.sent.filter(s=>s[0]==='projector:vj-request').length,1,'held-key repeats are ignored');
 vj(event,true);m.clock.now+=1000;assert.equal(m.handlers.get('projector:fullscreen')(event),true);assert.equal(m.state.opacity,1);assert.equal(m.state.full,false);
 vj(event,true);assert.equal(vj(event,false),false);assert.equal(m.state.opacity,1);assert.equal(vj(event,false),false);
});
test('VJ mode keeps an already fullscreen window fullscreen and falls back to in-window shortcut',async()=>{
 const m=loadMain({startFullscreen:true,globalRegister:()=>false});await new Promise(r=>setImmediate(r));
 const event={sender:m.instance.webContents,senderFrame:m.frame};
 assert.equal(m.key({key:'t',control:true,alt:true,isAutoRepeat:true}),false);assert.equal(m.sent.length,0);
 assert.equal(m.key({key:'T',control:true,alt:true}),true);assert.deepEqual(m.sent.pop(),['projector:vj-request',undefined]);
 m.handlers.get('projector:vj-mode')(event,true);assert.equal(m.state.opacity,0.5);assert.equal(m.state.full,true);
 m.key({key:'Escape'});assert.equal(m.state.opacity,1);assert.equal(m.state.full,true);assert.equal(m.state.top,false);
 const pinned=loadMain();await new Promise(r=>setImmediate(r));pinned.instance.setAlwaysOnTop(true);
 pinned.handlers.get('projector:vj-mode')({sender:pinned.instance.webContents,senderFrame:pinned.frame},true);pinned.key({key:'Escape'});assert.equal(pinned.state.top,true,'a window that was already on top stays on top');
});

