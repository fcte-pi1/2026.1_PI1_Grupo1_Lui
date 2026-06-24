#pragma once
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

struct PacoteTelemetria {
    float bateria_v;
    int pos_x;
    int pos_y;
    char estado_fsm[16];
    int dist_frontal;
    int dist_esq;
    int dist_dir;
    uint8_t paredes;
    uint32_t timestamp;
};

// Exportação de handlers globais e protótipos
extern QueueHandle_t FilaTelemetria;
void TaskTelemetria(void *parametrospv);

#define CAPACIDADE_BUFFER 600

struct RingBufferTelemetria {
    PacoteTelemetria pacotes[CAPACIDADE_BUFFER];
    int head;
    int tail;
    int count;
};

extern RingBufferTelemetria bufferOffline;
bool enfileirarBuffer(const PacoteTelemetria& pacote);
bool desenfileirarBuffer(PacoteTelemetria& pacote);
