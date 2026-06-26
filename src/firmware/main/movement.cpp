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

    printf("Iniciando Teste de Calibração (10 Voltas) em 3 segundos...\n");
    vTaskDelay(pdMS_TO_TICKS(3000));

    // TESTE EMPÍRICO DA BITOLA: 10 voltas para a direita (3600 graus)
    girar_graus(3600.0f, true);
    
    // Fim da coreografia. Fica parado para sempre.
    while(true) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
