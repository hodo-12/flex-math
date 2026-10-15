import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[],failed=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
await page.addInitScript(()=>{const gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return gc.call(this,type,/webgl/.test(type)?{...options,preserveDrawingBuffer:true}:options);};});
fs.mkdirSync('kart-previews',{recursive:true});
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:8080';
const capture=name=>page.screenshot({path:`kart-previews/${name}.png`,fullPage:true});
// Exercise the production fixed-step simulation while skipping redundant GPU
// frames in software-rendered CI. Each visual frame still advances <= 0.5 s.
async function advance(ms){for(let elapsed=0;elapsed<ms;elapsed+=400){await page.clock.fastForward(Math.min(400,ms-elapsed));await page.clock.runFor(17);}}
try{
  await page.clock.install();await page.goto(origin+'/kart/index.html');await page.waitForFunction(()=>document.getElementById('loadStatus').hidden,{timeout:60000});
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.clock.runFor(32);
  assert.equal(await page.locator('.racer-card').count(),5);assert.equal(await page.locator('.kart-label').count(),5);assert.equal(await page.locator('.racer-card[aria-pressed="true"]').getAttribute('data-racer'),'clover');
  assert.equal(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true);assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');await capture('grid');
  await page.locator('#camera').click();await advance(1600);await capture('green-princess');await page.locator('#camera').click();await advance(1600);
  await page.locator('#start').click();assert.ok(await page.locator('#start').isDisabled());assert.equal(await page.locator('.racer-card:disabled').count(),5);await capture('countdown');
  await advance(4000);assert.equal(await page.locator('#phaseLabel').innerText(),'레이스 중');assert.ok(await page.locator('#boost').isEnabled());await page.locator('#boost').click();assert.ok(await page.locator('#boost').isDisabled());
  await advance(7500);assert.ok(Number(await page.locator('#bumps').innerText())>0);assert.ok(Number(await page.locator('#passes').innerText())>0);await capture('racing');
  await page.locator('#pause').click();const timer=await page.locator('#timer').innerText();await advance(2000);assert.equal(await page.locator('#timer').innerText(),timer);assert.ok(await page.locator('#boost').isDisabled());await page.locator('#pause').click();
  await page.locator('#camera').click();await advance(1800);await capture('close-race');await page.locator('#camera').click();
  for(let i=0;i<110&&await page.locator('#result').isHidden();i++)await advance(400);
  assert.ok(await page.locator('#result').isVisible());assert.match(await page.locator('#winnerTitle').innerText(),/공주, 우승/);assert.equal(await page.locator('.finish-check').allTextContents().then(a=>a.filter(t=>t==='FIN').length),5);assert.ok(await page.locator('#boost').isDisabled());await advance(1600);await capture('finish');
  // Reset mid-race cannot let an old countdown or finish callback leak through.
  await page.locator('#start').click();await advance(6000);await page.locator('#reset').click();await advance(1000);assert.equal(await page.locator('#phaseLabel').innerText(),'출발 준비');assert.equal(await page.locator('#timer').innerText(),'00:00.0');assert.ok(await page.locator('#result').isHidden());
  await page.locator('.racer-card[data-racer="ruby"]').click();assert.equal(await page.locator('.racer-card[aria-pressed="true"]').getAttribute('data-racer'),'ruby');
  await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');await page.locator('#sound').click();
  // Untampered, real-time mobile WebGL session, including reduced-motion mode.
  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(origin+'/kart/index.html');await mobile.waitForFunction(()=>document.getElementById('loadStatus').hidden,{timeout:60000});assert.equal(await mobile.locator('#motion').getAttribute('aria-pressed'),'false');assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mobile.screenshot({path:'kart-previews/mobile-grid.png',fullPage:true});await mobile.locator('#start').click();await mobile.waitForFunction(()=>document.getElementById('phaseLabel').textContent==='레이스 중',{timeout:20000});
  assert.ok(await mobile.locator('#mobileBoost').isEnabled());assert.equal(await mobile.locator('#camera').getAttribute('aria-pressed'),'true');assert.equal(await mobile.locator('#mobileBoost').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),true);await mobile.locator('#mobileBoost').click();assert.ok(await mobile.locator('#mobileBoost').isDisabled());await mobile.locator('#mobilePause').click();assert.equal(await mobile.locator('#phaseLabel').innerText(),'잠시 쉬는 중');await mobile.locator('#mobilePause').click();await mobile.screenshot({path:'kart-previews/mobile-race.png',fullPage:true});await mobile.locator('#reset').click();assert.ok(await mobile.locator('#mobileControls').isHidden());
  await mobile.locator('.site-header>a').click();for(const id of ['level','level2','level3','specialEntry','bonusEntry','kartEntry'])assert.ok(await mobile.locator('#'+id).count());await mobile.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS KART: five original portraits, green newcomer, countdown, simultaneous race, boost/cooldown, passing, pair collisions, all finishers, podium, pause/reset, selection, optional audio, real-time mobile WebGL, reduced motion, intact lobby links.');
}catch(error){await capture('failure');console.error('BROWSER ERRORS',errors,'HTTP ERRORS',failed);throw error;}finally{await browser.close();}
