// This finite catalogue is NOT a classifier for arbitrary meshes.
// Surfaces are connected, closed, orientable 2-manifolds; curves are simple
// closed 1-manifolds or compact intervals. Thickness on curves is display only.
export const models = Object.freeze({
  sphere: Object.freeze({name:'구의 표면',dimension:2,genus:0,shape:'sphere'}),
  egg: Object.freeze({name:'알의 표면',dimension:2,genus:0,shape:'egg'}),
  torus: Object.freeze({name:'도넛의 표면',dimension:2,genus:1,shape:'torus'}),
  ovalTorus: Object.freeze({name:'길쭉한 도넛의 표면',dimension:2,genus:1,shape:'ovalTorus'}),
  circle: Object.freeze({name:'원의 선만 (내부 없음)',dimension:1,boundary:0,shape:'circle'}),
  ellipse: Object.freeze({name:'타원의 선만 (내부 없음)',dimension:1,boundary:0,shape:'ellipse'}),
  segment: Object.freeze({name:'선분 (양 끝점 포함)',dimension:1,boundary:2,shape:'segment'}),
  arc: Object.freeze({name:'휘어진 선분 (양 끝점 포함)',dimension:1,boundary:2,shape:'arc'})
});
function model(id){if(!Object.hasOwn(models,id))throw new Error('Unknown model');return models[id];}
export function homeomorphic(a,b){
  const x=model(a),y=model(b);
  return x.dimension===y.dimension && (x.dimension===2 ? x.genus===y.genus : x.boundary===y.boundary);
}
export function explain(a,b){
  const x=model(a),y=model(b);
  if(x.dimension!==y.dimension)return '하나는 2차원 표면, 하나는 1차원 곡선이므로 위상동형이 아니에요. 곡선의 두께는 화면 표시일 뿐이에요.';
  if(x.dimension===2)return `두 모형 모두 연결된 닫힌 가향 표면이에요. 종수(손잡이 수)는 각각 ${x.genus}, ${y.genus}이므로 ${homeomorphic(a,b)?'위상동형이에요':'위상동형이 아니에요'}.`;
  return `곡선의 끝점 수는 각각 ${x.boundary}, ${y.boundary}개예요. ${homeomorphic(a,b)?'이 모형들은 같은 종류의 곡선이에요':'닫힌 곡선과 끝점이 있는 선분은 위상동형이 아니에요'}.`;
}
export const rounds=Object.freeze([
  Object.freeze({target:'torus',options:Object.freeze(['ovalTorus','sphere','circle'])}),
  Object.freeze({target:'sphere',options:Object.freeze(['torus','egg','ellipse'])}),
  Object.freeze({target:'circle',options:Object.freeze(['torus','ellipse','segment'])}),
  Object.freeze({target:'segment',options:Object.freeze(['arc','circle','sphere'])})
]);
// Choosing the held object is the answer. There is no true/false claim and
// no "correct rejection" escape: a non-homeomorphic choice always loses.
export class Match {
  constructor(){this.index=0;this.scores=[0,0];this.phase='select';this.result=null;}
  get round(){return rounds[this.index];}
  submit(selected){
    if(this.phase!=='select')throw new Error('Round already started');
    if(!this.round.options.includes(selected))throw new Error('Select an offered model');
    const won=homeomorphic(this.round.target,selected);
    this.result=Object.freeze({selected,target:this.round.target,won,winner:won?0:1});
    this.phase='fighting';return this.result;
  }
  finish(){
    if(this.phase!=='fighting')throw new Error('No fight to finish');
    this.scores[this.result.winner]++;this.phase='result';return this.result;
  }
  next(){
    if(this.phase!=='result')throw new Error('Finish the fight before advancing');
    if(this.index===rounds.length-1){this.phase='complete';return false;}
    this.index++;this.phase='select';this.result=null;return true;
  }
}
