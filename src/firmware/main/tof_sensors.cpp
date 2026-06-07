#include "tof_sensors.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

namespace {
constexpr const char *TAG = "TOF";
}

TofSensors::TofSensors()
    : tof_frontal_(kI2cPort, kFrontalXshutPin),
      tof_esquerdo_(kI2cPort, kEsquerdoXshutPin) {}

bool TofSensors::init() {
  ESP_LOGI(TAG, "Inicializando barramento I2C em SDA=%d SCL=%d",
           static_cast<int>(kSdaPin), static_cast<int>(kSclPin));
  tof_frontal_.i2cMasterInit(kSdaPin, kSclPin);

  ESP_ERROR_CHECK(gpio_set_direction(kFrontalXshutPin, GPIO_MODE_OUTPUT));
  ESP_ERROR_CHECK(gpio_set_direction(kEsquerdoXshutPin, GPIO_MODE_OUTPUT));
  ESP_ERROR_CHECK(gpio_set_level(kFrontalXshutPin, 0));
  ESP_ERROR_CHECK(gpio_set_level(kEsquerdoXshutPin, 0));
  vTaskDelay(pdMS_TO_TICKS(10));

  if (!init_sensor(tof_frontal_, "TOF frontal", kFrontalXshutPin,
                   kFrontalAddress)) {
    return false;
  }

  if (!init_sensor(tof_esquerdo_, "TOF esquerdo", kEsquerdoXshutPin,
                   kEsquerdoAddress)) {
    return false;
  }

  ESP_LOGI(TAG, "Sensores VL53L0X prontos");
  return true;
}

TofReadings TofSensors::getDistance() {
  TofReadings readings;
  TickType_t tick_start = xTaskGetTickCount();

  readings.frontal_ok = tof_frontal_.read(&readings.frontal_mm);
  readings.esquerdo_ok = tof_esquerdo_.read(&readings.esquerdo_mm);

  TickType_t tick_end = xTaskGetTickCount();
  readings.took_ms = static_cast<int>((tick_end - tick_start) * portTICK_PERIOD_MS);
  return readings;
}

TofReadings TofSensors::read() { return getDistance(); }

TofDistance TofSensors::getDistanceFrontal() {
  return read_sensor(tof_frontal_);
}

TofDistance TofSensors::getDistanceEsquerdo() {
  return read_sensor(tof_esquerdo_);
}

void TofSensors::logar() {
  TofReadings readings = getDistance();
  ESP_LOGI(TAG, "frontal=%u mm (%s), esquerdo=%u mm (%s), leitura=%d ms",
           readings.frontal_mm, readings.frontal_ok ? "ok" : "falha",
           readings.esquerdo_mm, readings.esquerdo_ok ? "ok" : "falha",
           readings.took_ms);
}

bool TofSensors::init_sensor(VL53L0X &sensor, const char *name,
                             gpio_num_t xshut_pin, uint8_t address) {
  ESP_ERROR_CHECK(gpio_set_level(xshut_pin, 1));
  vTaskDelay(pdMS_TO_TICKS(10));

  if (!sensor.init()) {
    ESP_LOGE(TAG, "Falha ao inicializar %s no endereco padrao 0x29", name);
    return false;
  }

  if (!sensor.setDeviceAddress(address)) {
    ESP_LOGE(TAG, "Falha ao mover %s para o endereco 0x%02X", name, address);
    return false;
  }

  ESP_LOGI(TAG, "%s inicializado em 0x%02X", name, address);
  return true;
}

TofDistance TofSensors::read_sensor(VL53L0X &sensor) {
  TofDistance distance;
  TickType_t tick_start = xTaskGetTickCount();

  distance.ok = sensor.read(&distance.mm);

  TickType_t tick_end = xTaskGetTickCount();
  distance.took_ms =
      static_cast<int>((tick_end - tick_start) * portTICK_PERIOD_MS);
  return distance;
}
