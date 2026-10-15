import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const executablePath=process.env.BROWSER_PATH||['/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const server=http.createServer((req,res)=>{
  const file=path.resolve('.','.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(path.resolve('.')+path.sep)){res.writeHead(403);res.end();return;}
  const contentType={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
  fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':contentType});res.end(error?'Not found':data);});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=process.env.TEST_ORIGIN||`http://127.0.0.1:${server.address().port}`;
fs.mkdirSync('special-previews',{recursive:true});
async function claim(i,value){await page.locator('.player').nth(i).locator(`[data-claim="${value}"]`).click();}
async function answer(a,b){await claim(0,a);await claim(1,b);await page.locator('#judge').click();}
try{
  await page.goto(origin+'/special/index.html');
  await page.waitForFunction(()=>document.getElementById('loadStatus').hidden,{timeout:60000});
  assert.ok(await page.locator('#judge').isDisabled());
  // Both wrong: no victory and no points.
  await answer(false,true);
  assert.match(await page.locator('#result').innerText(),/승자 없음/);
  assert.match(await page.locator('#score').innerText(),/빨강 0 : 0 노랑/);
  assert.ok(await page.locator('#model-0').isDisabled());
  await page.screenshot({path:'special-previews/no-winner.png',fullPage:true});
  await page.locator('#restart').click();
  await claim(0,true);await page.locator('#model-0').selectOption('sphere');
  assert.ok(await page.locator('#judge').isDisabled());
  // Correct rejection wins for first character; third is incorrect.
  await answer(false,true);
  assert.match(await page.locator('#result').innerText(),/첫째 캐릭터 · 빨강 공주 승리/);
  assert.match(await page.locator('#score').innerText(),/빨강 1 : 0 노랑/);
  await page.screenshot({path:'special-previews/winner.png',fullPage:true});
  await page.locator('#next').click();await answer(false,true); // Both right.
  assert.match(await page.locator('#result').innerText(),/공동 승리/);
  await page.locator('#next').click();await answer(false,true); // Surface vs curve.
  assert.match(await page.locator('#result').innerText(),/차원/);
  await page.locator('#next').click();await answer(true,false);
  await page.locator('#next').click();
  assert.match(await page.locator('#result').innerText(),/빨강 공주 우승/);
  assert.match(await page.locator('#result').innerText(),/빨강 4 : 3 노랑/);
  await page.locator('#restart').click();assert.match(await page.locator('#score').innerText(),/빨강 0 : 0 노랑/);
  await page.locator('#motion').click();await page.locator('#view').click();
  await page.screenshot({path:'special-previews/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'special-previews/mobile.png',fullPage:true});
  // Reduced motion starts disabled and all-zero tournament has no champion.
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
  await page.waitForFunction(()=>document.getElementById('loadStatus').hidden);
  assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'false');
  for(const pair of [[false,true],[true,false],[true,false],[false,true]]){await answer(...pair);await page.locator('#next').click();}
  assert.match(await page.locator('#result').innerText(),/우승자가 없어요/);
  await page.locator('header a').click();assert.ok(await page.locator('#level3').isVisible());
  assert.equal(await page.locator('#specialEntry').getAttribute('href'),'special/index.html');
  assert.deepEqual(errors,[]);
  console.log('SPECIAL browser checks passed: wrong/correct/tie, all rounds, championship, reset, mobile, reduced motion, exit.');
}finally{await browser.close();server.close();}
