import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error('BONUS ERROR',e.message);});
// Preserve the GPU buffer only in this screenshot harness: a paused virtual
// animation clock must not let the compositor clear an otherwise valid frame.
await page.addInitScript(()=>{const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return getContext.call(this,type,/webgl/.test(type)?{...options,preserveDrawingBuffer:true}:options);};});
fs.mkdirSync('bonus-previews',{recursive:true});
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8080';
async function capture(name){await page.screenshot({path:`bonus-previews/${name}.png`,fullPage:true});}
async function start(id){await page.locator(`[data-model="${id}"]`).click();await page.locator('#dance').click();assert.ok(await page.locator('#dance').isDisabled());assert.equal(await page.locator('.choice:disabled').count(),3);}
async function advance(ms){await page.clock.fastForward(ms);await page.clock.runFor(32);}
async function finish(){await advance(13000);assert.ok(await page.locator('#next').isVisible());}
try{
  await page.clock.install();await page.goto(origin+'/bonus/index.html');
  await page.waitForFunction(()=>document.getElementById('loadStatus').hidden,{timeout:60000});
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.clock.runFor(32);
  assert.ok(await page.locator('#dance').isDisabled());assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
  await capture('desktop-select');
  await start('ovalTorus');await advance(1200);assert.equal(await page.locator('#moveLabel').innerText(),'TOP ROCK');await capture('red-toprock');
  await advance(1600);assert.equal(await page.locator('#moveLabel').innerText(),'ONE-HAND FREEZE');await capture('red-freeze');
  await advance(3300);assert.match(await page.locator('#turnLabel').innerText(),/노랑/);await capture('yellow-freeze');
  await advance(2000);assert.equal(await page.locator('#moveLabel').innerText(),'POWER SPIN');await capture('power-spin');
  await finish();await page.clock.runFor(400);assert.match(await page.locator('#resultTitle').innerText(),/빨강.*승리/);assert.match(await page.locator('#score').innerText(),/1승 · 0패/);await capture('win');
  await page.locator('#next').click();await start('torus');await finish();assert.match(await page.locator('#resultTitle').innerText(),/노랑.*승리/);assert.match(await page.locator('#score').innerText(),/1승 · 1패/);await capture('loss');
  await page.locator('#next').click();await start('ellipse');await finish();await page.locator('#next').click();await start('arc');await finish();await page.locator('#next').click();assert.match(await page.locator('#resultTitle').innerText(),/3승 1패/);
  await page.locator('#restart').click();await start('sphere');await advance(2600);await page.locator('#restart').click();await advance(16000);assert.match(await page.locator('#score').innerText(),/0승 · 0패/);assert.ok(await page.locator('#next').isHidden());assert.ok(await page.locator('#dance').isDisabled());
  await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
  await page.setViewportSize({width:390,height:844});await page.clock.runFor(32);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await capture('mobile-select');
  // Real-time production rendering, with no clock or context patch.
  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(origin+'/bonus/index.html');await mobile.waitForFunction(()=>document.getElementById('loadStatus').hidden,{timeout:60000});
  assert.equal(await mobile.locator('#motion').getAttribute('aria-pressed'),'false');await mobile.locator('[data-model="circle"]').click();await mobile.locator('#dance').click();
  assert.equal(await mobile.locator('.arena').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),true);
  await mobile.locator('#next').waitFor({state:'visible',timeout:30000});assert.match(await mobile.locator('#resultTitle').innerText(),/노랑.*승리/);assert.match(await mobile.locator('#resultExplanation').innerText(),/차원/);await mobile.screenshot({path:'bonus-previews/mobile-loss.png',fullPage:true});
  await mobile.locator('#readResult').click();assert.ok(await mobile.locator('#resultTitle').isVisible());
  await mobile.locator('header a').click();assert.ok(await mobile.locator('#level3').isVisible());assert.equal(await mobile.locator('#specialEntry').getAttribute('href'),'special/index.html');assert.equal(await mobile.locator('#bonusEntry').getAttribute('href'),'bonus/index.html');await mobile.close();
  assert.deepEqual(errors,[]);console.log('PASS BONUS: red/yellow top-rock and freezes, power spin, correct win/wrong loss, four rounds, interrupted reset, optional beat, mobile scroll, real-time reduced motion, lobby preservation.');
}finally{await browser.close();}
