import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Layout } from '../app/components/Layout';

function renderLayout(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Layout />
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('renderiza o nome da aplicação "Micromouse"', () => {
    renderLayout();
    expect(screen.getByText('Micromouse')).toBeInTheDocument();
  });

  it('renderiza a versão "Telemetria v1.0"', () => {
    renderLayout();
    expect(screen.getByText('Telemetria v1.0')).toBeInTheDocument();
  });

  it('renderiza o título do menu', () => {
    renderLayout();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  describe('links de navegação', () => {
    it('link Dashboard presente', () => {
      renderLayout();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('link Dashboard aponta para /', () => {
      renderLayout();
      const link = screen.getByText('Dashboard').closest('a');
      expect(link).toHaveAttribute('href', '/');
    });

    it('link Histórico presente', () => {
      renderLayout();
      expect(screen.getByText('Histórico')).toBeInTheDocument();
    });

    it('link Histórico aponta para /historico', () => {
      renderLayout();
      const link = screen.getByText('Histórico').closest('a');
      expect(link).toHaveAttribute('href', '/historico');
    });
  });

  describe('status de conexão', () => {
    it('exibe "Conectado" com ícone WiFi', () => {
      renderLayout();
      expect(screen.getByText('Conectado')).toBeInTheDocument();
    });

    it('indicador de pulso verde visível quando conectado', () => {
      renderLayout();
      // O dot pulsando tem classe animate-pulse e bg-green-400
      const pulseDot = document.querySelector('.animate-pulse.bg-green-400');
      expect(pulseDot).toBeTruthy();
    });
  });

  describe('perfil do usuário', () => {
    it('exibe "Admin" na seção de perfil', () => {
      renderLayout();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('exibe avatar com inicial "A"', () => {
      renderLayout();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('Outlet (conteúdo filho)', () => {
    it('renderiza área de conteúdo principal', () => {
      const { container } = renderLayout();
      // Deve ter um elemento <main>
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('navegação ativa', () => {
    it('Dashboard ativo na rota /', () => {
      renderLayout('/');
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink?.className).toContain('bg-blue-500/20');
    });

    it('Histórico ativo na rota /historico', () => {
      renderLayout('/historico');
      const historicoLink = screen.getByText('Histórico').closest('a');
      expect(historicoLink?.className).toContain('bg-blue-500/20');
    });
  });
});
