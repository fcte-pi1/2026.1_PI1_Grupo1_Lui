#pragma once
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

struct PacoteTelemetria {
    float bateria_v;
    int pos_x;
    int pos_y;
    char estado_fsm[16];
    int dist_frontal;
};

// Declaramos para outros módulos que a Fila e a Task existem
extern QueueHandle_t FilaTelemetria;
void TaskTelemetria(void *parametrospv);
