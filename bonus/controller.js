// Bonus state is independent; only the unchanged catalogue/rule contract is reused.
import {Match,models,rounds,explain} from '../special/rules.js';
import {modelIcon} from '../special/icons.js';
import {createDanceStage} from './scene.js';
import {createBeat} from './beat.js';
const $=id=>document.getElementById(id);
let match=new Match(),stage,ready=false,selected=null,lastMove='',lastBeat=-1;
const music=createBeat();
const type=id=>models[id].dimension===2?'2D · 표면':'1D · 선';
function result(kind,kicker,title,text){$('result').dataset.kind=kind;$('resultMark').textContent=kind==='win'?'W':kind==='lose'?'L':'♪';$('resultKicker').textContent=kicker;$('resultTitle').textContent=title;$('resultExplanation').textContent=text;}
function button(){ $('dance').disabled=!ready||!selected||match.phase!=='select';$('dance').firstElementChild.textContent=selected?'이 모형으로 비보잉 배틀':'모형을 먼저 골라 줘'; }
function flow(values){values.forEach((v,i)=>{const meter=$('flow'+i).parentElement;if(meter.getAttribute('aria-valuenow')!==String(v)){$('flow'+i).style.width=v+'%';meter.setAttribute('aria-valuenow',v);}});}
function score(){$('score').textContent=`${match.scores[0]}승 · ${match.scores[1]}패`;}
function paint(){
  selected=null;lastMove='';lastBeat=-1;
  $('roundLabel').textContent=`ROUND ${String(match.index+1).padStart(2,'0')}`;$('roundCount').textContent=`${match.index+1} / ${rounds.length}`;
  $('target').textContent=models[match.round.target].name;$('targetIcon').innerHTML=modelIcon(match.round.target);$('targetType').textContent=type(match.round.target);
  $('choices').replaceChildren();
  match.round.options.forEach((id,i)=>{
    const b=document.createElement('button');b.className='choice';b.type='button';b.dataset.model=id;b.setAttribute('aria-pressed','false');
    b.innerHTML=`<span class="choice-number">0${i+1}</span><span class="shape-icon">${modelIcon(id)}</span><span class="choice-copy"><b>${models[id].name}</b><small>${type(id)}</small></span><span class="check" aria-hidden="true">✓</span>`;
    b.onclick=()=>{if(match.phase!=='select')return;selected=id;for(const el of $('choices').children)el.setAttribute('aria-pressed',String(el===b));stage?.select(id);$('selectionNote').textContent=`빨강 공주가 ‘${models[id].name}’을 골랐어요.`;button();};$('choices').append(b);
  });
  $('dance').hidden=false;$('next').hidden=true;$('readResult').hidden=true;
  $('moveLabel').textContent='PICK YOUR SHAPE';$('turnLabel').textContent='WELCOME TO THE CYPHER';document.querySelector('.move-banner').dataset.phase='select';
  $('danceStatus').textContent='모형을 고르면 배틀을 시작할 수 있어요';$('selectionNote').textContent='늘리고 구부려서 같은 구조로 바꿀 수 있을까?';
  for(const bar of $('beatBars').children)bar.classList.remove('active');
  result('select','SHAPE DECIDES THE WINNER','춤은 다르게, 구조는 같게.','빨강 공주와 노랑 공주가 번갈아 춤을 춰요. 내가 고른 모형이 위상동형이면 빨강 공주가 마지막 파워 무브로 승리해요.');
  flow([0,0]);stage?.setRound(match.round);button();
}
function onFrame(frame){
  flow(frame.flow);
  if(lastBeat!==frame.beat){lastBeat=frame.beat;[...$('beatBars').children].forEach((bar,i)=>bar.classList.toggle('active',i===frame.beat&&stage.motion));}
  const key=frame.stage+frame.move;if(lastMove===key)return;lastMove=key;
  document.querySelector('.move-banner').dataset.phase=frame.stage;
  $('moveLabel').textContent=frame.move;
  $('turnLabel').textContent=frame.stage==='result'?(match.result.won?'위상동형 · 빨강 공주 승리':'다른 구조 · 노랑 공주 승리'):frame.active===0?'RED PRINCESS / 빨강 공주의 턴':frame.active===1?'YELLOW PRINCESS / 노랑 공주의 턴':'CHOOSE · GROOVE · WIN';
  $('danceStatus').textContent=frame.stage==='result'?'배틀 종료 · 판정 설명을 확인해 봐':frame.move==='POWER SPIN'?'모형의 힘으로 파워 스핀!':frame.move==='ONE-HAND FREEZE'||frame.move==='FINAL FREEZE'?'한 손으로 버티는 프리즈!':'서로 다른 무브로 주고받는 비보잉 배틀';
}
function finish(){
  if(match.phase!=='fighting')return;const r=match.finish();score();
  result(r.won?'win':'lose',r.won?'YOU WIN / 위상동형':'YOU LOSE / 다른 구조',r.won?'빨강 공주, 파워 무브로 승리!':'이번 배틀은 노랑 공주의 승리!',`${models[r.target].name} ↔ ${models[r.selected].name}. ${explain(r.target,r.selected)}`);
  $('dance').hidden=true;$('next').hidden=false;$('readResult').hidden=false;$('next').textContent=match.index===rounds.length-1?'최종 전적 보기 →':'다음 비보잉 라운드 →';
}
$('dance').onclick=()=>{
  if(!ready||!selected||match.phase!=='select')return;
  const r=match.submit(selected);for(const b of $('choices').children)b.disabled=true;$('dance').disabled=true;$('dance').firstElementChild.textContent='비보잉 배틀 중…';
  result('dancing','THE CYPHER IS ON','빨강과 노랑, 무대를 주고받는 중!','교차 스텝 → 바닥 풋워크 → 프리즈. 마지막 파워 무브의 주인은 선택한 모형이 정해요.');stage.start(r);
  if(matchMedia('(max-width:760px)').matches)document.querySelector('.arena').scrollIntoView({behavior:stage.motion?'smooth':'instant',block:'center'});
};
$('next').onclick=()=>{if(match.phase!=='result')return;if(match.next()){paint();$('choices').firstElementChild.focus();}else{$('roundLabel').textContent='BATTLE COMPLETE';$('next').hidden=true;result(match.scores[0]===4?'win':'select','FOUR ROUNDS COMPLETE',`비보잉 배틀 · ${match.scores[0]}승 ${match.scores[1]}패`,match.scores[0]===4?'완벽한 선택! 네 번 모두 위상동형인 모형을 찾아냈어요.':'모양이 달라도 구조가 같으면 승리해요. 다른 모형으로 다시 도전해 봐요.');$('restart').focus();}};
$('restart').onclick=()=>{match=new Match();score();paint();$('choices').firstElementChild.focus();};
$('readResult').onclick=()=>$('result').scrollIntoView({behavior:stage?.motion?'smooth':'instant',block:'end'});
function motionLabel(){const on=stage?.motion??false;$('motion').textContent=on?'효과 모션 켜짐':'효과 모션 꺼짐';$('motion').setAttribute('aria-pressed',String(on));}
$('motion').onclick=()=>{if(stage){stage.setMotion(!stage.motion);motionLabel();}};
$('sound').onclick=async()=>{try{await music.setEnabled(!music.enabled);$('sound').textContent=music.enabled?'♫ 비트 끄기':'♫ 비트 켜기';$('sound').setAttribute('aria-pressed',String(music.enabled));}catch{$('sound').textContent='비트 재생 불가';$('sound').setAttribute('aria-pressed','false');}};
paint();
try{stage=await createDanceStage($('stage'),{onFrame,onFinish:finish});ready=true;stage.setRound(match.round);if(selected)stage.select(selected);$('loadStatus').hidden=true;motionLabel();button();}
catch(error){$('loadStatus').textContent='3D 무대를 열지 못했어요. WebGL을 지원하는 브라우저에서 다시 열어 주세요.';console.error(error);}
window.addEventListener('pagehide',()=>{stage?.dispose();music.dispose();},{once:true});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
