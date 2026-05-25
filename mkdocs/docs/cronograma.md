# Cronograma de Execução e Sprints (Hierarquia Estrita e Multidisciplinar)

Este documento detalha o planejamento estratégico do projeto Micromouse até a **Inspeção Prévia do Produto (IPP)** (29/06). A hierarquia de backlog segue regras estritas de rastreabilidade numérica onde `Épico -> Subépico -> HU Folha`.

As fases foram distribuídas de maneira a garantir paralelismo entre as frentes de Engenharia, assegurando que requisitos físicos e lógicos convirjam nas fases de integração.

---

## Sprint 1: Fundação Crítica, Prototipagem e Simulação (27/05 a 03/06)
**Revisão:** 01/06
**Objetivo:** Estabelecer a infraestrutura inicial de comunicação no software e preparar os requisitos de hardware e modelos paramétricos primários.

### Estruturas e Mecânica
- [ ] **Atividade (#128)** — Validação do Modelo CAD do Labirinto.
- [ ] **Atividade (#131)** — Verificação do Modelo CAD do Micromouse.
- [ ] **Atividade (#146)** — Posicionamento das peças teóricas.

### Eletrônica e Energia
- [ ] **Atividade (#125)** — Prototipagem Eletrônica Inicial.
- [ ] **Atividade (#157)** — Validação da Autonomia e Distribuição Buck (LM2596).

### Software (Controle, Backend, Frontend)
- [x] **HU 2.1.1** — Visualizar posição estática do robô para validar interface.
- [x] **HU 3.1.1** — Validar transição visual da FSM no painel via mocks.
- [ ] **HU 2.5** — Login.
- [ ] **HU 2.2.1** — Visualizar paredes simuladas no labirinto.
- [ ] **HU 3.2** — Monitoramento de Tensão da Bateria.
- [ ] **HU 4.1** — Gravação Contínua no InfluxDB.
- [ ] **HU 5.3** — Transmissão AsyncUDP.

---

## Sprint 2: A Ponte Lógica e Fabricação do Chassi (03/06 a 10/06)
**Revisão:** 08/06 (Data da entrega ED2)
**Objetivo:** Integrar as interfaces web aos fluxos de dados reais e fabricar as primeiras estruturas físicas em 3D e CNC.

### Estruturas e Mecânica
- [ ] **Atividade (#132)** — Preparação de Ficheiros CAD para Impressão 3D.
- [ ] **Atividade (#147)** — Chassi (Fabricação Física).
- [ ] **Atividade (#127)** — Fabricação e Montagem do Labirinto de Testes 4x4.

### Eletrônica e Energia
- [ ] **Atividade (#148)** — Peças Eletrônicas e de locomoção (Montagem e Soldagem no Chassi).

### Software (Controle, Backend, Frontend)
- [ ] **HU 2.1.2** — Consumir telemetria do backend para acompanhar posição real.
- [ ] **HU 2.2.2** — Sincronizar mapa descoberto com backend.
- [ ] **HU 3.1.2** — Monitorar transições dinâmicas da FSM integradas ao backend.
- [ ] **HU 3.5** — Plotagem em Tempo Real do Erro Direcional (PID).
- [ ] **HU 3.8.1** — Validar controle lógico matemático do PID em bancada virtual.

---

## Sprint 3: Validação Cibernética e Chão de Fábrica (03/06 a 17/06)
**Revisão:** 15/06
**Objetivo:** Validar o robô físico montado rodando na pista finalizada e calibrar sensores críticos.

### Estruturas e Mecânica
- [ ] **Atividade (#129)** — Construção Física do Labirinto de Testes (Finalização e Pintura).
- [ ] **Atividade (#133)** — Montagem da Estrutura e Validação de Rigidez.
- [ ] **Atividade (#136)** — Verificação Dimensional e de Tolerâncias (Real vs Projeto).

### Eletrônica e Energia
- [ ] **Atividade (#156)** — Integração e Calibração dos Sensores VL53L0X e Encoders na pista oficial.

### Software (Controle, Backend, Frontend)
- [ ] **HU 2.1.3** — Visualizar dados de movimento provenientes do robô físico.
- [ ] **HU 2.2.3** — Validar escaneamento físico do ambiente.
- [ ] **HU 3.8.2** — Navegar em eixo reto sem colidir contra as quinas físicas.
- [ ] **HU 6.1.1** — Inicializar matrizes parametrizadas para Flood Fill.
- [ ] **HU 6.1.2** — Validar propagação de pesos no simulador.
- [ ] **HU 6.1.3** — Validar desvio de paredes conhecidas.

---

## Sprint 4: Resiliência, Histórico Analítico e Fast Run (17/06 a 24/06)
**Revisão:** 22/06
**Objetivo:** Imunidade a quedas, exportação de dados para relatórios técnicos acadêmicos e velocidade máxima do labirinto (Flood Fill de otimização).

### Estruturas e Mecânica
- [ ] **Atividade (#135)** — Documentação Fotográfica e Inventário de Manufatura.
- [ ] **Atividade (#137)** — Consistência Virtual-Real e Validação CAD (Auditoria).

### Eletrônica e Energia
- [ ] Estresse da Bateria: Validação contínua do consumo elétrico em modo Fast Run para apuração de durabilidade.

### Software (Controle, Backend, Frontend)
- [ ] **HU 6.2** — Navegar utilizando leitura sensorial do labirinto.
- [ ] **HU 6.3** — Executar Fast Run utilizando rota memorizada.
- [ ] **HU 6.4** — Sincronização do Mapa com o Backend (Telemetria de Paredes).
- [ ] **HU 5.1.1** — Continuar operando sob queda momentânea de rede (Buffer local no ESP).
- [ ] **HU 5.1.2** — Manter interface responsiva sem travamentos na queda de pacotes UDP (Jitter).
- [ ] **HU 3.6** — Alarme Imediato de Interrupção de Hardware.
- [ ] **HU 4.2** — Carregamento e Comparação de Sessões Anteriores.
- [ ] **HU 4.3** — Exportação de Histórico para Análise Externa.
- [ ] **HU 4.4** — Filtragem e Comparação de Desempenho por Pista.
- [ ] **HU 4.5** — Registro de Carimbo Temporal de Início de Prova.
- [ ] **HU 4.6** — Integração Real e Sincronização de Timestamp.
- [ ] **HU 4.7** — Ingestão em Lote (Batch) para Buffer Offline.
- [ ] **HU 5.2** — Despacho Assíncrono de Buffer Pós-Queda.
- [ ] **HU 2.3** — Cobertura e Progresso de Mapeamento.
- [ ] **HU 2.4** — Layout Adaptativo para Modo Alta Performance.

---

## Sprint 5: Refinamento e Gold Master (24/06 a 29/06)
**Revisão Final:** 29/06 (Inspeção Prévia do Produto - IPP)
**Objetivo:** Produto 100% estabilizado e documentação fechada para demonstração técnica da IPP.

### Atividades Globais Consolidadas
- [ ] **Atividade (#138)** — Relatório Técnico de Testes (LaTeX) e Correção de Pendências (Hardware e Software em conjunto).
- [ ] Bug Bash Integrado e testes severos ininterruptos no labirinto da FCTE.
- [ ] **Apresentação Oficial IPP**.
