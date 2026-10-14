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

/** Level 03 compares the complete boundary of a single thick solid.
 * The three correct pieces are connected, closed, orientable genus-two surfaces.
 * A planar region with two holes, extruded into a solid, has genus two on its boundary. */
export const oceanObjects=[
{id:'twinGate',name:'쌍문 유적석',correct:true,reason:'하나로 연결된 유적석에 서로 독립적인 관통 터널이 두 개 있어요. 전체 경계는 종수 2인 닫힌 표면이에요.',symbol:'🏛️',x:-3.3,z:-1.9},
{id:'coralCrown',name:'쌍고리 산호 왕관',correct:true,reason:'굴곡진 바깥 모양과 관계없이 관통 구멍 두 개를 가진 하나의 닫힌 경계 표면이에요. 쌍고리 기준 모형과 위상동형입니다.',symbol:'🪸',x:2.9,z:1.65},
{id:'ruinSlab',name:'두 눈 수정 유물',correct:true,reason:'수정 유물의 두 창은 각각 독립적인 관통 구멍이에요. 모서리를 둥글게 변형해도 종수 2가 유지돼요.',symbol:'🔱',x:2.6,z:-2.6},
{id:'singlePortal',name:'한 구멍 석문',correct:false,reason:'관통 구멍이 하나인 연결된 닫힌 표면으로 종수 1이에요. 두 구멍 기준 모형과 달라요.',symbol:'🪨',x:-2.7,z:2.2},
{id:'seaPearl',name:'심해의 진주',correct:false,reason:'진주 겉표면은 구면과 같은 종수 0의 닫힌 표면이에요. 관통 구멍이 없어요.',symbol:'🫧',x:-0.1,z:-2.5},
{id:'tripleRelic',name:'세 구멍 비석',correct:false,reason:'서로 독립적인 관통 구멍이 세 개이므로 종수 3이에요. 종수 2인 기준 유물과 위상동형이 아니에요.',symbol:'🗿',x:0.2,z:2.45},
{id:'treasure',name:'봉인된 보물상자',correct:false,reason:'뚜껑이 닫힌 통짜 보물상자의 전체 경계는 구면처럼 관통 구멍이 없는 종수 0의 표면이에요.',symbol:'📦',x:3.7,z:-0.45},
{id:'kelpRing',name:'해초 고리',correct:false,reason:'두꺼운 해초 고리의 경계는 하나의 관통 구멍을 가져 종수 1이에요. 기준 모형의 두 구멍보다 적어요.',symbol:'🌿',x:-3.8,z:.12}
];

export const levels={
1:{id:1,name:'고리의 비밀',place:'장난감 방',target:'도넛',objects,description:'도넛과 같은 구조를 찾아라!',hint:'손잡이 하나가 있는지 살펴보세요!'},
2:{id:2,name:'마법의 숲',place:'마법의 숲',target:'마법 구슬',objects:forestObjects,description:'마법 구슬과 같은 구조를 찾아라!',hint:'물체의 전체 경계 표면에 관통 구멍이 없는지 확인해요.'},
3:{id:3,name:'두 구멍의 비밀',place:'바닷속 유적',target:'쌍고리 유물',objects:oceanObjects,description:'구멍이 두 개인 유물 3개를 찾아라!',hint:'겉표면이 하나로 연결되어 있고, 서로 독립적인 관통 구멍 두 개가 있는지 확인해요. 움푹 팬 곳과 실제 터널은 달라요.'}
};
