import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const target = page.getByText('standalone browser mode for the Maden webview.', { exact: false }).first();
await target.click();
await page.keyboard.down('Shift');
for (let i = 0; i < 6; i += 1) await page.keyboard.press('ArrowRight');
await page.keyboard.up('Shift');
await page.keyboard.press('Meta+J');
await page.waitForTimeout(300);

const improveItem = page
  .getByText('Improve writing', { exact: true })
  .first()
  .locator('xpath=ancestor::*[@data-slot="command-item"][1]');
await improveItem.waitFor({ state: 'visible', timeout: 10000 });
const before = await improveItem.evaluate((el) => getComputedStyle(el).backgroundColor);
await improveItem.hover();
await page.waitForTimeout(160);
const after = await improveItem.evaluate((el) => getComputedStyle(el).backgroundColor);

await improveItem.click();
await page.waitForTimeout(2200);
const bodyText = (await page.locator('body').innerText()).slice(0, 5000);

console.log(JSON.stringify({ before, after, hoverChanged: before !== after, hasImprovedVersionLabel: bodyText.includes('Improved version:') }, null, 2));
await browser.close();
