#pragma once

#include <cstdint>

#include "esp_err.h"

struct Ina219Dados {
  int bus_voltage_mv = 0;
  float shunt_voltage_mv = 0.0f;
  bool bus_ok = false;
  bool shunt_ok = false;
};

using Ina219Readings = Ina219Dados;

class Ina219 {
public:
  bool init();
  Ina219Dados getDados();
  Ina219Dados read();
  void logar();

private:
  esp_err_t read_register(uint8_t reg_addr, uint16_t *data) const;
};
