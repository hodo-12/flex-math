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
  const cutout=await page.evaluate(async()=>{
    const {RACERS}=await import('./racers.js'),{createPortraitCanvas}=await import('./portrait.js');
    const config=RACERS.find(c=>c.id==='clover'),w=config.faceWindow;
    const image=document.querySelector('.racer-card[data-racer="clover"] img');
    const canvas=createPortraitCanvas(image,w),ctx=canvas.getContext('2d');
    const source=document.createElement('canvas');source.width=w.width;source.height=w.height;source.getContext('2d').drawImage(image,-w.x,-w.y);
    const a=ctx.getImageData(0,0,w.width,w.height).data,b=source.getContext('2d').getImageData(0,0,w.width,w.height).data;
    let opaque=0,changed=0;for(let i=0;i<a.length;i+=4)if(a[i+3]===255){opaque++;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++;}
    const alpha=(x,y)=>ctx.getImageData(x-w.x,y-w.y,1,1).data[3];
    return {opaque,changed,background:[[225,90],[810,90],[810,200],[220,700]].map(p=>alpha(...p)),face:[[491,410],[652,400],[574,502],[580,587],[570,700]].map(p=>alpha(...p)),masks:[...document.querySelectorAll('clipPath')].map(el=>el.id)};
  });
  assert.ok(cutout.opaque>220000);assert.equal(cutout.changed,0);assert.deepEqual(cutout.background,[0,0,0,0]);assert.deepEqual(cutout.face,[255,255,255,255,255]);assert.equal(new Set(cutout.masks).size,2);
  console.log('PASS CLOVER CONTOUR: transparent backdrop, eyes/nose/mouth/chin retained, every opaque pixel identical to original, shared UI masks.');
  // Capture the real display masks at review size; this temporary panel is test-only.
  await page.evaluate(async()=>{
    const {RACERS}=await import('./racers.js'),{createPortraitCanvas}=await import('./portrait.js');
    const c=RACERS.find(c=>c.id==='clover'),image=document.querySelector('.racer-card[data-racer="clover"] img');
    const panel=document.createElement('div');panel.id='face-review';panel.style.cssText='position:fixed;inset:20px auto auto 20px;z-index:1000;display:flex;gap:24px;padding:24px;background:#faf8ed;color:#283f43;font:700 17px sans-serif';
    for(const [title,w] of [['수정 전 · 회색 여백', {...c.faceWindow,x:180,y:40,width:700,height:760,outline:null}],['수정 후 · 얼굴 윤곽',c.faceWindow]]){
      const card=document.createElement('div');card.style.cssText='width:280px;text-align:center';const canvas=createPortraitCanvas(image,w);canvas.style.cssText='display:block;height:300px;width:auto;max-width:280px;margin:18px auto 0;background:#dceee9';card.append(document.createTextNode(title),canvas);panel.append(card);
    }document.body.append(panel);
  });
  await page.locator('#face-review').screenshot({path:'kart-previews/face-contour.png'});await page.locator('#face-review').evaluate(el=>el.remove());
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
