#include "VL53L0X.h"

#include "driver/gpio.h"
#include "driver/i2c.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

namespace {
constexpr const char *TAG = "VL53L0X_TOF";

constexpr i2c_port_t kI2cPort = I2C_NUM_0;
constexpr gpio_num_t kSdaPin = GPIO_NUM_21;
constexpr gpio_num_t kSclPin = GPIO_NUM_22;
constexpr uint32_t kI2cFreqHz = 400000;

constexpr float kRegA = 0.9951f;
constexpr float kRegB_cm = 1.7475f;

constexpr float kFiltroAlpha = 0.5f;

float corrigirDistanciaMm(uint16_t distancia_raw_mm) {
    float distancia_raw_cm = static_cast<float>(distancia_raw_mm) / 10.0f;

    float distancia_corrigida_cm =
        (distancia_raw_cm - kRegB_cm) / kRegA;

    return distancia_corrigida_cm * 10.0f;
}

constexpr gpio_num_t kXshutPin = GPIO_NUM_MAX;

constexpr TickType_t kReadPeriod = pdMS_TO_TICKS(200);

void halt_task() {
  while (true) {
    vTaskDelay(portMAX_DELAY);
  }
}
}  // namespace

extern "C" void app_main(void) {
  ESP_LOGI(TAG, "Inicializando VL53L0X em I2C%d SDA=%d SCL=%d",
           static_cast<int>(kI2cPort), static_cast<int>(kSdaPin),
           static_cast<int>(kSclPin));

  VL53L0X tof(kI2cPort, kXshutPin);
  tof.i2cMasterInit(kSdaPin, kSclPin, kI2cFreqHz);

  if (!tof.init()) {
    ESP_LOGE(TAG, "Falha ao inicializar VL53L0X no endereco padrao 0x29");
    halt_task();
  }

  ESP_LOGI(TAG, "VL53L0X pronto. Iniciando leituras.");
/*
  while (true) {
    uint16_t distance_mm = 0;
    TickType_t start_tick = xTaskGetTickCount();
    bool ok = tof.read(&distance_mm);
    TickType_t end_tick = xTaskGetTickCount();
    int took_ms = static_cast<int>((end_tick - start_tick) * portTICK_PERIOD_MS);

    if (ok) {
      ESP_LOGI(TAG, "distancia=%u mm leitura=%d ms", (static_cast<float>(distance_mm)-1.7475)/0.9951, took_ms);
    } else {
      ESP_LOGE(TAG, "falha na leitura leitura=%d ms", took_ms);
    }

    vTaskDelay(kReadPeriod);
  }
*/

float distancia_filtrada_mm = 0.0f;
bool filtro_iniciado = false;

while (true) {
    uint16_t distance_mm = 0;

    TickType_t start_tick = xTaskGetTickCount();
    bool ok = tof.read(&distance_mm);
    TickType_t end_tick = xTaskGetTickCount();

    int took_ms = static_cast<int>((end_tick - start_tick) * portTICK_PERIOD_MS);

    if (ok) {
        float distancia_corrigida_mm = corrigirDistanciaMm(distance_mm);

        if (!filtro_iniciado) {
            distancia_filtrada_mm = distancia_corrigida_mm;
            filtro_iniciado = true;
        } else {
            distancia_filtrada_mm =
                (1.0f - kFiltroAlpha) * distancia_filtrada_mm +
                kFiltroAlpha * distancia_corrigida_mm;
        }

        ESP_LOGI(TAG,
                 "raw=%u mm corrigida=%.2f mm filtrada=%.2f mm leitura=%d ms",
                 distance_mm,
                 distancia_corrigida_mm,
                 distancia_filtrada_mm,
                 took_ms);
    } else {
        ESP_LOGE(TAG, "falha na leitura leitura=%d ms", took_ms);
    }

    vTaskDelay(kReadPeriod);
}



}
