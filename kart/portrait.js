// Display masks only. The source PNG remains untouched; every opaque canvas
// pixel is copied at 1:1 scale from that original. UI and WebGL share one path.
let portraitSerial=0;

export function createPortraitCanvas(image,window){
  const canvas=document.createElement('canvas');
  canvas.width=window.width;canvas.height=window.height;
  const ctx=canvas.getContext('2d');
  ctx.translate(-window.x,-window.y);
  if(window.outline){
    ctx.clip(new Path2D(window.outline));
  }else{
    ctx.beginPath();
    ctx.ellipse(window.x+window.width/2,window.y+window.height/2,window.width*.49,window.height*.5,0,0,Math.PI*2);
    ctx.clip();
  }
  ctx.drawImage(image,0,0);
  return canvas;
}

export function portraitHTML(racer){
  const w=racer.faceWindow;
  let mask='',style=w?`width:${w.sourceWidth/w.width*100}%;height:${w.sourceHeight/w.height*100}%;left:${-w.x/w.width*100}%;top:${-w.y/w.height*100}%;`:'';
  if(w?.outline){
    const id=`portrait-contour-${++portraitSerial}`;
    mask=`<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs><clipPath id="${id}" clipPathUnits="objectBoundingBox"><path transform="scale(${1/w.sourceWidth} ${1/w.sourceHeight})" d="${w.outline}"/></clipPath></defs></svg>`;
    style+=`clip-path:url(#${id});`;
  }
  return `<span class="portrait" style="--racer:${racer.color}">${mask}<img src="${racer.face}" alt="${racer.name} 원본 얼굴" style="${style}"></span>`;
}
