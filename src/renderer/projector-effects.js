/* Live-source effects: only the user-selected stream or dropped local video is sampled. */
function drawContained(ctx,video,x,y,width,height){
 const vw=video.videoWidth||width,vh=video.videoHeight||height,scale=Math.min(width/vw,height/vh),dw=vw*scale,dh=vh*scale;
 ctx.drawImage(video,x+(width-dw)/2,y+(height-dh)/2,dw,dh);
}
function chromaticEchoFactory(getStrength,persistent=false){
 const render=()=>{const s=getStrength();if(s<.001||sourceVideo.readyState<2)return;const w=glitchCanvas.width,h=glitchCanvas.height;if(!w||!h)return;const t=customTime*.001,offset=(5+24*s)*Math.sin(t*.7);
  gctx.save();try{gctx.globalCompositeOperation='screen';gctx.globalAlpha=.12*s;gctx.filter='hue-rotate(115deg) saturate(1.6)';drawContained(gctx,sourceVideo,offset,0,w,h);gctx.filter='hue-rotate(285deg) saturate(1.6)';drawContained(gctx,sourceVideo,-offset,0,w,h);}finally{gctx.restore();}
 };return persistent?render:createTimedEffect(render);
}
function temporalSlicesFactory(getStrength,persistent=false){
 let frames=null,index=0,lastCapture=-Infinity;
 const render=()=>{const s=getStrength();if(s<.001){frames=null;lastCapture=-Infinity;return;}if(sourceVideo.readyState<2)return;const w=glitchCanvas.width,h=glitchCanvas.height;if(!w||!h)return;
  const scale=Math.min(640/w,360/h),fw=Math.max(1,Math.round(w*scale)),fh=Math.max(1,Math.round(h*scale));
  if(!frames){frames=Array.from({length:6},()=>document.createElement('canvas'));}
  if(frames[0].width!==fw||frames[0].height!==fh){for(const frame of frames){frame.width=fw;frame.height=fh;}index=0;lastCapture=-Infinity;}
  if(customTime-lastCapture>160){const c=frames[index],ctx=c.getContext('2d');ctx.clearRect(0,0,fw,fh);drawContained(ctx,sourceVideo,0,0,fw,fh);index=(index+1)%frames.length;lastCapture=customTime;}
  const slices=3+Math.floor(s*7),height=h/slices;gctx.save();try{gctx.globalAlpha=.25+.42*s;for(let i=0;i<slices;i++){const img=frames[(index+i)%frames.length];const shift=Math.sin(customTime*.0015+i*2)*s*28;gctx.drawImage(img,0,i*fh/slices,fw,fh/slices,shift,i*height,w,height+1);}}finally{gctx.restore();}
 };return persistent?render:createTimedEffect(render);
}
