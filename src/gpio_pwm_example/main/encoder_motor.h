#pragma once

#include "driver/gpio.h"
#include "driver/pulse_cnt.h"

class EncoderMotor {
private:
  static constexpr int LIMITE_INFERIOR = -32768;
  static constexpr int LIMITE_SUPERIOR = 32767;
  static constexpr uint32_t FILTRO_GLITCH_NS = 1000;

  pcnt_unit_handle_t _unit;
  pcnt_channel_handle_t _canalC1;
  pcnt_channel_handle_t _canalC2;
  bool _rodando;

public:
  EncoderMotor(gpio_num_t c1_pin, gpio_num_t c2_pin);

  void iniciar();
  void parar();
  void zerar();
  int getPulsos() const;
};
