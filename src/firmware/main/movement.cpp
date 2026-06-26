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

    printf("Iniciando Teste de Validação (Andar 1 Célula - 18cm)...\n");
    vTaskDelay(pdMS_TO_TICKS(100));

    // TESTE DE VALIDAÇÃO: Andar uma célula em linha reta
    mover_celula();
    vTaskDelay(pdMS_TO_TICKS(100));
    girar_graus(180.0,true);

    vTaskDelay(pdMS_TO_TICKS(100));
    girar_graus(180.0,false);
    
    // Fim da coreografia. Fica parado para sempre.
    while(true) {
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}
