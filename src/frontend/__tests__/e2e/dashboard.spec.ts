import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function waitForTelemetryUpdate(page: Page, initialTimestamp: string) {
  await expect(async () => {
    const timestamp = await page.locator('.font-mono.text-sm.text-slate-500.font-medium').first().textContent();
    expect(timestamp).not.toBe(initialTimestamp);
  }).toPass({ timeout: 5000 });
}

test.describe('Dashboard (Simulação)', () => {
  test.setTimeout(45000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const simBtn = page.getByRole('button', { name: /MODO SIMULAÇÃO/i });
    await expect(simBtn).toBeVisible();
    await page.locator('.aspect-square').first().waitFor();
  });

  test('deve mostrar métricas iniciais corretamente', async ({ page }) => {
    await expect(page.getByText('Bateria', { exact: true })).toBeVisible();
    await expect(page.getByText('Velocidade', { exact: true })).toBeVisible();
    await expect(page.getByText('Posição Atual', { exact: true })).toBeVisible();
    await expect(page.getByText('Estado do Robô', { exact: true })).toBeVisible();

    const bateria = await page.locator('.tabular-nums').first().textContent();
    expect(bateria).toMatch(/\d+\.\d+V/);
  });

  test('deve alternar entre modos de override: Auto, Exploração, Alta Performance', async ({ page }) => {
    const autoBtn = page.getByRole('button', { name: 'Auto' });
    const exploracaoBtn = page.getByRole('button', { name: 'Exploração' });
    const performanceBtn = page.getByRole('button', { name: 'Alta Performance' });

    await expect(autoBtn).toBeVisible();
    await expect(exploracaoBtn).toBeVisible();
    await expect(performanceBtn).toBeVisible();

    await exploracaoBtn.click();
    await expect(page.getByText('FAST_RUN', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Volta Atual', { exact: true })).not.toBeVisible();

    await performanceBtn.click();
    await expect(page.getByText('FAST_RUN').first()).toBeVisible();
    await expect(page.getByText('Volta Atual', { exact: true })).toBeVisible();
    await expect(page.getByText('Melhor Volta', { exact: true })).toBeVisible();

    await autoBtn.click();
  });

  test('deve atualizar telemetria automaticamente (simulação)', async ({ page }) => {
    const posInicial = await page.locator('.tabular-nums').nth(4).textContent();
    const timestampInicial = await page.locator('.font-mono.text-sm.text-slate-500.font-medium').first().textContent();

    await waitForTelemetryUpdate(page, timestampInicial!);

    const posAtual = await page.locator('.tabular-nums').nth(4).textContent();
    expect(posAtual).not.toBe(posInicial);

    const robotCell = page.locator('div.bg-blue-500\\/20.rounded-full').first();
    await expect(robotCell).toBeVisible();
  });

  test('deve exibir alerta crítico de bateria quando tensão < 6.8V', async ({ page }) => {
    await expect(page.getByText('Alerta Crítico:').first()).toBeVisible({ timeout: 25000 });
    const alertText = await page.getByText(/Bateria Crítica/).first().textContent();
    expect(alertText).toContain('Bateria Crítica');
  });

  test('deve exibir erro de hardware quando estado = ERROR', async ({ page }) => {
    await expect(page.getByText('Alarme Crítico de Hardware:').first()).toBeVisible({ timeout: 30000 });
    const causaErro = await page.getByText(/Parada de Emergência/).first().textContent();
    expect(causaErro).toBeTruthy();
    const estadoCard = page.locator('.bg-red-100, .border-red-400').filter({ hasText: 'ERROR' }).first();
    await expect(estadoCard).toBeVisible({ timeout: 35000 });
  });

  test('deve abrir/fechar gaveta de logs e mostrar conteúdo adequado', async ({ page }) => {
    const toggleBtn = page.getByRole('button', { name: /Logs de Interrupção|Desempenho da Corrida|Ocultar Logs|Ocultar Desempenho/ }).first();
    const drawer = page.locator('.bg-slate-900\\/95.backdrop-blur-md.rounded-2xl').first();

    await toggleBtn.click();
    await expect(drawer).toBeVisible();
    await expect(page.getByRole('button', { name: /Ocultar Logs|Ocultar Desempenho/ }).first()).toBeVisible();

    await toggleBtn.click();
    await expect(page.getByRole('button', { name: /Logs de Interrupção|Desempenho da Corrida/ }).first()).toBeVisible();
  });

  test('deve exibir trajeto rápido quando modo FAST_RUN ativo', async ({ page }) => {
    await page.getByRole('button', { name: 'Alta Performance' }).click();
    const pontosVerdes = page.locator('.rounded-full.bg-emerald-400, .rounded-full.bg-emerald-500');
    await expect(pontosVerdes.first()).toBeVisible({ timeout: 5000 });
  });
});