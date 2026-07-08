#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "movement.hpp"
#include "telemetry.hpp"
#include "tof_sensor.hpp"
#include "wifi_manager.hpp"

// Task para simulação de instabilidade de rede (Validação do Ring Buffer)
// void TaskSimularQuedaRede(void *pvParameters) {
//     for (;;) {
//         vTaskDelay(pdMS_TO_TICKS(15000)); // Período de operação normal
//         
//         printf("\n[DIAGNOSTICO] Simulando queda de conectividade Wi-Fi (15s)...\n");
//         wifi_conectado = false; // Interrompe conectividade lógica para forçar acúmulo no buffer offline
//         
//         vTaskDelay(pdMS_TO_TICKS(15000)); // Período offline simulado
//         
//         printf("\n[DIAGNOSTICO] Conectividade restabelecida. Acionando descarregamento em lote.\n");
//         wifi_conectado = true; // Restabelecimento da conexão
//     }
// }

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

    // 2. Cria a tarefa de leitura do sensor ToF no Core 0
    xTaskCreatePinnedToCore(
        ToFTask,
        "TOF_Core0",
        4096,
        NULL,
        6,
        NULL,
        0
    );

    // 3. Fixação da tarefa de controle motor e PID no Core 0 (alta prioridade) para garantir determinismo de tempo real.
    xTaskCreatePinnedToCore(
        MoveTask,            // Função executada
        "Movement_Core0",    // Nome para debug
        4096,                // Stack size
        NULL,                // Sem argumentos
        5,                   // Prioridade
        NULL,                // Sem task handle
        0                    // Executa no Core 0
    );
    
    // 4. Isolamento da carga de rede (Wi-Fi/UDP) no Core 1 para evitar jitter no loop de controle do Core 0.
    xTaskCreatePinnedToCore(
        TaskTelemetria,
        "Telemetry_core1",
        8192,
        NULL,
        5,
        NULL,
        1                    // Executa no Core 1
    );

    // 5. Cria a tarefa de simulação de conectividade instável
    /* xTaskCreate(
        TaskSimularQuedaRede,
        "   ",
        2048,
        NULL,
        2,                   // Prioridade mais baixa
        NULL
    ); */
}
