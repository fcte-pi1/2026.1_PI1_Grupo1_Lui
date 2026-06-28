#include "movement.hpp"
#include "navigation.hpp"
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "switches.hpp"
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

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
    
    printf("\n>>> START DETECTADO! Iniciando Wall Following...\n");
    
    // Missão Principal: Wall Following com Parada Segura
    // Velocidade = 10 cm/s | Parada = 3.0 cm da parede frontal
    andar_corredor_centralizado(10.0f, 3.0f);
    
    // Missão concluída. Fica em repouso.
    while(true) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
