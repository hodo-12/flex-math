// A deterministic, presentation-only fight. Mathematics in rules.js decides
// the winner once; animation timing can never change the submitted answer.
export const FIGHT_DURATION=7.8;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
const pulse=(t,a,b,c)=>t<b?ramp(t,a,b):1-ramp(t,b,c);
export function combatFrame(time,won){
  const t=Math.max(0,time),winner=won?0:1,loser=1-winner;
  const approach=ramp(t,.55,1.55);
  const poses=[0,1].map(i=>({
    x:(i===0?-1:1)*(1.8-1.02*approach),y:0,
    punch:0,arm:0,recoil:0,lean:0,defeat:0,cheer:0,
    moving:t>.55&&t<1.55
  }));
  const strikes=[{i:0,hit:2.05,arm:1},{i:1,hit:2.95,arm:0},
    {i:0,hit:3.8,arm:0},{i:1,hit:4.5,arm:1},
    {i:winner,hit:5.65,arm:1,final:true}];
  const health=[100,100];let impact=null;
  strikes.forEach((strike,index)=>{
    const {i,hit,arm,final}=strike,j=1-i;
    const extension=pulse(t,hit-(final?.45:.28),hit,hit+.28);
    if(extension>poses[i].punch){poses[i].punch=extension;poses[i].arm=arm;}
    poses[i].x+=(i===0?1:-1)*extension*(final?.38:.32);
    poses[i].lean+=extension*.12;
    const recoil=t>=hit?pulse(t,hit,hit+.09,hit+.42):0;
    poses[j].recoil=Math.max(poses[j].recoil,recoil);
    poses[j].x+=(j===0?-1:1)*recoil*.13;
    if(t>=hit)health[j]=final?0:Math.max(0,health[j]-(index<2?20:25));
    if(t>=hit&&t<hit+.28)impact={index,attacker:i,progress:(t-hit)/.28,final:!!final};
  });
  const defeat=ramp(t,5.72,6.65);
  poses[loser].x+=(loser===0?-1:1)*defeat*.9;
  poses[loser].defeat=defeat;
  poses[winner].cheer=ramp(t,6.45,7.1);
  const charge=pulse(t,4.8,5.17,5.65);
  let stage='ready',label='FIGHT!';
  if(t>=.55){stage='approach';label='상대에게 접근!';}
  if(t>=1.55){stage='exchange';label='공격 · 방어';}
  if(t>=4.8){stage='charge';label='모형의 힘을 모으는 중…';}
  if(t>=5.65){stage='knockout';label=won?'위상동형! 결정타!':'다른 구조! 상대의 결정타!';}
  if(t>=6.65){stage='victory';label=won?'YOU WIN':'YOU LOSE';}
  return {time:t,stage,label,health,poses,impact,charge,winner,done:t>=FIGHT_DURATION};
}
