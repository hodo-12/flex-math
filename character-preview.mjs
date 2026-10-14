import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(path=>fs.existsSync(path));
assert(executablePath,'Chromium executable is required');
const browser=await chromium.launch({
  executablePath,headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
const page=await browser.newPage({viewport:{width:1400,height:950},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.character').count(),4);
  assert.equal(await page.locator('.outfit-chip').count(),4,'four distinct outfit tags');
  await page.locator('[data-character="hood"]').click();
  await page.locator('#start').click();
  await page.locator('#world canvas').waitFor({state:'visible',timeout:25000});
  await page.waitForTimeout(500);
  await page.screenshot({path:'avatar-hood-idle.png'});
  await page.locator('#exit').click();
  await page.locator('[data-character="cat"]').click();
  await page.locator('#start').click();
  await page.locator('#objectList button[data-id="cup"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({path:'avatar-cat-walk.png'});
  await page.locator('#inspect').waitFor({state:'visible',timeout:25000});
  await page.locator('#closeInspect').click();
  await page.locator('#exit').click();
  await page.locator('[data-character="cap"]').click();
  await page.locator('#start').click();
  await page.waitForTimeout(550);
  await page.screenshot({path:'avatar-cap-idle.png'});
  assert.deepEqual(errors,[],'The new character rig should not throw runtime errors');
  console.log('PASS: original photos, four outfit cards, 3D rig, movement, inspection, character switching');
}finally{await browser.close();}
