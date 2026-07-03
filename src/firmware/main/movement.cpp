#include "movement.hpp"
#include "navigation.hpp"
#include "encoder.hpp"
#include "motor_driver.hpp"
#include "switches.hpp"
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "wallfollowing.hpp"
#include "../floodfill/flood_fill.h"
#include <string.h>
#include "tof_sensor.hpp"
#include "telemetry.hpp"

const char* direcao_to_string(Direcao d) {
    switch(d) {
        case NORTE: return "NORTE";
        case LESTE: return "LESTE";
        case SUL:   return "SUL";
        case OESTE: return "OESTE";
        default:    return "UNK";
    }
}

// Ponto de entrada do loop de missão do Micromouse. Concentra a inicialização de periféricos 
// e rege a Máquina de Estados (FSM) de movimentação do robô.

enum EstadoFSM {
    CALIBRATING,
    IDLE,
    MAPPING,
    GOAL_REACHED,
    FAST_RUN
};

EstadoFSM estado_atual = CALIBRATING;

void MoveTask(void *parametrospv) {
    // Inicialização do Hardware
    encoder_init(); 
    motor_init();   
    switches_init();
    navigation_init();

    // Lendo a chave de tamanho apenas uma vez no inicio
    int tamanho_labirinto = is_maze_size_8x8() ? 8 : 4;
    std::vector<std::pair<int,int>> metas;
    if (tamanho_labirinto == 8) {
        metas = {{3,3}, {3,4}, {4,3}, {4,4}};
    } else { 
        metas = {{1,1}, {1,2}, {2,1}, {2,2}};
    }

    ff_inicializar(tamanho_labirinto, tamanho_labirinto, metas);
    
    int pos_x = 0;
    int pos_y = 0;
    Direcao orientacao = NORTE;
    int ticks_calibracao = 0;
    int ticks_idle = 0; // Novo contador para o log no IDLE

    printf("\n=== MICROMOUSE LIGADO ===\n");
    printf("Entrando em modo CALIBRATING (2 segundos)...\n");

    while (true) {
        // Leitura constante de sensores independente do estado
        int f=-1, e=-1, d=-1;
        tof_get_distances_mm(&f, &e, &d);

        // Prepara o pacote base de telemetria
        PacoteTelemetria pkt;
        memset(&pkt, 0, sizeof(PacoteTelemetria));
        pkt.pos_x = pos_x;
        pkt.pos_y = pos_y;
        strncpy(pkt.orientacao, direcao_to_string(orientacao), 7);
        pkt.bateria_v = 7.4; 
        pkt.dist_frontal = f;
        pkt.dist_esq = e;
        pkt.dist_dir = d;

        switch (estado_atual) {

            case CALIBRATING: {
                strncpy(pkt.estado_fsm, "CALIBRATING", 15);
                xQueueSend(FilaTelemetria, &pkt, 0);

                ticks_calibracao++;
                if (ticks_calibracao > 20) { // ~2 segundos (20 * 100ms = 2s)
                    printf("Calibracao concluida. Indo para IDLE.\n");
                    printf("Pressione o botao fisico (START) para iniciar a missao...\n");
                    estado_atual = IDLE;
                }
                vTaskDelay(pdMS_TO_TICKS(100)); // Roda a 10Hz na calibração
                break;
            }

            case IDLE: {
                strncpy(pkt.estado_fsm, "IDLE", 15);
                xQueueSend(FilaTelemetria, &pkt, 0);

                // Print periódico sem travar a tela (a cada 1 segundo = 10 ticks de 100ms)
                ticks_idle++;
                if (ticks_idle >= 10) {
                    printf("IDLE: Aguardando START (Labirinto configurado: %dx%d)\n", tamanho_labirinto, tamanho_labirinto);
                    ticks_idle = 0;
                }

                if (is_start_pressed()) {
                    printf("\n>>> START DETECTADO!\n");
                    vTaskDelay(pdMS_TO_TICKS(1000)); // Pausa de 1s para o usuario tirar a mao
                    
                    estado_atual = MAPPING;
                } else {
                    vTaskDelay(pdMS_TO_TICKS(100)); // Aguarda botao
                }
                break;
            }

            case MAPPING: {
                bool tem_frente = (f > 0 && f < 150);
                bool tem_dir    = (d > 0 && d < 150);
                bool tem_esq    = (e > 0 && e < 150);

                Direcao dir_frente = orientacao;
                Direcao dir_esq = (Direcao)((orientacao + 3) % 4);
                Direcao dir_dir = (Direcao)((orientacao + 1) % 4);

                if (tem_frente) ff_parede(pos_x, pos_y, dir_frente);
                if (tem_esq)    ff_parede(pos_x, pos_y, dir_esq);
                if (tem_dir)    ff_parede(pos_x, pos_y, dir_dir);

                uint8_t mascara_paredes = 0;
                if (labirinto[pos_x][pos_y].parede_norte) mascara_paredes |= 1;
                if (labirinto[pos_x][pos_y].parede_leste) mascara_paredes |= 2;
                if (labirinto[pos_x][pos_y].parede_sul)   mascara_paredes |= 4;
                if (labirinto[pos_x][pos_y].parede_oeste) mascara_paredes |= 8;

                ff_visitado(pos_x, pos_y);
                ff_recalcular();

                // Completa o pacote com dados de mapping
                strncpy(pkt.estado_fsm, "MAPPING", 15);
                pkt.paredes = mascara_paredes;
                xQueueSend(FilaTelemetria, &pkt, 0);

                bool na_meta = false;
                for (auto m : metas) {
                    if (m.first == pos_x && m.second == pos_y) {
                        na_meta = true; break;
                    }
                }
                
                if (na_meta) {
                    printf("\n>>> LABIRINTO RESOLVIDO! Meta: %d, %d <<<\n", pos_x, pos_y);
                    estado_atual = GOAL_REACHED;
                    break; // Sai do switch case
                }

                Direcao proxima_dir = ff_melhor_movimento(pos_x, pos_y, orientacao);
                
                if (proxima_dir != orientacao) {
                    int diff = (proxima_dir - orientacao);
                    if (diff == 1 || diff == -3) {
                        girar_graus(90.0f, true); 
                    } else if (diff == -1 || diff == 3) {
                        girar_graus(90.0f, false);
                    } else {
                        girar_graus(180.0f, true);
                    }
                    orientacao = proxima_dir;
                    vTaskDelay(pdMS_TO_TICKS(300));
                }
                
                mover_celula_wallfollowing();
                vTaskDelay(pdMS_TO_TICKS(200)); 
                
                if (orientacao == NORTE) pos_y++;
                else if (orientacao == SUL) pos_y--;
                else if (orientacao == LESTE) pos_x++;
                else if (orientacao == OESTE) pos_x--;

                break;
            }

            case GOAL_REACHED: {
                strncpy(pkt.estado_fsm, "GOAL_REACHED", 15);
                // Envia continuamente pra garantir que o backend receba e feche o JSON
                xQueueSend(FilaTelemetria, &pkt, 0);
                
                // Futuramente pode checar o botao aqui para ir para FAST_RUN
                vTaskDelay(pdMS_TO_TICKS(1000));
                break;
            }
            
            case FAST_RUN: {

                vTaskDelay(pdMS_TO_TICKS(1000));
                break;
            }
        }
    }
}
