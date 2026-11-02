'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('projector', Object.freeze({
 listSources:()=>ipcRenderer.invoke('projector:list-sources'),
 cancelSourceList:()=>ipcRenderer.invoke('projector:cancel-source-list'),
 selectSource:id=>ipcRenderer.invoke('projector:select-source',id),
 displays:()=>ipcRenderer.invoke('projector:displays'),
 moveDisplay:id=>ipcRenderer.invoke('projector:move-display',id),
 fullscreen:()=>ipcRenderer.invoke('projector:fullscreen'),
 minimize:()=>ipcRenderer.invoke('projector:minimize'),
 close:()=>ipcRenderer.invoke('projector:close'),
 shortcutStatus:()=>ipcRenderer.invoke('projector:shortcut-status'),
 setVjMode:enabled=>ipcRenderer.invoke('projector:vj-mode',enabled),
 onVjRequest:fn=>{if(typeof fn==='function')ipcRenderer.on('projector:vj-request',()=>fn());},
 onVjModeChanged:fn=>{if(typeof fn==='function')ipcRenderer.on('projector:vj-mode-changed',(_e,value)=>fn(value===true));},
 onDisplaysChanged:fn=>{if(typeof fn==='function')ipcRenderer.on('projector:displays-changed',(_e,data)=>fn(data));},
 onFullscreenChanged:fn=>{if(typeof fn==='function')ipcRenderer.on('projector:fullscreen-changed',(_e,value)=>fn(value));}
}));
