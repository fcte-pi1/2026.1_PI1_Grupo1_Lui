#include "encoder_motor.h"
#include "driver/gpio.h"
#include "driver/ledc.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <stdio.h>

class Pinagem {
private:
  gpio_num_t _pin;
  bool _state;

public:
  Pinagem(gpio_num_t pin) : _pin(pin), _state(false) {
    gpio_reset_pin(_pin);
    gpio_set_direction(_pin, GPIO_MODE_OUTPUT);
    gpio_set_level(_pin, 0);
  }

  void on() {
    _state = true;
    gpio_set_level(_pin, 1);
  }

  void off() {
    _state = false;
    gpio_set_level(_pin, 0);
  }

  void toggle() {
    _state = !_state;
    gpio_set_level(_pin, _state ? 1 : 0);
  }
};

class Velocidade {
private:
  ledc_channel_t _channel;
  ledc_mode_t _mode;

public:
  Velocidade(gpio_num_t pin, ledc_channel_t channel, ledc_timer_t timer) {
    _channel = channel;
    _mode = LEDC_LOW_SPEED_MODE;

    ledc_timer_config_t ledc_timer = {};
    ledc_timer.speed_mode = _mode;
    ledc_timer.timer_num = timer;
    ledc_timer.duty_resolution = LEDC_TIMER_13_BIT;
    ledc_timer.freq_hz = 5000;
    ledc_timer.clk_cfg = LEDC_AUTO_CLK;
    ledc_timer_config(&ledc_timer);

    ledc_channel_config_t ledc_channel = {};
    ledc_channel.speed_mode = _mode;
    ledc_channel.channel = _channel;
    ledc_channel.timer_sel = timer;
    ledc_channel.intr_type = LEDC_INTR_DISABLE;
    ledc_channel.gpio_num = pin;
    ledc_channel.duty = 0;
    ledc_channel.hpoint = 0;
    ledc_channel_config(&ledc_channel);
  }

  void setVelocidade(uint32_t duty) {
    if (duty > 8191) {
      duty = 8191;
    }

    ledc_set_duty(_mode, _channel, duty);
    ledc_update_duty(_mode, _channel);
  }
};

class Motores {
private:
  Velocidade velA;
  Velocidade velB;

  Pinagem AIN1;
  Pinagem AIN2;
  Pinagem BIN1;
  Pinagem BIN2;

  uint32_t _velocidade;

public:
  Motores(gpio_num_t AIN1_pin, gpio_num_t AIN2_pin, gpio_num_t BIN1_pin,
          gpio_num_t BIN2_pin, gpio_num_t PWMA_pin, gpio_num_t PWMB_pin,
          int velocidade_percentual)
      : velA(PWMA_pin, LEDC_CHANNEL_0, LEDC_TIMER_0),
        velB(PWMB_pin, LEDC_CHANNEL_1, LEDC_TIMER_0), AIN1(AIN1_pin),
        AIN2(AIN2_pin), BIN1(BIN1_pin), BIN2(BIN2_pin), _velocidade(0) {
    setVelocidade(velocidade_percentual);
  }

  void aplicarVelocidade() {
    velA.setVelocidade(_velocidade);
    velB.setVelocidade(_velocidade);
  }

  void paraFrente() {
    AIN1.on();
    AIN2.off();

    BIN1.on();
    BIN2.off();

    aplicarVelocidade();
  }

  void paraTras() {
    AIN1.off();
    AIN2.on();

    BIN1.off();
    BIN2.on();

    aplicarVelocidade();
  }

  void girarEsquerda() {
    AIN1.off();
    AIN2.on();

    BIN1.on();
    BIN2.off();

    aplicarVelocidade();
  }

  void girarDireita() {
    AIN1.on();
    AIN2.off();

    BIN1.off();
    BIN2.on();

    aplicarVelocidade();
  }

  void parar() {
    AIN1.off();
    AIN2.off();

    BIN1.off();
    BIN2.off();

    velA.setVelocidade(0);
    velB.setVelocidade(0);
  }

  void setVelocidade(int vel) {
    if (vel > 100) {
      vel = 100;
    }
    if (vel < 0) {
      vel = 0;
    }

    _velocidade = (vel * 8191) / 100;
  }
};

extern "C" void app_main(void) {
  printf("Iniciando controle dos motores\n");

  Motores carro(
      GPIO_NUM_25, // AIN1
      GPIO_NUM_26, // AIN2
      GPIO_NUM_35, // BIN1
      GPIO_NUM_32, // BIN2
      GPIO_NUM_27, // PWMA
      GPIO_NUM_33,  // PWMB
      100         // velocidade em porcentagem
  );
  EncoderMotor encoderMotorA(
      GPIO_NUM_17, // C1 do encoder do motor A
      GPIO_NUM_16  // C2 do encoder do motor A
  );

  carro.girarDireita();

  while (true) {
    printf("Encoder motor A: %d pulsos\n", encoderMotorA.getPulsos());
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}
