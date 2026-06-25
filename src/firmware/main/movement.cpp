#include "movement.hpp"
#include "telemetry.hpp"
#include "tof_sensor.hpp"
#include "ina219.hpp"
#include "pid.hpp" 
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "switches.hpp"
#include <string.h>
#include <stdio.h>
#include <cmath>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

// ============================================================================
// ATENÇÃO: MODO DE TESTE ISOLADO DE MOVIMENTO (BRANCH DESCARTÁVEL)
// O ENCODER ESQUERDO ESTÁ FISICAMENTE QUEBRADO. 
// TODA A ODOMETRIA (DISTÂNCIA E CURVAS) USA APENAS OS TICKS DO ENCODER DIREITO.
// O MOTOR ESQUERDO RODA EM MALHA ABERTA ESPELHANDO A FORÇA DO MOTOR DIREITO.
// ============================================================================

void MoveTask(void *parametrospv) {
    PacoteTelemetria pacote;
    pacote.bateria_v = 7.4;
    pacote.pos_x = 0;
    pacote.pos_y = 0;
    strcpy(pacote.estado_fsm, "TESTING");
    pacote.dist_frontal = -1;
    pacote.dist_esq = -1;
    pacote.dist_dir = -1;
    
    Ina219 ina;
    bool ina_ok = ina.init();
    
    // Usaremos apenas um PID, para a roda direita (a única que tem sensor)
    PID pid_motor_dir;
    pid_motor_dir.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f);
    
    encoder_init(); 
    motor_init();   
    switches_init();

    // Constantes de Calibração (AJUSTE ESSES NÚMEROS AMANHÃ NO LABORATÓRIO)
    const float velocidade_alvo = 15.0f; // cm/s
    const int32_t TICKS_PRA_FRENTE = 800; // Ticks para 18cm
    const int32_t TICKS_PRA_CURVA = 400;  // Ticks para girar 90 graus (CHUTE)

    int passo_teste = 0; // 0=Wait, 1=Frente, 2=Pausa1, 3=Curva, 4=Pausa2
    int32_t ticks_inicio = 0;
    TickType_t tempo_pausa = 0;

    for (;;) {
        // Atualiza sensores só pra mandar na telemetria
        int dist_f = -1, dist_e = -1, dist_d = -1;
        if (tof_get_distances_mm(&dist_f, &dist_e, &dist_d)) {
            pacote.dist_frontal = dist_f; pacote.dist_esq = dist_e; pacote.dist_dir = dist_d;
        }

        float dt = 0.1f;
        float vel_real_dir = encoder_get_right_velocity_cms();
        int32_t ticks_atuais = encoder_get_right_ticks();

        switch (passo_teste) {
            case 0: // AGUARDANDO START
                motor_set_speed(MOTOR_LEFT, 0);
                motor_set_speed(MOTOR_RIGHT, 0);
                if (is_start_pressed()) {
                    printf("Iniciando Coreografia! Andando reto...\n");
                    ticks_inicio = ticks_atuais;
                    passo_teste = 1;
                }
                break;

            case 1: // ANDAR RETO
            {
                int32_t ticks_andados = std::abs(ticks_atuais - ticks_inicio);
                if (ticks_andados >= TICKS_PRA_FRENTE) {
                    printf("Chegou em 18cm! Pausando...\n");
                    motor_set_speed(MOTOR_LEFT, 0);
                    motor_set_speed(MOTOR_RIGHT, 0);
                    tempo_pausa = xTaskGetTickCount();
                    passo_teste = 2;
                } else {
                    float pwm_dir = pid_motor_dir.compute(velocidade_alvo, vel_real_dir, dt);
                    // Roda Direita usa o PID. Roda Esquerda copia a força.
                    motor_set_speed(MOTOR_RIGHT, (int)pwm_dir);
                    motor_set_speed(MOTOR_LEFT, (int)pwm_dir);
                }
                break;
            }

            case 2: // PAUSA 1
                if ((xTaskGetTickCount() - tempo_pausa) > pdMS_TO_TICKS(1500)) {
                    printf("Iniciando Curva de 90 graus!\n");
                    ticks_inicio = ticks_atuais;
                    passo_teste = 3;
                }
                break;

            case 3: // GIRAR 90 GRAUS (Eixo)
            {
                int32_t ticks_andados = std::abs(ticks_atuais - ticks_inicio);
                if (ticks_andados >= TICKS_PRA_CURVA) {
                    printf("Curva concluida! Pausando e recomecando...\n");
                    motor_set_speed(MOTOR_LEFT, 0);
                    motor_set_speed(MOTOR_RIGHT, 0);
                    tempo_pausa = xTaskGetTickCount();
                    passo_teste = 4;
                } else {
                    // Para girar no eixo, mandamos uma força fixa (ex: PWM 80)
                    // Como a roda direita vai rodar para TRÁS, o encoder dela vai ler negativo, 
                    // mas o std::abs() ali em cima resolve isso.
                    motor_set_speed(MOTOR_RIGHT, -80);
                    motor_set_speed(MOTOR_LEFT, 80); 
                }
                break;
            }

            case 4: // PAUSA 2 E RECOMEÇA
                if ((xTaskGetTickCount() - tempo_pausa) > pdMS_TO_TICKS(1500)) {
                    printf("Reiniciando ciclo! Andando reto...\n");
                    ticks_inicio = ticks_atuais;
                    passo_teste = 1;
                }
                break;
        }
        
        xQueueSend(FilaTelemetria, &pacote, 0);
        vTaskDelay(pdMS_TO_TICKS(100)); // Loop de 10Hz
    }
}
