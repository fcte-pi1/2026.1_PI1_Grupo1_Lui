#pragma once

#include <cstdint>

#include "VL53L0X.h"
#include "driver/gpio.h"
#include "driver/i2c.h"

struct TofReadings {
  uint16_t frontal_mm = 0;
  uint16_t esquerdo_mm = 0;
  bool frontal_ok = false;
  bool esquerdo_ok = false;
  int took_ms = 0;
};

struct TofDistance {
  uint16_t mm = 0;
  bool ok = false;
  int took_ms = 0;
};

class TofSensors {
public:
  static constexpr i2c_port_t kI2cPort = I2C_NUM_0;
  static constexpr gpio_num_t kSdaPin = GPIO_NUM_21;
  static constexpr gpio_num_t kSclPin = GPIO_NUM_22;
  static constexpr gpio_num_t kFrontalXshutPin = GPIO_NUM_18;
  static constexpr gpio_num_t kEsquerdoXshutPin = GPIO_NUM_5;
  static constexpr uint8_t kFrontalAddress = 0x30;
  static constexpr uint8_t kEsquerdoAddress = 0x31;

  TofSensors();

  bool init();
  TofReadings getDistance();
  TofReadings read();
  TofDistance getDistanceFrontal();
  TofDistance getDistanceEsquerdo();
  void logar();

private:
  bool init_sensor(VL53L0X &sensor, const char *name, gpio_num_t xshut_pin,
                   uint8_t address);
  TofDistance read_sensor(VL53L0X &sensor);

  VL53L0X tof_frontal_;
  VL53L0X tof_esquerdo_;
};
