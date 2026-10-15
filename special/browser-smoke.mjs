import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const executablePath=process.env.BROWSER_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:1000}});
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('ARENA ERROR',e.message);});
const server=http.createServer((req,res)=>{
  const file=path.resolve('.','.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(path.resolve('.')+path.sep)){res.writeHead(403);res.end();return;}
  const contentType={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
  fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':contentType});res.end(error?'Not found':data);});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=process.env.TEST_ORIGIN||`http://127.0.0.1:${server.address().port}`;
fs.mkdirSync('special-previews',{recursive:true});
async function capture(name){await page.screenshot({path:`special-previews/${name}.png`,fullPage:true});}
async function choose(id){await page.locator(`[data-model="${id}"]`).click();assert.equal(await page.locator(`[data-model="${id}"]`).getAttribute('aria-pressed'),'true');}
async function start(id){await choose(id);await page.locator('#fight').click();assert.ok(await page.locator('#fight').isDisabled());}
async function finish(){await page.clock.fastForward(8000);await page.clock.runFor(32);assert.ok(await page.locator('#next').isVisible());}
try{
  await page.clock.install();
  await page.goto(origin+'/special/index.html');
  await page.waitForFunction(()=>document.getElementById('loadStatus').hidden,{timeout:60000});
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  assert.ok(await page.locator('#fight').isDisabled());
  await capture('desktop-select');
  await start('ovalTorus');
  assert.equal(await page.locator('.choice:disabled').count(),3);
  // Real WebGL frames, with only the browser clock controlled for reproducibility.
  await page.clock.fastForward(2035);await page.clock.runFor(32);
  assert.equal(await page.locator('[aria-label="상대 체력"]').getAttribute('aria-valuenow'),'80');
  await capture('punch-contact');
  await page.clock.fastForward(880);await page.clock.runFor(32);
  assert.equal(await page.locator('[aria-label="내 체력"]').getAttribute('aria-valuenow'),'80');
  await capture('rival-counter');
  await page.clock.fastForward(2660);await page.clock.runFor(32);
  assert.equal(await page.locator('#bannerText').innerText(),'K.O.');
  await capture('finishing-hit');
  await finish();
  assert.match(await page.locator('#resultTitle').innerText(),/승리/);
  assert.match(await page.locator('#score').innerText(),/1승 · 0패/);
  assert.equal(await page.locator('[aria-label="상대 체력"]').getAttribute('aria-valuenow'),'0');
  await page.clock.runFor(400);await capture('win');
  // Repeat clicks cannot score twice, and a different object now always loses.
  await page.locator('#fight').evaluate(button=>button.click());
  assert.match(await page.locator('#score').innerText(),/1승 · 0패/);
  await page.locator('#next').click();await start('torus');await finish();
  assert.match(await page.locator('#resultTitle').innerText(),/패배/);
  assert.match(await page.locator('#score').innerText(),/1승 · 1패/);
  assert.equal(await page.locator('[aria-label="내 체력"]').getAttribute('aria-valuenow'),'0');
  await capture('loss');
  await page.locator('#next').click();await start('ellipse');await finish();
  await page.locator('#next').click();await start('arc');await finish();
  await page.locator('#next').click();assert.match(await page.locator('#resultTitle').innerText(),/3승 1패/);
  // Restart during a fight cancels its old outcome instead of resolving later.
  await page.locator('#restart').click();await start('sphere');await page.clock.fastForward(2100);
  await page.locator('#restart').click();await page.clock.fastForward(10000);
  assert.match(await page.locator('#score').innerText(),/0승 · 0패/);assert.ok(await page.locator('#fight').isDisabled());assert.ok(await page.locator('#next').isHidden());
  await page.locator('#motion').click();await page.locator('#view').click();
  assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'false');
  await page.setViewportSize({width:390,height:844});await page.clock.runFor(32);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await choose('ovalTorus');await capture('mobile-select');
  // A real-time fight with reduced motion proves timing does not require the
  // test clock, camera movement or celebration animation to finish correctly.
  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(origin+'/special/index.html');
  await mobile.waitForFunction(()=>document.getElementById('loadStatus').hidden,{timeout:60000});
  assert.equal(await mobile.locator('#motion').getAttribute('aria-pressed'),'false');
  await mobile.locator('[data-model="circle"]').click();await mobile.locator('#fight').click();
  assert.equal(await mobile.locator('.arena').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),true,'Mobile fight scrolls the arena into view');
  await mobile.locator('#next').waitFor({state:'visible',timeout:30000});
  assert.ok(await mobile.locator('#readResult').isVisible());
  assert.match(await mobile.locator('#resultTitle').innerText(),/패배/);
  assert.match(await mobile.locator('#resultExplanation').innerText(),/차원/);
  await mobile.screenshot({path:'special-previews/mobile-loss.png',fullPage:true});
  await mobile.locator('header a').click();assert.ok(await mobile.locator('#level3').isVisible());
  assert.equal(await mobile.locator('#specialEntry').getAttribute('href'),'special/index.html');
  await mobile.close();assert.deepEqual(errors,[]);
  console.log('PASS SPECIAL: actual exchange/contact frames, correct-object win, wrong-object loss, 4 rounds, input lock, mid-fight reset, mobile, real-time reduced motion and exit.');
}finally{await browser.close();server.close();}
