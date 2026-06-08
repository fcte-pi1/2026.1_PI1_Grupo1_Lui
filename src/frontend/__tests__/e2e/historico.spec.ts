import { test, expect } from '@playwright/test';
import { Buffer } from 'buffer';

const MOCK_RUN_ID = 'corrida_1715456789.json';

const MOCK_HISTORICO = {
  id_corrida: 'run_001',
  historico: [
    { x: 0, y: 7, orientacao: 'NORTE', paredes: [] },
    { x: 0, y: 6, orientacao: 'NORTE', paredes: [{ x: 0, y: 6, dir: 'NORTE' }] },
    { x: 0, y: 5, orientacao: 'LESTE', paredes: [{ x: 0, y: 5, dir: 'LESTE' }] },
    { x: 1, y: 5, orientacao: 'LESTE', paredes: [] },
    { x: 2, y: 5, orientacao: 'NORTE', paredes: [] },
    { x: 2, y: 4, orientacao: 'NORTE', paredes: [] },
  ],
};

test.describe('Página de Histórico', () => {
  test.setTimeout(45000);

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/maze_runs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_RUN_ID]),
      });
    });

    await page.route(`**/api/maze_runs/${MOCK_RUN_ID}`, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify(MOCK_HISTORICO) });
    });

    await page.goto('/historico');
    await page.waitForSelector(`text=${MOCK_RUN_ID}`);
  });

  test('deve carregar lista de corridas da API', async ({ page }) => {
    await expect(page.getByText(MOCK_RUN_ID).first()).toBeVisible();
    await expect(page.getByText('1 corrida encontrada').first()).toBeVisible();
  });

  test('deve carregar detalhes da corrida ao clicar', async ({ page }) => {
    await page.getByText(MOCK_RUN_ID).first().click();
    await expect(page.locator('.grid').first()).toBeVisible();
    await expect(page.getByText(/6 passos/).first()).toBeVisible();
  });

  test('deve permitir navegação passo a passo', async ({ page }) => {
    await page.getByText(MOCK_RUN_ID).first().click();
    await page.waitForSelector('.grid');

    await expect(page.locator('.font-mono.font-bold').first()).toContainText('1/6');
    await expect(page.locator('.font-mono').filter({ hasText: '(0, 7)' }).first()).toBeVisible();

    await page.getByRole('button', { name: '▶', exact: true }).click();
    await expect(page.locator('.font-mono.font-bold').first()).toContainText('2/6');
    await expect(page.locator('.font-mono').filter({ hasText: '(0, 6)' }).first()).toBeVisible();

    await page.getByRole('button', { name: '◀', exact: true }).click();
    await expect(page.locator('.font-mono.font-bold').first()).toContainText('1/6');
  });

  test('deve executar replay automático', async ({ page }) => {
    await page.getByText(MOCK_RUN_ID).first().click();
    await page.waitForSelector('.grid');

    await page.getByRole('button', { name: '▶ Play' }).click();
    await page.waitForTimeout(1500);

    const stepText = await page.locator('.font-mono.font-bold').first().textContent();
    expect(stepText).not.toBe('1/6');

    await page.getByRole('button', { name: /Pausar|Replay/i }).first().click();
  });

  test('deve resetar para o início', async ({ page }) => {
    await page.getByText(MOCK_RUN_ID).first().click();
    await page.waitForSelector('.grid');

    await page.getByRole('button', { name: '▶', exact: true }).click();
    await page.getByRole('button', { name: '▶', exact: true }).click();
    await expect(page.locator('.font-mono.font-bold').first()).toContainText('3/6');

    await page.getByRole('button', { name: '⏮' }).click();
    await expect(page.locator('.font-mono.font-bold').first()).toContainText('1/6');
  });

  test('deve permitir upload de arquivo JSON', async ({ page }) => {
    const mockFileContent = JSON.stringify({
      historico: [
        { x: 0, y: 0, orientacao: 'NORTE', paredes: [] },
        { x: 0, y: 1, orientacao: 'NORTE', paredes: [{ x: 0, y: 1, dir: 'LESTE' }] },
      ],
    });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: 'upload.json',
      mimeType: 'application/json',
      buffer: Buffer.from(mockFileContent, 'utf-8'),
    });

    await expect(page.getByText('upload.json').first()).toBeVisible();
    await expect(page.locator('.grid').first()).toBeVisible();
    await expect(page.getByText(/2 passos/).first()).toBeVisible();
  });

  test('deve ajustar velocidade do replay', async ({ page }) => {
    await page.getByText(MOCK_RUN_ID).first().click();
    await page.waitForSelector('.grid');

    await page.getByRole('button', { name: '10×' }).click();
    await page.getByRole('button', { name: '▶ Play' }).click();
    await page.waitForTimeout(600);

    const step = await page.locator('.font-mono.font-bold').first().textContent();
    const current = parseInt(step!.split('/')[0]);
    expect(current).toBeGreaterThan(1);
  });
});