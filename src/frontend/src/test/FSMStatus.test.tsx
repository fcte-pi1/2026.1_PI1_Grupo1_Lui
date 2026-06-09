import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FSMStatus } from '../app/components/FSMSStatus';
import type { DadosTelemetria } from '../app/components/Dashboard';

function criarTelemetria(override: Partial<DadosTelemetria> = {}): DadosTelemetria {
  return {
    timestamp: 1715456789,
    estado_fsm: 'MAPPING',
    bateria_v: 7.4,
    posicao_x: 0,
    posicao_y: 6,
    orientacao: 'NORTE',
    tamanho_grade: 8,
    paredes_atuais: { norte: false, sul: false, leste: true, oeste: true },
    ...override,
  };
}

describe('FSMStatus', () => {
  it('renderiza o título "Navegação Interna"', () => {
    render(<FSMStatus telemetria={criarTelemetria()} />);
    expect(screen.getByText('Navegação Interna')).toBeInTheDocument();
  });

  it('exibe a orientação atual (NORTE)', () => {
    render(<FSMStatus telemetria={criarTelemetria({ orientacao: 'NORTE' })} />);
    expect(screen.getByText('NORTE')).toBeInTheDocument();
  });

  it('exibe a orientação SUL', () => {
    render(<FSMStatus telemetria={criarTelemetria({ orientacao: 'SUL' })} />);
    expect(screen.getByText('SUL')).toBeInTheDocument();
  });

  it('exibe a orientação LESTE', () => {
    render(<FSMStatus telemetria={criarTelemetria({ orientacao: 'LESTE' })} />);
    expect(screen.getByText('LESTE')).toBeInTheDocument();
  });

  it('exibe a orientação OESTE', () => {
    render(<FSMStatus telemetria={criarTelemetria({ orientacao: 'OESTE' })} />);
    expect(screen.getByText('OESTE')).toBeInTheDocument();
  });

  it('exibe o timestamp do último pacote', () => {
    render(<FSMStatus telemetria={criarTelemetria({ timestamp: 1715456789 })} />);
    expect(screen.getByText('1715456789')).toBeInTheDocument();
  });

  it('rótulo "Bússola (Orientação)" visível', () => {
    render(<FSMStatus telemetria={criarTelemetria()} />);
    expect(screen.getByText('Bússola (Orientação)')).toBeInTheDocument();
  });

  it('rótulo "Último Pacote Recebido" visível', () => {
    render(<FSMStatus telemetria={criarTelemetria()} />);
    expect(screen.getByText('Último Pacote Recebido')).toBeInTheDocument();
  });

  describe('estado de erro (ERROR)', () => {
    it('borda destrutiva quando estado_fsm === ERROR', () => {
      render(<FSMStatus telemetria={criarTelemetria({ estado_fsm: 'ERROR' })} />);
      // Card deve ter classe border-destructive
      const cardContainer = screen.getByText('Navegação Interna').closest('[data-slot="card"]');
      expect(cardContainer?.className).toContain('border-destructive');
    });

    it('ícone de navegação vermelho no erro', () => {
      render(<FSMStatus telemetria={criarTelemetria({ estado_fsm: 'ERROR' })} />);
      // O ícone Navigation deve ter classe text-destructive
      const navIcon = document.querySelector('.text-destructive');
      expect(navIcon).toBeTruthy();
    });

    it('sem borda destrutiva em estado normal', () => {
      render(<FSMStatus telemetria={criarTelemetria({ estado_fsm: 'MAPPING' })} />);
      const cardContainer = screen.getByText('Navegação Interna').closest('[data-slot="card"]');
      expect(cardContainer?.className).not.toContain('border-destructive');
    });
  });
});
