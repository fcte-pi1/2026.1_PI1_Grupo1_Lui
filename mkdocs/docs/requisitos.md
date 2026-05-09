# Requisitos Unificados — Projeto Micromouse (PI1)

Este documento consolida os requisitos levantados pelas áreas de Estrutura, Eletrônica, Software e Energia do projeto Micromouse, removendo redundâncias e agrupando requisitos relacionados.


# 1. Requisitos Funcionais (RF)

## RF01 — Detecção de Paredes e Obstáculos

O sistema deve detectar paredes do labirinto e obstáculos nas direções frontal, esquerda e direita durante a navegação, distinguindo corretamente paredes brancas do piso preto.

**Origem:** Eletrônica + Software


## RF02 — Localização e Navegação Autônoma

O robô deve calcular sua posição, orientação e deslocamento dentro de um labirinto de até 16×16 células utilizando sensores e odometria.

**Origem:** Eletrônica + Software + Estrutura


## RF03 — Execução Local da Navegação

Toda a lógica de navegação, exploração e resolução do labirinto deve ser executada localmente no robô, sem dependência de processamento externo.

**Origem:** Eletrônica


## RF04 — Armazenamento do Mapa do Labirinto

O sistema deve possuir memória suficiente para armazenar e atualizar a representação de um labirinto de até 16×16 células.

**Origem:** Eletrônica


## RF05 — Comunicação e Telemetria

O sistema deve manter comunicação sem fio com um servidor para transmissão de telemetria, incluindo métricas de movimento, posição, estado energético e dados de mapeamento.

**Origem:** Eletrônica + Software


## RF06 — Visualização e Interface de Telemetria

O software deve disponibilizar uma interface capaz de:

* renderizar o labirinto em tempo real;
* exibir paredes detectadas;
* apresentar métricas de navegação;
* exibir cronômetro, velocidade e trajetória;
* diferenciar os modos de exploração e corrida rápida.

**Origem:** Software


## RF07 — Configuração da Arena

O software deve permitir configuração prévia do tamanho do labirinto (4×4, 8×8 ou 16×16), ajustando automaticamente a grade visual e os limites de coordenadas.

**Origem:** Software


## RF08 — Persistência e Exportação de Dados

O sistema deve armazenar históricos de trajetos, tempos e logs de eventos, além de permitir exportação dos dados em formatos estruturados como JSON e CSV.

**Origem:** Software


## RF09 — Resiliência de Comunicação

O sistema deve possuir mecanismo de cache local para preservar dados de telemetria em caso de perda temporária de conexão.

**Origem:** Software


## RF10 — Estrutura Mecânica para Navegação Precisa

O chassi deve:

* manter alinhamento paralelo e fixação rígida dos motores;
* possuir suportes rígidos para sensores;
* minimizar vibrações e erros de odometria;
* permitir rotações de 90° e 180° dentro da célula.

**Origem:** Estrutura


## RF11 — Distribuição e Proteção Mecânica

A estrutura deve:

* possuir distribuição simétrica de massas;
* proteger sensores e componentes eletrônicos contra impactos leves;
* prever compartimento acessível para bateria;
* possuir pontos de fixação para LEDs e botões externos.

**Origem:** Estrutura


## RF12 — Gerenciamento Energético

O sistema deve:

* monitorar tensão e corrente da bateria;
* dimensionar alimentação conforme o consumo total;
* possuir reguladores e proteções elétricas adequadas;
* separar, quando necessário, alimentação lógica e alimentação de potência.

**Origem:** Energia + Software


## RF13 — Controle de Oscilações Elétricas

O projeto eletrônico deve prever mecanismos de mitigação de ruído e oscilações elétricas, incluindo capacitores de desacoplamento, aterramento adequado e proteção contra picos gerados pelos motores.

**Origem:** Energia


## RF14 — Modos de Operação Energética

O sistema deve considerar diferentes modos operacionais para cálculo e gerenciamento energético, incluindo:

* inicialização;
* leitura de sensores;
* exploração do labirinto;
* corrida rápida;
* frenagens e correções;
* tentativas sucessivas.

**Origem:** Energia


## RF15 — Validação Experimental

O projeto deve permitir coleta e análise experimental de dados elétricos e operacionais, incluindo tensão, corrente, tempo de operação, picos de corrente e comportamento da bateria.

**Origem:** Energia


# 2. Requisitos Não Funcionais (RNF)

## RNF01 — Tempo de Resposta

O tempo total entre leitura dos sensores, processamento da decisão e acionamento dos motores deve ser de no máximo 50 ms.

**Origem:** Eletrônica


## RNF02 — Latência da Telemetria

A latência entre captura dos dados no robô e atualização da interface web deve ser inferior a 150 ms.

**Origem:** Software


## RNF03 — Estabilidade da Comunicação

A comunicação sem fio deve manter perda de pacotes inferior a 5% durante a operação em labirintos de até 16×16 células.

**Origem:** Eletrônica


## RNF04 — Autonomia Energética

O sistema deve possuir autonomia mínima suficiente para executar pelo menos 3 execuções completas do labirinto sem recarga.

**Origem:** Eletrônica + Energia


## RNF05 — Limite Dimensional

A largura operacional do robô deve ser menor ou igual a 10 cm para permitir manobras seguras.

**Origem:** Estrutura


## RNF06 — Massa Total

A massa total do robô deve ser menor ou igual a 250 g.

**Origem:** Estrutura


## RNF07 — Estabilidade Mecânica

O centro de massa deve permanecer abaixo de 2 cm de altura e até 1,5 cm à frente do eixo motriz.

**Origem:** Estrutura


## RNF08 — Aderência

O sistema de tração deve garantir coeficiente de atrito mínimo equivalente a μ ≥ 0,7.

**Origem:** Estrutura


## RNF09 — Rigidez Estrutural

Os suportes dos sensores devem apresentar deformação inferior a 0,1 mm sob carga de 2 N.

**Origem:** Estrutura


## RNF10 — Robustez da Memória

O sistema deve suportar operação contínua de mapeamento em grade 16×16 sem falhas por esgotamento de memória.

**Origem:** Eletrônica


## RNF11 — Margens de Segurança Energética

O dimensionamento energético deve considerar:

* mínimo de 30% de margem de segurança na capacidade energética;
* entre 20% e 30% de folga para corrente e potência de pico.

**Origem:** Energia
