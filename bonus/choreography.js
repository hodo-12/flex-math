// Presentation only: the existing topology rule determines the winner once.
export const DANCE_DURATION=12.4;
export const BPM=108;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
const window=(t,a,b,c,d)=>ramp(t,a,b)*(1-ramp(t,c,d));
export function danceFrame(time,won){
  const t=Math.max(0,time),winner=won?0:1,loser=1-winner;
  const poses=[0,1].map(i=>({x:i===0?-1.65:1.65,z:0,active:0,floor:0,spin:0,freeze:0,cheer:0,defeat:0,beat:t*BPM/60*Math.PI*2+i*Math.PI}));
  let stage='ready',move='READY?',active=-1;
  const solos=[{i:0,start:.6},{i:1,start:3.85}];
  for(const {i,start} of solos){
    const u=t-start,p=poses[i],presence=window(u,0,.4,2.75,3.15);
    p.x+=(i===0?1:-1)*1.12*presence;p.active=presence;
    p.floor=window(u,1.15,1.48,2.60,2.9)*presence;
    p.freeze=window(u,2,2.16,2.56,2.75);
    p.spin=ramp(u,1.48,2)*Math.PI*.65;
    if(u>=0&&u<3.15){stage=i===0?'red-solo':'yellow-solo';active=i;move=u<1.15?'TOP ROCK':u<2?'FOOTWORK':'ONE-HAND FREEZE';}
  }
  if(t>=7){
    stage='finale';active=winner;
    const p=poses[winner],entry=ramp(t,7,7.4);
    p.x=(winner===0?-1.65:1.65)*(1-entry);p.z=.35*entry;p.active=entry;
    p.floor=window(t,7.45,7.85,9.7,10.2);p.freeze=window(t,9.15,9.4,9.7,10.05);
    p.spin=t>=9.15?0:ramp(t,7.85,9.15)*Math.PI*4; // two full turns, then unwind-free recovery
    move=t<7.45?'TOPOLOGY POWER':t<9.15?'POWER SPIN':'FINAL FREEZE';
    poses[loser].x+=(loser===0?-1:1)*ramp(t,7,7.6)*.28;
  }
  if(t>=10.2){stage='result';move=won?'YOU WIN':'YOU LOSE';poses[winner].floor=0;poses[winner].cheer=ramp(t,10.2,10.6);poses[loser].defeat=ramp(t,10.2,10.7);}
  const flow=[Math.round(ramp(t,.6,3.5)*52),Math.round(ramp(t,3.85,6.75)*52)];
  if(t>=7){flow[winner]=Math.round(52+48*ramp(t,7,10.2));flow[loser]=52;}
  return {time:t,stage,move,active,winner,poses,flow,beat:Math.floor(t*BPM/60)%4,done:t>=DANCE_DURATION};
}
