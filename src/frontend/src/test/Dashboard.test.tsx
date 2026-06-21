import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../app/components/Dashboard';

// O Dashboard inicia em modo SIMULAÇÃO por padrão, o que dispara um
// setInterval interno. Usamos fake timers para manter o teste determinístico
// e evitar que o robô "ande" sozinho entre as asserções.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Dashboard - Cartões de PWM (assimetria/saturação na ponte H)', () => {
  it('exibe os rótulos "PWM Esquerdo" e "PWM Direito" no grid de cartões', () => {
    render(<Dashboard />);
    expect(screen.getByText('PWM Esquerdo')).toBeInTheDocument();
    expect(screen.getByText('PWM Direito')).toBeInTheDocument();
  });

  it('exibe "---" para os cartões de PWM no modo SIMULAÇÃO (mocks não trazem pwm_esq/pwm_dir)', () => {
    render(<Dashboard />);
    // Garante que o modo inicial é mesmo SIMULAÇÃO
    expect(screen.getByText('MODO SIMULAÇÃO')).toBeInTheDocument();

    const placeholders = screen.getAllByText('---');
    // Pelo menos os dois cartões de PWM devem estar em estado de placeholder
    expect(placeholders.length).toBeGreaterThanOrEqual(2);
  });

  it('mostra o texto indicativo de que o dado só está disponível em Tempo Real', () => {
    render(<Dashboard />);
    const subLabels = screen.getAllByText('Disponível em Tempo Real');
    expect(subLabels.length).toBe(2); // um para PWM Esquerdo, outro para PWM Direito
  });
});
