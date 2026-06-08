# Cronograma de Execução e Sprints (Hierarquia Estrita e Multidisciplinar)

Este documento detalha o planejamento estratégico do projeto Micromouse até a Inspeção Prévia do Produto (IPP) em 29/06 e a Apresentação Final de Trabalho (APT) em 08/07. A hierarquia de backlog segue regras estritas de rastreabilidade numérica onde `Épico -> Subépico -> HU Folha`.

As fases foram distribuídas de maneira a garantir paralelismo entre as frentes de Engenharia, assegurando que requisitos físicos e lógicos convirjam nas fases de integração.

---

## Sprint 1: Fundação Crítica, Prototipagem e Simulação (27/05 a 08/06)
**Marco:** ED2 (Entrega de Documentação 2) em 08/06
**Objetivo:** Estabelecer a infraestrutura inicial de comunicação no software e preparar os requisitos de hardware e modelos paramétricos primários.

### Estruturas e Mecânica
- [x] **Atividade (#128)** — Validação do Modelo CAD do Labirinto.
- [x] **Atividade (#131)** — Verificação do Modelo CAD do Micromouse.
- [x] **Atividade (#146)** — Posicionamento das peças teóricas.
- [x] **Atividade (#127)** — Fabricação do Labirinto de Testes 4x4.
- [x] **Atividade (#147)** — Impressão 3D do Chassi.

### Eletrônica e Energia
- [x] **Atividade (#125)** — Prototipagem Eletrônica Inicial.

### Software (Controle, Backend, Frontend)
- [x] **HU 2.1.1** — Visualizar posição estática do robô para validar interface.
- [x] **HU 3.1.1 (#180)** — Validar transição visual da FSM no painel via mocks.
- [x] **HU 6.1.1 (#182)** — Inicializar matrizes parametrizadas para Flood Fill no Simulador.
- [x] **HU 6.1.2 (#183)** — Validar propagação de pesos no simulador.

---

## Sprint 2: Montagem Estrutural e Algoritmos Pós-Mapeamento (09/06 a 15/06)
**Objetivo:** Integrar as peças físicas manufaturadas à placa eletrônica e avançar na infraestrutura de roteamento visual (Fast Run) na aplicação Web.

### Estruturas e Mecânica
- [ ] **Atividade (#133)** — Montagem da Estrutura e Validação de Rigidez.

### Eletrônica e Energia
- [ ] **Atividade (#157)** — Validação da Autonomia e Distribuição Buck (LM2596).
- [ ] **Atividade (#216)** — Teste com todos os componentes eletrônicos ligados.

### Software (Controle, Backend, Frontend)
- [ ] **HU 6.3.1 (#248)** — Adicionar array de rota_calculada ao simulador (Mock).
- [ ] **HU 6.3.2 (#249)** — Repassar rota_calculada via Socket.io no Backend.
- [ ] **HU 6.3.3 (#250)** — Desenhar a Rota da Fast Run na Dashboard Frontend.

---

## Sprint 3: Malha de Controle e Visão Periférica (16/06 a 22/06)
**Objetivo:** Implementação da malha PID para locomoção do hardware físico e integração dos sensores de barreira.

### Eletrônica e Firmware
- [ ] **Atividade (#156)** — Integração e Calibração dos Sensores VL53L0X e Encoders na pista oficial.
- [ ] **HU 3.8.1 (#173)** — Validar controle lógico matemático do PID.
- [ ] **HU 3.8.2 (#174)** — Navegar em eixo reto sem colidir contra as quinas físicas.

### Software (Backend, Frontend)
- [ ] **HU 2.1.2 (#171)** — Consumir telemetria do backend para acompanhar posição real.
- [ ] **HU 2.2.2 (#166)** — Sincronizar mapa descoberto com backend.
- [ ] **HU 3.1.2 (#181)** — Monitorar transições dinâmicas da FSM integradas ao backend.

---

## Sprint 4: Estabilidade, Histórico e Inspeção (23/06 a 29/06)
**Marco:** IPP (Inspeção Prévia do Produto) em 29/06
**Objetivo:** Sistema totalmente integrado (Firmware + Software). Testes ininterruptos no labirinto físico.

### Atividades Globais Consolidadas
- [ ] **HU 2.1.3 (#172)** — Visualizar dados de movimento provenientes do robô físico.
- [ ] **HU 2.2.3 (#167)** — Validar escaneamento físico do ambiente.
- [ ] **HU 6.4 (#145)** — Sincronização do Mapa com o Backend (Telemetria de Paredes).
- [ ] **Atividade (#136)** — Verificação Dimensional e de Tolerâncias (Real vs Projeto).
- [ ] **Atividade (#138)** — Relatório Técnico de Testes (LaTeX) e Correção de Pendências.
- [ ] **Apresentação Oficial IPP (29/06)**.

---

## Sprint 5: Refinamento de Dados e Gold Master (30/06 a 08/07)
**Marco:** APT (Apresentação Final de Trabalho) em 08/07
**Objetivo:** Foco nas histórias de resiliência e painéis analíticos não essenciais para a IPP, mas cruciais para a documentação final.

### Software (Resiliência e Dados)
- [ ] **HU 4.2 (#115)** — Carregamento e Comparação de Sessões Anteriores.
- [ ] **HU 4.3 (#116)** — Exportação de Histórico para Análise Externa.
- [ ] **HU 4.4 (#117)** — Filtragem e Comparação de Desempenho por Pista.
- [ ] **HU 5.1.1 (#178)** — Continuar operando sob queda momentânea de rede (Buffer local no ESP).
- [ ] **HU 5.1.2 (#179)** — Manter interface responsiva sem travamentos na queda de pacotes UDP.
- [ ] **HU 4.7 (#140)** — Ingestão em Lote (Batch) para Buffer Offline.
- [ ] **Apresentação Oficial APT (08/07)**.
