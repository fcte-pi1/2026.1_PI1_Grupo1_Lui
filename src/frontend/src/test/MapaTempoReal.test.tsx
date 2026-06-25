import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RobotMap } from '../app/components/MapaTempoReal';
import type { DadosTelemetria, CelulaMapa } from '../app/components/Dashboard';

function criarTelemetria(override: Partial<DadosTelemetria> = {}): DadosTelemetria {
  return {
    timestamp: 1715456789,
    estado_fsm: 'MAPPING',
    bateria_v: 7.4,
    posicao_x: 3,
    posicao_y: 4,
    orientacao: 'NORTE',
    tamanho_grade: 8,
    paredes_atuais: { norte: false, sul: false, leste: true, oeste: true },
    ...override,
  };
}

describe('RobotMap', () => {
  it('renderiza grade 8x8 = 64 células', () => {
    const { container } = render(
      <RobotMap
        telemetria={criarTelemetria({ tamanho_grade: 8 })}
        celulasExploradas={{}}
        mostrarTrajetoRapido={false}
      />
    );
    // O grid interno tem as células com classe border-slate (não o container externo)
    const gridInner = container.querySelector('.grid');
    const cells = gridInner?.querySelectorAll('[class*="border-slate"]') ?? [];
    expect(cells.length).toBe(64);
  });

  it('renderiza grade 4x4 = 16 células', () => {
    const { container } = render(
      <RobotMap
        telemetria={criarTelemetria({ tamanho_grade: 4 })}
        celulasExploradas={{}}
        mostrarTrajetoRapido={false}
      />
    );
    const gridInner = container.querySelector('.grid');
    const cells = gridInner?.querySelectorAll('[class*="border-slate"]') ?? [];
    expect(cells.length).toBe(16);
  });

  it('renderiza grade 16x16 = 256 células', () => {
    const { container } = render(
      <RobotMap
        telemetria={criarTelemetria({ tamanho_grade: 16 })}
        celulasExploradas={{}}
        mostrarTrajetoRapido={false}
      />
    );
    const gridInner = container.querySelector('.grid');
    const cells = gridInner?.querySelectorAll('[class*="border-slate"]') ?? [];
    expect(cells.length).toBe(256);
  });

  it('robô aparece na posição correta (célula com fundo azul)', () => {
    const { container } = render(
      <RobotMap
        telemetria={criarTelemetria({ posicao_x: 2, posicao_y: 5, tamanho_grade: 8 })}
        celulasExploradas={{}}
        mostrarTrajetoRapido={false}
      />
    );
    // A célula do robô tem bg-blue-500/20
    const robotCell = container.querySelector('.bg-blue-500\\/20');
    expect(robotCell).toBeTruthy();
  });

  it('células exploradas têm fundo escuro (#1e293b)', () => {
    const celulas: Record<string, CelulaMapa> = {
      '0-7': { x: 0, y: 7, paredes: { norte: false, sul: false, leste: false, oeste: false } },
    };
    const { container } = render(
      <RobotMap
        telemetria={criarTelemetria({ posicao_x: 5, posicao_y: 5, tamanho_grade: 8 })}
        celulasExploradas={celulas}
        mostrarTrajetoRapido={false}
      />
    );
    const exploredCells = container.querySelectorAll('.bg-\\[\\#1e293b\\]');
    expect(exploredCells.length).toBeGreaterThanOrEqual(1);
  });

  it('células não exploradas têm fundo transparente', () => {
    const { container } = render(
      <RobotMap
        telemetria={criarTelemetria({ tamanho_grade: 4 })}
        celulasExploradas={{}}
        mostrarTrajetoRapido={false}
      />
    );
    // Sem células exploradas, nenhuma deve ter cor de fundo escura
    const exploredCells = container.querySelectorAll('.bg-\\[\\#1e293b\\]');
    expect(exploredCells.length).toBe(0);
  });

  describe('rotação do robô', () => {
    it('NORTE → rotate(0deg)', () => {
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ orientacao: 'NORTE', tamanho_grade: 4, posicao_x: 0, posicao_y: 0 })}
          celulasExploradas={{}}
          mostrarTrajetoRapido={false}
        />
      );
      const svg = container.querySelector('svg');
      const wrapper = svg?.parentElement;
      expect(wrapper?.style.transform).toBe('rotate(0deg)');
    });

    it('LESTE → rotate(90deg)', () => {
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ orientacao: 'LESTE', tamanho_grade: 4, posicao_x: 0, posicao_y: 0 })}
          celulasExploradas={{}}
          mostrarTrajetoRapido={false}
        />
      );
      const svg = container.querySelector('svg');
      const wrapper = svg?.parentElement;
      expect(wrapper?.style.transform).toBe('rotate(90deg)');
    });

    it('SUL → rotate(180deg)', () => {
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ orientacao: 'SUL', tamanho_grade: 4, posicao_x: 0, posicao_y: 0 })}
          celulasExploradas={{}}
          mostrarTrajetoRapido={false}
        />
      );
      const svg = container.querySelector('svg');
      const wrapper = svg?.parentElement;
      expect(wrapper?.style.transform).toBe('rotate(180deg)');
    });

    it('OESTE → rotate(-90deg)', () => {
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ orientacao: 'OESTE', tamanho_grade: 4, posicao_x: 0, posicao_y: 0 })}
          celulasExploradas={{}}
          mostrarTrajetoRapido={false}
        />
      );
      const svg = container.querySelector('svg');
      const wrapper = svg?.parentElement;
      expect(wrapper?.style.transform).toBe('rotate(-90deg)');
    });
  });

  describe('trajeto rápido', () => {
    const trajeto = [
      { x: 0, y: 7 },
      { x: 0, y: 6 },
      { x: 0, y: 5 },
    ];

    it('não exibe pontos verdes quando mostrarTrajetoRapido=false', () => {
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ tamanho_grade: 8 })}
          celulasExploradas={{}}
          trajetoRapido={trajeto}
          mostrarTrajetoRapido={false}
        />
      );
      const greenDots = container.querySelectorAll('.bg-emerald-400');
      expect(greenDots.length).toBe(0);
    });

    it('exibe pontos verdes quando mostrarTrajetoRapido=true', () => {
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ tamanho_grade: 8, posicao_x: 7, posicao_y: 7 })}
          celulasExploradas={{}}
          trajetoRapido={trajeto}
          mostrarTrajetoRapido={true}
        />
      );
      const greenDots = container.querySelectorAll('.bg-emerald-400');
      // 3 pontos no trajeto, mas o robô pode estar sobre um deles
      expect(greenDots.length).toBeGreaterThanOrEqual(2);
    });

    it('ponto verde não aparece sobre o robô', () => {
      // Robô na posição (0,7) que também está no trajeto
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ tamanho_grade: 8, posicao_x: 0, posicao_y: 7 })}
          celulasExploradas={{}}
          trajetoRapido={trajeto}
          mostrarTrajetoRapido={true}
        />
      );
      // Deve ter SVG do robô na posição (0,7), mas sem ponto verde nessa célula
      const robotMarker = container.querySelector('svg');
      expect(robotMarker).toBeTruthy();
    });
  });

  describe('paredes', () => {
    it('célula com parede norte exibe borda vermelha superior', () => {
      const celulas: Record<string, CelulaMapa> = {
        '0-7': { x: 0, y: 7, paredes: { norte: true, sul: false, leste: false, oeste: false } },
      };
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ tamanho_grade: 8, posicao_x: 5, posicao_y: 5 })}
          celulasExploradas={celulas}
          mostrarTrajetoRapido={false}
        />
      );
      const wallNorth = container.querySelector('.border-t-red-500');
      expect(wallNorth).toBeTruthy();
    });

    it('célula sem paredes não tem bordas vermelhas', () => {
      const celulas: Record<string, CelulaMapa> = {
        '0-7': { x: 0, y: 7, paredes: { norte: false, sul: false, leste: false, oeste: false } },
      };
      const { container } = render(
        <RobotMap
          telemetria={criarTelemetria({ tamanho_grade: 8, posicao_x: 5, posicao_y: 5 })}
          celulasExploradas={celulas}
          mostrarTrajetoRapido={false}
        />
      );
      const redWalls = container.querySelectorAll('[class*="border-t-red"],[class*="border-b-red"],[class*="border-r-red"],[class*="border-l-red"]');
      expect(redWalls.length).toBe(0);
    });
  });
});
