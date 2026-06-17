# Guia Arquitetural do Micromouse

Este documento descreve a organização e os padrões de projeto adotados no ecossistema de software do Micromouse. A arquitetura foi desenhada com foco na **separação de responsabilidades (Separation of Concerns - SoC)**, garantindo que o sistema possa ser desenvolvido simultaneamente por múltiplas pessoas da equipe sem causar conflitos de *merge*.

## 1. Visão Geral do Backend

O backend Node.js é o intermediário responsável por captar pacotes de telemetria em alta frequência (UDP/MsgPack) gerados pela ESP32 e registrá-los em um banco de séries temporais (InfluxDB) para visualização e análise.

A base de código utiliza **ES Modules** (`import` / `export`) e está estruturada da seguinte maneira:

```text
src/backend/
├── src/
│   ├── config/       # Configuração e variáveis de ambiente
│   ├── db/           # Conexões com banco de dados
│   ├── services/     # Lógica de negócio da aplicação
│   ├── transport/    # Portas de entrada (Listeners UDP, Servidores HTTP/WS)
│   └── app.js        # Inicialização da aplicação (Entrypoint)
├── mock_sender.js    # Ferramenta para testar fluxo local
├── Dockerfile
└── docker-compose.yml
```

### 1.1 Responsabilidades de Cada Módulo

#### `src/config/`
Toda vez que uma nova variável for incluída no `.env`, ela deve ser injetada através de `config/env.js`.
* **Regra:** Nenhum outro arquivo do sistema deve utilizar `process.env`. Todos os arquivos devem importar as variáveis via `import config from '../config/env.js'`.

#### `src/db/`
Responsável pelo setup das instâncias do banco de dados (no nosso caso, `influx.js`).
* **Regra:** Este módulo não entende o que é "Telemetria do Robô" ou "FSM". Sua única finalidade é conectar, fornecer o cliente (`writeApi`, `queryApi`) e fechar a conexão de forma limpa.

#### `src/services/`
É o coração do sistema, englobando todas as regras e transformações de negócios. O arquivo `telemetryService.js` sabe o que fazer com os dados brutos e como transformá-los (mapeamento InfluxDB).
* **Regra:** Os serviços nunca inicializam redes ou sockets. Eles expõem funções genéricas de entrada (`processTelemetry(msg, rinfo)`) para serem consumidas por camadas mais externas.

#### `src/transport/`
É a camada de comunicação do sistema com o mundo externo.
* No `udpServer.js`, gerencia-se o socket UDP de escuta do hardware e os eventos *low-level* (`listening`, `message`, `error`).
* **Futuro:** Quando formos disponibilizar a API WebSocket para o Frontend, o código deverá ser incluído aqui (`src/transport/wsServer.js`), orquestrando as conexões e consumindo informações das camadas mais internas.

#### `src/app.js`
É o maestro. Ele engloba e encadeia todas as importações para dar a partida correta ao serviço e garantir o *graceful shutdown* em quedas do servidor (tratamento de `SIGTERM` e `SIGINT`).

---

## 2. Fluxo de Dados e Dependências

Para garantir a ausência de gargalos ou *Circular Dependencies* (importações circulares), todos devem seguir este fluxo básico:

1. **(Cima) Transportes** conhecem Serviços (`udpServer.js` importa `processTelemetry`).
2. **(Meio) Serviços** conhecem Banco e Configuração (`telemetryService.js` importa `writeApi` e `config`).
3. **(Baixo) Bancos** conhecem Configuração (`influx.js` importa `config`).

> [!WARNING]  
> A regra de ouro é: **Dependências fluem da borda externa para o núcleo.**
> * NUNCA importe um arquivo da pasta `transport/` ou `app.js` dentro da pasta `services/`.
> * NUNCA faça o `db/influx.js` importar funções de regras de negócio de `services/`.

---

## 3. Diretrizes para o Frontend

O painel de monitoramento foi construído utilizando React 19 + Vite com TypeScript. No momento da refatoração atual, ele ainda conta com dados _mockados_ em seus painéis de simulação para testar a disposição visual da matriz.

Quando o momento de integração Backend/Frontend chegar (WebSockets ou requisições REST), os desenvolvedores devem aderir ao princípio de separação de lógicas presente no backend, extraindo o estado direto dos componentes visuais (`FSMStatus.tsx`, `MapaTempoReal.tsx`).

### Proposta recomendada para a futura integração:
- **`src/types/telemetry.ts`**: Padronizar as interfaces TypeScript globalmente de acordo com a Telemetria que vem da ESP32.
- **`src/services/telemetrySocket.ts`**: Abstrair o objeto Websocket.
- **`src/hooks/useTelemetry.ts`**: Fazer uma ponte React do contexto dos dados entre a interface UI e o `telemetrySocket`.

Adoções destas práticas simplificarão e padronizarão o desenvolvimento dos módulos.
