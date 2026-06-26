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

    printf("Iniciando coreografia (18cm + 90 esq + 360) em 3 segundos...\n");
    vTaskDelay(pdMS_TO_TICKS(3000));

    andar_reto_cm(6.0f);
    vTaskDelay(pdMS_TO_TICKS(1000)); // pausa pra estabilizar antes do giro
    girar_graus(90.0f, true); // vira pra direita
    vTaskDelay(pdMS_TO_TICKS(1000)); // pausa pra estabilizar antes do giro
    andar_reto_cm(6.0f);
    vTaskDelay(pdMS_TO_TICKS(1000));
    girar_graus(90.0f, false);

    // Fim da coreografia. Fica parado para sempre.
    while(true) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
