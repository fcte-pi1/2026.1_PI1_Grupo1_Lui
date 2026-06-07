#include "motors.h"

#include "esp_err.h"
#include "esp_log.h"

#include <inttypes.h>

namespace {
constexpr uint32_t kMaxDuty = 8191;
constexpr uint32_t kPwmFrequencyHz = 5000;
constexpr ledc_timer_bit_t kDutyResolution = LEDC_TIMER_13_BIT;
constexpr ledc_mode_t kLedcMode = LEDC_LOW_SPEED_MODE;
constexpr const char *TAG = "MOTORES";
}

Pinagem::Pinagem(gpio_num_t pin) : pin_(pin), state_(false) {
  ESP_ERROR_CHECK(gpio_reset_pin(pin_));
  ESP_ERROR_CHECK(gpio_set_direction(pin_, GPIO_MODE_OUTPUT));
  ESP_ERROR_CHECK(gpio_set_level(pin_, 0));
}

void Pinagem::on() {
  state_ = true;
  ESP_ERROR_CHECK(gpio_set_level(pin_, 1));
}

void Pinagem::off() {
  state_ = false;
  ESP_ERROR_CHECK(gpio_set_level(pin_, 0));
}

void Pinagem::toggle() {
  state_ = !state_;
  ESP_ERROR_CHECK(gpio_set_level(pin_, state_ ? 1 : 0));
}

Velocidade::Velocidade(gpio_num_t pin, ledc_channel_t channel,
                       ledc_timer_t timer)
    : channel_(channel), mode_(kLedcMode) {
  ledc_timer_config_t ledc_timer = {};
  ledc_timer.speed_mode = mode_;
  ledc_timer.timer_num = timer;
  ledc_timer.duty_resolution = kDutyResolution;
  ledc_timer.freq_hz = kPwmFrequencyHz;
  ledc_timer.clk_cfg = LEDC_AUTO_CLK;
  ESP_ERROR_CHECK(ledc_timer_config(&ledc_timer));

  ledc_channel_config_t ledc_channel = {};
  ledc_channel.speed_mode = mode_;
  ledc_channel.channel = channel_;
  ledc_channel.timer_sel = timer;
  ledc_channel.intr_type = LEDC_INTR_DISABLE;
  ledc_channel.gpio_num = pin;
  ledc_channel.duty = 0;
  ledc_channel.hpoint = 0;
  ESP_ERROR_CHECK(ledc_channel_config(&ledc_channel));
}

void Velocidade::setDuty(uint32_t duty) {
  if (duty > kMaxDuty) {
    duty = kMaxDuty;
  }

  ESP_ERROR_CHECK(ledc_set_duty(mode_, channel_, duty));
  ESP_ERROR_CHECK(ledc_update_duty(mode_, channel_));
}

Motores::Motores(gpio_num_t ain1_pin, gpio_num_t ain2_pin, gpio_num_t bin1_pin,
                 gpio_num_t bin2_pin, gpio_num_t pwma_pin, gpio_num_t pwmb_pin,
                 uint32_t velocidade_percentual)
    : vel_a_(pwma_pin, LEDC_CHANNEL_0, LEDC_TIMER_0),
      vel_b_(pwmb_pin, LEDC_CHANNEL_1, LEDC_TIMER_0), ain1_(ain1_pin),
      ain2_(ain2_pin), bin1_(bin1_pin), bin2_(bin2_pin), velocidade_duty_(0),
      velocidade_percentual_(0), estado_(EstadoMotores::Parado) {
  setVelocidade(velocidade_percentual);
  parar();
}

void Motores::paraFrente() {
  ain1_.on();
  ain2_.off();
  bin1_.on();
  bin2_.off();
  aplicarVelocidade();
  estado_ = EstadoMotores::Frente;
}

void Motores::paraTras() {
  ain1_.off();
  ain2_.on();
  bin1_.off();
  bin2_.on();
  aplicarVelocidade();
  estado_ = EstadoMotores::Tras;
}

void Motores::girarEsquerda() {
  ain1_.off();
  ain2_.on();
  bin1_.on();
  bin2_.off();
  aplicarVelocidade();
  estado_ = EstadoMotores::GirandoEsquerda;
}

void Motores::girarDireita() {
  ain1_.on();
  ain2_.off();
  bin1_.off();
  bin2_.on();
  aplicarVelocidade();
  estado_ = EstadoMotores::GirandoDireita;
}

void Motores::parar() {
  ain1_.off();
  ain2_.off();
  bin1_.off();
  bin2_.off();
  vel_a_.setDuty(0);
  vel_b_.setDuty(0);
  estado_ = EstadoMotores::Parado;
}

void Motores::setVelocidade(uint32_t velocidade_percentual) {
  if (velocidade_percentual > 100) {
    velocidade_percentual = 100;
  }

  velocidade_duty_ = (velocidade_percentual * kMaxDuty) / 100;
  velocidade_percentual_ = velocidade_percentual;
}

uint32_t Motores::getVelocidade() const {
  return velocidade_percentual_;
}

EstadoMotores Motores::getEstado() const {
  return estado_;
}

void Motores::logar() const {
  ESP_LOGI(TAG, "estado=%s, velocidade=%" PRIu32 "%%, duty=%" PRIu32,
           estadoToString(), velocidade_percentual_, velocidade_duty_);
}

void Motores::aplicarVelocidade() {
  vel_a_.setDuty(velocidade_duty_);
  vel_b_.setDuty(velocidade_duty_);
}

const char *Motores::estadoToString() const {
  switch (estado_) {
  case EstadoMotores::Parado:
    return "parado";
  case EstadoMotores::Frente:
    return "frente";
  case EstadoMotores::Tras:
    return "tras";
  case EstadoMotores::GirandoEsquerda:
    return "girar_esquerda";
  case EstadoMotores::GirandoDireita:
    return "girar_direita";
  }
  return "desconhecido";
}
