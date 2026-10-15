// Add a face, name, palette and vehicle here. Grid, standings and results use
// this array's length; the existing game's character selector is untouched.
export const RACERS = Object.freeze([
  {id:'ruby',name:'빨강 공주',profile:'hood',face:'../hood.png',color:'#cf3654',light:'#ffb4bd',trim:'#ffe5a5',vehicle:'donut',vehicleName:'딸기 도넛',motto:'도넛은 굴러야 제맛!'},
  {id:'sapphire',name:'파랑 공주',profile:'smile',face:'../smile.png',color:'#4b80cc',light:'#c1e1ff',trim:'#fff2d6',vehicle:'cup',vehicleName:'로열 찻잔',motto:'차는 타는 거였어?'},
  {id:'sunny',name:'노랑 공주',profile:'cat',face:'../avatar-cat-head.png',color:'#e8b62d',light:'#ffe18b',trim:'#fff4ca',vehicle:'crown',vehicleName:'왕관 익스프레스',motto:'왕관의 무게? 가속의 무게!'},
  {id:'rose',name:'핑크 공주',profile:'cap',face:'../avatar-cap-head.png',color:'#df7eac',light:'#ffd0e5',trim:'#fff0f4',vehicle:'ribbon',vehicleName:'리본 로켓',motto:'리본 묶고 출발해!'},
  {id:'clover',name:'초록 공주',profile:'hood',face:'./assets/green-face.png',color:'#379b72',light:'#b0e4bd',trim:'#fff1b8',vehicle:'heart',vehicleName:'클로버 하트 마차',motto:'초록불이니까 먼저 갈게!',
    // Display window only: original uploaded PNG is stored byte-for-byte.
    faceWindow:{x:180,y:40,width:700,height:760,sourceWidth:976,sourceHeight:1433},
    palette:{color:0x379b72,light:0xb0e4bd,trim:0xfff1b8,shoe:0x287d5c}},
]);

export function portraitHTML(racer) {
  const w=racer.faceWindow;
  const style=w?`width:${w.sourceWidth/w.width*100}%;height:${w.sourceHeight/w.height*100}%;left:${-w.x/w.width*100}%;top:${-w.y/w.height*100}%;`:'';
  return `<span class="portrait" style="--racer:${racer.color}"><img src="${racer.face}" alt="${racer.name} 원본 얼굴" style="${style}"></span>`;
}
