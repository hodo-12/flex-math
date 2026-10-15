import {Match,models,rounds,explain} from './rules.js';
import {createArena} from './scene.js';
import {modelIcon} from './icons.js';
const $=id=>document.getElementById(id);
let match=new Match(),arena,ready=false,selected=null,lastStage='';
const type=id=>models[id].dimension===2?'2D · 표면':'1D · 선';
function setResult(kind,kicker,title,explanation){
  $('result').dataset.kind=kind;$('resultMark').textContent=kind==='win'?'W':kind==='lose'?'L':'?';
  $('resultKicker').textContent=kicker;$('resultTitle').textContent=title;$('resultExplanation').textContent=explanation;
}
function updateFight(){
  $('fight').disabled=!ready||!selected||match.phase!=='select';
  $('fight').firstElementChild.textContent=selected?'이 모형 들고 대결하기':'모형을 먼저 골라 줘';
}
function health(values){values.forEach((v,i)=>{$('hp'+i).style.width=v+'%';$('hp'+i).parentElement.setAttribute('aria-valuenow',v);});}
function score(){ $('score').textContent=`${match.scores[0]}승 · ${match.scores[1]}패`; }
function paintRound(){
  selected=null;lastStage='';
  $('roundLabel').textContent=`ROUND ${String(match.index+1).padStart(2,'0')}`;$('roundCount').textContent=`${match.index+1} / ${rounds.length}`;
  $('target').textContent=models[match.round.target].name;$('targetIcon').innerHTML=modelIcon(match.round.target);$('targetType').textContent=type(match.round.target);
  $('choices').replaceChildren();
  match.round.options.forEach((id,i)=>{
    const button=document.createElement('button');button.className='choice';button.dataset.model=id;button.type='button';button.setAttribute('aria-pressed','false');
    button.innerHTML=`<span class="choice-number">0${i+1}</span><span class="shape-icon">${modelIcon(id)}</span><span class="choice-copy"><b>${models[id].name}</b><small>${type(id)}</small></span><span class="check" aria-hidden="true">✓</span>`;
    button.onclick=()=>{
      if(match.phase!=='select')return;selected=id;
      for(const b of $('choices').children)b.setAttribute('aria-pressed',String(b===button));
      arena?.select(id);$('selectionNote').textContent=`내 캐릭터가 ‘${models[id].name}’을 들었어요.`;updateFight();
    };$('choices').append(button);
  });
  $('fight').hidden=false;$('next').hidden=true;$('fightBanner').hidden=true;$('readResult').hidden=true;
  $('selectionNote').textContent='찢거나 붙이지 않고 기준 모형으로 바꿀 수 있을까?';
  $('fightStatus').textContent='모형을 선택하고 대결을 시작하세요';
  setResult('select','THE RULE IS SIMPLE','위상동형이면 내가 이긴다!','물체를 고르고 대결을 시작하면 두 캐릭터가 격투해요. 선택한 모형의 구조가 결정타의 주인을 정해요.');
  health([100,100]);arena?.setRound(match.round);updateFight();
}
function fightFrame(state){
  health(state.health);
  if(lastStage===state.stage)return;lastStage=state.stage;
  $('fightStatus').textContent=state.label;
  const banner=['ready','knockout','victory'].includes(state.stage);
  $('fightBanner').hidden=!banner;$('fightBanner').dataset.stage=state.stage;
  $('bannerText').textContent=state.stage==='knockout'?'K.O.':state.label;
  $('bannerKicker').textContent=state.stage==='ready'?'선택 완료 · 대결 시작':state.stage==='knockout'?'TOPOLOGY POWER':match.result.won?'위상동형 · 내 캐릭터 승리':'다른 구조 · 내 캐릭터 패배';
}
function finishFight(){
  if(match.phase!=='fighting')return;
  const result=match.finish();score();$('readResult').hidden=false;
  setResult(result.won?'win':'lose',result.won?'VICTORY / 위상동형':'DEFEAT / 다른 구조',result.won?'내가 고른 모형으로 승리!':'다른 구조를 골라 패배했어요',`${models[result.target].name} ↔ ${models[result.selected].name}. ${explain(result.target,result.selected)}`);
  $('fight').hidden=true;$('next').hidden=false;$('next').textContent=match.index===rounds.length-1?'최종 전적 보기 →':'다음 상대 모형 →';
  // Do not move keyboard focus on a timer; announce the result through live text.
}
$('fight').onclick=()=>{
  if(!ready||!selected||match.phase!=='select')return;
  const result=match.submit(selected);
  $('choices').querySelectorAll('button').forEach(el=>el.disabled=true);$('fight').disabled=true;$('fight').firstElementChild.textContent='대결 중…';
  setResult('fighting','BATTLE IN PROGRESS','두 캐릭터가 맞붙었어!','공격과 방어 다음, 모형의 힘으로 승부가 결정돼요.');
  arena.fight(result);
  if(matchMedia('(max-width:760px)').matches)document.querySelector('.arena').scrollIntoView({behavior:arena.motion?'smooth':'instant',block:'center'});
};
$('next').onclick=()=>{
  if(match.phase!=='result')return;
  if(match.next()){paintRound();$('choices').firstElementChild.focus();}
  else{
    $('roundLabel').textContent='ALL CLEAR';$('next').hidden=true;
    setResult(match.scores[0]>=3?'win':'lose','FOUR ROUNDS COMPLETE',`네 번의 승부 · ${match.scores[0]}승 ${match.scores[1]}패`,match.scores[0]===4?'완벽한 선택! 모든 라운드에서 위상동형인 모형을 찾아냈어요.':'각 라운드에서 위상동형인 모형을 골라야 이길 수 있어요. 다시 도전해 볼까요?');
    $('restart').focus();
  }
};
$('restart').onclick=()=>{match=new Match();score();paintRound();$('choices').firstElementChild.focus();};
$('view').onclick=()=>arena?.changeView();
$('readResult').onclick=()=>$('result').scrollIntoView({behavior:arena?.motion?'smooth':'instant',block:'end'});
function motionLabel(){const on=arena?.motion??false;$('motion').setAttribute('aria-pressed',String(on));$('motion').textContent=on?'효과 모션 켜짐':'효과 모션 꺼짐';}
$('motion').onclick=()=>{if(arena){arena.setMotion(!arena.motion);motionLabel();}};
paintRound();
try{arena=await createArena($('stage'),{onFrame:fightFrame,onFinish:finishFight});ready=true;$('loadStatus').hidden=true;arena.setRound(match.round);if(selected)arena.select(selected);motionLabel();updateFight();}
catch(error){$('loadStatus').textContent='3D 경기장을 열지 못했어요. WebGL을 지원하는 브라우저에서 다시 열어 주세요.';console.error(error);}
window.addEventListener('pagehide',()=>arena?.dispose(),{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
