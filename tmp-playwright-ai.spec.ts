import { test, expect } from '@playwright/test';

test('ai actions are interactive and send selected context', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__hostMessages = [];
    (window as any).__lastAiRequestBody = null;
    (window as any).__glowSeen = false;

    const postFromHost = (data: any) => {
      window.dispatchEvent(new MessageEvent('message', { data }));
    };

    (window as any).acquireVsCodeApi = () => ({
      postMessage: (msg: any) => {
        (window as any).__hostMessages.push(msg);

        if (msg?.type === 'ready') {
          setTimeout(() => {
            postFromHost({
              type: 'initDocument',
              aiEnabled: true,
              fileName: 'playwright.md',
              filePath: '/tmp/playwright.md',
              markdown:
                '# Playwright AI test\\n\\nThis paragraph should be selected for AI improve writing action.',
              readOnly: false,
              workspacePaths: [],
            });
          }, 10);
        }

        if (msg?.type === 'aiRequestStart') {
          (window as any).__lastAiRequestBody = msg.body;
          const id = msg.requestId;

          setTimeout(() => {
            postFromHost({ type: 'aiStreamChunk', requestId: id, chunk: 'data: {"type":"start"}\\n\\n' });
            postFromHost({ type: 'aiStreamChunk', requestId: id, chunk: 'data: {"type":"start-step"}\\n\\n' });
            postFromHost({ type: 'aiStreamChunk', requestId: id, chunk: 'data: {"type":"text-start","id":"m1","providerMetadata":{"maden":{"itemId":"m1"}}}\\n\\n' });
            postFromHost({ type: 'aiStreamChunk', requestId: id, chunk: 'data: {"type":"text-delta","id":"m1","delta":"Improved sentence."}\\n\\n' });
            (window as any).__glowSeen = document.querySelectorAll('.maden-ai-loading-glow').length > 0;
          }, 100);

          setTimeout(() => {
            postFromHost({ type: 'aiStreamChunk', requestId: id, chunk: 'data: {"type":"text-end","id":"m1"}\\n\\n' });
            postFromHost({ type: 'aiStreamChunk', requestId: id, chunk: 'data: {"type":"finish-step"}\\n\\n' });
            postFromHost({ type: 'aiStreamChunk', requestId: id, chunk: 'data: {"type":"finish"}\\n\\n' });
            postFromHost({ type: 'aiStreamEnd', requestId: id });
          }, 1200);
        }
      },
    });
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  await page
    .getByText('paragraph should be selected for AI improve writing action', { exact: false })
    .dblclick();

  await page.keyboard.press('Meta+J');

  const improveText = page.getByText('Improve writing', { exact: true }).first();
  const improveItem = improveText.locator(
    'xpath=ancestor::*[@data-slot="command-item"][1]'
  );
  await expect(improveItem).toBeVisible({ timeout: 10000 });

  const beforeBg = await improveItem.evaluate((el) => getComputedStyle(el).backgroundColor);
  await improveItem.hover();
  await page.waitForTimeout(120);
  const afterBg = await improveItem.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(afterBg).not.toBe(beforeBg);

  await improveItem.click();
  await page.waitForTimeout(300);

  const hostMessages = await page.evaluate(() => (window as any).__hostMessages || []);
  expect(hostMessages.some((m: any) => m?.type === 'aiRequestStart')).toBeTruthy();

  const bodyRaw = await page.evaluate(() => (window as any).__lastAiRequestBody);
  expect(typeof bodyRaw).toBe('string');

  const parsed = JSON.parse(bodyRaw as string);
  const messages = Array.isArray(parsed?.messages) ? parsed.messages : [];
  const joined = messages.map((m: any) => String(m?.content ?? '')).join('\\n');

  expect(joined.includes('Selected content:') || joined.includes('Current block:')).toBeTruthy();

  await page.waitForTimeout(250);
  const glowSeen = await page.evaluate(() => Boolean((window as any).__glowSeen));
  expect(glowSeen).toBeTruthy();
});
