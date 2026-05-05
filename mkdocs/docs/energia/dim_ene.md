# Dimensionamento Energético

Este documento apresenta o dimensionamento energético do sistema embarcado do MicroMouse, considerando os componentes eletrônicos utilizados, o tempo estimado de operação e a escolha da fonte de alimentação. O procedimento segue o passo a passo definido no documento de [requisitos](requisitos.md).

## 1. Parâmetros considerados

Para o dimensionamento, considera-se o uso do sistema durante **18 minutos**, no qual foi considerado 2 minutos para o máximo de tentativas possíveis durante a prova, equivalente a:

```text
18 min = 1080 s
```

Também foi considerada uma margem de segurança de **30%** sobre o consumo total estimado, a fim de reduzir o risco de subdimensionamento da bateria.

## 2. Levantamento dos componentes

A tabela a seguir apresenta os principais componentes eletrônicos considerados no cálculo energético do sistema.

| Componente | Quantidade | Tensão nominal (V) | Corrente considerada (A) | Tempo de uso (s) |
| :--- | :---: | :---: | :---: | :---: |
| ESP WROOM-32 / ESP32 DevKit V1 | 1 | 5 | 0,08 a 0,5 | 1080 |
| Motor GA-12 N20 DC com encoder | 2 | 6 | 0,08 a 1,6 | 1080 |
| Sensor Time-of-Flight (ToF) VL53L0X | 3 | 2,8 | 0,02 | 1080 |
| Sensor INA219 | 1 | 3,3 | 0,001 | 1080 |

> **Observação sobre a Ponte H TB6612FNG:** a Ponte H não foi contabilizada diretamente no dimensionamento energético porque atua como intermediária no acionamento dos motores. Assim, o consumo dos motores GA-12 N20 já representa a maior parte da corrente que passa por ela. O consumo próprio da lógica interna da TB6612FNG é muito pequeno em relação ao consumo total do sistema e, por isso, foi considerado desprezível para este cálculo.

### Fontes consultadas

- [ESP32 DevKit V1 — Loja Proesi](http://proesi.com.br/esp-wroom-32-wifi-e-bluetooth-nodemcu-30-pinos?srsltid=AfmBOoq72uGj-iJ3DbQ0UXDL1XKrHqPkycK8cyUHV7vH90ZI_wP3az0Y)
- [ESP32 DevKit V1 — Loja Saravati](https://www.saravati.com.br/placa-esp32-wifi-bluetooth-devkit-v1-30-pinos.html)
- [Motor GA12-N20 — Datasheet Handsontec](https://www.handsontec.com/dataspecs/motor_fan/GA12-N20.pdf)
- [Sensor ToF VL53L0X — AliExpress](https://pt.aliexpress.com/item/1005007436787520.html)
- [Sensor ToF VL53L0X — Mercado Livre](https://www.mercadolivre.com.br/sensor-de-distancia-laser-vl53l0x-timeofflight-gyvl53l0xv2/up/MLBU1459478080)
- [Sensor ToF VL53L0X — Mercado Livre 2](https://www.mercadolivre.com.br/sensor-de-distancia-laser-tof-vl53l0x-i2c-02m-alta-precisao/up/MLBU1752412476)

## 3. Cálculo da energia consumida por componente

A energia consumida por cada componente foi calculada por meio da seguinte fórmula:

```text
E = V × I × t
```

Onde:

- `E` é a energia consumida, em joules (J);
- `V` é a tensão de operação, em volts (V);
- `I` é a corrente elétrica, em ampères (A);
- `t` é o tempo de uso, em segundos (s).

Para converter joules para watt-hora, foi utilizada a relação:

```text
1 Wh = 3600 J
```

### Consumo individual em 18 minutos

| Componente | Equação | Energia (J) | Energia (Wh) |
| :--- | :--- | ---: | ---: |
| ESP WROOM-32 / ESP32 DevKit V1 | `E = 5 × 0,5 × 1080` | 2700 | 0,75 |
| Motor GA-12 N20 DC com encoder | `E = 6 × 1,6 × 1080` | 10368 | 2,88 |
| Sensor ToF VL53L0X | `E = 2,8 × 0,02 × 1080` | 60,48 | 0,0168 |
| Sensor INA219 | `E = 3,3 × 0,001 × 1080` | 3,564 | 0,001 |

## 4. Consumo total de energia

Para obter o consumo total, o consumo individual de cada componente foi multiplicado pela respectiva quantidade utilizada no sistema.

| Componente | Quantidade | Consumo individual (Wh) | Consumo total (Wh) |
| :--- | :---: | ---: | ---: |
| ESP WROOM-32 / ESP32 DevKit V1 | 1 | 0,75 | 0,75 |
| Motor GA-12 N20 DC com encoder | 2 | 2,88 | 5,76 |
| Sensor ToF VL53L0X | 3 | 0,0168 | 0,0504 |
| Sensor INA219 | 1 | 0,001 | 0,001 |
| **Total final** | — | — | **6,5614 Wh** |

Portanto, o consumo total estimado para **18 minutos de operação** é de aproximadamente:

```text
E_total = 6,56 Wh
```

Aplicando uma margem de segurança de **30%**:

```text
E_com_folga = 6,56 × 1,30
E_com_folga = 8,53 Wh
```

Assim, a fonte de alimentação deve ser dimensionada para fornecer, no mínimo, aproximadamente **8,53 Wh**.

## 5. Escolha da fonte de alimentação

Para escolher a fonte de alimentação do sistema, foi utilizada a relação entre energia, tensão e capacidade:

```text
Capacidade = E / V
```

Onde:

- `Capacidade` é a capacidade mínima da bateria, em ampère-hora (Ah);
- `E` é a energia necessária, em watt-hora (Wh);
- `V` é a tensão da bateria, em volts (V).

### Capacidade mínima sem considerar profundidade de descarga

Considerando a energia com folga de **8,53 Wh**, temos:

| Tensão da bateria | Cálculo | Capacidade mínima |
| :---: | :--- | ---: |
| 7,4 V | `8,53 / 7,4` | 1,16 Ah |
| 12 V | `8,53 / 12` | 0,71 Ah |

## 6. Consideração da capacidade útil da bateria

Ao dimensionar a bateria, recomenda-se considerar apenas parte da capacidade nominal como capacidade útil, evitando descargas excessivas e preservando a vida útil da bateria.

Neste projeto, foram adotados os seguintes valores:

- **Bateria Li-Ion:** 80% de capacidade útil;
- **Bateria LiPo:** 70% de capacidade útil.

### Capacidade mínima corrigida

| Tipo de bateria | 7,4 V | 12 V |
| :--- | ---: | ---: |
| Li-Ion | `1,16 / 0,8 = 1,46 Ah` | `0,71 / 0,8 = 0,89 Ah` |
| LiPo | `1,16 / 0,7 = 1,66 Ah` | `0,71 / 0,7 = 1,01 Ah` |


| Versão | Descrição                                  | Autor                                                 | Revisor                                               |
| ------ | ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| `1.0`  | Adição dos cálculos para o dimensionamento energético     | [Júlia Fortunato](https://github.com/julia-fortunato) e  [Ana Luiza Soares](https://github.com/Ana-Luiza-SC) | [Ian guimarães](https://github.com/iancostag)   |