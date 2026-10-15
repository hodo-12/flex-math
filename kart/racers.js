// Add a face, name, palette and vehicle here. Grid, standings and results use
// this array's length; the existing game's character selector is untouched.
export const RACERS = Object.freeze([
  {id:'ruby',name:'빨강 공주',profile:'hood',face:'../hood.png',color:'#cf3654',light:'#ffb4bd',trim:'#ffe5a5',vehicle:'donut',vehicleName:'딸기 도넛',motto:'도넛은 굴러야 제맛!'},
  {id:'sapphire',name:'파랑 공주',profile:'smile',face:'../smile.png',color:'#4b80cc',light:'#c1e1ff',trim:'#fff2d6',vehicle:'cup',vehicleName:'로열 찻잔',motto:'차는 타는 거였어?'},
  {id:'sunny',name:'노랑 공주',profile:'cat',face:'../avatar-cat-head.png',color:'#e8b62d',light:'#ffe18b',trim:'#fff4ca',vehicle:'crown',vehicleName:'왕관 익스프레스',motto:'왕관의 무게? 가속의 무게!'},
  {id:'rose',name:'핑크 공주',profile:'cap',face:'../avatar-cap-head.png',color:'#df7eac',light:'#ffd0e5',trim:'#fff0f4',vehicle:'ribbon',vehicleName:'리본 로켓',motto:'리본 묶고 출발해!'},
  {id:'clover',name:'초록 공주',profile:'hood',face:'./assets/green-face.png',color:'#379b72',light:'#b0e4bd',trim:'#fff1b8',vehicle:'heart',vehicleName:'클로버 하트 마차',motto:'초록불이니까 먼저 갈게!',
    // Tight original-pixel display window. The hand-traced head contour removes
    // the grey photo backdrop without generating or retouching facial pixels.
    faceWindow:{x:210,y:65,width:620,height:665,sourceWidth:976,sourceHeight:1433,
      outline:'M 541 84 C 511 66 471 70 430 88 C 391 113 354 154 325 213 C 295 270 278 327 264 381 C 252 426 241 475 231 523 C 211 565 224 611 258 644 C 297 680 350 691 405 684 C 429 681 447 669 459 653 C 489 689 529 715 570 720 C 612 717 655 687 684 646 C 716 669 761 685 799 674 C 824 664 826 628 820 590 C 818 542 806 495 792 449 C 780 407 779 365 770 324 C 754 241 728 180 678 134 C 635 94 587 77 549 86 Z'},
    palette:{color:0x379b72,light:0xb0e4bd,trim:0xfff1b8,shoe:0x287d5c}},
]);

export {portraitHTML} from './portrait.js';
