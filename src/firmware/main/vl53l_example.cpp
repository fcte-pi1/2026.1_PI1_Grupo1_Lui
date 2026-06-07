#include "driver/gpio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "VL53L0X.h"

#define TAG "VL53L0X example"

#define I2C_PORT I2C_NUM_0
#define PIN_SDA GPIO_NUM_21
#define PIN_SCL GPIO_NUM_22
#define TOF_FRONTAL_ADDRESS 0x30
#define TOF_ESQUERDO_ADDRESS 0x31
#define PIN_TOF_FRONTAL_XSHUT GPIO_NUM_18
#define PIN_TOF_ESQUERDO_XSHUT GPIO_NUM_5

static void halt_on_error() {
  while (true) {
    vTaskDelay(portMAX_DELAY);
  }
}

static void init_tof(VL53L0X &tof, const char *name, gpio_num_t xshut_pin,
                     uint8_t address) {
  gpio_set_level(xshut_pin, 1);
  vTaskDelay(pdMS_TO_TICKS(10));

  if (!tof.init()) {
    ESP_LOGE(TAG, "Failed to initialize %s at default address 0x29", name);
    halt_on_error();
  }

  if (!tof.setDeviceAddress(address)) {
    ESP_LOGE(TAG, "Failed to move %s to address 0x%02X", name, address);
    halt_on_error();
  }

  ESP_LOGI(TAG, "%s initialized at address 0x%02X", name, address);
}

extern "C" void app_main(void) {
  ESP_LOGI(TAG, "Starting VL53L0X example!");

  VL53L0X tof_frontal(I2C_PORT, PIN_TOF_FRONTAL_XSHUT);
  VL53L0X tof_esquerdo(I2C_PORT, PIN_TOF_ESQUERDO_XSHUT);

  tof_frontal.i2cMasterInit(PIN_SDA, PIN_SCL);

  gpio_set_direction(PIN_TOF_FRONTAL_XSHUT, GPIO_MODE_OUTPUT);
  gpio_set_direction(PIN_TOF_ESQUERDO_XSHUT, GPIO_MODE_OUTPUT);
  gpio_set_level(PIN_TOF_FRONTAL_XSHUT, 0);
  gpio_set_level(PIN_TOF_ESQUERDO_XSHUT, 0);
  vTaskDelay(pdMS_TO_TICKS(10));

  init_tof(tof_frontal, "TOF frontal", PIN_TOF_FRONTAL_XSHUT, TOF_FRONTAL_ADDRESS);
  init_tof(tof_esquerdo, "TOF esquerdo", PIN_TOF_ESQUERDO_XSHUT, TOF_ESQUERDO_ADDRESS);

  ESP_LOGI(TAG, "VL53L0X sensors initialized! Starting reading...");

  while (true) {
    uint16_t frontal_mm = 0;
    uint16_t esquerdo_mm = 0;
    TickType_t tick_start = xTaskGetTickCount();

    bool frontal_ok = tof_frontal.read(&frontal_mm);
    bool esquerdo_ok = tof_esquerdo.read(&esquerdo_mm);

    TickType_t tick_end = xTaskGetTickCount();
    int took_ms = ((int)tick_end - tick_start) / portTICK_PERIOD_MS;

    if (frontal_ok && esquerdo_ok) {
      ESP_LOGI(TAG, "TOF frontal: %d mm | TOF esquerdo: %d mm (took %d ms)",
               (int)frontal_mm, (int)esquerdo_mm, took_ms);
    } else {
      ESP_LOGE(TAG, "Failed to measure: frontal=%s esquerdo=%s (took %d ms)",
               frontal_ok ? "ok" : "fail", esquerdo_ok ? "ok" : "fail", took_ms);
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}
