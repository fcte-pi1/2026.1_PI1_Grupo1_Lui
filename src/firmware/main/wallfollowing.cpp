#include "movement.hpp"
#include "navigation.hpp"
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "switches.hpp"
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "wallfollowing.hpp"


void wallfollowing() {
    for(int i = 0; i < 6; i++) {
        andar_ate_parede(12.5f);
        vTaskDelay(pdMS_TO_TICKS(500));
        girar_graus(80.0f, true);
    }
}