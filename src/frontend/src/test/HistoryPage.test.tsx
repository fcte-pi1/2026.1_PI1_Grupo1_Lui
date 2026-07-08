import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { HistoryPage } from '../app/components/HistoryPage';

// ─── MSW Server ───
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helpers ───
function criarCorridaCompleta(id: string) {
  return {
    id_corrida: id,
    historico: [
      {
        x: 0,
        y: 0,
        orientacao: 'NORTE',
        paredes: [
          { x: 0, y: 0, dir: 'LESTE' },
          { x: 0, y: 0, dir: 'OESTE' },
        ],
      },
      {
        x: 0,
        y: 1,
        orientacao: 'NORTE',
        paredes: [
          { x: 0, y: 1, dir: 'NORTE' },
        ],
      },
    ],
  };
}

function criarCorridaArray() {
  return [
    {
      x: 0, y: 0, orientacao: 'NORTE',
      paredes: [{ x: 0, y: 0, dir: 'LESTE' }],
    },
    {
      x: 1, y: 0, orientacao: 'LESTE',
      paredes: [{ x: 1, y: 0, dir: 'NORTE' }],
    },
  ];
}

/** Configura MSW para listar arquivos E servir uma corrida especifica (auto-load) */
function mockListaEAutoLoad(arquivos: string[], arquivoParaAutoLoad?: string) {
  const handlers: ReturnType<typeof http.get>[] = [
    http.get('/api/maze_runs', () => HttpResponse.json(arquivos)),
  ];

  if (arquivoParaAutoLoad && arquivos.includes(arquivoParaAutoLoad)) {
    const corrida = criarCorridaCompleta('mock_' + arquivoParaAutoLoad.replace(/[^0-9]/g, ''));
    handlers.push(
      http.get(`/api/maze_runs/${arquivoParaAutoLoad}`, () => HttpResponse.json(corrida)),
    );
  }

  server.use(...handlers);
}

// ─── Testes ───
describe('HistoryPage - API de listagem (GET /api/maze_runs)', () => {
  it('GET /api/maze_runs retorna array de nomes de arquivo e exibe botoes', async () => {
    mockListaEAutoLoad(
      ['corrida_1780358830195.json', 'corrida_1780359000000.json'],
      'corrida_1780358830195.json',
    );

    render(<HistoryPage />);

    await waitFor(async () => {
      const elementos = document.querySelectorAll('button.w-full.text-left');
      expect(elementos.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('lista vazia exibe 0 registros', async () => {
    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json([])),
    );

    render(<HistoryPage />);

    const msg = await screen.findByText(/0 registros/);
    expect(msg).toBeInTheDocument();
  });

  it('erro na API de listagem nao causa crash (fallback para lista vazia)', async () => {
    server.use(
      http.get('/api/maze_runs', () =>
        // Retorna texto nao-JSON para forcar erro no .json() e acionar o catch
        HttpResponse.text('Internal Server Error', { status: 500 }),
      ),
    );

    render(<HistoryPage />);

    const msg = await screen.findByText(/Não foi possível conectar/);
    expect(msg).toBeInTheDocument();
    expect(screen.getByText('Histórico de Corridas')).toBeInTheDocument();
  });
});

describe('HistoryPage - Carregamento de corrida (GET /api/maze_runs/:arquivo)', () => {
  it('GET /api/maze_runs/corrida_xxx.json retorna JSON valido no formato {historico: [...]}', async () => {
    mockListaEAutoLoad(['corrida_teste.json'], 'corrida_teste.json');

    render(<HistoryPage />);

    await waitFor(async () => {
      const el = document.querySelectorAll('button.w-full.text-left');
      expect(el.length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Histórico de Corridas')).toBeInTheDocument();
  });

  it('JSON com formato {historico: [...]} tem passos extraidos e exibe replay', async () => {
    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json(['corrida_obj.json'])),
      http.get('/api/maze_runs/corrida_obj.json', () =>
        HttpResponse.json(criarCorridaCompleta('id_formato_obj')),
      ),
    );

    render(<HistoryPage />);

    await waitFor(async () => {
      const el = document.querySelectorAll('button.w-full.text-left');
      expect(el.length).toBeGreaterThanOrEqual(1);
      await userEvent.click(el[0]);
    });

    const replayTitle = await screen.findByText(/Replay do Labirinto/);
    expect(replayTitle).toBeInTheDocument();
  });

  it('JSON com formato array [...] tem passos extraidos e exibe replay', async () => {
    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json(['corrida_array.json'])),
      http.get('/api/maze_runs/corrida_array.json', () =>
        HttpResponse.json(criarCorridaArray()),
      ),
    );

    render(<HistoryPage />);

    await waitFor(async () => {
      const elementos = document.querySelectorAll('button.w-full.text-left');
      expect(elementos.length).toBeGreaterThanOrEqual(1);
      await userEvent.click(elementos[0]);
    });

    const replayTitle = await screen.findByText(/Replay do Labirinto/);
    expect(replayTitle).toBeInTheDocument();
  });

  it('JSON invalido (formato nao reconhecido) exibe mensagem de erro sem crash', async () => {
    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json(['corrida_invalida.json'])),
      http.get('/api/maze_runs/corrida_invalida.json', () =>
        HttpResponse.json({ foo: 'bar', nada: 123 }),
      ),
    );

    render(<HistoryPage />);

    // Devemos primeiro expandir a corrida para tentar carregar os dados
    await waitFor(async () => {
      const el = document.querySelector('button.w-full.text-left') as HTMLButtonElement;
      expect(el).not.toBeNull();
      await userEvent.click(el);
    });

    const erroMsg = await screen.findByText(/Erro ao ler dados/);
    expect(erroMsg).toBeInTheDocument();
    expect(screen.getByText('Histórico de Corridas')).toBeInTheDocument();
  });

  it('HTTP erro (404) exibe mensagem de erro sem crash', async () => {
    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json(['arquivo_inexistente.json'])),
      http.get('/api/maze_runs/arquivo_inexistente.json', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );

    render(<HistoryPage />);

    await waitFor(async () => {
      const el = document.querySelector('button.w-full.text-left') as HTMLButtonElement;
      expect(el).not.toBeNull();
      await userEvent.click(el);
    });

    const erroMsg = await screen.findByText(/Erro ao ler dados/);
    expect(erroMsg).toBeInTheDocument();
    expect(screen.getByText('Histórico de Corridas')).toBeInTheDocument();
  });

  it('JSON com historico vazio exibe mensagem de erro', async () => {
    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json(['corrida_vazia.json'])),
      http.get('/api/maze_runs/corrida_vazia.json', () =>
        HttpResponse.json({ id_corrida: 'vazia', historico: [] }),
      ),
    );

    render(<HistoryPage />);

    await waitFor(async () => {
      const el = document.querySelector('button.w-full.text-left') as HTMLButtonElement;
      expect(el).not.toBeNull();
      await userEvent.click(el);
    });

    // Como extrairPassos() pode lançar erro se não encontrar passos, verificamos o erro
    const erroMsg = await screen.findByText(/Erro ao ler dados/);
    expect(erroMsg).toBeInTheDocument();
  });
});

describe('HistoryPage - Upload manual de arquivo', () => {
  it('upload de JSON valido (formato objeto) extrai passos e exibe replay', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json([])),
    );

    render(<HistoryPage />);

    await screen.findByText(/0 registros/);

    const corridaJSON = JSON.stringify(criarCorridaCompleta('upload_test'));
    const file = new File([corridaJSON], 'corrida_upload.json', { type: 'application/json' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    await user.upload(input, file);

    const replayTitle = await screen.findByText(/Replay do Labirinto/);
    expect(replayTitle).toBeInTheDocument();
  });

  it('upload de JSON invalido (sintaxe quebrada) exibe erro sem crash', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json([])),
    );

    render(<HistoryPage />);

    await screen.findByText(/0 registros/);

    const file = new File(['{invalid json!!!'], 'corrida_bad.json', { type: 'application/json' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    const erroMsg = await screen.findByText(/Arquivo JSON/);
    expect(erroMsg).toBeInTheDocument();
    expect(screen.getByText('Histórico de Corridas')).toBeInTheDocument();
  });

  it('upload de JSON array tambem extrai passos e exibe replay', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/maze_runs', () => HttpResponse.json([])),
    );

    render(<HistoryPage />);

    await screen.findByText(/0 registros/);

    const corridaJSON = JSON.stringify(criarCorridaArray());
    const file = new File([corridaJSON], 'corrida_array_upload.json', { type: 'application/json' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    const replayTitle = await screen.findByText(/Replay do Labirinto/);
    expect(replayTitle).toBeInTheDocument();
  });
});
