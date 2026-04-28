# Microcontrolador

# Contextualização

Segundo Espressif Systems [1], o ESP32 é um microcontrolador de alto desempenho projetado para aplicações embarcadas que exigem conectividade, processamento e controle em tempo real. De acordo com Chase e Almeida [6], microcontroladores são pequenos sistemas computacionais bastante poderosos que englobam em um único chip interfaces de entrada e saída digitais e analógicas, além de periféricos importantes como memória RAM, memória FLASH, interfaces de comunicação serial, conversores analógico-digitais e temporizadores/contadores. 

A principal vantagem desses dispositivos é a integração de diversos periféricos em um único chip, além da capacidade de executar e armazenar programas (firmware). Com o avanço tecnológico, esses sistemas também passaram a incorporar funcionalidades adicionais, como comunicação USB, pilha TCP/IP, comunicação RF e outras interfaces, sendo amplamente utilizados no processamento de dados, leitura de sensores e controle de atuadores em sistemas embarcados, especialmente em robótica móvel.

No contexto do micromouse, o microcontrolador é o componente central do sistema, sendo responsável por executar o algoritmo de navegação, processar os dados provenientes dos sensores e controlar os motores do robô. Dessa forma, a escolha do microcontrolador impacta diretamente no desempenho, precisão e confiabilidade do sistema.

Diante disso, foi realizado um estudo comparativo entre as principais plataformas utilizadas em projetos acadêmicos, visando selecionar a alternativa mais adequada para os requisitos do projeto.

#
#

# Microcontroladores escolhidos para análise

A equipe selecionou os seguintes microcontroladores para comparação:

- ESP32: Microcontrolador com conectividade WiFi/Bluetooth e arquitetura dual-core.
- Arduino Uno (ATmega328P): Plataforma baseada em microcontrolador AVR de 8 bits.
- STM32 (STM32F103C8T6): Microcontrolador baseado em arquitetura ARM Cortex-M3.
- Raspberry Pi Pico (RP2040): Microcontrolador dual-core com foco em custo-benefício.

#
#

# Tabela de Comparação

**A tabela foi construída conforme as fontes listadas nas Referências**

| Critério              | ESP32                     | Arduino Uno           | STM32 (F103)                          | Raspberry Pi Pico     |
|----------------------|--------------------------|-----------------------|----------------------------------------|-----------------------|
| Clock                | 240 MHz (dual-core)      | 16 MHz                | 72 MHz                                 | 133 MHz (dual-core)   |
| Arquitetura          | Xtensa dual-core         | AVR 8 bits            | ARM Cortex-M3                          | ARM Cortex-M0+        |
| Memória RAM          | ~520 KB                  | 2 KB                  | 20 KB                                  | 264 KB                |
| WiFi/Bluetooth       | Sim (nativo)             | Não                   | Não                                    | Não                   |
| PWM                  | Até 16 canais (LEDC)     | 6 canais              | Múltiplos canais (timers avançados)    | 16 canais             |
| ADC                  | 12 bits                  | 10 bits               | 12 bits                                | 12 bits               |
| Interrupções         | Em todos GPIOs           | Limitadas             | Avançadas                              | Avançadas             |
| Facilidade de uso    | Alta                     | Muito alta            | Média                                  | Alta                  |
| Custo                | Médio (~R$30–50)         | Médio (~R$40–60)      | Baixo (~R$20–30)                       | Baixo (~R$25–35)      |
| Tensão típica        | 3,3 V                    | 5 V                   | 3,3 V                                  | 3,3 V                 |
| Consumo ativo (CPU, sem RF) | 30–68 mA @ 240 MHz | ~12 mA @ 16 MHz (chip isolado) | ~5,5 mA @ 72 MHz (periféricos off) | ~25 mA @ 133 MHz |
| Consumo com Wi-Fi ativo | 95–240 mA             | —                     | —                                      | —                     |

*Nota: Os valores de consumo referem-se a condições típicas de operação, podendo variar conforme o uso de periféricos e configuração do sistema.*

#
#

# Justificativa

A escolha pelo microcontrolador ESP32 se justifica principalmente pelo seu alto desempenho computacional aliado à grande quantidade de periféricos integrados, o que o torna especialmente adequado para aplicações em robótica móvel autônoma.

Um dos principais diferenciais do ESP32 é sua arquitetura dual-core operando a 240 MHz, permitindo a separação de tarefas críticas. Dessa forma, é possível dedicar um núcleo ao controle dos motores, garantindo comportamento determinístico, enquanto o outro executa algoritmos de navegação e tomada de decisão, reduzindo interferências entre processos.

Além disso, o microcontrolador possui periféricos essenciais para o projeto, como interface I2C para comunicação com sensores de distância, módulos PWM de alta resolução para controle dos motores, suporte a interrupções em múltiplos pinos para leitura de encoders e conectividade WiFi nativa para transmissão de dados em tempo real, atendendo aos requisitos estabelecidos.

Outro fator relevante é o seu ecossistema consolidado, com ampla disponibilidade de bibliotecas, documentação e comunidade ativa, o que reduz significativamente o tempo de desenvolvimento e facilita a integração dos diferentes módulos do sistema.

Em comparação, plataformas como o Arduino Uno apresentam limitações significativas de processamento e memória, enquanto alternativas como STM32, embora potentes, possuem maior complexidade de configuração. Já o Raspberry Pi Pico, apesar de apresentar bom desempenho, não possui conectividade nativa.

Destaca-se ainda que, durante a transmissão Wi-Fi, o consumo do ESP32 pode atingir valores entre 180 mA e 240 mA, dependendo da configuração de operação. Entretanto, com o Wi-Fi desativado (modo modem sleep), o consumo reduz-se para aproximadamente 30 mA a 68 mA a 240 MHz. No contexto do micromouse, isso permite desligar o rádio durante a execução das rotas e ativá-lo apenas para transmissão de telemetria, otimizando o consumo energético.

Por fim, o ESP32 apresenta uma excelente relação custo-benefício, oferecendo alto desempenho a um custo acessível, o que o torna a escolha mais adequada para o projeto.

#
#

# Observações Técnicas

- Recomenda-se utilizar apenas os pinos do ADC1 para leituras analógicas, pois o ADC2 compartilha recursos com o módulo WiFi, podendo causar instabilidade nas medições.
- A leitura dos encoders deve ser realizada preferencialmente por meio de interrupções, garantindo maior precisão na obtenção dos dados.

#
#

# Referências

[1] ESPRESSIF SYSTEMS. ESP32 Series Datasheet. Disponível em: <https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf>. Acesso em: 27 abr. 2026.

[2] ARDUINO. Arduino Uno Rev3 Documentation. Disponível em: <https://docs.arduino.cc/hardware/uno-rev3/>. Acesso em: 27 abr. 2026.

[3] MICROCHIP TECHNOLOGY. ATmega328P Datasheet. Disponível em: <https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf>. Acesso em: 27 abr. 2026.

[4] STMICROELECTRONICS. STM32F103C8. Disponível em: <https://www.st.com/en/microcontrollers-microprocessors/stm32f103c8.html>. Acesso em: 27 abr. 2026.

[5] RASPBERRY PI. RP2040 Datasheet: a microcontroller by Raspberry Pi. Disponível em: <https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf>. Acesso em: 27 abr. 2026.

[6] CHASE, Otavio; ALMEIDA, F. Sistemas embarcados. Mídia eletrônica. Disponível em: <http://www.sbajovem.org/chase>. Acesso em: 27 abr. 2026.

#
#

## Tabela de versionamento

| Data       | Versão | Descrição              | Autores |
|------------|--------|-----------------------|--------|
| 27/04/2026 | 0.1    | Criação do documento  | Caio Bechepeche Mota |
|            |        |                       | Renato Rodrigues |