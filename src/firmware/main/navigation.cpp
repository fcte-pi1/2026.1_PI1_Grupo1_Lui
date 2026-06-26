#include "navigation.hpp"
#include "pid.hpp"
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "telemetry.hpp"
#include <string.h>
#include <stdio.h>
#include <cmath>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

// ================= CONSTANTES DE CALIBRAÇÃO =================
// Baseado no seu teste: 222 Ticks para 5cm -> 44.4 Ticks por cm
const float TICKS_POR_CM = 44.4f; 

// Baseado na Bitola do robô: Quantos Ticks são necessários para girar 90 graus?
// (Ajuste esse valor após o teste das 10 voltas ou ao medir a bitola)
const float TICKS_POR_90_GRAUS = 210.0f; 
// ============================================================

// Instâncias globais (privadas deste módulo) de PID
static PID pid_motor_dir;
static PID pid_motor_esq;

// Função privada para controle de velocidade
static void controle_velocidade(float vel_alvo_esq, float vel_alvo_dir, float dt) {
    float vel_real_esq = encoder_get_left_velocity_cms();
    float vel_real_dir = encoder_get_right_velocity_cms();

    float pwm_esq = pid_motor_esq.compute(vel_alvo_esq, vel_real_esq, dt);
    float pwm_dir = pid_motor_dir.compute(vel_alvo_dir, vel_real_dir, dt);

    float forca_final_esq = pwm_esq;
    if (forca_final_esq > 0) forca_final_esq += 200.0f;
    if (forca_final_esq < 0) forca_final_esq -= 200.0f;
    if (vel_alvo_esq == 0) forca_final_esq = 0; // Se alvo for zero, corta de vez

    float forca_final_dir = pwm_dir;
    if (forca_final_dir > 0) forca_final_dir += 200.0f;
    if (forca_final_dir < 0) forca_final_dir -= 200.0f;
    if (vel_alvo_dir == 0) forca_final_dir = 0;

    motor_set_speed(MOTOR_LEFT, (int)forca_final_esq);
    motor_set_speed(MOTOR_RIGHT, (int)forca_final_dir);
}

// Função privada para enviar telemetria limpa
static void despachar_telemetria(const char* estado, int32_t ticks) {
    PacoteTelemetria pacote;
    pacote.bateria_v = 7.4;
    pacote.pos_x = ticks;
    pacote.pos_y = 0;
    strcpy(pacote.estado_fsm, estado);
    pacote.dist_frontal = -1;
    pacote.dist_esq = -1;
    pacote.dist_dir = -1;
    xQueueSend(FilaTelemetria, &pacote, 0);
}

void navigation_init() {
    pid_motor_dir.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f);
    pid_motor_esq.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f);
}

void andar_reto_cm(float cm) {
    printf("\n>>> Iniciando Reta de %.1f cm...\n", cm);
    
    int32_t ticks_alvo = (int32_t)(cm * TICKS_POR_CM);
    
    int32_t ticks_inicio = encoder_get_right_ticks();
    TickType_t tempo_inicio = xTaskGetTickCount();
    
    pid_motor_esq.reset();
    pid_motor_dir.reset();

    while (true) {
        int32_t ticks_andados = std::abs(encoder_get_right_ticks() - ticks_inicio);
        despachar_telemetria("ANDANDO", ticks_andados);

        if (ticks_andados >= ticks_alvo || (xTaskGetTickCount() - tempo_inicio) > pdMS_TO_TICKS(10000)) {
            break; 
        }

        controle_velocidade(15.0f, 15.0f, 0.1f);
        vTaskDelay(pdMS_TO_TICKS(100));
    }

    motor_set_speed(MOTOR_LEFT, 0);
    motor_set_speed(MOTOR_RIGHT, 0);
    printf(">>> Reta Finalizada!\n");
}

void mover_celula() {
    andar_reto_cm(18.0f);
}

void girar_graus(float graus, bool direita) {
    printf("\n>>> Iniciando Giro de %.1f graus para a %s...\n", graus, direita ? "Direita" : "Esquerda");
    
    const float fator_conversao = TICKS_POR_90_GRAUS / 90.0f; 
    int32_t ticks_alvo = (int32_t)(graus * fator_conversao);
    
    int32_t ticks_inicio = encoder_get_right_ticks();
    TickType_t tempo_inicio = xTaskGetTickCount();
    
    pid_motor_esq.reset();
    pid_motor_dir.reset();

    float vel_esq = direita ? 15.0f : -15.0f;
    float vel_dir = direita ? -15.0f : 15.0f;

    while (true) {
        int32_t ticks_andados = std::abs(encoder_get_right_ticks() - ticks_inicio);
        despachar_telemetria("GIRANDO", ticks_andados);

        // Calcula um timeout dinâmico: 5s base + 2s a cada 90 graus
        uint32_t timeout_ms = 5000 + (uint32_t)((graus / 90.0f) * 2000);

        if (ticks_andados >= ticks_alvo || (xTaskGetTickCount() - tempo_inicio) > pdMS_TO_TICKS(timeout_ms)) {
            break; 
        }

        controle_velocidade(vel_esq, vel_dir, 0.1f); 
        vTaskDelay(pdMS_TO_TICKS(100)); 
    }

    motor_set_speed(MOTOR_LEFT, 0);
    motor_set_speed(MOTOR_RIGHT, 0);
    printf(">>> Giro Finalizado!\n");
}
