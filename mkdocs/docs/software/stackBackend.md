# Definição de Stack e Protocolo de Comunicação

Este documento formaliza as escolhas tecnológicas para o servidor de telemetria e o protocolo de rede, visando atender aos requisitos de baixa latência e alta disponibilidade de dados durante as provas do Micromouse.

## 1. Stack do Servidor: Node.js com TypeScript
A escolha do **Node.js** como ambiente de execução para o backend baseia-se nos seguintes pilares técnicos:

* **Event Loop e I/O não bloqueante:** Essencial para lidar com o fluxo constante de pacotes de telemetria sem interromper o processamento de outros módulos.
* **Ecossistema Robusto:** Facilidade de integração com bibliotecas de rede e drivers de banco de dados.
* **TypeScript:** Adição de tipagem estática para reduzir erros em tempo de execução, garantindo que os pacotes de dados vindos do hardware sigam o contrato esperado pelo frontend.

## 2. Protocolo de Comunicação: WebSockets (Socket.io)
Para garantir a latência inferior a **150ms**, optamos pelo protocolo **WebSockets** em detrimento ao HTTP tradicional ou MQTT (em cenários de broker externo).

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
[A fazer]

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
| `1.0`  | Criação inicial do documento de Backend  | [Yzabella Pimenta](https://github.com/redjsun) |   |
