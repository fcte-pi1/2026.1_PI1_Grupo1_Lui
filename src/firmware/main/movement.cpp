#include "movement.hpp"
#include "telemetry.hpp"
#include <string.h>
#include <stdio.h>

void MoveTask(void *parametrospv) {
    PacoteTelemetria pacote;
    pacote.bateria_v = 7.4;
    pacote.pos_x = 0;
    pacote.pos_y = 0;
    strcpy(pacote.estado_fsm, "MAPPING");
    pacote.dist_frontal = 150;

    for (;;) {
        pacote.bateria_v -= 0.01;
        pacote.pos_x += 1;

        // Empurra os dados na Fila global (definida em telemetry.hpp)
        xQueueSend(FilaTelemetria, &pacote, 0);
        printf("Core 0 -> Enviou telemetria para a fila (X: %d)\n", pacote.pos_x);

        // TAXA DE ATUALIZAÇÃO (DELAY DO LOOP):
        // [OFICIAL]: pdMS_TO_TICKS(100) -> 10Hz (Controle e amostragem rápidos para o robô real)
        // [TESTES/DEBUG]: pdMS_TO_TICKS(1000) -> 1Hz (Mais lento para visualizar os logs sem inundar o terminal)
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
