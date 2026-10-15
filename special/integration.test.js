import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const gitHash=data=>createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
test('existing levels, learning, characters and styles retain baseline bytes',()=>{
  const expected={
    'app.js':'fb70cbe4cff77f84e05ca17a12337316e7bfe132',
    'state.js':'9e0198e0758fc49ce8bbcdb174345e5419c3d329',
    'learning.js':'80c4053e1cb981feb939072bd86795d1a03405a0',
    'character-rig.js':'c33e81baad24a061183cee440873e0ea675d1889',
    'character-dress.js':'1380c54871829b22390d606c7bdc9688fdbee2f0',
    'style.css':'7f27d8d2e449b98b4014e359d25b71b155227a53',
    'polish.css':'c28d5088eae7d8b658c1d432acafe1486689a14d',
    'ocean.css':'b753c59ea1c24a6b9ba04ce373c4b9f94aaef35c',
    'character-style.css':'adef28e2f42fc9d786880e5ad51bfe4d0ca9de0c'
  };
  for(const [file,sha] of Object.entries(expected))assert.equal(gitHash(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
});
test('lobby differs only by one independent SPECIAL link',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const link='<a id="specialEntry" class="library-entry" href="special/index.html">✦ SPECIAL ROUND · 위상동형 격투기장 ↗</a>';
  assert.equal(html.split(link).length,2);
  assert.equal(gitHash(Buffer.from(html.replace(link,''))),'2a204e9d7fd6570182eae80e07b996bbb10531bb');
});
test('both uploaded PNGs retain their original bytes and explicit first/third mapping',()=>{
  assert.equal(gitHash(readFileSync(new URL('./assets/first-face.png',import.meta.url))),'672b28864e4d0d53ad178c2124907635d14b5b70');
  assert.equal(gitHash(readFileSync(new URL('./assets/third-face.png',import.meta.url))),'ea0d3def2d93c29b5b10d2836a43e2bc3491badf');
});
