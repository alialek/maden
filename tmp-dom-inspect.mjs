import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

const target = page.getByText('standalone browser mode for the Maden webview.', { exact: false }).first();
await target.click();
await page.keyboard.down('Shift');
for (let i = 0; i < 6; i += 1) await page.keyboard.press('ArrowRight');
await page.keyboard.up('Shift');
await page.keyboard.press('Meta+J');
await page.waitForTimeout(400);

const improveText = page.getByText('Improve writing', { exact: true }).first();
const improveItem = improveText.locator('xpath=ancestor::*[@data-slot="command-item"][1]');
await improveItem.waitFor({ state: 'visible', timeout: 10000 });

const beforeBg = await improveItem.evaluate((el) => getComputedStyle(el).backgroundColor);
await page.screenshot({ path: '/tmp/maden-ai-menu-before-hover.png', fullPage: true });
await improveItem.hover();
await page.waitForTimeout(250);
const afterBg = await improveItem.evaluate((el) => getComputedStyle(el).backgroundColor);
await page.screenshot({ path: '/tmp/maden-ai-menu-after-hover.png', fullPage: true });

await improveItem.click();
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/maden-ai-loading.png', fullPage: true });

await page.waitForTimeout(2200);
const acceptVisible = await page.getByRole('button', { name: 'Accept' }).isVisible().catch(() => false);
const rejectVisible = await page.getByRole('button', { name: 'Reject' }).isVisible().catch(() => false);
await page.screenshot({ path: '/tmp/maden-ai-after-finish.png', fullPage: true });

console.log(JSON.stringify({ beforeBg, afterBg, hoverChanged: beforeBg !== afterBg, acceptVisible, rejectVisible }, null, 2));
await browser.close();
