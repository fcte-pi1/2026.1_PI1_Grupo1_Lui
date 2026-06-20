#include "movement.hpp"
#include "telemetry.hpp"
#include "tof_sensor.hpp"
#include "ina219.hpp"
#include <string.h>
#include <stdio.h>
#include "encoder.hpp"

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

        // Envia telemetria para processamento assíncrono
        pacote.velocidade_media = encoder_get_velocity_ms();
        xQueueSend(FilaTelemetria, &pacote, 0);
        printf("Core 0 -> Enviou telemetria para a fila (X: %d | ToF: %d mm)\n",
               pacote.pos_x,
               pacote.dist_frontal);

        // Taxa de amostragem de controle: 1Hz (Testes) | Padrão Oficial: 10Hz
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
