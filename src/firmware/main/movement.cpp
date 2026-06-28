#include "movement.hpp"
#include "navigation.hpp"
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "switches.hpp"
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

// ================= CÉREBRO PRINCIPAL ================= //

void MoveTask(void *parametrospv) {
    // Inicialização do Hardware
    encoder_init(); 
    motor_init();   
    switches_init();
    
    // Inicialização da Lógica de Navegação (PIDs)
    navigation_init();

    printf("Iniciando Teste de Parada com Sensor (ToF) em 3 segundos...\n");
    vTaskDelay(pdMS_TO_TICKS(3000));

    // TESTE DO SENSOR: Anda reto e freia a 5.0 cm da parede
    andar_ate_parede(5.0f);
    
    // Fim da coreografia. Fica parado para sempre.
    while(true) {
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}
