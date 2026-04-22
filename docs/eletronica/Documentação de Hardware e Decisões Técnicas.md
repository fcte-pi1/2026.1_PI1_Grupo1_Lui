# Micromouse — Documentação de Hardware e Decisões Técnicas

> Projeto Integrador de Engenharias — UnB Gama  
> Labirinto: 16x16 células | Navegação sem rodada de reconhecimento

---

## Lista de Componentes

|             Componente          | Quantidade |
|---------------------------------|------------|
| ESP32                           |      1     |
| Motor DC N20 100:1 com Encoder  |      2     |
| Ponte H TB6612FNG               |      1     | 
| Placa de Fenolite               |      5+    |
| Sensor ToF VL53L0X              |      3     | 
| Giroscópio MPU-6050             |      1     | 

---

## Microcontrolador — ESP32

### Por que o ESP32?

O ESP32 foi escolhido após comparação com as alternativas mais comuns no contexto de robótica acadêmica (Arduino Uno/Nano, STM32, Raspberry Pi Pico). Os critérios foram custo, periféricos disponíveis, ecossistema e adequação ao projeto.

**Processamento**
Dual-core 240MHz com FreeRTOS nativo. Isso permite separar a tarefa de controle de motor (core 0, alta prioridade, loop determinístico) da tarefa de navegação/lógica (core 1) sem interferência entre elas. Arduino Uno opera a 16MHz single-core — insuficiente para PID + leitura de múltiplos sensores I2C em paralelo com a frequência necessária.

**Periféricos nativos relevantes para o projeto**
- **2x I2C** — necessário para VL53L0X (múltiplos sensores) e MPU-6050 simultaneamente
- **LEDC (PWM de alta resolução)** — até 16 canais PWM independentes, essencial para controle fino dos dois motores via TB6612FNG
- **Interrupções externas em qualquer pino GPIO** — necessário para leitura dos encoders por interrupção (método mais preciso)
- **ADC de 12 bits** — caso seja necessário adicionar sensores analógicos futuramente

**Ecossistema e documentação**
Ampla base de tutoriais, bibliotecas Arduino compatíveis e comunidade ativa. Para um projeto acadêmico com prazo definido, isso reduz o tempo gasto com troubleshooting de hardware e aumenta o tempo disponível para o desenvolvimento do algoritmo.

**Custo**
Comparável ao Arduino Nano e significativamente mais barato que soluções equivalentes em performance (ex: STM32 com placa de desenvolvimento).

**Atenção:** Usar apenas pinos do **ADC1** para leituras analógicas. O ADC2 compartilha hardware com o WiFi e apresenta leituras instáveis.
---

## Motores — DC N20 100:1 com Encoder

Redução 100:1 prioriza torque e controle em detrimento de velocidade máxima. Dado que o projeto não é uma competição de velocidade, essa troca é favorável — o controle de posição e curva fica mais preciso.

Os encoders integrados são usados tanto para **odometria** (cálculo de distância percorrida) quanto para **tracking de orientação** em conjunto com o giroscópio.

---

## Ponte H — TB6612FNG

Ponte H dupla, padrão para esse tipo de projeto. Para os motores N20 ela opera com folga considerável de corrente, o que evita aquecimento e aumenta a confiabilidade.

---

## Placa de Fenolite

Usada para soldagem dos componentes. Recomendado adquirir **pelo menos 5 unidades** para prototipagem e possíveis retrabalhos.

---

## Sensores de Distância — VL53L0X (ToF)

Sensor Time-of-Flight. Preferido ao IR analógico pelos seguintes motivos:

- **Independente de cor e reflectividade** da parede — IR analógico falha em superfícies escuras ou fosca
- **Imune à luz ambiente** — IR sofre interferência de lâmpadas fluorescentes (60Hz)
- **Interface I2C** — compartilha barramento com o MPU-6050

**Atenção de implementação:** Todos os módulos VL53L0X saem de fábrica com o mesmo endereço I2C (`0x29`). Com múltiplos sensores no mesmo barramento, é necessário controlar o pino **XSHUT** de cada módulo individualmente na inicialização para reendereçá-los.

---

## Orientação — MPU-6050 + Encoders (Sensor Fusion)

### Por que não só encoder?

Em um labirinto 16x16, o robô pode executar 50+ curvas no pior caso. Cada curva com ~2° de erro acumula até 100° de desvio total — o suficiente para quebrar completamente o algoritmo de navegação.

### Por que não só giroscópio?

O giroscópio tem *drift* — um bias que faz o heading derivar lentamente mesmo sem movimento. Sozinho também acumula erro, porém de forma diferente.

### Solução: Filtro Complementar

Combina os dois sensores em uma única linha:

```cpp
// alpha entre 0.95 e 0.98 — ajustar empiricamente
heading = alpha * (heading + gyroZ * dt)
        + (1 - alpha) * headingFromEncoders;
```

O giroscópio responde bem a variações rápidas (curvas). O encoder serve de referência de longo prazo. Juntos, o erro acumulado cai para menos de 5° em toda a execução.

### Discretização por 90°

Como o labirinto é uma grade, o heading não precisa ser contínuo — basta distinguir Norte/Sul/Leste/Oeste. Após cada curva, o heading é "snapeado" para o múltiplo de 90° mais próximo, resetando a incerteza acumulada.

```cpp
enum Direction { NORTH, EAST, SOUTH, WEST };

Direction turnRight(Direction d) { return (Direction)((d + 1) % 4); }
Direction turnLeft(Direction d)  { return (Direction)((d + 3) % 4); }
```

---

## Linguagem — C++

Escolhido sobre MicroPython pelos seguintes motivos:

- **Tempo de ciclo determinístico** — o loop de controle (leitura de sensor → PID → PWM) precisa rodar em ciclos fixos, centenas de vezes por segundo. MicroPython não garante isso por causa do GIL e do garbage collector
- **Controle baixo nível** — sem dependência de bibliotecas externas que adicionam overhead imprevisível
- **Framework Arduino no ESP32** — oferece abstração suficiente para facilitar o desenvolvimento sem abrir mão de performance

---

## Algoritmo de Navegação — Pledge Algorithm

Evolução do Wall Follower que resolve o problema de ficar preso em loops ao redor de ilhas (obstáculos isolados).

**Lógica central:** mantém um contador de rotação acumulada. O wall follower é ativado ao encontrar uma parede, mas só é desativado quando o contador retorna a zero — garantindo que o robô não abandone a parede no meio de um contorno de obstáculo.

- Vira à esquerda: `contador - 1`
- Vira à direita: `contador + 1`
- Contador == 0: abandona a parede e segue em linha reta na direção original

**Limitação conhecida:** não garante caminho ótimo, mas garante que o robô encontra a saída em labirintos sem configurações patológicas — suficiente para o contexto do projeto.

---

*Documentação gerada com base nas discussões técnicas do grupo e pesquisas. Para alterações, abrir PR no repositório.*
