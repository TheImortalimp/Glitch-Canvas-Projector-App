'use strict';
const { app, BrowserWindow, desktopCapturer, ipcMain, session, screen, globalShortcut } = require('electron');
const path = require('node:path');
let win = null;
let offeredSources = new Map();
let pendingSource = null;
let shortcutRegistered = false;
let vjShortcutRegistered = false;
let offerTimer = null;
let sourceEpoch = 0;
function clearOffers(){offeredSources.clear();pendingSource=null;clearTimeout(offerTimer);offerTimer=null;}
const MAX_SOURCE_AGE = 30_000;
function trusted(event) { return !!win && !win.isDestroyed() && event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame; }
function requireTrusted(event) { if (!trusted(event)) throw new Error('Untrusted request'); }
function displays() {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, index) => ({ id: String(d.id), label: d.label || `Display ${index + 1}`, primary: d.id === primaryId, width: d.bounds.width, height: d.bounds.height }));
}
function sendDisplays(){ if(win && !win.isDestroyed()) win.webContents.send('projector:displays-changed',displays()); }
async function leaveFullscreen(window) {
  if (!window.isFullScreen()) return;
  await new Promise(resolve => {
    let finished = false; const done = () => { if(!finished){finished=true;clearTimeout(timer);resolve();} };
    const timer=setTimeout(done,1500); window.once('leave-full-screen',done);window.setFullScreen(false);
  });
}
async function moveToDisplay(id){
  const target=screen.getAllDisplays().find(d=>String(d.id)===id);
  if(!target) throw new Error('That display is no longer available. Refresh the display list.');
  const wasFull=win.isFullScreen(); if(wasFull)await leaveFullscreen(win);
  if(win.isMaximized())win.unmaximize();
  const area=target.workArea;
  const [oldW,oldH]=win.getSize();const width=Math.min(oldW,area.width),height=Math.min(oldH,area.height);
  win.setBounds({x:Math.round(area.x+(area.width-width)/2),y:Math.round(area.y+(area.height-height)/2),width,height});
  if(wasFull)win.setFullScreen(true);
  return {ok:true};
}
const VJ_OPACITY = 0.5;
const VJ_TOGGLE_GAP = 400;
let vjMode = false;
let vjWasFullScreen = false;
let vjWasOnTop = false;
let lastVjToggle = 0;
function sendVjMode(){ if(win && !win.isDestroyed()) win.webContents.send('projector:vj-mode-changed',vjMode); }
function enterVjMode(){
  if(vjMode || !win || win.isDestroyed()) return;
  vjMode=true;vjWasFullScreen=win.isFullScreen();vjWasOnTop=win.isAlwaysOnTop();
  win.setOpacity(VJ_OPACITY);win.setAlwaysOnTop(true,'screen-saver');if(!vjWasFullScreen)win.setFullScreen(true);
  sendVjMode();
}
function exitVjMode(){
  if(!vjMode) return;
  vjMode=false;
  if(win && !win.isDestroyed()){win.setOpacity(1);win.setAlwaysOnTop(vjWasOnTop);if(!vjWasFullScreen && win.isFullScreen())win.setFullScreen(false);sendVjMode();}
}
// Entering is confirmed by the renderer so VJ mode only starts while a source is active; leaving never depends on it.
function toggleVjMode(){
  const now=Date.now();if(now-lastVjToggle<VJ_TOGGLE_GAP)return;lastVjToggle=now;
  if(vjMode){exitVjMode();return;}
  if(win && !win.isDestroyed())win.webContents.send('projector:vj-request');
}
function toggleFullScreen(){
  if(vjMode){exitVjMode();return;}
  if(win && !win.isDestroyed())win.setFullScreen(!win.isFullScreen());
}
function registerHandlers(){
  ipcMain.handle('projector:list-sources', async event => {
    requireTrusted(event);clearOffers();const epoch=++sourceEpoch;
    const items=(await desktopCapturer.getSources({types:['screen','window'],thumbnailSize:{width:240,height:135},fetchWindowIcons:false})).filter(s=>s.name!==win?.getTitle());
    if(epoch!==sourceEpoch)return [];
    const now=Date.now(); for(const source of items)offeredSources.set(source.id,{source,at:now});
    offerTimer=setTimeout(clearOffers,MAX_SOURCE_AGE);offerTimer.unref?.();
    return items.map(s=>({id:s.id,name:s.name || 'Untitled source',thumbnail:s.thumbnail.isEmpty()?'':s.thumbnail.toDataURL(),displayId:s.display_id||''}));
  });
  ipcMain.handle('projector:cancel-source-list',event=>{requireTrusted(event);sourceEpoch++;clearOffers();return true;});
  ipcMain.handle('projector:select-source',(event,id)=>{
    requireTrusted(event);
    if(typeof id!=='string' || id.length>300)throw new Error('Invalid capture source');
    const found=offeredSources.get(id);if(!found || Date.now()-found.at>MAX_SOURCE_AGE)throw new Error('Source selection expired. Please refresh the source list.');
    pendingSource=found; offeredSources.clear();return true;
  });
  ipcMain.handle('projector:displays',event=>{requireTrusted(event);return displays();});
  ipcMain.handle('projector:move-display',async(event,id)=>{requireTrusted(event);if(typeof id!=='string'||id.length>40)throw new Error('Invalid display');return moveToDisplay(id);});
  ipcMain.handle('projector:fullscreen',event=>{requireTrusted(event);toggleFullScreen();return true;});
  ipcMain.handle('projector:vj-mode',(event,enabled)=>{
    requireTrusted(event);
    if(typeof enabled!=='boolean')throw new Error('Invalid VJ mode');
    if(enabled)enterVjMode();else exitVjMode();
    return vjMode;
  });
  ipcMain.handle('projector:minimize',event=>{requireTrusted(event);win.minimize();return true;});
  ipcMain.handle('projector:close',event=>{requireTrusted(event);win.close();return true;});
  ipcMain.handle('projector:shortcut-status',event=>{requireTrusted(event);return shortcutRegistered;});
}
function configureSession(){
  const ses=session.defaultSession;
  ses.setPermissionRequestHandler((webContents, permission, callback) => callback(!!win && webContents===win.webContents && permission==='display-capture'));
  ses.setDisplayMediaRequestHandler((request,callback)=>{
    const selected=pendingSource;pendingSource=null;
    if(!win || win.isDestroyed() || request.frame!==win.webContents.mainFrame || !request.videoRequested || request.audioRequested || !selected || Date.now()-selected.at>MAX_SOURCE_AGE){callback(null);return;}
    callback({video:selected.source});
  });
}
function createWindow(){
  win=new BrowserWindow({width:1280,height:800,minWidth:500,minHeight:360,frame:false,resizable:true,show:false,backgroundColor:'#090b0c',title:'Glitch Canvas Projector App',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
  win.setMenuBarVisibility(false);win.loadFile(path.join(__dirname,'../renderer/index.html'));
  win.once('ready-to-show',()=>win.show());
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event)=>event.preventDefault());
  win.webContents.on('before-input-event',(event,input)=>{
    if(input.type!=='keyDown' || typeof input.key!=='string')return;
    const key=input.key.toLowerCase();
    if(vjMode && key==='escape'){event.preventDefault();exitVjMode();return;}
    if(!input.control || !input.alt || input.isAutoRepeat)return;
    if(!shortcutRegistered && key==='f'){event.preventDefault();toggleFullScreen();}
    else if(!vjShortcutRegistered && key==='t'){event.preventDefault();toggleVjMode();}
  });
  win.on('enter-full-screen',()=>win.webContents.send('projector:fullscreen-changed',true));
  win.on('leave-full-screen',()=>win.webContents.send('projector:fullscreen-changed',false));
  win.on('closed',()=>{win=null;vjMode=false;sourceEpoch++;clearOffers();});
}
app.whenReady().then(()=>{configureSession();registerHandlers();createWindow();try { shortcutRegistered=globalShortcut.register('Control+Alt+F',toggleFullScreen); } catch { shortcutRegistered=false; }try { vjShortcutRegistered=globalShortcut.register('Control+Alt+T',toggleVjMode); } catch { vjShortcutRegistered=false; }screen.on('display-added',sendDisplays);screen.on('display-removed',sendDisplays);screen.on('display-metrics-changed',sendDisplays);app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>globalShortcut.unregisterAll());
