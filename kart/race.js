// Pure deterministic race simulation; no DOM, Three.js, timers or game globals.
export const LAPS=2;
export const TRACK={rx:7.2,rz:4.5,halfWidth:2.45};
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const samples=512,arc=[0];
for(let i=1;i<=samples;i++){
  const a=(i-1)/samples*TAU-Math.PI/2,b=i/samples*TAU-Math.PI/2;
  arc.push(arc[i-1]+Math.hypot(TRACK.rx*(Math.sin(b)-Math.sin(a)),TRACK.rz*(Math.cos(b)-Math.cos(a))));
}
export const TRACK_LENGTH=arc.at(-1);
export function trackPoint(distance,lane=0){
  const d=((distance%TRACK_LENGTH)+TRACK_LENGTH)%TRACK_LENGTH;
  let lo=0,hi=samples;while(hi-lo>1){const mid=(lo+hi)>>1;if(arc[mid]<=d)lo=mid;else hi=mid;}
  const a=(lo+(d-arc[lo])/(arc[hi]-arc[lo]))/samples*TAU-Math.PI/2;
  const dx=TRACK.rx*Math.cos(a),dz=-TRACK.rz*Math.sin(a),len=Math.hypot(dx,dz);
  return {x:TRACK.rx*Math.sin(a)-dz/len*lane,z:TRACK.rz*Math.cos(a)+dx/len*lane,yaw:Math.atan2(dx,dz)};
}
function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

export class Race {
  constructor(config,{seed=417,laps=LAPS}={}){
    if(config.length<2||new Set(config.map(r=>r.id)).size!==config.length)throw new Error('Racers need unique IDs (at least two).');
    this.config=config;this.seed=seed;this.laps=laps;this.reset(seed);
  }
  reset(seed=this.seed){
    this.seed=seed;const rnd=random(seed);
    this.phase='ready';this.paused=false;this.time=0;this.raceTime=0;this.countdown=3;this.accumulator=0;this.events=[];this.serial=0;this.finishOrder=[];this.cooldowns=new Map();this.stats={collisions:0,overtakes:0};
    this.racers=this.config.map((c,i)=>({id:c.id,index:i,distance:0,lane:(i-(this.config.length-1)/2)*Math.min(.94,3.8/(this.config.length-1)),speed:0,velocity:0,pace:2.07+rnd()*.13,offset:rnd()*TAU,nextBoost:5+rnd()*7,boost:0,boostReady:0,bump:0,lean:0,reaction:'준비 완료!',reactionUntil:0,rank:i+1,finished:false,finishTime:null}));
  }
  start(){if(this.phase!=='ready')return false;this.phase='countdown';return true;}
  togglePause(){if(!['countdown','racing'].includes(this.phase))return false;this.paused=!this.paused;return this.paused;}
  boost(id){const r=this.racers.find(r=>r.id===id);if(this.phase!=='racing'||this.paused||!r||r.finished||r.boostReady>0)return false;r.boost=1.65;r.boostReady=7;this.say(r,'부스터다아!','boost');return true;}
  say(r,text,kind,other=null){r.reaction=text;r.reactionUntil=this.raceTime+1.7;this.events.push({id:++this.serial,kind,racer:r.id,other,text,time:this.raceTime});if(this.events.length>12)this.events.shift();}
  get order(){return [...this.racers].sort((a,b)=>a.finished&&b.finished?a.finishTime-b.finishTime:a.finished?-1:b.finished?1:b.distance-a.distance||a.index-b.index);}
  // Fixed simulation steps keep collisions and finish ordering independent of FPS.
  advance(dt){if(this.paused||!Number.isFinite(dt)||dt<=0)return;this.accumulator+=Math.min(dt,.5);while(this.accumulator>=1/60){this.step(1/60);this.accumulator-=1/60;}}
  step(dt){
    if(this.phase==='ready'||this.phase==='finished')return;
    this.time+=dt;
    if(this.phase==='countdown'){this.countdown=Math.max(0,3-this.time);if(this.countdown<=1e-7){this.phase='racing';this.say(this.racers[0],'다 같이 출발!','start');}return;}
    this.raceTime+=dt;const previous=this.order.map(r=>r.id),active=this.racers.filter(r=>!r.finished),front=Math.max(...this.racers.map(r=>r.distance));
    for(const r of active){
      r.boostReady=Math.max(0,r.boostReady-dt);r.boost=Math.max(0,r.boost-dt);r.bump=Math.max(0,r.bump-dt*1.8);
      if(this.raceTime>=r.nextBoost){r.boost=Math.max(r.boost,.9);r.nextBoost=this.raceTime+8+(r.index*1.71+this.seed%7)%6;this.say(r,'지금이야! 슝~','boost');}
      const before=r.lane;
      // All racers converge after the start, then look for passing room.
      let desired=Math.sin(this.raceTime*.65+r.offset)*1.15;
      const ahead=active.find(o=>o!==r&&o.distance>r.distance&&o.distance-r.distance<2&&Math.abs(o.lane-r.lane)<.75);
      if(ahead)desired=clamp(ahead.lane+(r.index%2?-.95:.95),-1.85,1.85);
      if(this.raceTime<1.2)desired=r.lane;
      r.velocity+=(desired-r.lane)*dt*3;r.velocity*=Math.exp(-dt*3);r.lane=clamp(r.lane+r.velocity*dt,-1.9,1.9);
      r.lean+=(clamp((r.lane-before)/dt,-1,1)-r.lean)*dt*5;
      const catchup=clamp((front-r.distance)*.065,0,.32);
      const target=r.pace+Math.sin(this.raceTime*1.05+r.offset)*.36+catchup+(r.boost>0?.95:0)-r.bump*.32;
      r.speed+=(target-r.speed)*(1-Math.exp(-dt*3));
      const old=r.distance;r.distance+=r.speed*dt;
      if(r.distance>=this.laps*TRACK_LENGTH){r.finished=true;r.finishTime=this.raceTime-dt+(this.laps*TRACK_LENGTH-old)/(r.distance-old)*dt;this.finishOrder.push(r.id);this.say(r,'결승선 통과!','finish');}
    }
    // Nearby karts share contact impulses. Neither photos nor rigs are detached.
    for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
      const a=active[i],b=active[j];if(a.finished||b.finished||this.raceTime<1.2)continue;
      const gap=Math.abs(a.distance-b.distance)%TRACK_LENGTH,longitudinal=Math.min(gap,TRACK_LENGTH-gap),lateral=Math.abs(a.lane-b.lane),key=[a.id,b.id].sort().join(':');
      if(longitudinal<1.05&&lateral<.92&&(this.cooldowns.get(key)||0)<this.raceTime){
        const side=Math.sign(a.lane-b.lane)||(i%2?1:-1);a.velocity+=side*1.65;b.velocity-=side*1.65;a.bump=b.bump=1;
        const separate=(1.02-lateral)*.5;a.lane=clamp(a.lane+side*separate,-1.9,1.9);b.lane=clamp(b.lane-side*separate,-1.9,1.9);
        a.speed*=.88;b.speed*=.88;this.cooldowns.set(key,this.raceTime+2);this.stats.collisions++;this.say(a,'앗, 미안!','bump',b.id);b.reaction=b.id==='sapphire'?'내 찻잔은 안전해?!':'앗! 내 드레스!';b.reactionUntil=this.raceTime+1.7;
      }
    }
    const order=this.order;order.forEach((r,i)=>{
      const old=previous.indexOf(r.id);r.rank=i+1;
      if(this.raceTime>1.5&&old>i&&!r.finished){this.stats.overtakes++;this.say(r,i===0?'내가 선두야!':'먼저 갈게~','pass');const passed=this.racers.find(o=>o.id===previous[i]);if(passed&&passed!==r){passed.reaction='어? 언제 왔어?!';passed.reactionUntil=this.raceTime+1.7;}}
    });
    // Finish ranks are interpolated crossing times, not array iteration order.
    this.finishOrder=order.filter(r=>r.finished).map(r=>r.id);
    if(this.finishOrder.length===this.racers.length){this.phase='finished';order.forEach((r,i)=>{r.reaction=i===0?'왕관은 내 거!':i===1?'다음엔 내가 1등!':i===2?'박수 짝짝!':'잠깐, 차가 왜 이래…';r.reactionUntil=Infinity;});}
  }
}
