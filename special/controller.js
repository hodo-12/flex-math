import {Match,models,rounds,explain} from './rules.js';
import {createArena} from './scene.js';
const $=id=>document.getElementById(id);
let match=new Match(),arena,ready=false,selections=[],claims=[];
const names=['첫째 캐릭터 · 빨강 공주','셋째 캐릭터 · 노랑 공주'];
function updateJudge(){ $('judge').disabled=!ready||match.phase!=='select'||claims.some(x=>typeof x!=='boolean'); }
function paintRound(){
  selections=[match.round.options[0],match.round.options[1]];claims=[null,null];
  $('roundLabel').textContent=`ROUND ${String(match.index+1).padStart(2,'0')} / ${String(rounds.length).padStart(2,'0')}`;
  $('target').textContent=models[match.round.target].name;
  $('players').replaceChildren();
  names.forEach((name,i)=>{
    const card=document.createElement('section');card.className='player';
    const heading=document.createElement('h3');heading.textContent=name;
    const label=document.createElement('label');label.htmlFor='model-'+i;label.textContent='들고 비교할 모형';
    const select=document.createElement('select');select.id='model-'+i;
    match.round.options.forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=models[id].name;select.append(option);});
    select.value=selections[i];
    const buttons=document.createElement('div');buttons.className='claims';buttons.setAttribute('role','group');buttons.setAttribute('aria-label',name+'의 위상동형 판정');
    [true,false].forEach(claim=>{const button=document.createElement('button');button.type='button';button.textContent=claim?'같은 구조':'다른 구조';button.dataset.claim=String(claim);button.setAttribute('aria-pressed','false');button.onclick=()=>{claims[i]=claim;for(const b of buttons.children)b.setAttribute('aria-pressed',String(b===button));updateJudge();};buttons.append(button);});
    select.onchange=()=>{selections[i]=select.value;claims[i]=null;for(const b of buttons.children)b.setAttribute('aria-pressed','false');arena?.select(i,select.value);updateJudge();};
    card.append(heading,label,select,buttons);$('players').append(card);
  });
  $('next').hidden=true;$('judge').hidden=false;
  $('result').textContent='각 캐릭터의 모형과 판정을 모두 선택하세요. 정답인 캐릭터만 승리해요.';
  arena?.setRound(match.round,selections);updateJudge();
}
function score(){ $('score').textContent=`빨강 ${match.scores[0]} : ${match.scores[1]} 노랑`; }
$('judge').onclick=()=>{
  if(!ready||match.phase!=='select'||claims.some(c=>typeof c!=='boolean'))return;
  const result=match.submit(selections,claims);
  $('players').querySelectorAll('button,select').forEach(el=>el.disabled=true);
  const title=result.winners.length===2?'공동 승리!':result.winners.length===0?'이번 라운드는 승자 없음':`${names[result.winners[0]]} 승리!`;
  $('result').textContent=title+'\n'+names.map((name,i)=>`${name}: ${result.correct[i]?'정답 +1점':'오답 · 승리하지 않았어요'}\n${explain(match.round.target,selections[i])}`).join('\n');
  score();arena.resolve([...result.winners]);$('judge').hidden=true;$('next').hidden=false;
  $('next').textContent=match.index===rounds.length-1?'최종 결과 보기 →':'다음 라운드 →';$('next').focus();
};
$('next').onclick=()=>{
  if(match.phase!=='result')return;
  if(match.next()){paintRound();$('model-0').focus();}
  else{
    const champions=match.champions;
    $('result').textContent=(champions.length===2?'공동 우승!':champions.length===1?names[champions[0]]+' 우승!':'정답이 없어 우승자가 없어요. 다시 도전해 보세요.')+`\n최종 점수 · 빨강 ${match.scores[0]} : ${match.scores[1]} 노랑`;
    $('roundLabel').textContent='MATCH COMPLETE';$('next').hidden=true;arena.resolve(champions,true);$('restart').focus();
  }
};
$('restart').onclick=()=>{match=new Match();score();paintRound();$('model-0').focus();};
$('view').onclick=()=>arena?.changeView();
function motionLabel(){const on=arena?.motion??false;$('motion').setAttribute('aria-pressed',String(on));$('motion').textContent=on?'카메라 모션 켜짐':'카메라 모션 꺼짐';}
$('motion').onclick=()=>{if(arena){arena.setMotion(!arena.motion);motionLabel();}};
paintRound();
try{
  arena=await createArena($('stage'));ready=true;$('loadStatus').hidden=true;arena.setRound(match.round,selections);motionLabel();updateJudge();
}catch(error){$('loadStatus').textContent='경기장을 불러오지 못했어요. WebGL과 사진 파일을 확인한 뒤 새로고침해 주세요.';console.error(error);}
window.addEventListener('pagehide',()=>arena?.dispose(),{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
