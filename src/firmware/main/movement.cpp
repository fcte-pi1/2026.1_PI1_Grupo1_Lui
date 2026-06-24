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

    const float setpoint_mm = 23.0f;
    const float velocidade_base_cms = 15.0f;
    
    // Constantes de Odometria (Calibrar na prática)
    const int32_t TICKS_PER_CELL = 800; // Quantos ticks para andar 18cm?
    
    RobotState estado_atual = IDLE;
    TickType_t calibration_start_time = 0;
    int32_t ticks_start_left = 0;
    int32_t ticks_start_right = 0;

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

        float dt = 0.1f;
        float vel_real_esq = encoder_get_left_velocity_cms();
        float vel_real_dir = encoder_get_right_velocity_cms();

        switch (estado_atual) {
            case IDLE:
                motor_set_speed(MOTOR_LEFT, 0);
                motor_set_speed(MOTOR_RIGHT, 0);
                strcpy(pacote.estado_fsm, "IDLE");
                
                // Checa chave seletora
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
                
                // 1. Lógica de Odometria (Avanço de Célula)
                int32_t current_ticks_left = encoder_get_left_ticks();
                int32_t current_ticks_right = encoder_get_right_ticks();
                int32_t avg_ticks_moved = (std::abs(current_ticks_left - ticks_start_left) + 
                                           std::abs(current_ticks_right - ticks_start_right)) / 2;
                
                if (avg_ticks_moved >= TICKS_PER_CELL) {
                    // Robô andou 18cm (1 célula)!
                    pacote.pos_x += 1; // Apenas simulação. O Floodfill atualizará de verdade.
                    printf("FSM: Celula concluida! Passando para o estado de TURNING...\n");
                    
                    // Reseta odometria para ser usada pela curva
                    ticks_start_left = current_ticks_left;
                    ticks_start_right = current_ticks_right;
                    
                    // TODO: Aqui o Floodfill seria chamado. Por enquanto, forçamos ir para TURNING
                    estado_atual = TURNING;
                    break;
                }

                // 2. Proteção e Estado de Erro
                // Se a velocidade for muito baixa mesmo com muito PWM comandado,
                // ou se ele estiver prestes a bater de frente (ToF muito perto e não conseguiu virar).
                if (distancia_mm > 0 && distancia_mm < 30) {
                    printf("FSM ERRO: Risco iminente de colisao frontal (%d mm)!\n", distancia_mm);
                    estado_atual = ERROR;
                    break;
                }

                // 3. Execução Normal do PID
                if (distancia_mm > 0) {
                    float ajuste_velocidade_curva = pid_parede.compute(setpoint_mm, (float)distancia_mm, dt);
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
                
                // TODO: Implementar lógica de curva.
                // 1. Aplicar PWM positivo em uma roda e negativo na outra.
                // 2. Ler a diferença dos encoders até atingir a constante de 90 graus.
                // 3. Ao finalizar, voltar para estado_atual = MAPPING;
                
                // Por enquanto, apenas paramos os motores simulando que ele não sabe virar ainda
                motor_set_speed(MOTOR_LEFT, 0);
                motor_set_speed(MOTOR_RIGHT, 0);
                break;

            case GOAL_REACHED:
                strcpy(pacote.estado_fsm, "GOAL");
                motor_disable(); // Parada segura
                break;

            case ERROR:
                strcpy(pacote.estado_fsm, "ERROR");
                motor_disable(); // Zera PWM e desliga ENABLE
                break;
        }
        
        // Envia telemetria para processamento assíncrono
        xQueueSend(FilaTelemetria, &pacote, 0);

        // Taxa de amostragem de controle: 10Hz
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}
