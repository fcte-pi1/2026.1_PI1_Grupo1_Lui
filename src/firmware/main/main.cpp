#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "movement.hpp"
#include "telemetry.hpp"
#include "wifi_manager.hpp"

extern "C" void app_main(void) {
    printf("Iniciando Micromouse Modular com FreeRTOS... \n");


    // inicializar wi fi
    wifi_init_sta();
    // 1. Inicializa a Fila global definida em telemetry.hpp
    FilaTelemetria = xQueueCreate(10, sizeof(PacoteTelemetria));
    if (FilaTelemetria == NULL) {
        printf("Falha ao criar a Fila de Telemetria!\n");
        return;
    }

    // 2. Cria a tarefa de movimento no Core 0
    xTaskCreatePinnedToCore(
        MoveTask,            // Função executada
        "Movement_Core0",    // Nome para debug
        4096,                // Stack size
        NULL,                // Sem argumentos
        5,                   // Prioridade
        NULL,                // Sem task handle
        0                    // Executa no Core 0
    );
    
    // 3. Cria a tarefa de telemetria no Core 1
    xTaskCreatePinnedToCore(
        TaskTelemetria,
        "Telemetry_core1",
        8192,
        NULL,
        5,
        NULL,
        1                    // Executa no Core 1
    );
}
