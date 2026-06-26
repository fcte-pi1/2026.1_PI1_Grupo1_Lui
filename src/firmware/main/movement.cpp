#include "movement.hpp"
#include "telemetry.hpp"
#include "tof_sensor.hpp"
#include "ina219.hpp"
#include "pid.hpp"
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "switches.hpp"
#include "flood_fill.h"
#include <string.h>
#include <stdio.h>
#include <cmath>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

// ===========================================================================
// FSM
// ===========================================================================

enum RobotState {
    IDLE,
    CALIBRATING,
    MAPPING,
    TURNING,
    TURNING_180,
    GOAL_REACHED,
    ERROR
};

// ===========================================================================
// ODOMETRIA
// ===========================================================================
// [PONTO 1] TICKS_PER_CELL: usar modo CALIBRATING para medir.
//           Procedimento: posicionar o robo no inicio da celula, pressionar
//           START, empurrar 18 cm ate o inicio da proxima celula, pressionar
//           START de novo. O valor correto aparece no serial. Substituir aqui
//           e recompilar.
//
// [PONTO 2] DISTANCIA_ENTRE_RODAS_CM: medir com paquimetro do centro da
//           roda esquerda ao centro da roda direita (superficie de contato
//           com o chao, nao a largura do chassis). Isso impacta diretamente
//           TICKS_PER_TURN_90 - um erro de 2mm aqui vira ~5 graus de erro
//           no giro.

static const float   DISTANCIA_ENTRE_RODAS_CM = 9.5f;   // <<< [PONTO 2] MEDIR
static int32_t       TICKS_PER_CELL            = 800;    // <<< [PONTO 1] CALIBRAR
                                                          //     (nao e const: pode ser
                                                          //      atualizado em runtime)
static float         TICKS_POR_CM              = 800.0f / 18.0f; // recalculado apos calib

// Recalculado em runtime apos calibracao. Formula:
//   arco percorrido por cada roda num giro de 90 graus =
//   (PI/2) * raio_giro = (PI/2) * (dist_entre_rodas/2) * 2  <- giro no proprio eixo
//   raio efetivo = dist_entre_rodas / 2
//   arco = (PI/2) * (dist_entre_rodas / 2) * 2 = (PI/2) * dist_entre_rodas
static int32_t TICKS_PER_TURN_90 = 660; // sera recalculado no inicio da task

static const int PWM_GIRO = 120; // Reduzir para 90-100 se escorregar no giro

// ===========================================================================
// THRESHOLDS DE PAREDES (mm)
// ===========================================================================
// [PONTO 4] Limite frontal aumentado: 30 mm era tarde demais para frear.
//           Com 18 cm de celula e velocidade de 15 cm/s, o robo leva ~120 ms
//           para percorrer os ultimos 18 mm. A 10 Hz de controle isso e
//           apenas 1 ciclo de margem. 60 mm da ~400 ms de reacao.
//
//           Separamos em dois niveis:
//           - ALERTA: desaceleramento de emergencia
//           - CRITICO: para imediatamente e vai para ERROR

static const int LIMIAR_PAREDE_FRONTAL_ALERTA  = 120; // mm - inicia freagem de emergencia
static const int LIMIAR_PAREDE_FRONTAL_CRITICO =  40; // mm - para e vai para ERROR
static const int LIMIAR_PAREDE_LATERAL         = 110; // mm - deteccao de parede lateral

// Distancia ideal da parede lateral (folga de 29 mm de cada lado)
// Usada no modo de parede unica
static const float DIST_PAREDE_IDEAL_MM = 29.0f;

// ===========================================================================
// VELOCIDADES
// ===========================================================================

static const float VELOCIDADE_BASE_CMS    = 15.0f;
static const float VELOCIDADE_MINIMA_CMS  =  6.0f; // minimo na desaceleracao

// ===========================================================================
// HEADING POR ENCODER
// ===========================================================================
// [PONTO 5] O heading acumula o desvio angular calculado a partir da
//           diferenca de ticks entre os dois encoders. Ele e zerado ao
//           iniciar cada celula e usado como correcao adicional quando
//           nao ha paredes laterais (corredor aberto).
//
//           Formula: heading_rad = (ticks_dir - ticks_esq) / TICKS_POR_CM
//                                  / DISTANCIA_ENTRE_RODAS_CM
//           Em radianos. Positivo = deriva para a direita.
//
//           O ganho KP_HEADING converte radianos em correcao de velocidade
//           (cm/s). Comecar com 5.0 e ajustar na pista.

static const float KP_HEADING = 5.0f;

// ===========================================================================
// FUNCOES AUXILIARES
// ===========================================================================

static Direcao direcao_absoluta(Direcao atual, int relativo) {
    return (Direcao)((atual + relativo) % 4);
}

static void detectar_paredes(int x, int y, Direcao dir_atual,
                              int dist_f, int dist_e, int dist_d) {
    if (dist_f > 0 && dist_f < LIMIAR_PAREDE_FRONTAL_ALERTA) {
        Direcao d = direcao_absoluta(dir_atual, 0);
        ff_parede(x, y, d);
        printf("PAREDE: frente (dir abs %d, %d mm)\n", d, dist_f);
    }
    if (dist_d > 0 && dist_d < LIMIAR_PAREDE_LATERAL) {
        Direcao d = direcao_absoluta(dir_atual, 1);
        ff_parede(x, y, d);
        printf("PAREDE: direita (dir abs %d, %d mm)\n", d, dist_d);
    }
    if (dist_e > 0 && dist_e < LIMIAR_PAREDE_LATERAL) {
        Direcao d = direcao_absoluta(dir_atual, 3);
        ff_parede(x, y, d);
        printf("PAREDE: esquerda (dir abs %d, %d mm)\n", d, dist_e);
    }
}

// Calcula correcao lateral baseada no modo disponivel de sensores.
//
// [PONTO 3] Modo de parede unica:
//   - Duas paredes: erro = dist_esq - dist_dir  (centralizacao simetrica)
//   - So esquerda:  erro = dist_esq - IDEAL      (segue paralelo a parede esq)
//   - So direita:   erro = IDEAL   - dist_dir    (segue paralelo a parede dir)
//   - Nenhuma:      retorna 0 (controle pelo heading dos encoders)
//
// Retorna o erro em mm para o pid_parede (setpoint = 0).

static float calcular_erro_lateral(int dist_e, int dist_d) {
    bool tem_esq = (dist_e > 0 && dist_e < LIMIAR_PAREDE_LATERAL);
    bool tem_dir = (dist_d > 0 && dist_d < LIMIAR_PAREDE_LATERAL);

    if (tem_esq && tem_dir) {
        // Caso nominal: centraliza entre as duas paredes
        return (float)(dist_e - dist_d);
    } else if (tem_esq) {
        // So parede esquerda: mantem distancia ideal da esq
        // erro > 0 => longe da esq => corrige pra esq (reduz vel esq)
        return (float)dist_e - DIST_PAREDE_IDEAL_MM;
    } else if (tem_dir) {
        // So parede direita: mantem distancia ideal da dir
        // erro < 0 => longe da dir => corrige pra dir (aumenta vel esq)
        return DIST_PAREDE_IDEAL_MM - (float)dist_d;
    }
    return 0.0f; // nenhuma parede lateral visivel
}

// ===========================================================================
// TASK PRINCIPAL
// ===========================================================================

void MoveTask(void *parametrospv) {

    // -----------------------------------------------------------------------
    // Telemetria inicial
    // -----------------------------------------------------------------------
    PacoteTelemetria pacote;
    pacote.bateria_v    = 7.4f;
    pacote.pos_x        = 0;
    pacote.pos_y        = 0;
    pacote.dist_frontal = -1;
    pacote.dist_esq     = -1;
    pacote.dist_dir     = -1;
    strcpy(pacote.estado_fsm, "IDLE");

    // -----------------------------------------------------------------------
    // Perifericos
    // -----------------------------------------------------------------------
    Ina219 ina;
    bool ina_ok = ina.init();

    encoder_init();
    motor_init();
    switches_init();

    // -----------------------------------------------------------------------
    // Recalcula constantes derivadas (caso TICKS_PER_CELL seja alterado
    // em runtime pelo modo CALIBRATING)
    // -----------------------------------------------------------------------
    TICKS_POR_CM     = (float)TICKS_PER_CELL / 18.0f;
    TICKS_PER_TURN_90 = (int32_t)((M_PI / 2.0f) * DISTANCIA_ENTRE_RODAS_CM * TICKS_POR_CM);
    printf("INIT: TICKS_PER_TURN_90 = %ld\n", (long)TICKS_PER_TURN_90);

    // -----------------------------------------------------------------------
    // PIDs
    // -----------------------------------------------------------------------
    PID pid_parede;
    // Kp=8 Ki=0.2 Kd=1: funciona para centralizacao com duas paredes.
    // Com parede unica o mesmo ganho se aplica pois o erro esta na mesma
    // escala (mm). Afinar na pista se houver oscilacao.
    pid_parede.init(8.0f, 0.2f, 1.0f, 50.0f, 255.0f);

    PID pid_motor_esq;
    PID pid_motor_dir;
    pid_motor_esq.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f);
    pid_motor_dir.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f);

    // -----------------------------------------------------------------------
    // Estado da FSM
    // -----------------------------------------------------------------------
    RobotState estado_atual = IDLE;

    int     pos_x         = 0;
    int     pos_y         = 0;
    Direcao direcao_atual = NORTE;

    // Odometria por celula
    int32_t ticks_start_left  = 0;
    int32_t ticks_start_right = 0;

    // [PONTO 5] Heading acumulado dentro da celula atual (radianos)
    // Zerado ao iniciar cada nova celula.
    float heading_acumulado = 0.0f;
    int32_t ticks_heading_ref_left  = 0;
    int32_t ticks_heading_ref_right = 0;

    // Giro
    int32_t ticks_turn_start_left  = 0;
    int32_t ticks_turn_start_right = 0;
    bool    pending_turn_left      = true;
    int     turn_180_restantes     = 0;

    // Calibracao
    TickType_t calibration_start_time = 0;
    bool       calibration_measuring  = false;
    int32_t    calib_ticks_start_l    = 0;
    int32_t    calib_ticks_start_r    = 0;

    // FloodFill
    bool ff_iniciado = false;

    const float dt = 0.1f; // 10 Hz

    // -----------------------------------------------------------------------
    // Loop principal
    // -----------------------------------------------------------------------
    for (;;) {

        int dist_f = -1, dist_e = -1, dist_d = -1;
        if (tof_get_distances_mm(&dist_f, &dist_e, &dist_d)) {
            pacote.dist_frontal = dist_f;
            pacote.dist_esq     = dist_e;
            pacote.dist_dir     = dist_d;
        }

        if (ina_ok) {
            const Ina219Dados data_ina = ina.getDados();
            if (data_ina.bus_ok) {
                pacote.bateria_v = data_ina.bus_voltage_mv / 1000.0f;
            }
        } else {
            ina_ok = ina.init();
        }

        float vel_real_esq = encoder_get_left_velocity_cms();
        float vel_real_dir = encoder_get_right_velocity_cms();

        // ===================================================================
        switch (estado_atual) {
        // ===================================================================

        case IDLE:
            strcpy(pacote.estado_fsm, "IDLE");
            motor_set_speed(MOTOR_LEFT,  0);
            motor_set_speed(MOTOR_RIGHT, 0);

            if (is_start_pressed()) {
                printf("FSM: IDLE -> CALIBRATING. Tamanho: %s\n",
                       is_maze_size_8x8() ? "8x8" : "4x4");
                calibration_start_time = xTaskGetTickCount();
                calibration_measuring  = false;
                estado_atual = CALIBRATING;
            }
            break;

        // -------------------------------------------------------------------
        // CALIBRATING
        // -------------------------------------------------------------------
        // Uso:
        //   1. Posicionar o robo no inicio exato de uma celula (encostado na
        //      parede traseira ou alinhado com a linha de grade).
        //   2. Pressionar START => robo aguarda 2 s parado.
        //   3. Empurrar o robo manualmente ate o inicio da celula seguinte
        //      (exatamente 18 cm / 180 mm).
        //   4. Pressionar START de novo => valor impresso no serial.
        //   5. Substituir TICKS_PER_CELL acima e recompilar.
        // -------------------------------------------------------------------
        case CALIBRATING:
            strcpy(pacote.estado_fsm, "CALIBRATING");
            motor_set_speed(MOTOR_LEFT,  0);
            motor_set_speed(MOTOR_RIGHT, 0);

            if (!calibration_measuring) {
                if ((xTaskGetTickCount() - calibration_start_time) > pdMS_TO_TICKS(2000)) {
                    calib_ticks_start_l = encoder_get_left_ticks();
                    calib_ticks_start_r = encoder_get_right_ticks();
                    calibration_measuring = true;
                    printf("CALIB: Mova o robo 18 cm e pressione START.\n");
                }
            } else {
                if (is_start_pressed()) {
                    int32_t tl = std::abs(encoder_get_left_ticks()  - calib_ticks_start_l);
                    int32_t tr = std::abs(encoder_get_right_ticks() - calib_ticks_start_r);
                    int32_t medido = (tl + tr) / 2;

                    printf("CALIB: TICKS_PER_CELL medido = %ld\n", (long)medido);

                    // Aplica em runtime (sem recompilar) e recalcula derivados
                    TICKS_PER_CELL    = medido;
                    TICKS_POR_CM      = (float)medido / 18.0f;
                    TICKS_PER_TURN_90 = (int32_t)((M_PI / 2.0f) *
                                        DISTANCIA_ENTRE_RODAS_CM * TICKS_POR_CM);

                    printf("CALIB: TICKS_POR_CM=%.2f  TICKS_PER_TURN_90=%ld\n",
                           TICKS_POR_CM, (long)TICKS_PER_TURN_90);
                    printf("CALIB: Substitua TICKS_PER_CELL no codigo e recompile.\n");

                    vTaskDelay(pdMS_TO_TICKS(500)); // debounce

                    ticks_start_left  = encoder_get_left_ticks();
                    ticks_start_right = encoder_get_right_ticks();
                    ticks_heading_ref_left  = ticks_start_left;
                    ticks_heading_ref_right = ticks_start_right;
                    heading_acumulado = 0.0f;

                    estado_atual = MAPPING;
                    printf("FSM: CALIBRATING -> MAPPING\n");
                }
            }
            break;

        // -------------------------------------------------------------------
        // MAPPING
        // -------------------------------------------------------------------
        case MAPPING: {
            strcpy(pacote.estado_fsm, "MAPPING");

            if (!ff_iniciado) {
                int maze_size = is_maze_size_8x8() ? 8 : 4;
                vector<pair<int,int>> meta;
                if (maze_size == 4) {
                    meta = {{1,1},{2,1},{1,2},{2,2}};
                } else {
                    meta = {{3,3},{4,3},{3,4},{4,4}};
                }
                ff_inicializar(maze_size, maze_size, meta);
                ff_iniciado = true;
                printf("FF: Inicializado %dx%d.\n", maze_size, maze_size);
            }

            int32_t cur_l = encoder_get_left_ticks();
            int32_t cur_r = encoder_get_right_ticks();

            int32_t ticks_moved = (std::abs(cur_l - ticks_start_left) +
                                   std::abs(cur_r - ticks_start_right)) / 2;

            // [PONTO 5] Atualiza heading acumulado
            // Diferenca de deslocamento entre as rodas => angulo de desvio
            // positivo = deriva para a direita
            float delta_l_cm = (float)(cur_l - ticks_heading_ref_left)  / TICKS_POR_CM;
            float delta_r_cm = (float)(cur_r - ticks_heading_ref_right) / TICKS_POR_CM;
            heading_acumulado = (delta_r_cm - delta_l_cm) / DISTANCIA_ENTRE_RODAS_CM;
            // heading_acumulado em radianos; pequeno angulo: ~igual ao angulo real

            // [PONTO 4] Protecao frontal em dois niveis
            if (dist_f > 0 && dist_f < LIMIAR_PAREDE_FRONTAL_CRITICO) {
                printf("FSM ERRO: Colisao iminente (%d mm)!\n", dist_f);
                estado_atual = ERROR;
                break;
            }

            bool freagem_emergencia = (dist_f > 0 &&
                                       dist_f < LIMIAR_PAREDE_FRONTAL_ALERTA);

            // --- Celula concluida ---
            if (ticks_moved >= TICKS_PER_CELL) {
                motor_set_speed(MOTOR_LEFT,  0);
                motor_set_speed(MOTOR_RIGHT, 0);
                vTaskDelay(pdMS_TO_TICKS(80));

                pos_x += DX[direcao_atual];
                pos_y += DY[direcao_atual];
                pacote.pos_x = pos_x;
                pacote.pos_y = pos_y;
                ff_visitado(pos_x, pos_y);

                printf("FF: Chegou em (%d,%d) dir=%d heading=%.3f rad\n",
                       pos_x, pos_y, direcao_atual, heading_acumulado);

                detectar_paredes(pos_x, pos_y, direcao_atual, dist_f, dist_e, dist_d);
                ff_recalcular();

                bool chegou = false;
                for (auto& [gx, gy] : objetivo) {
                    if (pos_x == gx && pos_y == gy) {
                        printf("FSM: OBJETIVO em (%d,%d)!\n", pos_x, pos_y);
                        estado_atual = GOAL_REACHED;
                        chegou = true;
                        break;
                    }
                }
                if (chegou) break;

                Direcao prox  = ff_melhor_movimento(pos_x, pos_y, direcao_atual);
                int     delta = ((int)prox - (int)direcao_atual + 4) % 4;

                // Reinicia odometria e heading para a proxima celula
                ticks_start_left  = encoder_get_left_ticks();
                ticks_start_right = encoder_get_right_ticks();
                ticks_heading_ref_left  = ticks_start_left;
                ticks_heading_ref_right = ticks_start_right;
                heading_acumulado = 0.0f;

                if (delta == 0) {
                    printf("FF: Avanca reto\n");
                } else if (delta == 1) {
                    printf("FF: Gira DIREITA\n");
                    pending_turn_left      = false;
                    ticks_turn_start_left  = encoder_get_left_ticks();
                    ticks_turn_start_right = encoder_get_right_ticks();
                    estado_atual = TURNING;
                } else if (delta == 3) {
                    printf("FF: Gira ESQUERDA\n");
                    pending_turn_left      = true;
                    ticks_turn_start_left  = encoder_get_left_ticks();
                    ticks_turn_start_right = encoder_get_right_ticks();
                    estado_atual = TURNING;
                } else {
                    printf("FF: Meia-volta\n");
                    pending_turn_left      = true;
                    turn_180_restantes     = 2;
                    ticks_turn_start_left  = encoder_get_left_ticks();
                    ticks_turn_start_right = encoder_get_right_ticks();
                    estado_atual = TURNING_180;
                }
                break;
            }

            // --- Velocidade alvo com desaceleracao progressiva ---
            // Nos ultimos 25% da celula: escala de 100% ate VELOCIDADE_MINIMA.
            // Em freagem de emergencia: aplica VELOCIDADE_MINIMA imediatamente.
            float vel_base;
            if (freagem_emergencia) {
                vel_base = VELOCIDADE_MINIMA_CMS;
            } else {
                float progresso = (float)ticks_moved / (float)TICKS_PER_CELL;
                float fator_vel = 1.0f;
                if (progresso > 0.75f) {
                    fator_vel = 1.0f - ((progresso - 0.75f) / 0.25f) *
                                (1.0f - VELOCIDADE_MINIMA_CMS / VELOCIDADE_BASE_CMS);
                    if (fator_vel < VELOCIDADE_MINIMA_CMS / VELOCIDADE_BASE_CMS)
                        fator_vel = VELOCIDADE_MINIMA_CMS / VELOCIDADE_BASE_CMS;
                }
                vel_base = VELOCIDADE_BASE_CMS * fator_vel;
            }

            // --- Correcao lateral ---
            // [PONTO 3] calcular_erro_lateral trata os tres casos:
            //   duas paredes / so esquerda / so direita
            float erro_lateral = calcular_erro_lateral(dist_e, dist_d);

            float correcao_parede  = pid_parede.compute(0.0f, erro_lateral, dt);

            // [PONTO 5] Correcao de heading quando nenhuma parede lateral esta
            // disponivel. Quando ha parede, o PID de parede ja garante o
            // alinhamento e o heading seria redundante (pode somar erros).
            bool sem_parede_lateral = (erro_lateral == 0.0f &&
                                       (dist_e <= 0 || dist_e >= LIMIAR_PAREDE_LATERAL) &&
                                       (dist_d <= 0 || dist_d >= LIMIAR_PAREDE_LATERAL));

            float correcao_heading = 0.0f;
            if (sem_parede_lateral) {
                // heading_acumulado > 0 => deriva direita => reduz vel_dir, aumenta vel_esq
                correcao_heading = KP_HEADING * heading_acumulado;
            }

            float correcao_total = correcao_parede + correcao_heading;

            float pwm_esq = pid_motor_esq.compute(vel_base - correcao_total, vel_real_esq, dt);
            float pwm_dir = pid_motor_dir.compute(vel_base + correcao_total, vel_real_dir, dt);

            motor_set_speed(MOTOR_LEFT,  (int)pwm_esq);
            motor_set_speed(MOTOR_RIGHT, (int)pwm_dir);
            break;
        }

        // -------------------------------------------------------------------
        // TURNING (90 graus por encoder)
        // -------------------------------------------------------------------
        case TURNING: {
            strcpy(pacote.estado_fsm, "TURNING");

            int32_t tl = std::abs(encoder_get_left_ticks()  - ticks_turn_start_left);
            int32_t tr = std::abs(encoder_get_right_ticks() - ticks_turn_start_right);
            int32_t avg_turn = (tl + tr) / 2;

            if (avg_turn >= TICKS_PER_TURN_90) {
                motor_set_speed(MOTOR_LEFT,  0);
                motor_set_speed(MOTOR_RIGHT, 0);

                if (pending_turn_left) {
                    direcao_atual = (Direcao)((direcao_atual + 3) % 4);
                } else {
                    direcao_atual = (Direcao)((direcao_atual + 1) % 4);
                }
                printf("FSM: Giro concluido. Direcao: %d\n", direcao_atual);

                ticks_start_left        = encoder_get_left_ticks();
                ticks_start_right       = encoder_get_right_ticks();
                ticks_heading_ref_left  = ticks_start_left;
                ticks_heading_ref_right = ticks_start_right;
                heading_acumulado       = 0.0f;
                estado_atual = MAPPING;
                break;
            }

            if (pending_turn_left) {
                motor_set_speed(MOTOR_LEFT,  -PWM_GIRO);
                motor_set_speed(MOTOR_RIGHT,  PWM_GIRO);
            } else {
                motor_set_speed(MOTOR_LEFT,   PWM_GIRO);
                motor_set_speed(MOTOR_RIGHT, -PWM_GIRO);
            }
            break;
        }

        // -------------------------------------------------------------------
        // TURNING_180 (dois giros de 90)
        // -------------------------------------------------------------------
        case TURNING_180: {
            strcpy(pacote.estado_fsm, "TURN180");

            int32_t tl = std::abs(encoder_get_left_ticks()  - ticks_turn_start_left);
            int32_t tr = std::abs(encoder_get_right_ticks() - ticks_turn_start_right);
            int32_t avg_turn = (tl + tr) / 2;

            if (avg_turn >= TICKS_PER_TURN_90) {
                motor_set_speed(MOTOR_LEFT,  0);
                motor_set_speed(MOTOR_RIGHT, 0);
                vTaskDelay(pdMS_TO_TICKS(50));

                direcao_atual = (Direcao)((direcao_atual + 3) % 4);
                turn_180_restantes--;

                printf("FSM: Giro parcial. Restam: %d. Direcao: %d\n",
                       turn_180_restantes, direcao_atual);

                if (turn_180_restantes <= 0) {
                    ticks_start_left        = encoder_get_left_ticks();
                    ticks_start_right       = encoder_get_right_ticks();
                    ticks_heading_ref_left  = ticks_start_left;
                    ticks_heading_ref_right = ticks_start_right;
                    heading_acumulado       = 0.0f;
                    estado_atual = MAPPING;
                } else {
                    ticks_turn_start_left  = encoder_get_left_ticks();
                    ticks_turn_start_right = encoder_get_right_ticks();
                }
                break;
            }

            motor_set_speed(MOTOR_LEFT,  -PWM_GIRO);
            motor_set_speed(MOTOR_RIGHT,  PWM_GIRO);
            break;
        }

        // -------------------------------------------------------------------
        case GOAL_REACHED:
            strcpy(pacote.estado_fsm, "GOAL");
            motor_disable();
            break;

        case ERROR:
            strcpy(pacote.estado_fsm, "ERROR");
            motor_disable();
            break;

        } // switch

        xQueueSend(FilaTelemetria, &pacote, 0);
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}