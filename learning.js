// Topology field guide: cards compare 1-dimensional curves, levels compare 2D boundary surfaces.
export const circleCards = [
 {id:1,name:'동그라미',glyph:'◯',same:true,reason:'기준인 원 자체예요. 하나로 이어진 닫힌 선입니다.'},
 {id:2,name:'열린 선',glyph:'⌢',same:false,reason:'끝점이 두 개 있습니다. 닫힌 원에는 끝점이 없어요.'},
 {id:3,name:'길쭉한 고리',glyph:'⬭',same:true,reason:'길게 늘어난 부분을 줄이면 원이 됩니다. 끊어진 곳이 없어요.'},
 {id:4,name:'떨어진 두 원',glyph:'◯ ◯',same:false,reason:'서로 떨어진 연결 성분이 두 개라서 원 하나와 달라요.'},
 {id:5,name:'울퉁불퉁 고리',glyph:'〰',same:true,reason:'찌그러져도 끊기거나 갈라지지 않은 하나의 닫힌 선이에요.'},
 {id:6,name:'채워진 원판',glyph:'●',same:false,reason:'원은 1차원 선이고 원판은 내부가 채워진 2차원 공간이에요.'},
 {id:7,name:'하트 고리',glyph:'♡',same:true,reason:'모서리와 뾰족한 부분을 매끈하게 펴면 원이 됩니다.'},
 {id:8,name:'벌어진 고리',glyph:'C',same:false,reason:'틈이 있어 끝점이 두 개입니다. 끊어진 채로는 원이 될 수 없어요.'},
 {id:9,name:'직사각형 고리',glyph:'▢',same:true,reason:'모서리를 둥글게 구부리면 원이 돼요. 내부는 비어 있는 선입니다.'},
 {id:10,name:'원과 점',glyph:'◯ ·',same:false,reason:'원과 떨어진 점이 각각 별도의 연결 성분을 이룹니다.'}
];
const quizSets=[
 {id:'explorer',label:'기초 · 동형 탐험가',badge:'🏅 동형 탐험가',questions:[
 ['길쭉한 고리는 원과 위상동형이다.',true,'길이와 굽음은 바뀌어도 이어진 방식은 같습니다.'],
 ['끝점이 두 개인 열린 선은 원과 위상동형이다.',false,'원에는 끝점이 없고 열린 선에는 두 개가 있어요.'],
 ['채워진 원판은 원(선)과 위상동형이다.',false,'원판은 내부가 있는 2차원 공간이고 원은 1차원 곡선이에요.'],
 ['하트 모양의 닫힌 선은 원과 위상동형이다.',true,'뾰족한 부분을 펴도 선이 끊기지 않아요.']
 ]},
 {id:'intersection',label:'도전 · 교차점 박사',badge:'🏅 교차점 박사',questions:[
 ['Y자 형태의 선은 원과 위상동형이다.',false,'Y자에는 세 갈래가 만나는 갈림점이 있지만 원에는 없어요.'],
 ['서로 떨어진 두 원은 원 하나와 위상동형이다.',false,'연결 성분이 두 개와 한 개로 다릅니다.'],
 ['직사각형 테두리는 원과 위상동형이다.',true,'꼭짓점은 부드럽게 펼 수 있고 닫힌 선 한 조각은 유지돼요.'],
 ['원 하나에 떨어진 점을 추가해도 여전히 원과 위상동형이다.',false,'연결 성분이 한 개에서 두 개로 늘어납니다.']
 ]},
 {id:'ocean',label:'바닷속 유적 · 종수 탐험가',badge:'🏅 종수 탐험가',questions:[
 ['서로 독립적인 관통 터널이 두 개인 하나의 두꺼운 유물의 전체 경계 표면은 종수 2이다.',true,'관통 구멍 두 개를 가진 닫힌 연결 가향 표면은 종수 2예요.'],
 ['구멍이 하나인 도넛 표면은 구멍이 두 개인 표면과 위상동형이다.',false,'종수 1과 종수 2는 서로 다른 위상적 구조예요.'],
 ['구멍 두 개가 있는 유물과 세 개가 있는 유물은 구멍 개수가 달라도 위상동형이다.',false,'종수가 각각 2와 3이라 자르거나 붙이지 않고 서로 바꿀 수 없어요.'],
 ['유물 표면의 크기와 색이 달라도 종수 2인 연결된 닫힌 가향 표면끼리는 위상동형일 수 있다.',true,'이 종류의 표면에서는 분류정리에 따라 종수가 같으면 위상동형이에요.']
 ]},
 {id:'master',label:'심화 · 위상수학 마스터',badge:'🏆 위상수학 마스터',questions:[
 ['손잡이가 하나인 두께 있는 컵의 전체 경계 표면은 도넛 표면과 위상동형이다.',true,'두 표면 모두 종수 1인 닫힌 연결 가향 표면이에요.'],
 ['구와 정육면체의 전체 경계 표면은 위상동형이다.',true,'모서리 유무와 무관하게 둘 다 종수 0인 닫힌 연결 표면이에요.'],
 ['속이 채워진 공과 공의 경계 구면은 같은 위상공간이다.',false,'3차원 공 전체와 2차원 구면은 서로 다른 공간입니다.'],
 ['관통 구멍이 하나인 도넛 표면은 구면과 위상동형이다.',false,'구면은 종수 0, 도넛 표면은 종수 1이라 구멍을 없애지 않고는 변형할 수 없어요.']
 ]}
];
function readJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback;}catch{return fallback;}}
const favorites=new Set(readJSON('flex-math-favorites',[]));
const seen=new Set(readJSON('flex-math-cards',[]));
const badges=new Set(readJSON('flex-math-badges',[]));
const discoveries=new Set(readJSON('flex-math-discoveries',[]));
const discoveryLabels={
 '1:square':'사각 고리 · 모서리와 종수 1','1:oval':'길쭉한 고리 · 크기와 위상','1:cup':'손잡이 컵 · 컵과 도넛',
 '2:fruit':'숲 열매 · 매끈한 구면','2:stone':'마법 돌 · 찌그러진 구면','2:egg':'수정 알 · 긴 구면',
 '3:twinGate':'쌍문 유적석 · 두 개의 관통 터널', '3:coralCrown':'산호 왕관 · 종수 2', '3:ruinSlab':'수정 유물 · 두 구멍의 표면'
};
let tab='concepts',activeQuiz='explorer',quizIndex=0,score=0,answered=false,flipped=new Set();
const $=s=>document.querySelector(s);
function persist(key,set){try{localStorage.setItem(key,JSON.stringify([...set]));}catch{}}
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function renderConcepts(out){
 const title=el('h3','수학자가 보는 것은 겉모양이 아니라 구조');out.append(title);
 const p=el('p','위상동형은 양방향으로 연속적인 대응이 가능한 공간 사이의 관계예요. 자르거나 붙이지 않고 부드럽게 바꿔 보는 것은 이를 이해하는 좋은 직관입니다.');out.append(p);
 const unlocked=el('article',undefined,'concept-item');
 unlocked.append(el('h4','📖 탐험하며 획득한 위상 카드 ('+discoveries.size+'/9)'));
 unlocked.append(el('p',discoveries.size?[...discoveries].map(k=>'✓ '+(discoveryLabels[k]||k)).join(' · '):'레벨에서 정답 물체를 발견하면 여기에 개념 카드가 수집돼요.'));
 out.append(unlocked);
 const concepts=[
 ['① 1차원 곡선 · 원','끝점이 없고, 갈림점도 없고, 하나로 이어진 닫힌 선입니다. 열린 선·원판·서로 떨어진 두 원은 원과 달라요.'],
 ['② 2차원 표면 · 구면','두께 있는 공의 겉표면을 생각합니다. 정육면체의 경계, 매끈한 열매와 돌의 전체 경계도 구면과 같은 구조일 수 있어요.'],
 ['③ 2차원 표면 · 도넛','손잡이 하나 있는 컵의 전체 경계 표면과 도넛의 표면은 종수 1인 닫힌 연결 가향 표면입니다.'],
 ['④ 두 구멍의 표면 · 종수 2','하나로 연결된 두께 있는 물체의 전체 경계 표면에서, 서로 독립적인 관통 터널이 두 개라면 종수 2예요. 구면(종수 0), 도넛 표면(종수 1), 두 구멍 표면(종수 2)은 서로 위상동형이 아니에요.'],
 ['⑤ 비교 대상부터 확인','선인지, 표면인지, 속까지 채운 입체인지를 먼저 구분하세요. 단순히 구멍 개수만 세면 모든 위상공간의 동형을 판별할 수 있는 것은 아니에요.']
 ];
 for(const [name,description] of concepts){const box=el('article',undefined,'concept-item');box.append(el('h4',name),el('p',description));out.append(box);}
}
function renderCards(out){
 out.append(el('h3','동형 카드 연구소 · 기초 카드 10장'));
 out.append(el('p','이 카드들은 3D 물체의 표면이 아닌, 선으로 그린 원(S¹)과 비교해요. 카드를 누르면 정답과 이유가 나와요.'));
 const grid=el('div',undefined,'card-grid');out.append(grid);
 for(const c of circleCards){
 const wrap=el('article',undefined,'study-card'),flip=el('button',undefined,'flip-card');
 const isFlipped=flipped.has(c.id);
 flip.append(el('small','NO. '+String(c.id).padStart(2,'0')+' · '+(isFlipped?'정답':'문제')));
 if(isFlipped){flip.append(el('strong',c.same?'✓ 위상동형':'✕ 비동형'));flip.append(el('p',c.reason));}
 else {flip.append(el('span',c.glyph,'card-glyph'));flip.append(el('strong',c.name));flip.append(el('small','원과 위상동형일까? ↗'));}
 flip.setAttribute('aria-label',c.name+' 카드 '+(isFlipped?'앞면 보기':'뒤집어서 정답 보기'));
 flip.onclick=()=>{seen.add(c.id);persist('flex-math-cards',seen);if(isFlipped)flipped.delete(c.id);else flipped.add(c.id);render();};
 const fav=el('button',favorites.has(c.id)?'★ 즐겨찾기':'☆ 즐겨찾기','favorite');
 fav.setAttribute('aria-pressed',String(favorites.has(c.id)));
 fav.onclick=()=>{favorites.has(c.id)?favorites.delete(c.id):favorites.add(c.id);persist('flex-math-favorites',favorites);render();};
 wrap.append(flip,fav);grid.append(wrap);
 }
 out.append(el('p','확인한 카드 '+seen.size+' / 10 · 즐겨찾기 '+favorites.size+'개','learn-footnote'));
}
function renderQuiz(out){
 out.append(el('h3','4문제 퀴즈 · 배지 모으기'));
 const tabs=el('div',undefined,'quiz-modes');out.append(tabs);
 for(const q of quizSets){const b=el('button',q.label+(badges.has(q.id)?' ✓':''));b.classList.toggle('selected',activeQuiz===q.id);b.onclick=()=>{activeQuiz=q.id;quizIndex=0;score=0;answered=false;render();};tabs.append(b);}
 const q=quizSets.find(x=>x.id===activeQuiz);
 const badgeList=el('p','획득한 배지: '+(badges.size?quizSets.filter(x=>badges.has(x.id)).map(x=>x.badge).join(' · '):'아직 없음'),'learn-footnote');out.append(badgeList);
 if(quizIndex===q.questions.length){
 const perfect=score===q.questions.length;
 out.append(el('div',perfect?'🎉 '+q.badge+' 획득!':'퀴즈 종료! '+score+' / 4 정답','quiz-result'));
 out.append(el('p',perfect?'네 문제를 한 번에 모두 맞혔어요!':'틀린 문제를 다시 떠올리며 도전해 봐요.'));
 const retry=el('button','이 퀴즈 다시 풀기 ↻','primary');retry.onclick=()=>{quizIndex=0;score=0;answered=false;render();};out.append(retry);return;
 }
 const [question,correct,why]=q.questions[quizIndex];
 out.append(el('p','문제 '+(quizIndex+1)+' / 4','quiz-counter'),el('h4',question));
 const actions=el('div',undefined,'quiz-answers');out.append(actions);
 for(const [label,guess] of [['맞아요',true],['아니에요',false]]){
 const b=el('button',label);b.disabled=answered;b.onclick=()=>{
 if(answered)return;answered=true;if(guess===correct)score++;
 const message=el('div',(guess===correct?'✓ 정답! ':'✕ 틀렸어요. ')+why,'quiz-feedback');
 out.append(message);for(const t of actions.children)t.disabled=true;
 const next=el('button',quizIndex===3?'결과 보기 →':'다음 문제 →','primary');
 next.onclick=()=>{quizIndex++;answered=false;if(quizIndex===q.questions.length&&score===q.questions.length){badges.add(q.id);persist('flex-math-badges',badges);}render();};out.append(next);
 };actions.append(b);
 }
}
function render(){
 const out=$('#learningContent');if(!out)return;out.replaceChildren();
 for(const b of document.querySelectorAll('[data-learn-tab]')){b.classList.toggle('selected',b.dataset.learnTab===tab);b.setAttribute('aria-selected',String(b.dataset.learnTab===tab));}
 if(tab==='concepts')renderConcepts(out);else if(tab==='cards')renderCards(out);else renderQuiz(out);
 $('#learningProgress').textContent='카드 '+seen.size+'/10 · 배지 '+badges.size+'/'+quizSets.length;
}
export function setupLearning(){
 const dialog=$('#learningDialog');if(!dialog)return;
 const open=()=>{render();dialog.showModal();};
 for(const id of ['openLibrary','libraryGame']){const b=$('#'+id);if(b)b.onclick=open;}
 $('#closeLearning').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 for(const b of document.querySelectorAll('[data-learn-tab]'))b.onclick=()=>{tab=b.dataset.learnTab;render();};
 render();
}

export function unlockDiscovery(level,id){const k=level+':'+id;if(!discoveryLabels[k]||discoveries.has(k))return false;discoveries.add(k);persist('flex-math-discoveries',discoveries);return true;}
