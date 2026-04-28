# Definição de Stack e Protocolo de Comunicação

Este documento formaliza as escolhas tecnológicas para o servidor de telemetria e o protocolo de rede, visando atender aos requisitos de baixa latência e alta disponibilidade de dados durante as provas do Micromouse.

## 1. Stack do Servidor: Node.js com TypeScript
A escolha do Node.js como ambiente de execução para o backend baseia-se nos seguintes pilares técnicos:

* **Event Loop e I/O não bloqueante:** Essencial para lidar com o fluxo constante de pacotes de telemetria sem interromper o processamento de outros módulos.
* **Ecossistema Robusto:** Facilidade de integração com bibliotecas de rede e drivers de banco de dados.
* **TypeScript:** Adição de tipagem estática para reduzir erros em tempo de execução, garantindo que os pacotes de dados vindos do hardware sigam o contrato esperado pelo frontend.

## 2. Protocolo de Comunicação: WebSockets (Socket.io)
Para garantir a latência inferior a 150ms, optamos pelo protocolo WebSockets em detrimento ao HTTP tradicional ou MQTT (em cenários de broker externo).

### Justificativa Técnica
| Critério | WebSockets | Justificativa |
| :--- | :--- | :--- |
| **Bidirecionalidade** | Full-Duplex | Permite que o servidor envie atualizações para o dashboard e receba comandos do robô simultaneamente. |
| **Overhead de Rede** | Baixo | Após o *handshake* inicial, os pacotes não precisam de cabeçalhos HTTP repetitivos, economizando banda e tempo. |
| **Latência** | Real-time | Conexão persistente que elimina o tempo de estabelecimento de novas conexões para cada dado enviado. |

## 3. Arquitetura de Fluxo de Dados
O fluxo de dados seguirá o modelo abaixo para garantir que a interface React reflita o estado real do robô:

1. **Hardware (ESP32):** Coleta dados de sensores e envia via WebSocket Client para o servidor.
2. **Backend (Node.js):** Recebe o JSON, valida a estrutura e emite um evento via Socket.io para os clientes conectados.
3. **Frontend (React):** Escuta o evento e atualiza o estado dos componentes (Mapa e Gráficos de Energia) instantaneamente.

## 4. Integração com a Equipe de Eletrônica

A integração entre o software de telemetria e o firmware de hardware (centrado no microcontrolador ESP32 e motores DC N20 com encoder) será baseada em uma arquitetura distribuída orientada a eventos e processamento na borda ("Edge Computing"). Da perspectiva da engenharia de software, o robô atuará como um provedor de dados isolado (Cliente WebSocket), transmitindo metadados pré-processados e recebendo comandos sistêmicos esporádicos do dashboard.

### 4.1 Separação de Preocupações e Threading
Com a ajuda da arquitetura *dual-core* a 240 MHz do ESP32, propõe-se um pareamento de tarefas que evite bloqueio de "threads" de I/O em tempo real. Engloba perfeitamente a distinção entre processamento lógico de software e sensoriamento eletrônico puro:
* **Core 0 (Software & I/O):** Dedicado ao uso da pilha TCP/IP, RF Nativo de WiFi e empacotamento JSON. Este "fio" cuida do *handshake* e persistência do WebSocket Client, injetando dados telemétricos via rádio na rede sem interromper o hardware local.
* **Core 1 (Engenharia Eletrônica Rígida - RNF01 e RNF06):** Totalmente isolado para controle restrito. Administra, via interrupção (IRQ), a contagem do *encoder* dos Motores N20, faz as requisições diretas de tempo de voo/infravermelho para os 3 sensores (Frente, Esquerda, Direita) e atua nos PWMs. É exigido que o ciclo de (ler sensor -> determinar obstáculo -> corrigir motor) ocorra em até 50ms (RNF01), algo totalmente suportado quando este core é dedicado exclusivamente ao firmware autônomo.

### 4.2 Abstração e Contrato de Dados (Payload)
A mecânica MVC do Backend/Frontend funcionará de modo puramente visual e estatístico.
Buscamos que o processamento bruto ocorra no chip — O Arduino/ESP enviará as coordenadas matemáticas e dados sumarizados do que "enxerga", em vez de pulsos brutos de sensores e *ticks* soltos de motor.

**Proposta de DTO (Data Transfer Object) via Socket:**
```json
{
  "t": 1682635201234,
  "pose": { "x": 2, "y": 3, "theta": 90 },
  "sensors": { "front": 12.5, "left": 4.0, "right": 15.0 },
  "motorRPM": { "L": 210, "R": 208 },
  "state": "mapping_maze"
}
```
Através desse pacote contínuo, a tipagem estática (TypeScript) do nosso servidor NodeJS mapeará interfaces validadas com os eventos vitais da eletrônica sem gerar falhas de *cast* em tela.

## Referências Complementares

1. [MMS - Micromouse Simulator (mackorone)](https://github.com/mackorone/mms)

2. [Socket.io - Bidirectional communication](https://socket.io/docs/v4/)

3. [Maze Solving Algorithms for Micro Mouse (IEEE)](https://ieeexplore.ieee.org/document/8561664)

4. [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

5. [React Dev - State Management](https://react.dev/learn/managing-state)

6. [IEEE Micromouse Competition Rules](https://www.ieee.org/membership/students/competitions/micromouse/index.html)

## Tabela de Versionamento

| Versão | Descrição                                  | Autor                                                 | Revisor                                               |
| ------ | ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| `1.0`  | Criação inicial do documento de Backend  | [Yzabella Pimenta](https://github.com/redjsun) | [Carlos Paz](https://github.com/dudupaz)  |
| `1.1`  | Adição do tópico de integração com eletrônica | [Yzabella Pimenta](https://github.com/redjsun) | [Carlos Paz](https://github.com/dudupaz)  |