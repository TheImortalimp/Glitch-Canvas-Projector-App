'use strict';
let activeStream=null, localObjectUrl=null;
const sourceDialog=document.getElementById('source-dialog'),sourceGrid=document.getElementById('source-grid'),sourceStatus=document.getElementById('source-status'),launchStatus=document.getElementById('launch-status');
function report(message,error=false){launchStatus.textContent=message;launchStatus.classList.toggle('error',error);sourceStatus.textContent=message;sourceStatus.classList.toggle('error',error);const panelStatus=document.getElementById('panel-status');panelStatus.textContent=message;panelStatus.classList.toggle('error',error);}
function clearSource(){
 const previous=activeStream;activeStream=null;if(previous)previous.getTracks().forEach(t=>t.stop());
 sourceVideo.pause();sourceVideo.srcObject=null;sourceVideo.removeAttribute('src');sourceVideo.load();
 if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=null;}
}
function showStage(label){
 document.body.classList.add('playing');document.getElementById('ui-toggle-tab').style.display='block';
 sliderContainer.style.display='block';glitchCanvas.style.zIndex='2';
 document.getElementById('live-source').textContent=label;
 if(isAutoGlitching)persistentAutoGlitchLoop();if(isAiWarpActive)startGlitchOverlay();if(!isLooping)mainRenderLoop();report('Source active: '+label);
}
function stopSource(){clearSource();stopGlitchOverlay();activeEffects=[];document.body.classList.remove('playing','ui-hidden');isUIHidden=false;toggleUiBtn.textContent='HIDE CONTROL U.I.';document.getElementById('ui-toggle-tab').style.display='none';report('Source stopped. Choose a screen or window to begin.');}
async function chooseCapture(source){
 let stream=null;try{
  await window.projector.selectSource(source.id);
  stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:60}},audio:false});
  clearSource();activeStream=stream;sourceVideo.srcObject=stream;
  const track=stream.getVideoTracks()[0];if(track)track.addEventListener('ended',()=>{if(activeStream===stream)stopSource();},{once:true});
  await sourceVideo.play();sourceDialog.close();showStage(source.name);
 }catch(error){if(stream && activeStream===stream){clearSource();document.body.classList.remove('playing');}report('Could not start sharing: '+(error.message||'permission denied'),true);}
}
async function openSourcePicker(){
 if(!window.projector){report('Screen sharing is available in the desktop app only.',true);return;}
 sourceGrid.replaceChildren();report('Looking for screens and windows…');if(!sourceDialog.open)sourceDialog.showModal();
 try{
  const sources=await window.projector.listSources();if(!sources.length){report('No sources found. Check screen-recording permission and try again.',true);return;}
  sourceStatus.textContent='Choose one source. Screen sharing begins only after your selection.';
  for(const source of sources){const b=document.createElement('button');b.className='source-card';b.type='button';
   if(source.thumbnail){const img=document.createElement('img');img.src=source.thumbnail;img.alt='';b.appendChild(img);}else{const placeholder=document.createElement('span');placeholder.className='source-placeholder';placeholder.textContent='SCREEN / WINDOW';b.appendChild(placeholder);}
   const name=document.createElement('span');name.className='source-name';name.textContent=source.name;b.appendChild(name);b.addEventListener('click',()=>chooseCapture(source));sourceGrid.appendChild(b);}
 }catch(error){report('Unable to list sources: '+(error.message||'permission denied'),true);}
}
document.getElementById('open-source').addEventListener('click',openSourcePicker);
document.getElementById('new-source').addEventListener('click',openSourcePicker);
document.getElementById('refresh-sources').addEventListener('click',openSourcePicker);
document.getElementById('close-source-dialog').addEventListener('click',()=>sourceDialog.close());
sourceDialog.addEventListener('close',()=>{sourceGrid.replaceChildren();if(window.projector)window.projector.cancelSourceList().catch(()=>{});});
document.getElementById('stop-source').addEventListener('click',stopSource);
async function useLocalVideo(file){
 if(!file || !(file.type.startsWith('video/') || /\.(mp4|webm|ogv|mov|m4v)$/i.test(file.name))){report('Drop a supported local video file.',true);return;}
 clearSource();localObjectUrl=URL.createObjectURL(file);sourceVideo.src=localObjectUrl;sourceVideo.loop=true;
 try{await sourceVideo.play();if(sourceDialog.open)sourceDialog.close();showStage('Local video: '+file.name);}catch(error){clearSource();report('Could not play this file. The installed Electron codecs may not support it.',true);}
}
document.getElementById('video-file').addEventListener('change',e=>{const file=e.target.files[0];if(file)useLocalVideo(file);e.target.value='';});
for(const eventName of ['dragenter','dragover'])document.addEventListener(eventName,e=>{if(Array.from(e.dataTransfer?.types||[]).includes('Files')){e.preventDefault();document.body.classList.add('dragging-file');}});
document.addEventListener('dragleave',e=>{if(!e.relatedTarget)document.body.classList.remove('dragging-file');});
document.addEventListener('drop',e=>{e.preventDefault();document.body.classList.remove('dragging-file');const file=e.dataTransfer?.files?.[0];if(file)useLocalVideo(file);});
window.addEventListener('beforeunload',clearSource);
const displaySelect=document.getElementById('display-select');
function updateDisplays(displays){const old=displaySelect.value;displaySelect.replaceChildren();const first=document.createElement('option');first.value='';first.textContent='Move to display…';displaySelect.appendChild(first);for(const d of displays){const option=document.createElement('option');option.value=d.id;option.textContent=`${d.label}${d.primary?' · primary':''} (${d.width} × ${d.height})`;displaySelect.appendChild(option);}if([...displaySelect.options].some(o=>o.value===old))displaySelect.value=old;}
if(window.projector){window.projector.displays().then(updateDisplays).catch(e=>report('Could not list displays: '+e.message,true));window.projector.onDisplaysChanged(updateDisplays);window.projector.onFullscreenChanged(v=>{document.getElementById('fullscreen-window').setAttribute('aria-label',v?'Exit fullscreen':'Enter fullscreen');});window.projector.shortcutStatus().then(ok=>{if(!ok)document.getElementById('shortcut-note').textContent='Shortcut unavailable globally; use the fullscreen button or press Ctrl+Alt+F while focused.';});}
displaySelect.addEventListener('change',async()=>{if(!displaySelect.value)return;try{await window.projector.moveDisplay(displaySelect.value);}catch(e){report('Could not move window: '+e.message,true);}});
document.getElementById('fullscreen-window').addEventListener('click',()=>window.projector.fullscreen());
document.getElementById('minimize-window').addEventListener('click',()=>window.projector.minimize());
document.getElementById('close-window').addEventListener('click',()=>window.projector.close());
