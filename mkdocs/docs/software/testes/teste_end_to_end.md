# Testes End-to-End (E2E)

## O que são

Testes End-to-End (E2E) simulam um **usuário real interagindo com a aplicação completa** no navegador. Diferente dos unitários e de integração, aqui o frontend, o backend simulador e o websocket de telemetria rodam de verdade — sem mocks, exceto quando necessário para isolar APIs externas específicas.

Neste projeto, usamos [Playwright](https://playwright.dev/) para testes E2E.

| Localização | Framework | Browser |
|---|---|---|
| `src/frontend/__tests__/e2e/` | Playwright 1.60 | Chromium |

---

## Estrutura

```
src/frontend/
├── __tests__/e2e/
│   ├── navegacao.spec.ts        ← Testes de navegação entre páginas
│   ├── dashboard.spec.ts        ← Testes do Dashboard (telemetria, modos, alertas)
│   └── historico.spec.ts        ← Testes da página de Histórico (replay, upload)
├── playwright.config.ts         ← Configuração do Playwright
└── package.json
```

---

## Configuração (`playwright.config.ts`)

| Parâmetro | Valor | Descrição |
|---|---|---|
| `testDir` | `./__tests__/e2e` | Diretório dos testes |
| `timeout` | 30s | Tempo máximo por teste |
| `expect.timeout` | 5s | Timeout de assertions |
| `fullyParallel` | `true` | Execução paralela |
| `retries` | 0 (local) / 2 (CI) | Retentativas em caso de falha |
| `workers` | 1 | Um worker por vez |
| `reporter` | `html` | Relatório HTML |
| `trace` | `on-first-retry` | Grava trace apenas no retry |
| `video` | `retain-on-failure` | Vídeo só quando falha |
| `baseURL` | `http://127.0.0.1:5173` | URL base da aplicação |
| `webServer.command` | `npm run dev -- --host 127.0.0.1 --port 5173` | Inicia o servidor Vite automaticamente |
| `webServer.timeout` | 120s | Timeout para o servidor subir |

---

## Testes de Navegação (`navegacao.spec.ts`)

Testa a estrutura básica de navegação da aplicação — sidebar, links e troca de páginas.

### Casos de teste

#### 1. Sidebar contém links para Dashboard e Histórico

| Verificação |
|---|
| Link "Dashboard" existe e está visível na sidebar |
| Link "Histórico" existe e está visível na sidebar |

#### 2. Navegação entre páginas

| Passo | Verificação |
|---|---|
| Clique em "Histórico" | URL muda para `/historico` |
| Clique em "Dashboard" | URL volta para `/` |

#### 3. Status de conexão

| Verificação |
|---|
| Ícone WiFi visível na interface |
| Cor do ícone indica status (verde = conectado, âmbar = desconectado) |
| Texto "Conectado" visível quando há conexão |

---

## Testes do Dashboard (`dashboard.spec.ts`)

Testa a tela principal de telemetria do robô, incluindo métricas em tempo real, modos de operação e alertas críticos. **Usa o simulador real com websocket** — sem mocks de telemetria.

### Casos de teste

#### 1. Métricas iniciais

| Métrica | Validação |
|---|---|
| Tensão da Bateria | Exibida com formato `XX.XV` (regex `\d+\.\d+V`) |
| Velocidade | Valor visível |
| Posição Atual | Coordenadas visíveis |
| Estado do Robô | String do estado FSM visível |

#### 2. Alternar modos de override

O dashboard permite alternar entre modos manuais de operação:

| Modo | Comportamento esperado |
|---|---|
| **Auto** | Robô opera automaticamente com algoritmo de exploração |
| **Exploração** | Métricas específicas de exploração aparecem (posição, paredes detectadas) |
| **Alta Performance** | Trajeto rápido (FAST_RUN) exibido com pontos verdes no grid |

**Verificação**: Ao alternar entre modos, diferentes conjuntos de métricas aparecem/desaparecem conforme o modo selecionado.

#### 3. Telemetria em tempo real (simulação)

| Verificação |
|---|
| Posição do robô atualiza automaticamente |
| Timestamp da última atualização muda ao longo do tempo |
| Célula do robô visível no grid do labirinto |

#### 4. Alerta crítico de bateria (tensão < 6.8V)

| Condição | Comportamento |
|---|---|
| Tensão cai abaixo de 6.8V | Alerta crítico de bateria aparece na tela |
| Timeout do teste | 25 segundos (aguarda o simulador emitir o estado) |

#### 5. Erro de hardware (estado = ERROR)

| Condição | Comportamento |
|---|---|
| Robô entra em estado ERROR | Alarme de hardware crítico visível |
| | Mensagem de parada de emergência exibida |
| Timeout do teste | 30 segundos |

#### 6. Gaveta de logs

| Ação | Verificação |
|---|---|
| Abrir gaveta (botão toggle) | Logs ficam visíveis |
| Fechar gaveta | Logs são ocultados |
| Conteúdo | Mensagens de log apropriadas ao contexto |

#### 7. Trajeto rápido (FAST_RUN)

| Condição | Verificação |
|---|---|
| Modo Alta Performance ativo | Pontos verdes (trajetória FAST_RUN) visíveis no grid |

---

## Testes do Histórico (`historico.spec.ts`)

Testa a página de histórico de corridas — listagem, carregamento, replay passo a passo e upload de arquivos.

### Estratégia de mock

Diferente do Dashboard (que usa simulador real), os testes de Histórico **interceptam chamadas HTTP** via `page.route()` para simular respostas da API de arquivos JSON sem depender de arquivos reais no disco.

#### Mock da listagem (`GET /api/maze_runs`)

```ts
await page.route('**/api/maze_runs', (route) => {
  if (route.request().method() === 'GET' && !route.request().url().includes('corrida')) {
    route.fulfill({
      status: 200,
      body: JSON.stringify(['corrida_2024.json', 'corrida_2025.json'])
    });
  } else {
    route.continue();
  }
});
```

#### Mock dos detalhes (`GET /api/maze_runs/:arquivo`)

```ts
const MOCK_HISTORICO = {
  id_corrida: 'run_001',
  historico: [
    { x: 0, y: 7, orientacao: 'NORTE', paredes: [] },
    { x: 0, y: 6, orientacao: 'NORTE', paredes: [{ x: 0, y: 6, dir: 'NORTE' }] },
    { x: 0, y: 5, orientacao: 'NORTE', paredes: [] },
    { x: 1, y: 5, orientacao: 'LESTE', paredes: [{ x: 1, y: 5, dir: 'LESTE' }] },
    { x: 2, y: 5, orientacao: 'LESTE', paredes: [] },
    { x: 3, y: 5, orientacao: 'LESTE', paredes: [] }
  ]
};
```

### Casos de teste

#### 1. Carregar lista de corridas

| Verificação |
|---|
| Lista de arquivos exibida na tela |
| Contagem de corridas visível |
| Cada arquivo tem um botão associado |

#### 2. Carregar detalhes ao clicar

| Ação | Verificação |
|---|---|
| Clique em uma corrida | Detalhes da corrida carregados e exibidos |
| | Informações do passo atual visíveis (x, y, orientacao) |

#### 3. Navegação passo a passo

| Botão | Verificação |
|---|---|
| ▶ (Avançar) | Posição muda de (0,7) → (0,6) |
| ◀ (Voltar) | Posição volta para (0,7) |
| ⏮ (Reset) | Volta ao passo 1 de 6 |

#### 4. Replay automático

| Ação | Verificação |
|---|---|
| Pressionar Play (▶▶) | Passos avançam automaticamente |
| | Navega por múltiplos passos sem intervenção manual |
| Timeout | 1.5 segundos para progressão automática |

#### 5. Reset para o início

| Verificação |
|---|
| Após avançar vários passos, reset volta ao passo 1 |
| Indicador "1/6" visível após reset |

#### 6. Upload de arquivo JSON

| Ação | Verificação |
|---|---|
| Selecionar arquivo `.json` | Arquivo carregado e processado |
| Arquivo com formato `{historico: [...]}` | Passos extraídos e replay disponível |

#### 7. Controle de velocidade

| Controle | Verificação |
|---|---|
| Velocidade 10× | Replay avança mais rápido |
| Mudança de velocidade | Progressão visivelmente alterada |

---

## Como rodar

```bash
cd src/frontend

# Instalar navegadores (primeira vez)
npx playwright install chromium

# Rodar todos os testes E2E (headless)
npx playwright test

# Rodar com navegador visível (modo headed)
npx playwright test --headed

# Rodar um arquivo específico
npx playwright test __tests__/e2e/dashboard.spec.ts

# Rodar com debug (passo a passo)
npx playwright test --debug

# Gerar relatório HTML
npx playwright show-report

# Rodar apenas testes do dashboard
npx playwright test --grep "dashboard"
```

> O Playwright **sobe o servidor Vite automaticamente** (`npm run dev` na porta 5173) antes de executar os testes e o derruba ao final.

---

## Resumo — Todos os tipos de teste

| Tipo | Comando | Localização |
|---|---|---|
| **Unitário (frontend)** | `cd src/frontend && npm test` | `src/test/` |
| **Unitário (firmware)** | `cd src/firmware/build && ctest` | `__test__/` |
| **Integração (backend)** | `cd src/backend && npm test` | `__tests__/` |
| **Integração (firmware)** | `cd src/firmware/build && ctest -R exploracao` | `__test__/test_main_exploracao.cpp` |
| **E2E (frontend)** | `cd src/frontend && npx playwright test` | `__tests__/e2e/` |
