#include "ina219.h"

#include "driver/i2c.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

namespace {
constexpr const char *TAG = "INA219";
constexpr i2c_port_t kI2cPort = I2C_NUM_0;
constexpr uint8_t kAddress = 0x40;
constexpr uint8_t kRegConfig = 0x00;
constexpr uint8_t kRegShuntVoltage = 0x01;
constexpr uint8_t kRegBusVoltage = 0x02;
constexpr int kTimeoutMs = 1000;
}

bool Ina219::init() {
  uint16_t config = 0;
  esp_err_t err = read_register(kRegConfig, &config);
  if (err != ESP_OK) {
    ESP_LOGE(TAG, "INA219 nao respondeu em 0x%02X: %s", kAddress,
             esp_err_to_name(err));
    return false;
  }

  ESP_LOGI(TAG, "INA219 disponivel em 0x%02X, config=0x%04X", kAddress,
           config);
  return true;
}

Ina219Dados Ina219::getDados() {
  Ina219Dados readings;
  uint16_t bus_voltage_raw = 0;
  uint16_t shunt_voltage_raw = 0;

  esp_err_t bus_err = read_register(kRegBusVoltage, &bus_voltage_raw);
  readings.bus_ok = bus_err == ESP_OK;
  if (readings.bus_ok) {
    readings.bus_voltage_mv = ((bus_voltage_raw >> 3) * 4);
  } else {
    ESP_LOGE(TAG, "Falha ao ler tensao de barramento: %s",
             esp_err_to_name(bus_err));
  }

  esp_err_t shunt_err = read_register(kRegShuntVoltage, &shunt_voltage_raw);
  readings.shunt_ok = shunt_err == ESP_OK;
  if (readings.shunt_ok) {
    int16_t shunt_voltage_signed = static_cast<int16_t>(shunt_voltage_raw);
    readings.shunt_voltage_mv = shunt_voltage_signed * 0.01f;
  } else {
    ESP_LOGE(TAG, "Falha ao ler tensao de shunt: %s",
             esp_err_to_name(shunt_err));
  }

  return readings;
}

Ina219Dados Ina219::read() { return getDados(); }

void Ina219::logar() {
  Ina219Dados dados = getDados();
  ESP_LOGI(TAG, "barramento=%d mV (%.2f V, %s), shunt=%.2f mV (%s)",
           dados.bus_voltage_mv, dados.bus_voltage_mv / 1000.0f,
           dados.bus_ok ? "ok" : "falha", dados.shunt_voltage_mv,
           dados.shunt_ok ? "ok" : "falha");
}

esp_err_t Ina219::read_register(uint8_t reg_addr, uint16_t *data) const {
  uint8_t rx_data[2] = {};
  esp_err_t err = i2c_master_write_read_device(
      kI2cPort, kAddress, &reg_addr, 1, rx_data, sizeof(rx_data),
      pdMS_TO_TICKS(kTimeoutMs));
  if (err == ESP_OK) {
    *data = (static_cast<uint16_t>(rx_data[0]) << 8) | rx_data[1];
  }
  return err;
}
