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

enum RobotState {
    IDLE,
    CALIBRATING,
    MAPPING,
    TURNING,       // Robô girando no próprio eixo (90 graus)
    GOAL_REACHED,
    ERROR
};

void MoveTask(void *parametrospv) {
    PacoteTelemetria pacote;
    pacote.bateria_v = 7.4;
    pacote.pos_x = 0;
    pacote.pos_y = 0;
    strcpy(pacote.estado_fsm, "IDLE");
    pacote.dist_frontal = -1;
    pacote.dist_esq = -1;
    pacote.dist_dir = -1;
    
    Ina219 ina;
    bool ina_ok = ina.init();
    
    PID pid_parede;
    // Substituir os ganhos abaixo no laboratório: (Kp, Ki, Kd, max_integral, max_output)
    pid_parede.init(8.0f, 0.2f, 1.0f, 50.0f, 255.0f);

    PID pid_motor_esq;
    PID pid_motor_dir;
    pid_motor_esq.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f); 
    pid_motor_dir.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f);
    
    encoder_init(); 
    motor_init();   
    switches_init(); // Inicia leitura das chaves

    const float setpoint_mm = 23.0f; // Manteremos para o Frontal caso precise
    const float velocidade_base_cms = 15.0f;
    
    // Constantes de Odometria (Calibrar na prática)
    const int32_t TICKS_PER_CELL = 800; // Quantos ticks para andar 18cm?
    
    RobotState estado_atual = IDLE;
    TickType_t calibration_start_time = 0;
    int32_t ticks_start_left = 0;
    int32_t ticks_start_right = 0;

    for (;;) {
        int dist_f = -1, dist_e = -1, dist_d = -1;
        if (tof_get_distances_mm(&dist_f, &dist_e, &dist_d)) {
            pacote.dist_frontal = dist_f;
            pacote.dist_esq = dist_e;
            pacote.dist_dir = dist_d;
        }

        if (ina_ok) {
            const Ina219Dados data_ina = ina.getDados();
            if (data_ina.bus_ok) {
                pacote.bateria_v = data_ina.bus_voltage_mv / 1000.0f;
            }
        } else {
            ina_ok = ina.init();
        }

        float dt = 0.1f;
        float vel_real_esq = encoder_get_left_velocity_cms();
        float vel_real_dir = encoder_get_right_velocity_cms();

        switch (estado_atual) {
            case IDLE:
                motor_set_speed(MOTOR_LEFT, 0);
                motor_set_speed(MOTOR_RIGHT, 0);
                strcpy(pacote.estado_fsm, "IDLE");
                
                if (is_start_pressed()) {
                    estado_atual = CALIBRATING;
                    calibration_start_time = xTaskGetTickCount();
                    printf("FSM: Transicao para CALIBRATING. Tamanho Labirinto: %s\n", 
                           is_maze_size_8x8() ? "8x8" : "4x4");
                }
                break;

            case CALIBRATING:
                strcpy(pacote.estado_fsm, "CALIBRATING");
                // Aguarda 2 segundos
                if ((xTaskGetTickCount() - calibration_start_time) > pdMS_TO_TICKS(2000)) {
                    estado_atual = MAPPING;
                    ticks_start_left = encoder_get_left_ticks();
                    ticks_start_right = encoder_get_right_ticks();
                    printf("FSM: Transicao para MAPPING. Iniciando movimento.\n");
                }
                break;

            case MAPPING: {
                strcpy(pacote.estado_fsm, "MAPPING");
                
                int32_t current_ticks_left = encoder_get_left_ticks();
                int32_t current_ticks_right = encoder_get_right_ticks();
                int32_t avg_ticks_moved = (std::abs(current_ticks_left - ticks_start_left) + 
                                           std::abs(current_ticks_right - ticks_start_right)) / 2;
                
                if (avg_ticks_moved >= TICKS_PER_CELL) {
                    pacote.pos_x += 1; 
                    printf("FSM: Celula concluida! Passando para o estado de TURNING...\n");
                    
                    ticks_start_left = current_ticks_left;
                    ticks_start_right = current_ticks_right;
                    
                    estado_atual = TURNING;
                    break;
                }

                // Proteção anti-colisão (Usa o Frontal)
                if (dist_f > 0 && dist_f < 30) {
                    printf("FSM ERRO: Risco iminente de colisao frontal (%d mm)!\n", dist_f);
                    estado_atual = ERROR;
                    break;
                }

                // 3. Execução Normal do PID
                // TODO: Adaptar o pid_parede para usar (dist_e - dist_d). 
                // Por enquanto mantemos usando o dist_f para manter sua compatibilidade.
                if (dist_f > 0) {
                    float ajuste_velocidade_curva = pid_parede.compute(setpoint_mm, (float)dist_f, dt);
                    float velocidade_alvo_esq = velocidade_base_cms + ajuste_velocidade_curva;
                    float velocidade_alvo_dir = velocidade_base_cms - ajuste_velocidade_curva;
                    
                    float pwm_final_esq = pid_motor_esq.compute(velocidade_alvo_esq, vel_real_esq, dt);
                    float pwm_final_dir = pid_motor_dir.compute(velocidade_alvo_dir, vel_real_dir, dt);

                    motor_set_speed(MOTOR_LEFT, (int)pwm_final_esq);
                    motor_set_speed(MOTOR_RIGHT, (int)pwm_final_dir);
                }
                break;
            }

            case TURNING:
                strcpy(pacote.estado_fsm, "TURNING");
                motor_set_speed(MOTOR_LEFT, 0);
                motor_set_speed(MOTOR_RIGHT, 0);
                break;

            case GOAL_REACHED:
                strcpy(pacote.estado_fsm, "GOAL");
                motor_disable(); 
                break;

            case ERROR:
                strcpy(pacote.estado_fsm, "ERROR");
                motor_disable(); 
                break;
        }
        
        xQueueSend(FilaTelemetria, &pacote, 0);

        // Taxa de amostragem de controle: 10Hz
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}
