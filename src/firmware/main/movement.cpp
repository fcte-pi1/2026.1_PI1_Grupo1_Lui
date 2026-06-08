#include "movement.hpp"
#include "telemetry.hpp"
#include "tof_sensor.hpp"
#include "ina219.hpp"
#include <string.h>
#include <stdio.h>

void MoveTask(void *parametrospv) {
    PacoteTelemetria pacote;
    pacote.bateria_v = 7.4;
    pacote.pos_x = 0;
    pacote.pos_y = 0;
    strcpy(pacote.estado_fsm, "MAPPING");
    pacote.dist_frontal = -1;

    Ina219 ina;
    bool ina_ok = ina.init();

    for (;;) {
        int distancia_mm = -1;
        if (tof_get_latest_distance_mm(&distancia_mm)) {
            pacote.dist_frontal = distancia_mm;
        }

        if (ina_ok) {
            const Ina219Dados data_ina = ina.getDados();
            if (data_ina.bus_ok) {
                pacote.bateria_v = data_ina.bus_voltage_mv / 1000.0f;
            }
        } else {
            ina_ok = ina.init();
        }
        pacote.pos_x += 1;

        // Empurra os dados na Fila global (definida em telemetry.hpp)
        xQueueSend(FilaTelemetria, &pacote, 0);
        printf("Core 0 -> Enviou telemetria para a fila (X: %d | ToF: %d mm)\n",
               pacote.pos_x,
               pacote.dist_frontal);

        // TAXA DE ATUALIZAÇÃO (DELAY DO LOOP):
        // [OFICIAL]: pdMS_TO_TICKS(100) -> 10Hz (Controle e amostragem rápidos para o robô real)
        // [TESTES/DEBUG]: pdMS_TO_TICKS(1000) -> 1Hz (Mais lento para visualizar os logs sem inundar o terminal)
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
