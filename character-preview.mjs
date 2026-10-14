// Runs only in the existing GitHub Actions test job; never deploys a site.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {levels} from './state.js';
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
assert(executablePath,'Chromium executable required on the CI runner');
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1400,height:950},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message);});
fs.mkdirSync('character-previews',{recursive:true});
try{
 await page.goto('http://127.0.0.1:8080/tests/character-studio.html');
 await page.waitForFunction(()=>window.studioReady,{timeout:30000});
 for(const [name,pose] of Object.entries({idle:{frames:120},walk:{moving:true,frames:78},turn:{moving:true,angle:1.2,frames:20},rear:{orbit:Math.PI,frames:1},cheer:{celebrating:true,frames:26},landing:{celebrating:true,frames:29}})){
  await page.evaluate(p=>window.studio.step(p),pose);
  const intact=await page.evaluate(()=>window.studio.rigs.every(r=>r.face.visible&&r.face.material.map.image.complete&&r.face.parent===r.head));assert(intact);
  await page.screenshot({path:`character-previews/${name}.png`});
 }
 await page.setViewportSize({width:1000,height:720});
 await page.goto('http://127.0.0.1:8080/');
 for(const id of ['hood','smile','cat','cap']){
  await page.locator(`[data-character="${id}"]`).click();await page.locator('#start').click();
  await page.locator('#world canvas').waitFor({state:'visible'});
  await page.screenshot({path:`character-previews/${id}-game-idle.png`});
  await page.locator('#objectList button[data-id="cup"]').click();
  await page.waitForTimeout(650);await page.screenshot({path:`character-previews/${id}-game-walk.png`});
  await page.locator('#inspect').waitFor({state:'visible',timeout:60000});await page.locator('#closeInspect').click();
  await page.locator('#objectList button[data-id="square"]').click();
  await page.waitForTimeout(650);await page.screenshot({path:`character-previews/${id}-game-turn.png`});
  await page.locator('#inspect').waitFor({state:'visible',timeout:60000});await page.locator('#closeInspect').click();await page.locator('#exit').click();
 }
 for(const level of [1,2,3]){
  await page.locator(level===1?'#level':`#level${level}`).click();await page.locator('#start').click();
  const objects=levels[level].objects;assert.equal(await page.locator('#objectList button').count(),objects.length);
  const targets=objects.filter(o=>o.correct),wrong=objects.find(o=>!o.correct);
  for(const [i,o] of [wrong,...targets].entries()){
   await page.locator(`#objectList button[data-id="${o.id}"]`).click();await page.locator('#inspect').waitFor({state:'visible',timeout:60000});
   await page.locator('#yes').click();assert.match(await page.locator('#feedback').innerText(),i===0?/아직 달라요/:/맞아요/);
   await page.locator('#continue').click();assert.equal(await page.locator('#count').innerText(),`${i} / 3`);
  }
  await page.waitForTimeout(400);await page.screenshot({path:`character-previews/level${level}-cheer.png`});
  await page.locator('#complete').waitFor({state:'visible',timeout:15000});await page.locator('#home').click();
 }
 assert.deepEqual(errors,[]);console.log('PASS: four original faces, idle/walk/turn/rear/cheer/landing, all three levels wrong/correct/completion');
}finally{await browser.close();}
