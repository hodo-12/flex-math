export const objects=[
{id:'square',name:'사각 고리',correct:true,reason:'모서리를 부드럽게 펴면 둥근 고리가 돼요. 표면을 자르거나 붙일 필요가 없어요.',symbol:'▢',x:-3.3,z:0},
{id:'oval',name:'길쭉한 고리',correct:true,reason:'길게 늘어난 부분을 줄이면 도넛이 돼요. 늘어나도 하나의 관통 구멍은 그대로예요.',symbol:'⬭',x:2.6,z:-1.8},
{id:'cup',name:'손잡이 컵',correct:true,reason:'두께 있는 컵의 안쪽·바깥쪽·테두리를 모두 잇는 표면을 비교해요. 컵의 움푹 팬 부분은 관통 구멍이 아니고, 손잡이 하나가 도넛의 구멍에 해당해요.',symbol:'☕',x:2.8,z:2},
{id:'ball',name:'장난감 공',correct:false,reason:'공의 표면에는 손잡이(관통 구멍)가 없어요. 도넛으로 만들려면 새 구멍을 뚫어야 해요.',symbol:'●',x:-1,z:-2.6},
{id:'bowl',name:'오목한 그릇',correct:false,reason:'두께 있는 그릇의 전체 표면은 구면과 같아요. 오목하게 파인 곳은 뚫린 통로가 아니에요.',symbol:'◡',x:-3.4,z:2.6},
{id:'double',name:'두 구멍 블록',correct:false,reason:'이 표면에는 서로 독립적인 관통 구멍이 두 개 있어요. 하나를 없애려면 자르거나 붙여야 하므로 도넛과 달라요.',symbol:'∞',x:0.2,z:0.5}
];
export class Mission {constructor(level=1){this.level=level;this.objects=levels[level].objects;this.found=new Set();this.attempts=0;}answer(id,guess){const o=this.objects.find(x=>x.id===id);if(!o)throw Error('Unknown object');if(this.found.has(id))return {duplicate:true,complete:this.found.size===3};this.attempts++;const right=o.correct===guess;if(right&&o.correct)this.found.add(id);return {right,collected:right&&o.correct,complete:this.found.size===3};}}

export const forestObjects=[
{id:'fruit',name:'반짝이는 숲 열매',correct:true,reason:'울퉁불퉁하거나 길쭉해도 구멍이 없는 닫힌 표면은 구면과 위상동형이에요.',symbol:'🍒',x:-3.5,z:-2},
{id:'stone',name:'이끼 낀 마법 돌',correct:true,reason:'매끈한 돌의 전체 경계면은 뚫린 구멍 없이 구면처럼 이어져요.',symbol:'🪨',x:2.6,z:2},
{id:'egg',name:'빛나는 수정 알',correct:true,reason:'길쭉한 알도 구멍이 없는 닫힌 표면이에요. 구로 연속 변형할 수 있어요.',symbol:'🥚',x:3,z:-2.6},
{id:'vine',name:'덩굴 고리',correct:false,reason:'덩굴 고리의 두꺼운 전체 표면에는 관통 구멍이 하나 있어 구면과 달라요.',symbol:'⭕',x:-2.3,z:2.4},
{id:'flower',name:'도넛 꽃',correct:false,reason:'꽃 모양이 예뻐도 가운데 관통 구멍이 하나 있으므로 구면이 아니에요.',symbol:'🌸',x:0,z:-1.3},
{id:'log',name:'관통된 나무 토막',correct:false,reason:'통나무의 가운데를 터널이 관통해 연결된 경계 표면은 구멍 하나를 가지므로 구면과 달라요.',symbol:'🪵',x:0.5,z:2.8},
{id:'rune',name:'마법의 고리 룬',correct:false,reason:'고리 모양의 두꺼운 마법 룬에는 관통 구멍이 하나 있어요.',symbol:'💍',x:3.4,z:0},
{id:'basket',name:'손잡이 바구니',correct:false,reason:'두께 있는 바구니의 전체 경계 표면을 보면 손잡이가 관통 구멍을 하나 만들어요.',symbol:'🧺',x:-3.6,z:0.4}
];
export const levels={
1:{id:1,name:'고리의 비밀',place:'장난감 방',target:'도넛',objects,description:'도넛과 같은 구조를 찾아라!',hint:'손잡이 하나가 있는지 살펴보세요!'},
2:{id:2,name:'마법의 숲',place:'마법의 숲',target:'마법 구슬',objects:forestObjects,description:'마법 구슬과 같은 구조를 찾아라!',hint:'물체의 전체 경계 표면에 관통 구멍이 없는지 확인해요.'}
};
