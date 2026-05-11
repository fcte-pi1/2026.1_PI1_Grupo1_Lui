## Tabela de Versionamento

| Versão | Descrição | Autor(es) | Revisor |
|--------|-----------|-----------|---------|
| 1.0 | Criação do documento de dimensionamento do chassi | [Alexandre Alvarez](https://github.com/alexandremacedoalvarez-cpu), [Arthur Ribeiro](https://github.com/ArthurMR7) | (iancostag) (biancazero) |

# Explicação Teórica da Estrutura

## 1. Introdução

O desafio Micromouse exige um robô autônomo capaz de navegar e mapear labirintos desconhecidos. O chassi não se limita a uma base de suporte: ele é a interface física que viabiliza a leitura dos sensores e a execução da lógica de controle. Um erro dimensional na estrutura pode causar colisões sistêmicas, independentemente da eficiência do algoritmo de navegação.

Este documento apresenta as decisões de projeto adotadas pelo grupo para o chassi, integrando requisitos mecânicos e operacionais da competição.

### 1.1 Objetivo

Este documento tem como objetivo definir as dimensões críticas do chassi e o arranjo preliminar dos componentes, atendendo aos seguintes pontos:

- **Largura máxima do chassi:** Respeitar o limite de 16 cm para deslocamento em linha reta e o limite de 11,88 cm para garantir manobras em diagonal sem colisão com as paredes do labirinto.
- **Otimização do Layout interno:** Apresentar o posicionamento estratégico dos motores GA12-N20-S0310D-E, bateria e microcontrolador, visando a centralização de massas e estabilidade dinâmica.
- **Documentação técnica:** Gerar o desenho esquemático (2D/3D) que servirá de base para a fabricação física da estrutura.

---

## 2. Dimensionamento Geométrico

### 2.1 Contexto e Normas do Labirinto

O labirinto oficial da competição Micromouse é composto por células quadradas de **18 cm × 18 cm**, medidos de centro a centro das paredes. As paredes laterais possuem 5 cm de altura e 1,2 cm de espessura. Esse padrão é adotado internacionalmente e define todas as restrições geométricas para o projeto do robô.

Considerando a espessura das paredes, o vão livre disponível para a movimentação do robô dentro de um corredor retilíneo é de:

```
18 cm – 1,2 cm = 16,88 cm
```

Este valor é crítico porque representa o espaço real que o robô tem para efetuar o deslocamento sem tocar nas paredes laterais durante uma trajetória em linha reta.

Além disso, para manobras que exigem uma rotação de 90° ou travessia diagonal de uma célula, a geometria do labirinto impõe uma restrição mais severa: o robô não pode exceder a largura equivalente à diagonal do vão livre. Caso contrário, ocorre a colisão de suas laterais com os vértices das paredes. O limite teórico para essa situação é:

```
Largura diagonal = 16,8 cm ÷ √2 ≈ 11,88 cm
```

As normas da competição não explicitam uma largura máxima obrigatória, mas a partir dos cálculos apresentados, é demonstrado que robôs com largura superior a 16,8 cm falham nos testes de manobrabilidade. Portanto, o projeto do chassi deve respeitar ambos os limites:

- **≤ 16,8 cm** para trechos retos
- **≤ 11,88 cm** para garantir operação em diagonal

Sendo recomendável adotar uma margem de segurança adicional.

---

## 3. Arranjo Preliminar dos Componentes

O objetivo é otimizar o posicionamento dos componentes de maneira equilibrada em relação ao centro de massa e prática de acordo com a proximidade necessária entre os mesmos.

### 3.1 Bateria

Posicionada no chassi na parte **traseira** do micromouse devido ao seu tamanho e peso, que muito influenciam o centro de massa. Mantém fácil acesso para recarga e manuseio.

### 3.2 Motores

Localizados no **centro** do chassi, fornecem torque para as rodas e consequentemente separam a bateria do restante do chassi.

### 3.3 Sensores

Posicionados estrategicamente na **dianteira** do chassi para detecção apropriada de obstáculos e mapeamento do labirinto.

---

## 4. Desenho Esquemático

Esta seção apresenta a materialização física do protótipo por meio de desenhos técnicos detalhados, demonstrando como o arranjo dos componentes atende aos requisitos de navegabilidade e estabilidade definidos anteriormente.

### 4.1 Vistas Técnicas

O desenho técnico do chassi apresenta as principais dimensões e a localização de fixação dos componentes (motores, bateria e microcontrolador). As cotas estão expressas em milímetros e seguem as larguras máximas definidas na Seção 2:

- **160 mm** para deslocamento retilíneo
- **118,8 mm** para manobras diagonais

### 4.2 Vista Explodida e Arranjo de Componentes

A vista explodida do **XaropinhoV1** evidencia a disposição espacial dos 13 subsistemas principais, permitindo visualizar a hierarquia de montagem e a integração entre as partes mecânicas e eletrônicas.

#### Lista de Peças — XaropinhoV1

| Número | Nome                  | Quantidade |
|--------|-----------------------|------------|
| 1      | Chassis               | 1          |
| 2      | Motor                 | 2          |
| 3      | Bateria               | 1          |
| 4      | MicroControlador      | 1          |
| 5      | Lateral               | 2          |
| 6      | Roda                  | 4          |
| 7      | Engrenagem            | 2          |
| 8      | Protoboard 400 pinos  | 1          |
| 9      | Protoboard 170 pinos  | 2          |
| 10     | Tampa                 | 1          |
| 11     | Sensor Laser VL53l0x  | 3          |
| 12     | Conversor DC-DC       | 2          |
| 13     | Driver p motor        | 1          |

O arranjo foi projetado seguindo as seguintes premissas:

- **Estabilidade Dinâmica:** A bateria (item 3) e os motores (item 2) estão fixados no chassi inferior (item 1), mantendo o centro de massa o mais próximo possível do solo e garantindo estabilidade em curvas.
- **Acesso à manutenção:** A tampa (item 10) permite a separação funcional dos componentes. Aqueles que não necessitam de acesso constante (motores, bateria) são alocados no chassi (item 1). Os elementos que exigem intervenção constante para depuração e calibração ficam acessíveis no plano superior. Além de prover proteção passiva, a tampa integra aberturas para o gerenciamento de cabos.
- **Interface de sensoriamento:** Os suportes dos sensores laser (item 11) foram posicionados nas extremidades da base, assegurando que o envelope de leitura não sofra interferência das rodas ou da tampa superior.

### 4.3 Visão Isométrica

A perspectiva isométrica do **XaropinhoV1** consolida o design tridimensional, permitindo a visualização do robô em seu estado final de montagem.

- **Validação volumétrica:** Demonstra a capacidade do conjunto e seu respeito às dimensões do labirinto.

---

## 5. Resumo

O projeto estrutural do XaropinhoV1 priorizou a compacidade e a eficiência na distribuição de componentes para atender à exigência de navegação autônoma. As principais soluções de design adotadas foram:

- **Estrutura de dois níveis:** Implementação em uma estrutura estratificada que isola os componentes, visando a máxima eficiência na distribuição de massa e minimização de modificações estruturais durante a manutenção do robô.
- **Direção diferencial:** Um método de direcionamento onde as rodas de um lado do veículo giram em velocidades diferentes das do outro lado, permitindo curvas sem a necessidade de virar as rodas dianteiras.
- **Gestão de componentes:** O posicionamento de aberturas para a passagem organizada de fiação visa facilitar a intervenção técnica e garantir a proteção das conexões.

Todas estas estratégias visam extrair o máximo desempenho de cada subsistema do Micromouse, garantindo sua livre locomoção e agilidade dentro do labirinto.

---

## 6. Conclusão

As definições de geometria crítica e o arranjo de componentes do XaropinhoV1 validam a viabilidade física do protótipo para as condições de competição impostas. Com base no desenvolvimento apresentado, conclui-se que:

- **Conformidade geométrica:** A largura final de **110 mm** respeita o limite teórico de 118,8 mm, garantindo a navegação em trajetórias retilíneas e a execução de manobras diagonais sem colisão com os pilares do labirinto.
- **Layout:** O arranjo de dois níveis mantém o centro de massa reduzido e assegura espaço suficiente para a integração dos subsistemas de energia e eletrônica, favorecendo a estabilidade dinâmica do robô.

O projeto está, portanto, apto para a fase de manufatura e montagem física.
