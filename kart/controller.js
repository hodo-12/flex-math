import {RACERS,portraitHTML} from './racers.js';
import {Race,TRACK_LENGTH,LAPS} from './race.js';
import {createKartScene} from './scene.js';
import {createBeat} from '../bonus/beat.js';
const $=id=>document.getElementById(id),music=createBeat();
let race=new Race(RACERS),stage,ready=false,selected=RACERS.at(-1).id,frame=0,last=performance.now(),visualTime=0,ended=false,disposed=false,lastEvent=0,lastOrder='',lastPaint=-1;
$('racerCount').textContent=RACERS.length;
const rows=new Map();
for(const [i,c] of RACERS.entries()){
  const button=document.createElement('button');button.className='racer-card';button.dataset.racer=c.id;button.style.setProperty('--racer',c.color);button.setAttribute('aria-pressed',String(c.id===selected));
  button.innerHTML=`${portraitHTML(c)}<span><b>${c.name}</b><small>${c.vehicleName}</small></span><span class="picked-mark">♥</span>`;
  button.onclick=()=>{if(!['ready','finished'].includes(race.phase))return;selected=c.id;stage?.setSelected(selected);selectUI();paint(true);};$('racers').append(button);
  const row=document.createElement('li');row.dataset.racer=c.id;row.innerHTML=`<span class="rank">${i+1}</span>${portraitHTML(c)}<span class="standing-copy"><b>${c.name}</b><small>${c.vehicleName}</small></span><span class="finish-check"></span>`;rows.set(c.id,row);$('standings').append(row);
}
function selectUI(){for(const el of $('racers').children)el.setAttribute('aria-pressed',String(el.dataset.racer===selected));for(const [id,row] of rows)row.classList.toggle('picked',id===selected);}
function announcement(text){$('announcement').textContent=text;}
function paint(force=false){
  if(!force&&visualTime-lastPaint<.09)return;lastPaint=visualTime;
  const active=['racing','countdown'].includes(race.phase),picked=race.racers.find(r=>r.id===selected),chosen=RACERS.find(c=>c.id===selected);
  $('start').disabled=!ready||active;$('start').innerHTML=race.phase==='finished'?'한 판 더! <span>↗</span>':active?'레이스 진행 중…':'같이 출발! <span>↗</span>';
  $('reset').disabled=!ready;$('pause').disabled=!active;$('pause').textContent=race.paused?'계속 달리기':'일시 정지';
  $('boost').disabled=!ready||race.phase!=='racing'||race.paused||picked.finished||picked.boostReady>0;
  $('boostState').textContent=picked.finished?'완주!':race.phase!=='racing'?'출발 후 사용':picked.boostReady>0?`${Math.ceil(picked.boostReady)}초 후 충전`:chosen.name+'에게!';
  $('mobileControls').hidden=!active;$('mobileBoost').disabled=$('boost').disabled;$('mobileBoostState').textContent=$('boostState').textContent;$('mobilePause').textContent=$('pause').textContent;
  for(const b of $('racers').children)b.disabled=active;
  $('phaseLabel').textContent=race.paused?'잠시 쉬는 중':{ready:'출발 준비',countdown:'카운트다운',racing:'레이스 중',finished:'FINISH'}[race.phase];
  $('boardTitle').textContent=race.phase==='finished'?'오늘의 최종 순위':race.phase==='ready'?'오늘의 출전 명단':'지금 앞서가는 친구';
  const order=race.order,key=order.map(r=>r.id).join(',');
  if(key!==lastOrder){for(const r of order)$('standings').append(rows.get(r.id));lastOrder=key;}
  for(const r of order){const el=rows.get(r.id);el.querySelector('.rank').textContent=r.rank;el.querySelector('.rank').classList.toggle('first',r.rank===1);el.querySelector('.finish-check').textContent=r.finished?'FIN':' ';el.querySelector('small').textContent=r.finished?`${r.finishTime.toFixed(2)}초`:race.phase==='racing'?`${Math.min(LAPS,Math.floor(r.distance/TRACK_LENGTH)+1)} / ${LAPS} 바퀴`:RACERS.find(c=>c.id===r.id).vehicleName;}
  $('timer').textContent=`00:${race.raceTime.toFixed(1).padStart(4,'0')}`;
  $('lap').textContent=active?`LAP ${Math.min(LAPS,Math.floor(order[0].distance/TRACK_LENGTH)+1)} / ${LAPS}`:race.phase==='finished'?'FINISH':`${LAPS} LAPS`;
  const count=$('countdown');count.hidden=!race.paused&&race.phase!=='countdown'&&!(race.phase==='racing'&&race.raceTime<.8);count.classList.toggle('paused',race.paused);const value=race.paused?'잠깐 쉬어 가자':race.phase==='countdown'?String(Math.max(1,Math.ceil(race.countdown))):'GO!';if(count.textContent!==value)count.textContent=value;
  $('passes').textContent=race.stats.overtakes;$('bumps').textContent=race.stats.collisions;
  const event=race.events.at(-1);
  if(event&&event.id!==lastEvent){lastEvent=event.id;const c=RACERS.find(c=>c.id===event.racer);$('liveNote').textContent=`${c.name} · ${event.text}`;}
  if(race.phase==='finished'&&!ended){ended=true;const winner=RACERS.find(c=>c.id===order[0].id);$('winnerTitle').textContent=`${winner.name}, 우승!`;$('resultCopy').textContent=`${winner.motto} 응원한 ${chosen.name}는 ${picked.rank}등으로 들어왔어. 다음 판엔 누가 웃을까?`;$('result').hidden=false;announcement(`${winner.name} 우승. ${chosen.name} ${picked.rank}등. 모두 결승선에 도착했어요.`);$('liveNote').textContent='모두 완주! 오늘도 우정은 무사합니다.';$('start').focus({preventScroll:true});}
}
function reset(){race.reset(crypto.getRandomValues(new Uint32Array(1))[0]);ended=false;lastEvent=0;lastOrder='';$('result').hidden=true;$('liveNote').textContent='친구를 고르고 함께 출발해 봐!';last=performance.now();paint(true);}
$('start').onclick=()=>{if(!ready||!['ready','finished'].includes(race.phase))return;if(race.phase==='finished')reset();race.start();paint(true);announcement(`${RACERS.length}명의 공주가 함께 출발합니다.`);if(matchMedia('(max-width:760px)').matches)document.querySelector('.arena').scrollIntoView({behavior:stage.motion?'smooth':'instant',block:'start'});};
$('boost').onclick=()=>{if(race.boost(selected)){announcement(`${RACERS.find(c=>c.id===selected).name} 부스터!`);paint(true);}};
$('mobileBoost').onclick=()=>$('boost').click();$('mobilePause').onclick=()=>$('pause').click();
$('pause').onclick=()=>{race.togglePause();paint(true);};$('reset').onclick=reset;
function motionUI(){$('motion').textContent=stage.motion?'효과 켜짐':'효과 꺼짐';$('motion').setAttribute('aria-pressed',String(stage.motion));}
$('motion').onclick=()=>{stage.setMotion(!stage.motion);motionUI();};
$('camera').onclick=()=>{if(!stage)return;stage.setClose(!stage.close);$('camera').textContent=stage.close?'전체 보기':'친구 가까이';$('camera').setAttribute('aria-pressed',String(stage.close));};
$('sound').onclick=async()=>{try{await music.setEnabled(!music.enabled);$('sound').textContent=music.enabled?'♫ 음악 끄기':'♫ 음악 켜기';$('sound').setAttribute('aria-pressed',String(music.enabled));}catch{$('sound').textContent='음악 재생 불가';}};
function keyboard(event){if(event.code!=='Space'||event.repeat||event.target.closest('button,a,input,textarea,select'))return;if(race.phase==='racing'){event.preventDefault();$('boost').click();}}
document.addEventListener('keydown',keyboard);
function visibility(){last=performance.now();}
document.addEventListener('visibilitychange',visibility);
function render(now){if(disposed)return;const dt=Math.min(Math.max((now-last)/1000,0),.5);last=now;if(!document.hidden){if(!race.paused)visualTime+=dt;race.advance(dt);stage.draw(race,visualTime,dt);paint();}frame=requestAnimationFrame(render);}
selectUI();paint(true);$('motion').disabled=true;$('camera').disabled=true;
try{stage=await createKartScene($('stage'),RACERS);stage.setSelected(selected);ready=true;$('loadStatus').hidden=true;$('motion').disabled=false;$('camera').disabled=false;$('camera').textContent=stage.close?'전체 보기':'친구 가까이';$('camera').setAttribute('aria-pressed',String(stage.close));motionUI();paint(true);last=performance.now();frame=requestAnimationFrame(render);}
catch(error){$('loadStatus').textContent='3D 카트를 불러오지 못했어요. WebGL 지원 브라우저에서 새로고침해 줘.';console.error(error);}
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);document.removeEventListener('keydown',keyboard);document.removeEventListener('visibilitychange',visibility);stage?.dispose();music.dispose();},{once:true});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
