#include "ina219.hpp"

#include <cstdint>

#include "driver/i2c.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"

namespace {
constexpr const char *TAG = "INA219";

constexpr i2c_port_t kI2cPort = I2C_NUM_0;
constexpr uint8_t kIna219Address = 0x40;
constexpr uint8_t kConfigRegister = 0x00;
constexpr uint8_t kShuntVoltageRegister = 0x01;
constexpr uint8_t kBusVoltageRegister = 0x02;

// 32 V range, +/-320 mV shunt range, 12-bit ADCs, shunt+bus continuous mode.
constexpr uint16_t kConfigValue = 0x399f;
constexpr TickType_t kI2cTimeout = pdMS_TO_TICKS(100);

esp_err_t write_register(uint8_t reg_addr, uint16_t data) {
    const uint8_t write_buffer[] = {
        reg_addr,
        static_cast<uint8_t>(data >> 8),
        static_cast<uint8_t>(data & 0xff),
    };

    return i2c_master_write_to_device(kI2cPort,
                                      kIna219Address,
                                      write_buffer,
                                      sizeof(write_buffer),
                                      kI2cTimeout);
}
}  // namespace

bool Ina219::init() {
    const esp_err_t err = write_register(kConfigRegister, kConfigValue);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Falha ao configurar INA219: %s", esp_err_to_name(err));
        return false;
    }

    ESP_LOGI(TAG, "INA219 configurado no endereco 0x%02x", kIna219Address);
    return true;
}

Ina219Dados Ina219::getDados() {
    Ina219Dados dados;
    uint16_t raw = 0;

    esp_err_t err = read_register(kBusVoltageRegister, &raw);
    if (err == ESP_OK) {
        dados.bus_voltage_mv = static_cast<int>((raw >> 3) * 4);
        dados.bus_ok = true;
    } else {
        ESP_LOGW(TAG, "Falha ao ler tensao do barramento: %s", esp_err_to_name(err));
    }

    err = read_register(kShuntVoltageRegister, &raw);
    if (err == ESP_OK) {
        dados.shunt_voltage_mv = static_cast<int16_t>(raw) * 0.01f;
        dados.shunt_ok = true;
    } else {
        ESP_LOGW(TAG, "Falha ao ler tensao do shunt: %s", esp_err_to_name(err));
    }

    return dados;
}

Ina219Dados Ina219::read() {
    return getDados();
}

void Ina219::logar() {
    const Ina219Dados dados = getDados();

    ESP_LOGI(TAG,
             "bus=%d mV (%s), shunt=%.2f mV (%s)",
             dados.bus_voltage_mv,
             dados.bus_ok ? "ok" : "erro",
             static_cast<double>(dados.shunt_voltage_mv),
             dados.shunt_ok ? "ok" : "erro");
}

esp_err_t Ina219::read_register(uint8_t reg_addr, uint16_t *data) const {
    if (data == nullptr) {
        return ESP_ERR_INVALID_ARG;
    }

    uint8_t read_buffer[2] = {};
    const esp_err_t err = i2c_master_write_read_device(kI2cPort,
                                                       kIna219Address,
                                                       &reg_addr,
                                                       sizeof(reg_addr),
                                                       read_buffer,
                                                       sizeof(read_buffer),
                                                       kI2cTimeout);
    if (err != ESP_OK) {
        return err;
    }

    *data = (static_cast<uint16_t>(read_buffer[0]) << 8) | read_buffer[1];
    return ESP_OK;
}
