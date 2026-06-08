#include "encoder_motor.h"

#include "esp_err.h"

EncoderMotor::EncoderMotor(gpio_num_t c1_pin, gpio_num_t c2_pin)
    : _unit(nullptr), _canalC1(nullptr), _canalC2(nullptr), _rodando(false) {
  pcnt_unit_config_t unit_config = {};
  unit_config.low_limit = LIMITE_INFERIOR;
  unit_config.high_limit = LIMITE_SUPERIOR;
  unit_config.flags.accum_count = true;
  ESP_ERROR_CHECK(pcnt_new_unit(&unit_config, &_unit));

  pcnt_glitch_filter_config_t filter_config = {};
  filter_config.max_glitch_ns = FILTRO_GLITCH_NS;
  ESP_ERROR_CHECK(pcnt_unit_set_glitch_filter(_unit, &filter_config));

  pcnt_chan_config_t canal_c1_config = {};
  canal_c1_config.edge_gpio_num = c1_pin;
  canal_c1_config.level_gpio_num = c2_pin;
  ESP_ERROR_CHECK(pcnt_new_channel(_unit, &canal_c1_config, &_canalC1));

  pcnt_chan_config_t canal_c2_config = {};
  canal_c2_config.edge_gpio_num = c2_pin;
  canal_c2_config.level_gpio_num = c1_pin;
  ESP_ERROR_CHECK(pcnt_new_channel(_unit, &canal_c2_config, &_canalC2));

  ESP_ERROR_CHECK(pcnt_channel_set_edge_action(
      _canalC1, PCNT_CHANNEL_EDGE_ACTION_DECREASE,
      PCNT_CHANNEL_EDGE_ACTION_INCREASE));
  ESP_ERROR_CHECK(pcnt_channel_set_level_action(
      _canalC1, PCNT_CHANNEL_LEVEL_ACTION_KEEP,
      PCNT_CHANNEL_LEVEL_ACTION_INVERSE));

  ESP_ERROR_CHECK(pcnt_channel_set_edge_action(
      _canalC2, PCNT_CHANNEL_EDGE_ACTION_INCREASE,
      PCNT_CHANNEL_EDGE_ACTION_DECREASE));
  ESP_ERROR_CHECK(pcnt_channel_set_level_action(
      _canalC2, PCNT_CHANNEL_LEVEL_ACTION_KEEP,
      PCNT_CHANNEL_LEVEL_ACTION_INVERSE));

  ESP_ERROR_CHECK(pcnt_unit_add_watch_point(_unit, LIMITE_INFERIOR));
  ESP_ERROR_CHECK(pcnt_unit_add_watch_point(_unit, LIMITE_SUPERIOR));

  ESP_ERROR_CHECK(pcnt_unit_enable(_unit));
  zerar();
  iniciar();
}

void EncoderMotor::iniciar() {
  if (!_rodando) {
    ESP_ERROR_CHECK(pcnt_unit_start(_unit));
    _rodando = true;
  }
}

void EncoderMotor::parar() {
  if (_rodando) {
    ESP_ERROR_CHECK(pcnt_unit_stop(_unit));
    _rodando = false;
  }
}

void EncoderMotor::zerar() { ESP_ERROR_CHECK(pcnt_unit_clear_count(_unit)); }

int EncoderMotor::getPulsos() const {
  int pulsos = 0;
  ESP_ERROR_CHECK(pcnt_unit_get_count(_unit, &pulsos));
  return pulsos;
}
