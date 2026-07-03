#include "movement.hpp"
#include "navigation.hpp"
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "switches.hpp"
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "wallfollowing.hpp" // <-- Corrigido aqui

// Ponto de entrada do loop de missão do Micromouse. Concentra a inicialização de periféricos 
// e rege a Máquina de Estados (FSM) de movimentação do robô.
void MoveTask(void *parametrospv) {
    // Inicialização do Hardware
    encoder_init(); 
    motor_init();   
    switches_init();
    
    // Inicialização da Lógica de Navegação (PIDs)
    navigation_init();

    printf("\n=== AGUARDANDO COMANDO DE START ===\n");
    printf("Pressione o botao fisico (START) para iniciar a missao...\n\n");
    
    // Aguarda o usuário apertar o botão
    while (!is_start_pressed()) {
        vTaskDelay(pdMS_TO_TICKS(100));
    }
    
    printf("\n>>> START DETECTADO!\n");
    printf("Iniciando Teste de Parada com Sensor (ToF) em 3 segundos...\n");
    vTaskDelay(pdMS_TO_TICKS(3000)); // Adicionado o delay de 3 segundos que o printf promete

    // TESTE DO SENSOR: Chama a coreografia exportada
    wallfollowing();
    
    // Missão concluída. Fica em repouso.
    while(true) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
