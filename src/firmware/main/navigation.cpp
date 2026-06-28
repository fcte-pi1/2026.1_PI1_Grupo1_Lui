#include "navigation.hpp"
#include "pid.hpp"
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "telemetry.hpp"
#include "tof_sensor.hpp"
#include <string.h>
#include <stdio.h>
#include <cmath>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

// ================= CONSTANTES DE CALIBRAÇÃO =================
// Corrigido contra Bouncing: A metade exata da calibração manual
const float TICKS_POR_CM = 23.0f; 

// Cálculo final com PIDs controlados: 538 ticks geraram 190 graus. Logo, (538 / 190) * 90 = 254.8 ~ Ajustado para 251 para cravar 180
const float TICKS_POR_90_GRAUS = 251.0f; 
// ============================================================

// Instâncias globais (privadas deste módulo) de PID
static PID pid_motor_dir;
static PID pid_motor_esq;

// Variáveis de estado para a Telemetria
static int last_pwm_esq = 0;
static int last_pwm_dir = 0;
static float last_erro_pid = 0.0f;
static float last_vel_media = 0.0f;

// Função privada para controle de velocidade
static void controle_velocidade(float vel_alvo_esq, float vel_alvo_dir, float dt) {
    float vel_real_esq = encoder_get_left_velocity_cms();
    float vel_real_dir = encoder_get_right_velocity_cms();

    last_vel_media = (vel_real_esq + vel_real_dir) / 2.0f;
    last_erro_pid = vel_alvo_esq - vel_real_esq; // Monitorando a roda problemática (esq) pro backend

    float pwm_esq = pid_motor_esq.compute(vel_alvo_esq, vel_real_esq, dt);
    float pwm_dir = pid_motor_dir.compute(vel_alvo_dir, vel_real_dir, dt);

    float base_esq = 0.0f;
    if (vel_alvo_esq > 0) {
        base_esq = 180.0f; 
    } else if (vel_alvo_esq < 0) {
        base_esq = -180.0f;
    }
    
    float forca_final_esq = base_esq + pwm_esq;
    if (vel_alvo_esq == 0) forca_final_esq = 0; // Se alvo for zero, corta de vez

    float base_dir = 0.0f;
    if (vel_alvo_dir > 0) {
        base_dir = 180.0f;
    } else if (vel_alvo_dir < 0) {
        base_dir = -180.0f;
    }
    
    float forca_final_dir = base_dir + pwm_dir;
    if (vel_alvo_dir == 0) forca_final_dir = 0;

    motor_set_speed(MOTOR_LEFT, (int)forca_final_esq);
    motor_set_speed(MOTOR_RIGHT, (int)forca_final_dir);
    
    last_pwm_esq = (int)forca_final_esq;
    last_pwm_dir = (int)forca_final_dir;
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
    
    pacote.pwm_esq = last_pwm_esq;
    pacote.pwm_dir = last_pwm_dir;
    pacote.erro_pid = last_erro_pid;
    pacote.velocidade_media = last_vel_media;
    
    xQueueSend(FilaTelemetria, &pacote, 0);
} 
// ordem de valores é  kp,ki,kd,min,max
void navigation_init() {
    pid_motor_dir.init(5.0f, 10.0f, 0.0f, 100.0f, 255.0f);
    pid_motor_esq.init(5.0f, 10.0f, 0.0f, 100.0f, 255.0f);
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

        controle_velocidade(15.0f, 15.0f, 0.01f);
        vTaskDelay(pdMS_TO_TICKS(10));
    }

    motor_set_speed(MOTOR_LEFT, 0);
    motor_set_speed(MOTOR_RIGHT, 0);
    printf(">>> Reta Finalizada!\n");
}

void mover_celula() {
    andar_reto_cm(18.0f);
}

void andar_ate_parede(float dist_parada_cm) {
    printf("\n>>> MODO CAUTELOSO: Andando ate a parede! Alvo: %.1f cm\n", dist_parada_cm);
    
    int32_t ticks_inicio = encoder_get_right_ticks();
    TickType_t tempo_inicio = xTaskGetTickCount();
    
    pid_motor_esq.reset();
    pid_motor_dir.reset();

    int dist_frontal, dist_esq, dist_dir;

    while (true) {
        int32_t ticks_andados = std::abs(encoder_get_right_ticks() - ticks_inicio);
        despachar_telemetria("TOF_TESTE", ticks_andados);

        // Medida de Segurança (Timeout de 7 segundos)
        if ((xTaskGetTickCount() - tempo_inicio) > pdMS_TO_TICKS(7000)) {
            printf(">>> ALARME DE SEGURANCA! Timeout de 7s estourado. FREANDO!\n");
            break;
        }

        // Lê os lasers do ToF
        if (tof_get_distances_mm(&dist_frontal, &dist_esq, &dist_dir)) {
            float dist_cm = dist_frontal / 10.0f;
            
            // Ignora leituras de erro de I2C (-1) ou fora de alcance (8190)
            if (dist_frontal > 0 && dist_frontal < 8000) {
                if (dist_cm <= dist_parada_cm) {
                    printf(">>> Parede detectada a %.1f cm! FREANDO!\n", dist_cm);
                    break;
                }
            }
        }

        // Mantém a velocidade BEM DEVAGAR enquanto não chega na parede
        controle_velocidade(10.0f, 10.0f, 0.01f);
        vTaskDelay(pdMS_TO_TICKS(10));
    }

    // Curto-Circuito Magnético!
    motor_set_speed(MOTOR_LEFT, 0);
    motor_set_speed(MOTOR_RIGHT, 0);
}

void girar_graus(float graus, bool direita) {
    printf("\n>>> Iniciando Giro de %.1f graus para a %s...\n", graus, direita ? "Direita" : "Esquerda");
    
    const float fator_conversao = TICKS_POR_90_GRAUS / 90.0f; 
    int32_t ticks_alvo = (int32_t)(graus * fator_conversao);
    
    int32_t ticks_inicio = encoder_get_right_ticks();
    TickType_t tempo_inicio = xTaskGetTickCount();
    
    pid_motor_esq.reset();
    pid_motor_dir.reset();

    // Velocidade de giro aumentada para 25.0f para garantir torque suficiente
    // e vencer o atrito lateral da roda boba (que estava travando o motor esquerdo)
    float vel_esq = direita ? 25.0f : -25.0f;
    float vel_dir = direita ? -25.0f : 25.0f;

    while (true) {
        int32_t ticks_andados = std::abs(encoder_get_right_ticks() - ticks_inicio);
        despachar_telemetria("GIRANDO", ticks_andados);

        // Calcula um timeout dinâmico: 5s base + 2s a cada 90 graus
        uint32_t timeout_ms = 5000 + (uint32_t)((graus / 90.0f) * 2000);

        if (ticks_andados >= ticks_alvo || (xTaskGetTickCount() - tempo_inicio) > pdMS_TO_TICKS(timeout_ms)) {
            break; 
        }

        controle_velocidade(vel_esq, vel_dir, 0.01f); 
        vTaskDelay(pdMS_TO_TICKS(10)); 
    }

    motor_set_speed(MOTOR_LEFT, 0);
    motor_set_speed(MOTOR_RIGHT, 0);
    printf(">>> Giro Finalizado!\n");
}

void testar_tofs_estatico() {
    printf("\n>>> INICIANDO TESTE ESTÁTICO DOS TOFS!\n");
    printf(">>> Os motores estao desligados. Aproxime a mao dos sensores!\n");
    
    while (true) {
        int f, e, d;
        if (tof_get_distances_mm(&f, &e, &d)) {
            printf("[LASER] Frontal: %d mm | Esquerda: %d mm | Direita: %d mm\n", f, e, d);
            
            // Envia para o Backend
            PacoteTelemetria pacote;
            pacote.bateria_v = 7.4;
            pacote.pos_x = 0; 
            pacote.pos_y = 0;
            strcpy(pacote.estado_fsm, "TESTE_TOF");
            pacote.dist_frontal = f;
            pacote.dist_esq = e;
            pacote.dist_dir = d;
            pacote.pwm_esq = 0; 
            pacote.pwm_dir = 0;
            pacote.erro_pid = 0; 
            pacote.velocidade_media = 0;
            
            xQueueSend(FilaTelemetria, &pacote, 0);
        }
        vTaskDelay(pdMS_TO_TICKS(500)); // Envia a cada 0.5 segundos (2Hz) para não poluir
    }
}
