#include "tof_sensor.hpp"

#include "VL53L0X.h"

#include <cstdint>

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
constexpr gpio_num_t kXshutPin = GPIO_NUM_MAX;

constexpr float kRegA = 0.9951f;
constexpr float kRegB_cm = 17.475f;
constexpr float kFiltroAlpha = 0.9f;

constexpr TickType_t kReadPeriod = pdMS_TO_TICKS(200);

portMUX_TYPE latest_distance_lock = portMUX_INITIALIZER_UNLOCKED;
int latest_distance_mm = -1;
bool latest_distance_valid = false;

float corrigir_distancia_mm(uint16_t distancia_raw_mm) {
    const float distancia_corrigida_cm = (distancia_raw_mm - kRegB_cm) / kRegA;

    return distancia_corrigida_cm;
}

void atualizar_distancia_filtrada(float distancia_filtrada_mm) {
    const float rounded = distancia_filtrada_mm >= 0.0f
                              ? distancia_filtrada_mm + 0.5f
                              : distancia_filtrada_mm - 0.5f;

    portENTER_CRITICAL(&latest_distance_lock);
    latest_distance_mm = static_cast<int>(rounded);
    latest_distance_valid = true;
    portEXIT_CRITICAL(&latest_distance_lock);
}

void halt_task() {
    while (true) {
        vTaskDelay(portMAX_DELAY);
    }
}
}  // namespace

bool tof_get_latest_distance_mm(int *distancia_mm) {
    if (distancia_mm == nullptr) {
        return false;
    }

    portENTER_CRITICAL(&latest_distance_lock);
    const bool valid = latest_distance_valid;
    const int distance = latest_distance_mm;
    portEXIT_CRITICAL(&latest_distance_lock);

    if (!valid) {
        return false;
    }

    *distancia_mm = distance;
    return true;
}

void ToFTask(void *parametrospv) {
    (void)parametrospv;

    ESP_LOGI(TAG, "Inicializando VL53L0X em I2C%d SDA=%d SCL=%d",
             static_cast<int>(kI2cPort),
             static_cast<int>(kSdaPin),
             static_cast<int>(kSclPin));

    VL53L0X tof(kI2cPort, kXshutPin);
    tof.i2cMasterInit(kSdaPin, kSclPin, kI2cFreqHz);

    if (!tof.init()) {
        ESP_LOGE(TAG, "Falha ao inicializar VL53L0X no endereco padrao 0x29");
        halt_task();
    }

    ESP_LOGI(TAG, "VL53L0X pronto. Iniciando leituras.");

    float distancia_filtrada_mm = 0.0f;
    bool filtro_iniciado = false;

    while (true) {
        uint16_t distance_mm = 0;

        const TickType_t start_tick = xTaskGetTickCount();
        const bool ok = tof.read(&distance_mm);
        const TickType_t end_tick = xTaskGetTickCount();
        const int took_ms = static_cast<int>((end_tick - start_tick) * portTICK_PERIOD_MS);

        if (ok) {
            const float distancia_corrigida_mm = corrigir_distancia_mm(distance_mm);

            if (!filtro_iniciado) {
                distancia_filtrada_mm = distancia_corrigida_mm;
                filtro_iniciado = true;
            } else {
                distancia_filtrada_mm =
                    (1.0f - kFiltroAlpha) * distancia_filtrada_mm +
                    kFiltroAlpha * distancia_corrigida_mm;
            }

            atualizar_distancia_filtrada(distancia_filtrada_mm);

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
