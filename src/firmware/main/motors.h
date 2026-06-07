#pragma once

#include <cstdint>

#include "driver/gpio.h"
#include "driver/ledc.h"

namespace motor_pins {
static constexpr gpio_num_t kAin1 = GPIO_NUM_25;
static constexpr gpio_num_t kAin2 = GPIO_NUM_26;
static constexpr gpio_num_t kBin1 = GPIO_NUM_17;
static constexpr gpio_num_t kBin2 = GPIO_NUM_32;
static constexpr gpio_num_t kPwma = GPIO_NUM_27;
static constexpr gpio_num_t kPwmb = GPIO_NUM_33;
}

enum class EstadoMotores {
  Parado,
  Frente,
  Tras,
  GirandoEsquerda,
  GirandoDireita,
};

class Pinagem {
public:
  explicit Pinagem(gpio_num_t pin);

  void on();
  void off();
  void toggle();

private:
  gpio_num_t pin_;
  bool state_;
};

class Velocidade {
public:
  Velocidade(gpio_num_t pin, ledc_channel_t channel, ledc_timer_t timer);

  void setDuty(uint32_t duty);

private:
  ledc_channel_t channel_;
  ledc_mode_t mode_;
};

class Motores {
public:
  Motores(gpio_num_t ain1_pin, gpio_num_t ain2_pin, gpio_num_t bin1_pin,
          gpio_num_t bin2_pin, gpio_num_t pwma_pin, gpio_num_t pwmb_pin,
          uint32_t velocidade_percentual);

  void paraFrente();
  void paraTras();
  void girarEsquerda();
  void girarDireita();
  void parar();
  void setVelocidade(uint32_t velocidade_percentual);
  uint32_t getVelocidade() const;
  EstadoMotores getEstado() const;
  void logar() const;

private:
  void aplicarVelocidade();
  const char *estadoToString() const;

  Velocidade vel_a_;
  Velocidade vel_b_;
  Pinagem ain1_;
  Pinagem ain2_;
  Pinagem bin1_;
  Pinagem bin2_;
  uint32_t velocidade_duty_;
  uint32_t velocidade_percentual_;
  EstadoMotores estado_;
};
