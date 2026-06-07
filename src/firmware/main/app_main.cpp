#include "ina219.h"
#include "motors.h"
#include "tof_sensors.h"

#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

namespace {
constexpr const char *TAG = "APP";
constexpr TickType_t kLogPeriod = pdMS_TO_TICKS(1000);
constexpr uint32_t kMotorSpeedPercent = 60;
}

extern "C" void app_main(void) {

  Motores motors(motor_pins::kAin1, motor_pins::kAin2, motor_pins::kBin1,
                 motor_pins::kBin2, motor_pins::kPwma, motor_pins::kPwmb,
                 kMotorSpeedPercent);
  motors.parar();
  motors.logar();

  TofSensors tof;
  bool tof_ok = tof.init();
  if (!tof_ok) {
    ESP_LOGE(TAG, "Falha ao inicializar sensores ToF");
  }

  Ina219 ina;
  bool ina_ok = ina.init();
  if (!ina_ok) {
    ESP_LOGE(TAG, "Falha ao inicializar INA219");
  }

  while (true) {
    if (tof_ok) {
      tof.logar();
    }

    if (ina_ok) {
      ina.logar();
    }

    motors.paraFrente();
    motors.logar();
    vTaskDelay(kLogPeriod);
  }
}
