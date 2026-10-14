export const objects=[
{id:'square',name:'사각 고리',correct:true,reason:'모서리를 부드럽게 펴면 둥근 고리가 돼요. 표면을 자르거나 붙일 필요가 없어요.',symbol:'▢',x:-3.3,z:0},
{id:'oval',name:'길쭉한 고리',correct:true,reason:'길게 늘어난 부분을 줄이면 도넛이 돼요. 늘어나도 하나의 관통 구멍은 그대로예요.',symbol:'⬭',x:2.6,z:-1.8},
{id:'cup',name:'손잡이 컵',correct:true,reason:'두께 있는 컵의 안쪽·바깥쪽·테두리를 모두 잇는 표면을 비교해요. 컵의 움푹 팬 부분은 관통 구멍이 아니고, 손잡이 하나가 도넛의 구멍에 해당해요.',symbol:'☕',x:2.8,z:2},
{id:'ball',name:'장난감 공',correct:false,reason:'공의 표면에는 손잡이(관통 구멍)가 없어요. 도넛으로 만들려면 새 구멍을 뚫어야 해요.',symbol:'●',x:-1,z:-2.6},
{id:'bowl',name:'오목한 그릇',correct:false,reason:'두께 있는 그릇의 전체 표면은 구면과 같아요. 오목하게 파인 곳은 뚫린 통로가 아니에요.',symbol:'◡',x:-3.4,z:2.6},
{id:'double',name:'두 구멍 블록',correct:false,reason:'이 표면에는 서로 독립적인 관통 구멍이 두 개 있어요. 하나를 없애려면 자르거나 붙여야 하므로 도넛과 달라요.',symbol:'∞',x:0.2,z:0.5}
];
export class Mission {constructor(){this.found=new Set();this.attempts=0;}answer(id,guess){const o=objects.find(x=>x.id===id);if(!o)throw Error('Unknown object');if(this.found.has(id))return {duplicate:true,complete:this.found.size===3};this.attempts++;const right=o.correct===guess;if(right&&o.correct)this.found.add(id);return {right,collected:right&&o.correct,complete:this.found.size===3};}}
