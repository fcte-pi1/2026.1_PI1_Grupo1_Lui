import { test, expect } from '@playwright/test';

test.describe('Navegação e Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sidebar deve conter links para Dashboard e Histórico', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' }).first();
    const historicoLink = page.getByRole('link', { name: 'Histórico' }).first();
    await expect(dashboardLink).toBeVisible();
    await expect(historicoLink).toBeVisible();
  });

  test('navegação para Histórico e volta para Dashboard', async ({ page }) => {
    await page.getByRole('link', { name: 'Histórico' }).first().click();
    await expect(page).toHaveURL(/\/historico/);
    await expect(page.getByText('Histórico do Labirinto').first()).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible();
  });

  test('exibe status de conexão (simulação mostra como conectado)', async ({ page }) => {
    const wifiIcon = page.locator('.text-emerald-500, .text-amber-500').first();
    await expect(wifiIcon).toBeVisible();
    await expect(page.getByText('Conectado').first()).toBeVisible();
  });
});