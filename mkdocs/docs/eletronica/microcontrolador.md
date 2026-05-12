# Microcontrolador

## 1. Contextualização

Segundo Espressif Systems [1], o ESP32 é um microcontrolador de alto desempenho projetado para aplicações embarcadas que exigem conectividade, processamento e controle em tempo real. De acordo com Chase e Almeida [6], microcontroladores são pequenos sistemas computacionais que englobam em um único chip interfaces de entrada e saída digitais e analógicas, além de periféricos importantes como memória RAM, memória Flash, interfaces de comunicação serial, conversores analógico-digitais e temporizadores/contadores.

A principal vantagem desses dispositivos é a integração de diversos periféricos em um único chip, aliada à capacidade de executar e armazenar programas (firmware). Com o avanço tecnológico, esses sistemas também passaram a incorporar funcionalidades adicionais, como comunicação USB, pilha TCP/IP, comunicação RF e outras interfaces, sendo amplamente utilizados no processamento de dados, leitura de sensores e controle de atuadores em sistemas embarcados, especialmente em robótica móvel.

No contexto do micromouse, o microcontrolador é o componente central do sistema, sendo responsável por executar o algoritmo de navegação, processar os dados provenientes dos sensores e controlar os motores do robô. Dessa forma, a escolha do microcontrolador impacta diretamente no desempenho, precisão e confiabilidade do sistema.

Diante disso, foi realizado um estudo comparativo entre as principais plataformas utilizadas em projetos acadêmicos, visando selecionar a alternativa mais adequada para os requisitos do projeto.

---

## 2. Microcontroladores Selecionados para Análise

A equipe selecionou os seguintes microcontroladores para comparação:

- **ESP32 Devkit WROOM:** Microcontrolador com conectividade Wi-Fi/Bluetooth e arquitetura dual-core.
- **Arduino Uno (ATmega328P):** Plataforma baseada em microcontrolador AVR de 8 bits.
- **STM32 (STM32F103C8T6):** Microcontrolador baseado em arquitetura ARM Cortex-M3.
- **Raspberry Pi Pico (RP2040):** Microcontrolador dual-core com foco em custo-benefício.

---

## 3. Tabela de Comparação

> A tabela foi construída conforme as fontes listadas nas Referências [1–5].

| Critério | ESP32 Devkit WROOM | Arduino Uno | STM32 (F103) | Raspberry Pi Pico |
|---|---|---|---|---|
| Clock | 240 MHz (dual-core) | 16 MHz | 72 MHz | 133 MHz (dual-core) |
| Arquitetura | Xtensa dual-core | AVR 8 bits | ARM Cortex-M3 | ARM Cortex-M0+ |
| Memória RAM | ~520 KB | 2 KB | 20 KB | 264 KB |
| Wi-Fi / Bluetooth | Sim (nativo) | Não | Não | Não |
| PWM | Até 16 canais (LEDC) | 6 canais | Múltiplos canais (timers avançados) | 16 canais |
| ADC | 12 bits | 10 bits | 12 bits | 12 bits |
| Interrupções | Em todos os GPIOs | Limitadas | Avançadas | Avançadas |
| Facilidade de uso | Alta | Muito alta | Média | Alta |
| Custo aproximado | ~R$ 30–50 | ~R$ 40–60 | ~R$ 20–30 | ~R$ 25–35 |
| Tensão de alimentação | 5 V | 5 V | 3,3 V | 3,3 V |
| Consumo ativo (CPU, sem RF) | 30–68 mA @ 240 MHz | ~12 mA @ 16 MHz (ATmega328P isolado) | ~5,5 mA @ 72 MHz | ~25 mA @ 133 MHz |
| Consumo Wi-Fi (transmissão, pico) | 180–240 mA [1] | — | — | — |
| Picos transitórios (DevKit) | até ~500–700 mA | — | — | — |

> **¹ Tensão de operação do microcontrolador (nível lógico / núcleo):** Refere-se à tensão interna do chip. O Arduino Uno opera nativamente a 5 V. O ESP32, o STM32 (F103) e o Raspberry Pi Pico operam a 3,3 V e não são tolerantes a 5 V em seus GPIOs (com exceção de pinos específicos do STM32F103 marcados como *5V tolerant* no datasheet). As placas de desenvolvimento aceitam alimentação a 5 V via regulador onboard.

> **Nota 2:** Os valores de consumo do módulo ESP32-WROOM-32 referem-se a condições típicas de operação conforme o datasheet [1], podendo variar conforme o esquema de modulação, a potência de transmissão (TX power) e a configuração do sistema.

> **Nota 3:** Valores típicos reportados na literatura indicam correntes transitórias da ordem de centenas de miliampères no ESP32-DevKitC, podendo atingir aproximadamente 0,5 A a 0,7 A durante eventos como inicialização do Wi-Fi [7][8].

---

## 4. Justificativa

A escolha pelo microcontrolador ESP32 se justifica principalmente pelo seu alto desempenho computacional aliado à grande quantidade de periféricos integrados, o que o torna especialmente adequado para aplicações em robótica móvel autônoma.

Um dos principais diferenciais do ESP32 é sua arquitetura dual-core operando a 240 MHz, permitindo a separação de tarefas críticas: é possível dedicar um núcleo ao controle dos motores, garantindo comportamento determinístico, enquanto o outro executa algoritmos de navegação e tomada de decisão.

Além disso, o microcontrolador possui periféricos essenciais para o projeto, como interface I²C para comunicação com sensores de distância, módulos PWM de alta resolução para controle dos motores, suporte a interrupções em múltiplos pinos para leitura de encoders e conectividade Wi-Fi nativa para transmissão de dados em tempo real, atendendo aos requisitos estabelecidos [1].

Em comparação, plataformas como o Arduino Uno apresentam limitações significativas de processamento e memória [2][3], enquanto alternativas como o STM32, embora potentes, possuem maior complexidade de configuração [4]. Já o Raspberry Pi Pico, apesar de apresentar bom desempenho e baixo custo, não possui conectividade sem fio nativa, exigindo módulos adicionais para funções de telemetria [5].

Por fim, o ESP32 apresenta uma excelente relação custo-benefício: combina alto desempenho, recursos de conectividade e ampla disponibilidade de ferramentas a um custo acessível, o que o torna a escolha mais adequada para o projeto em comparação às demais plataformas analisadas.

---

## 5. Análise de Consumo de Energia e Dimensionamento da Fonte

### 5.1 Módulo ESP32-WROOM-32

O consumo do módulo ESP32 varia conforme o modo de operação [1]:

- CPU ativa (240 MHz), rádio desligado: 30–68 mA  
- Wi-Fi em recepção: 95–100 mA  
- Wi-Fi em transmissão: 180–240 mA  

No contexto do micromouse, é possível desligar o rádio durante a navegação, reduzindo o consumo médio.

### 5.2 Placa de Desenvolvimento ESP32-DevKitC

É fundamental distinguir o consumo do **módulo ESP32-WROOM-32** (chip + antena + flash) do consumo da **placa de desenvolvimento ESP32-DevKitC**, que inclui componentes adicionais: regulador de tensão linear (IRU1117-33), chip USB-UART (CP2102) e LED de alimentação. Esses componentes elevam o consumo total medido na placa em relação ao datasheet do módulo isolado.
 
Medições realizadas com osciloscópio no ESP32-DevKitC durante a execução de scan Wi-Fi reportam corrente média de **~0,5 A por 10 ms** na inicialização, com picos de **~0,7 A** durante a operação contínua com Wi-Fi ativo [7][8].

### 5.3 Alimentação

**Dimensionamento da fonte:** Em razão dos picos de corrente durante a transmissão Wi-Fi e a inicialização do rádio, recomenda-se que a fonte de 3,3 V (ou a fonte de 5 V que alimenta o DevKit via regulador onboard) tenha capacidade mínima de **500 mA**, preferencialmente **1 A**, para garantir margem de segurança e estabilidade de tensão durante os transientes [8].

> Recomenda-se fonte de pelo menos **500 mA, idealmente 1 A**, para suportar picos de corrente.

---

## 6. Observações Técnicas

- Utilizar apenas ADC1 para leituras analógicas  
- Usar interrupções para encoders  
- GPIOs operam em 3,3 V (não toleram 5 V)  
- Uso de level shifter quando necessário  

---

## 7. Referências

[1] ESPRESSIF SYSTEMS. ESP32-WROOM-32 Datasheet. Versão 3.6.  
Disponível em: <https://documentation.espressif.com/esp32-wroom-32_datasheet_en.pdf>.  
Acesso em: 27 abr. 2026.

[2] ARDUINO. *Arduino Uno Rev3 Documentation*.  
Disponível em: <https://docs.arduino.cc/hardware/uno-rev3/>.  
Acesso em: 27 abr. 2026.

[3] MICROCHIP TECHNOLOGY. *ATmega328P Datasheet*.  
Disponível em: <https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf>.  
Acesso em: 27 abr. 2026.

[4] STMICROELECTRONICS. *STM32F103C8 Product Page*.  
Disponível em: <https://www.st.com/en/microcontrollers-microprocessors/stm32f103c8.html>.  
Acesso em: 27 abr. 2026.

[5] RASPBERRY PI. *RP2040 Datasheet: a microcontroller by Raspberry Pi*.  
Disponível em: <https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf>.  
Acesso em: 27 abr. 2026.

[6] CHASE, Otavio; ALMEIDA, F. *Sistemas embarcados*. Mídia eletrônica.  
Disponível em: <http://www.sbajovem.org/chase>.  
Acesso em: 27 abr. 2026.

[7] LAST MINUTE ENGINEERS. *Insight Into ESP32 Sleep Modes & Their Power Consumption*.  
Disponível em: <https://lastminuteengineers.com/esp32-sleep-modes-power-consumption/>.  
Acesso em: 05 mai. 2026.

[8] ESPRESSIF SYSTEMS. *ESP32-DevKitC User Guide*.  
Disponível em: <https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html>.  
Acesso em: 05 mai. 2026.

---

## 8. Histórico de Versões

| Data | Versão | Descrição | Autores |
|---|---|---|---|
| 27/04/2026 | 0.1 | Criação do documento | Caio Bechepeche Mota, Renato Rodrigues |
| 05/05/2026 | 0.2 | Revisão do consumo de energia e referências | — |