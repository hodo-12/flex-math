// Development-only browser screenshots. Full 1/2/3 gameplay is tested separately
// by browser-smoke.mjs. Avoid repeating long software-WebGL walks here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
assert(executablePath,'Chrome or Chromium is required on the CI runner');
const browser=await chromium.launch({
  executablePath,headless:true,args:[
    '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
const page=await browser.newPage({viewport:{width:1050,height:680},deviceScaleFactor:1});
page.setDefaultTimeout(15000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
fs.mkdirSync('character-previews',{recursive:true});
try{
  await page.goto('http://127.0.0.1:8080/tests/character-studio.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.studioReady,null,{timeout:45000});
  const intact=()=>page.evaluate(()=>window.studio.rigs.every(r=>
    r.face.visible && r.face.material.map?.image?.complete && r.face.parent===r.head &&
    Object.values(r.princessDress.skirts).filter(g=>g.visible).length===1
  ));
  assert(await intact(),'All four original photo textures must be loaded');
  for(const [name,pose] of [
    ['idle',{frames:40}],
    ['walk',{moving:true,frames:45}],
    ['turn',{moving:true,angle:1.2,frames:38}],
    ['rear',{orbit:Math.PI,frames:8}],
    ['cheer',{celebrating:true,frames:29}],
    ['landing',{celebrating:true,frames:36}]
  ]){
    await page.evaluate(p=>window.studio.step(p),pose);
    assert(await intact(),'Head and face must remain intact during '+name);
    await page.screenshot({path:'character-previews/'+name+'.png',animations:'disabled',timeout:25000});
    console.log('PREVIEW '+name+' OK');
  }
  // Character cards keep all controls and original photos; only clothing changes.
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.character').count(),4);
  const labels=await page.locator('.outfit-chip').allTextContents();
  assert.deepEqual(labels,['루비 리본 드레스','사파이어 레이스 드레스','햇살 꽃잎 드레스','로즈 프릴 드레스']);
  await page.screenshot({path:'character-previews/selection.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'character-previews/selection-mobile.png',fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile horizontal overflow');
  await page.setViewportSize({width:1050,height:680});
  // Original game still loads the character, and movement starts when object clicked.
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-character="cat"]').click();
  await page.locator('#start').click();
  await page.locator('#world canvas').waitFor({state:'visible'});
  await page.screenshot({path:'character-previews/cat-game-idle.png'});
  await page.locator('#objectList button[data-id="cup"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({path:'character-previews/cat-game-walking.png'});
  assert.deepEqual(errors,[],'No runtime exceptions in previews');
  console.log('PASS: four photo identities, six studio poses, game idle and walking');
}finally{await browser.close();}
