# Testes de Integração

## O que são

Testes de integração verificam a **comunicação entre múltiplos componentes reais** — por exemplo, o backend recebendo pacotes UDP e escrevendo no banco, ou o firmware executando o algoritmo completo de exploração com mock de hardware. Diferente dos unitários, aqui os módulos interagem entre si.

Neste projeto, os testes de integração cobrem duas camadas:

| Camada | Framework | Localização |
|---|---|---|
| **Backend** (Node.js) | [Jest](https://jestjs.io/) | `src/backend/__tests__/` |
| **Firmware** (C++) | [Catch2](https://github.com/catchorg/Catch2) | `src/firmware/__test__/test_main_exploracao.cpp` |

---

## Backend — Jest

### Estrutura

```
src/backend/
├── __tests__/
│   └── integration.test.js      ← Testes de integração UDP → InfluxDB
├── index.js                     ← Servidor principal (Express + UDP + InfluxDB)
├── mock_sender.js               ← Script auxiliar para enviar pacotes UDP
├── jest.config.js               ← Configuração do Jest
├── package.json
└── docker-compose.yml           ← Infraestrutura (InfluxDB, Grafana)
```

### Configuração (`jest.config.js`)

```js
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js'],
};
```

### Dependências de teste

```json
{
  "jest": "^30.2.0",
  "@influxdata/influxdb-client": "^1.35.0"
}
```

### Comando de execução

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand
```

> `--runInBand` garante execução sequencial para evitar conflitos de porta UDP.

### Testes (`__tests__/integration.test.js`)

O backend expõe um servidor UDP que recebe telemetria do robô e uma API REST para salvar no InfluxDB. Os testes verificam o pipeline ponta a ponta: pacote UDP → parse → Point do InfluxDB → bucket.

#### 1. Envio de pacote UDP e verificação no InfluxDB

**Cenário feliz**: Um pacote UDP com coordenadas, bateria e estado do robô é enviado, parseado e armazenado como Point no InfluxDB.

**Estrutura do pacote UDP simulado:**
```
corrida_001,15.5,6.8,EXPLORING
```
- `corrida_001` → ID da corrida
- `15.5` → Posição X
- `6.8` → Tensão da bateria (V)
- `EXPLORING` → Estado FSM do robô

**Verificações:**

| Campo | Validação |
|---|---|
| Posição (x, y) | Coordenadas coincidem com as enviadas |
| Tensão (battery) | Valor float preservado |
| Estado (state) | String do estado FSM preservada |
| Timestamp | Ponto registrado com timestamp válido |

#### 2. Rajada de 10 pacotes sem perda

**Objetivo**: Garantir que o backend suporta alta frequência de telemetria (rajadas de pacotes) sem perder dados — cenário típico de um robô em movimento enviando posição constantemente.

| Métrica | Esperado |
|---|---|
| Pacotes enviados | 10 |
| Pontos no InfluxDB | 10 |
| Perda | 0 |

#### 3. Cenário de falha — bateria baixa

**Objetivo**: Validar que estados de erro são corretamente registrados.

| Entrada | Estado esperado |
|---|---|
| Tensão = 5.5V | `estado_robo = "ERROR"` |

> O limiar crítico de bateria é 6.8V. Abaixo disso o sistema deve gerar alerta.

#### 4. Resiliência — InfluxDB fora do ar

**Objetivo**: Garantir que o backend **não crasha** se o InfluxDB estiver indisponível.

**Simulação**: Write API do InfluxDB lança exceção.

| Verificação |
|---|
| Servidor UDP continua ativo e aceitando pacotes |
| Nenhum crash ou `uncaughtException` |
| Log de erro emitido (não verificável diretamente, mas servidor permanece `up`) |

### Script auxiliar (`mock_sender.js`)

Envia pacotes UDP simulados para o backend sem precisar do firmware:

```bash
npm run mock
```

Útil para desenvolvimento e depuração manual do pipeline.

### Como rodar — Backend

```bash
cd src/backend

# Subir InfluxDB (necessário para os testes)
docker compose up -d influxdb

# Rodar testes de integração
npm test

# Rodar apenas testes de integração
npm run test:integration
```

---

## Firmware — Testes de Exploração

O arquivo `test_main_exploracao.cpp` testa o algoritmo completo de exploração do labirinto usando o mock de hardware (`API_mock.h`). Embora use Catch2 (mesmo framework dos unitários), esses testes são de **integração** porque exercitam o fluxo completo: sensores → algoritmo → atuadores → exportação JSON.

### Cenários de teste

#### 1. Labirinto 4×4 — Caminho simples

**Configuração**: Grade 4×4 com objetivo no centro.

| Verificação |
|---|
| Robô alcança a célula objetivo |
| Número de passos > 0 |

#### 2. Detecção de loop

**Objetivo**: Garantir que o robô não fica preso repetindo as mesmas posições.

| Verificação |
|---|
| Robô não repete padrão cíclico de posições |
| Exploração termina (por timeout ou objetivo alcançado) |

#### 3. Tratamento de beco sem saída (dead-end)

**Objetivo**: Validar que o robô encontra rotas alternativas ao encontrar um beco.

| Verificação |
|---|
| Robô não fica parado em dead-end |
| Encontra caminho alternativo ou retrocede corretamente |

#### 4. Registro de histórico

**Objetivo**: Cada movimento é registrado no histórico de exploração.

| Verificação |
|---|
| Array `historico` contém cada passo executado |
| Passos têm campos `x`, `y`, `orientacao` preenchidos |

#### 5. Exportação JSON

**Objetivo**: O JSON salvo corresponde fielmente ao histórico registrado.

| Verificação |
|---|
| Arquivo JSON gerado em `maze_runs/` |
| Conteúdo do JSON coincide com o array `historico` |

#### 6. Detecção de paredes

**Objetivo**: Paredes detectadas durante a exploração são registradas corretamente.

| Verificação |
|---|
| Paredes no JSON batem com a configuração real do labirinto |
| Paredes são bidirecionais (face oposta da vizinha também registrada) |

### Como rodar — Firmware (exploração)

```bash
cd src/firmware/build

# Rodar testes de exploração
ctest -R exploracao --output-on-failure

# Rodar com saída detalhada
ctest -R exploracao -V
```

---

## Resumo — Como rodar tudo

```bash
# Backend (Jest) — requer Docker com InfluxDB
cd src/backend
docker compose up -d influxdb
npm test

# Firmware (Catch2 + CTest) — testes de exploração
cd src/firmware/build
ctest -R exploracao --output-on-failure
```
