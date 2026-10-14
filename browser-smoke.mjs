import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'];
const executablePath=chromePaths.find(p=>fs.existsSync(p));
if(!executablePath)throw Error('Chrome executable not installed on runner');
const browser=await chromium.launch({
  headless:true,executablePath,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
const page=await browser.newPage({viewport:{width:1000,height:720}});
const errors=[];
page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE ERROR:',error.message);});
const seen=(locator)=>locator.isVisible();
async function pick(id,correctAnswer=true){
  await page.locator('#objectList button[data-id="'+id+'"]').click();
  await page.locator('#inspect').waitFor({state:'visible',timeout:60000});
  await page.locator(correctAnswer?'#yes':'#no').click();
  const result=await page.locator('#feedback').innerText();
  await page.locator('#continue').click();
  return result;
}
try{
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.character').count(),4);
  for(const image of await page.locator('.character img').all()){
    assert(await image.evaluate(img=>img.complete && img.naturalWidth>0),'Character image must load');
  }
  await page.locator('#level3').click();
  await page.locator('#start').click();
  await page.locator('#world canvas').waitFor({state:'visible',timeout:60000});
  assert.equal(await page.locator('#objectList button').count(),8);
  assert.match(await page.locator('.mission h2').innerText(),/두 개인/);
  await page.screenshot({path:'level3-ocean.png'});
  const wrong=await pick('seaPearl');
  assert.match(wrong,/아직 달라요|틀렸/);
  assert.equal(await page.locator('#count').innerText(),'0 / 3');
  const first=await pick('twinGate');
  assert.match(first,/맞아요/);
  assert.equal(await page.locator('#count').innerText(),'1 / 3');
  await pick('coralCrown');
  await pick('ruinSlab');
  await page.locator('#complete').waitFor({state:'visible',timeout:15000});
  assert.match(await page.locator('#complete h2').innerText(),/성공했다/);
  await page.screenshot({path:'level3-complete.png'});
  await page.locator('#home').click();
  await page.locator('#level2').click();
  await page.locator('#start').click();
  assert.equal(await page.locator('#objectList button').count(),8);
  await page.locator('#exit').click();
  await page.locator('#level').click();
  await page.locator('#start').click();
  assert.equal(await page.locator('#objectList button').count(),6);
  await page.locator('#exit').click();
  await page.locator('#openLibrary').click();
  await page.locator('[data-learn-tab="concepts"]').click();
  assert.match(await page.locator('#learningContent').innerText(),/종수 2/);
  assert.match(await page.locator('#learningContent').innerText(),/9/);
  await page.locator('[data-learn-tab="quiz"]').click();
  await page.locator('.quiz-modes button').filter({hasText:'바닷속 유적'}).click();
  assert.match(await page.locator('#learningContent').innerText(),/종수 2/);
  await page.screenshot({path:'level3-guide.png'});
  assert.deepEqual(errors,[],'No uncaught browser JS errors');
  console.log('PASS: Third-level 3D gameplay, wrong answer, three correct answers, success, old levels, atlas, quiz');
}finally{await browser.close();}
