# VL53L0X ToF com ESP-IDF

Projeto ESP-IDF para ler um sensor ToF VL53L0X via I2C.

Este projeto usa o componente `ESP32_VL53L0X` copiado do projeto `example`, porque ele implementa o acesso de registrador do VL53L0X com indice de 8 bits. Os exemplos genericos de sensores I2C do ESP-IDF costumam assumir registradores de 16 bits e nao servem diretamente para esse sensor.

## Ligacao padrao

| VL53L0X | ESP32 |
| --- | --- |
| VIN/VCC | 3V3 |
| GND | GND |
| SDA | GPIO21 |
| SCL | GPIO22 |
| XSHUT | opcional |

O endereco I2C padrao do VL53L0X e `0x29`.

Se voce conectou o pino `XSHUT`, edite `main/app_main.cpp` e troque:

```cpp
constexpr gpio_num_t kXshutPin = GPIO_NUM_MAX;
```

por exemplo:

```cpp
constexpr gpio_num_t kXshutPin = GPIO_NUM_18;
```

## Build e flash

```sh
cd /home/mauricio/esp/vl53l0x_tof
. ../esp-idf/export.sh
idf.py set-target esp32
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
```

Troque `/dev/ttyUSB0` pela porta serial da sua placa.
