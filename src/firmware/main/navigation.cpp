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

// --- Parâmetros de Calibração da Odometria ---
const float TICKS_POR_CM = 23.0f; 

// Fator de conversão angular (Ticks necessários para girar 90 graus no próprio eixo)
const float TICKS_POR_90_GRAUS = 251.0f; 
// ---------------------------------------------

// Instâncias globais (privadas deste módulo) de PID
static PID pid_motor_dir;
static PID pid_motor_esq;

// Variáveis de estado para a Telemetria
static int last_pwm_esq = 0;
static int last_pwm_dir = 0;
static float last_erro_pid = 0.0f;
static float last_vel_media = 0.0f;

// Malha Fechada Dupla (PID): Calcula o esforço de controle de forma independente para cada roda, 
// mantendo a velocidade alvo independente de atritos mecânicos assimétricos.
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

// Getter: Retorna o último PWM calculado para o motor esquerdo
int get_last_pwm_esq() {
    return last_pwm_esq;
}

// Getter: Retorna o último PWM calculado para o motor direito
int get_last_pwm_dir() {
    return last_pwm_dir;
}

// Getter: Retorna o último erro de controle de velocidade
float get_last_erro_pid() {
    return last_erro_pid;
}

// Getter: Retorna a última velocidade média registrada
float get_last_vel_media() {
    return last_vel_media;
}
void navigation_init() {
    /* 
     * Inicialização dos Controladores PID de Velocidade
     * Parâmetros: (Kp, Ki, Kd, min_output, max_output)
     * 
     * Kp (Proporcional): Força de reação imediata ao erro atual. Valores muito altos geram oscilação.
     * Ki (Integral): Corrige erros acumulados, essencial para vencer resistências mecânicas constantes (atrito).
     * Kd (Derivativo): Amortece a correção prevendo o erro futuro, evita overshoot.
     * min/max: Limitam a saída de PWM.
     */
    pid_motor_dir.init(5.0f, 10.0f, 0.0f, 100.0f, 220.0f);
    pid_motor_esq.init(5.0f, 10.0f, 0.0f, 100.0f, 220.0f);
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
    andar_reto_cm(16.0f);
}

void mover_celula_wallfollowing() {

    
    int32_t ticks_alvo = (int32_t)(18.0f * TICKS_POR_CM);
    int32_t ticks_inicio = encoder_get_right_ticks();
    TickType_t tempo_inicio = xTaskGetTickCount();
    
    pid_motor_esq.reset();
    pid_motor_dir.reset();

    int dist_frontal, dist_esq, dist_dir;
    float Kp_parede = 0.2f; 
    float vel_base_cm_s = 15.0f; // Mesma velocidade base
    float centro_ideal = 32.5f;

    while (true) {
        int32_t ticks_atuais = encoder_get_right_ticks();
        int32_t ticks_andados = std::abs(ticks_atuais - ticks_inicio);

        // 1. Condição de Parada (Odometria Exata da Célula)
        if (ticks_andados >= ticks_alvo || (xTaskGetTickCount() - tempo_inicio) > pdMS_TO_TICKS(5000)) {
            break; 
        }

        float vel_alvo_esq = vel_base_cm_s;
        float vel_alvo_dir = vel_base_cm_s;

        // 2. Leitura e Wall Following
        if (tof_get_distances_mm(&dist_frontal, &dist_esq, &dist_dir)) {
            float erro_parede_mm = 0;
            bool tem_parede = false;
            
            if (dist_esq < 150 && dist_dir < 150) {
                //  sensores: Centraliza baseado nas duas paredes
                erro_parede_mm = (float)(dist_esq - dist_dir);
                tem_parede = true;
            } else if (dist_esq < 150) {
                // Repulsão esquerda
                if (dist_esq < centro_ideal) {
                    erro_parede_mm = (dist_esq - centro_ideal) * 2.0f;
                    tem_parede = true;
                }
            } else if (dist_dir < 150) {
                // Repulsão direita
                if (dist_dir < centro_ideal) {
                    erro_parede_mm = (centro_ideal - dist_dir) * 2.0f; 
                    tem_parede = true;
                }
            }

            if (tem_parede) {
                float correcao = erro_parede_mm * Kp_parede;
                if (correcao > 8.0f) correcao = 8.0f;
                if (correcao < -8.0f) correcao = -8.0f;
                vel_alvo_esq -= correcao;
                vel_alvo_dir += correcao;
            }
        }

        // 3. Aplicação do PID de Velocidade
        controle_velocidade(vel_alvo_esq, vel_alvo_dir, 0.01f);
        vTaskDelay(pdMS_TO_TICKS(10));
    }

    // Frenagem e Finalização
    motor_set_speed(MOTOR_LEFT, 0);
    motor_set_speed(MOTOR_RIGHT, 0);
    printf(">>> Celula avancada e centralizada com sucesso!\n");
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

        // Timeout de Segurança (7 segundos máximo para evitar travamento)
        if ((xTaskGetTickCount() - tempo_inicio) > pdMS_TO_TICKS(7000)) {
            printf(">>> Timeout de navegacao estourado. Frenagem de emergencia!\n");
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

    motor_set_speed(MOTOR_LEFT, 0);
    motor_set_speed(MOTOR_RIGHT, 0);
}

void andar_corredor_centralizado(float vel_base_cm_s, float dist_parada_frontal_cm) {
    printf("\n>>> MODO WALL FOLLOWING (FUSAO DE SENSORES)\n");
    
    int32_t ticks_inicio = encoder_get_right_ticks();
    
    pid_motor_esq.reset();
    pid_motor_dir.reset();

    int dist_frontal, dist_esq, dist_dir;
    
    bool modo_cego = false;
    int32_t ticks_alvo_cego = 0;
    int32_t ticks_inicio_cego = 0;

    // Constante do Wall Following
    float Kp_parede = 0.2f; 

    while (true) {
        int32_t ticks_atuais = encoder_get_right_ticks();
        int32_t ticks_andados = std::abs(ticks_atuais - ticks_inicio);

        float vel_alvo_esq = vel_base_cm_s;
        float vel_alvo_dir = vel_base_cm_s;

        // Tenta ler os 3 Lasers
        if (tof_get_distances_mm(&dist_frontal, &dist_esq, &dist_dir)) {
            
            // --- 1. MALHA DE DIREÇÃO (WALL FOLLOWING) ---
            float erro_parede_mm = 0;
            bool tem_parede = false;
            float centro_ideal = 32.5f; // Clearance ideal considerando dimensões do chassi (115mm) na célula (180mm)
            
            if (dist_esq < 150 && dist_dir < 150) {
                // Fusão de sensores: Utiliza a diferença absoluta entre as paredes
                erro_parede_mm = (float)(dist_esq - dist_dir);
                tem_parede = true;
            } else if (dist_esq < 150) {
                // Estratégia de repulsão unilateral: Corrige a trajetória apenas se a distância for crítica (< centro_ideal)
                if (dist_esq < centro_ideal) {
                    erro_parede_mm = (dist_esq - centro_ideal) * 2.0f;
                    tem_parede = true;
                }
            } else if (dist_dir < 150) {
                // Estratégia de repulsão unilateral
                if (dist_dir < centro_ideal) {
                    erro_parede_mm = (centro_ideal - dist_dir) * 2.0f; 
                    tem_parede = true;
                }
            }

            if (tem_parede) {
                float correcao = erro_parede_mm * Kp_parede;
                
                // Limita a correção máxima para evitar loucuras
                if (correcao > 8.0f) correcao = 8.0f;
                if (correcao < -8.0f) correcao = -8.0f;
                
                vel_alvo_esq -= correcao;
                vel_alvo_dir += correcao;
            }

            // --- 2. PONTO DE ANCORAGEM (FRENAGEM) ---
            // Validação de integridade: O sensor ToF retorna -1 em caso de falha de leitura I2C.
            if (!modo_cego && dist_frontal > 0 && dist_frontal < 8000) {
                float dist_frontal_cm = dist_frontal / 10.0f;
                
                // Ancoragem ocorre aos 10.0 cm da parede
                if (dist_frontal_cm <= 10.0f) {
                    float dist_restante_cm = dist_frontal_cm - dist_parada_frontal_cm;
                    
                    if (dist_restante_cm <= 0) {
                        printf(">>> Ja passou do alvo! FREANDO!\n");
                        break;
                    }
                    
                    // Converte os centímetros restantes em Ticks de Encoder
                    ticks_alvo_cego = (int32_t)(dist_restante_cm * TICKS_POR_CM);
                    ticks_inicio_cego = ticks_atuais;
                    modo_cego = true;
                    
                    printf(">>> Ponto de ancoragem atingido a %.1f cm. Transicao para odometria cega por %.1f cm...\n", 
                           dist_frontal_cm, dist_restante_cm);
                }
            }
        }

        // --- 3. FRENAGEM CEGA (ODOMETRIA) ---
        if (modo_cego) {
            int32_t andados_cego = std::abs(ticks_atuais - ticks_inicio_cego);
            if (andados_cego >= ticks_alvo_cego) {
                break;
            }
        }

        // --- 4. EXECUTA OS MOTORES ---
        controle_velocidade(vel_alvo_esq, vel_alvo_dir, 0.01f);
        vTaskDelay(pdMS_TO_TICKS(10));
    }

    // Finalização e frenagem
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
