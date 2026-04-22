# Micromouse — Documentação de Hardware e Decisões Técnicas

> Projeto Integrador de Engenharias — UnB Gama - FCTE

---

## Lista de Componentes

### Principais

|            Componente           | Quantidade | 
|---------------------------------|------------|
| ESP32                           |      1     |
| Motor DC N20 100:1 com Encoder  |      2     |
| Ponte H TB6612FNG               |      1     |
| Sensor ToF VL53L0X              |      3     | 
| Bateria LiPo                    |      1     | 
| Regulador de Tensão AMS1117-3.3 |      1     | 
| Chave Liga/Desliga              |      1     | 
| Conector JST                    |      1     | 

### Passivos

|        Componente      | Valor | Quantidade |                        Uso                        |
|------------------------|-------|------------|---------------------------------------------------|
| Resistor               | 4.7kΩ |      2     | Pull-up I2C                                       |
| Resistor               | 10kΩ  |      2     | Divisor de tensão (leitura de bateria)            |
| Resistor               | 100Ω  |      3     | Proteção pinos XSHUT dos VL53L0X                  |
| Capacitor cerâmico     | 100nF |      5     | Desacoplamento sensores e regulador               |
| Capacitor eletrolítico | 10µF  |      3     | Bulk: entrada bateria, saída regulador, TB6612FNG |

**Total: 7 resistores | 8 capacitores**

### Estrutura e Montagem

|        Componente        | Quantidade |
|--------------------------|------------|
| Placa de Fenolite        |      5+    |
| Pinos header macho/fêmea |     ~40    |
| Fios jumper              |  conjunto  |

> **Nota:** A protoboard será usada apenas na fase inicial de validação do circuito, antes da migração para a fenolite.

> **Em aberto:** Tensão da bateria (1S 3.7V ou 2S 7.4V) e solução mecânica das rodas — dependem de decisão da equipe de estruturas e energia.

---

## Layout das Placas de Fenolite

Serão utilizadas **2 placas funcionais:**

**Placa principal (~15x10cm)**
ESP32, TB6612FNG, regulador AMS1117-3.3, capacitores e resistores.

**Placa dos sensores (~8x3cm)**
3x VL53L0X posicionados em ângulo (esquerda, frente, direita) na parte frontal do robô.

As demais placas adquiridas são reserva para retrabalho. O tamanho final deve ser validado com o chassi definido pela equipe de estruturas, respeitando o limite de **25x25cm** do regulamento.

---

## Microcontrolador — ESP32

### Por que o ESP32?

O ESP32 foi escolhido após comparação com as alternativas mais comuns no contexto de robótica acadêmica (Arduino Uno/Nano, STM32, Raspberry Pi Pico). Os critérios foram custo, periféricos disponíveis, ecossistema e adequação ao projeto.

**Processamento**
Dual-core 240MHz com FreeRTOS nativo. Isso permite separar a tarefa de controle de motor (core 0, alta prioridade, loop determinístico) da tarefa de navegação/lógica (core 1) sem interferência entre elas. Arduino Uno opera a 16MHz single-core — insuficiente para PID + leitura de múltiplos sensores I2C em paralelo com a frequência necessária.

**Periféricos nativos relevantes para o projeto**
- **I2C** — para comunicação com os 3x VL53L0X

- **LEDC (PWM de alta resolução)** — até 16 canais PWM independentes, essencial para controle fino dos dois motores via TB6612FNG

- **Interrupções externas em qualquer pino GPIO** — necessário para leitura dos encoders por interrupção (método mais preciso)

- **WiFi nativo** — necessário para transmissão de telemetria em tempo real (requisito do projeto)

- **ADC de 12 bits** — leitura de nível de bateria via divisor de tensão

**Ecossistema e documentação**
Ampla base de tutoriais, bibliotecas Arduino compatíveis e comunidade ativa. Para um projeto acadêmico com prazo definido, isso reduz o tempo gasto com troubleshooting de hardware e aumenta o tempo disponível para o desenvolvimento do algoritmo.

**Custo**
Comparável ao Arduino Nano e significativamente mais barato que soluções equivalentes em performance.

**Atenção:** Usar apenas pinos do **ADC1** para leituras analógicas. O ADC2 compartilha hardware com o WiFi e apresenta leituras instáveis.

---

## Motores — DC N20 100:1 com Encoder

Redução 100:1 prioriza torque e controle em detrimento de velocidade máxima. Dado que o projeto não é uma competição de velocidade, essa troca é favorável — o controle de posição e curva fica mais preciso.

Os encoders integrados são usados para **odometria** (cálculo de distância percorrida) e **tracking de orientação**, inferindo heading a partir da diferença de pulsos entre os dois lados.

> **Em aberto:** A configuração mecânica das rodas (1 motor por lado via engrenagem ou 1 roda tracionada + 1 boba) está a cargo da equipe de estruturas e não altera a lista de componentes eletrônicos.

---

## Ponte H — TB6612FNG

Ponte H dupla, padrão para esse tipo de projeto. Para os motores N20 ela opera com folga considerável de corrente, o que evita aquecimento e aumenta a confiabilidade.

---

## Sensores de Distância — VL53L0X (ToF)

Sensor Time-of-Flight. Preferido ao IR analógico pelos seguintes motivos:

- **Independente de cor e reflectividade** — Independente de cor e reflectividade — IR analógico mede intensidade de luz refletida, o que gera leituras inconsistentes em ambientes com superfícies de cores diferentes. Com chão preto e paredes brancas, a calibração se tornaria problemática. O VL53L0X mede tempo de voo e é imune a esse efeito. 

- **Imune à luz ambiente** — IR sofre interferência de lâmpadas fluorescentes (60Hz)

- **Interface I2C** — integra no mesmo barramento dos demais sensores

**Atenção de implementação:** Todos os módulos VL53L0X saem de fábrica com o mesmo endereço I2C (`0x29`). Com 3 sensores no mesmo barramento, é necessário controlar o pino **XSHUT** de cada módulo individualmente na inicialização para reendereçá-los. Os resistores de 100Ω nos pinos XSHUT protegem o GPIO do ESP32.

---

## Orientação — Odometria por Encoder

O tracking de orientação será feito exclusivamente pelos encoders dos motores N20, calculando a diferença de distância percorrida entre os dois lados:

```cpp
float leftDist  = leftPulses  * DIST_PER_PULSE;
float rightDist = rightPulses * DIST_PER_PULSE;

float deltaTheta = (rightDist - leftDist) / WHEEL_BASE;
heading += deltaTheta; // em radianos
```

Após cada curva, o heading é discretizado para o múltiplo de 90° mais próximo, resetando a incerteza acumulada:

```cpp
enum Direction { NORTH, EAST, SOUTH, WEST };

Direction turnRight(Direction d) { return (Direction)((d + 1) % 4); }
Direction turnLeft(Direction d)  { return (Direction)((d + 3) % 4); }
```

---

## Alimentação

O sistema será alimentado por bateria LiPo. A tensão (1S 3.7V ou 2S 7.4V) está a definir, mas a arquitetura de alimentação será:

- Bateria → TB6612FNG (tensão direta para os motores)
- Bateria → AMS1117-3.3 → ESP32 e sensores (3.3V regulado)
- Divisor de tensão resistivo (10kΩ + 10kΩ) → ADC1 do ESP32 (monitoramento de bateria)

O monitoramento de bateria é requisito explícito do projeto (telemetria em tempo real).

---

## Linguagem — C++

Escolhido sobre MicroPython pelos seguintes motivos:

- **Tempo de ciclo determinístico** — o loop de controle (leitura de sensor → PID → PWM) precisa rodar em ciclos fixos, centenas de vezes por segundo. MicroPython não garante isso por causa do GIL e do garbage collector

- **Controle baixo nível** — sem dependência de bibliotecas externas que adicionam overhead imprevisível

- **Framework Arduino no ESP32** — oferece abstração suficiente para facilitar o desenvolvimento sem abrir mão de performance

---

## SUGESTÃO DE ALGORITMO DE NAVEGAÇÃO

## Algoritmo de Navegação — Pledge Algorithm

Evolução do Wall Follower que resolve o problema de ficar preso em loops ao redor de ilhas (obstáculos isolados).

**Lógica central:** mantém um contador de rotação acumulada. O wall follower é ativado ao encontrar uma parede, mas só é desativado quando o contador retorna a zero — garantindo que o robô não abandone a parede no meio de um contorno de obstáculo.

- Vira à esquerda: `contador - 1`
- Vira à direita: `contador + 1`
- Contador == 0: abandona a parede e segue em linha reta na direção original

**Detecção do objetivo:** a área 2x2 no centro do labirinto será detectada por ausência simultânea de paredes nos lados esquerdo, direito e frontal — inferível diretamente pelas leituras dos 3x VL53L0X.

**Limitação conhecida:** não garante caminho ótimo, mas garante que o robô encontra a saída em labirintos sem configurações patológicas — suficiente para o contexto do projeto.

---

*Documentação gerada com base nas discussões técnicas do grupo e nos requisitos do PI1 2026/1.*