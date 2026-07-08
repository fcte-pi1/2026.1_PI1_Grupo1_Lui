#pragma once

#include <stdint.h>

/**
 * Inicializa os controladores PID e outros subsistemas necessários
 * para a navegação de alto nível. Deve ser chamada no início da MoveTask.
 */
void navigation_init();

/**
 * Move o robô para frente uma distância fixa de 18cm (1 célula do labirinto).
 * Essa função é bloqueante e usa PID duplo.
 */
void mover_celula();

/**
 * Avança exatos 18cm utilizando PID e Fusão de Sensores ToF laterais
 * para se manter perfeitamente no centro do corredor (Wall Following Inteligente).
 */
void mover_celula_wallfollowing();

/**
 * Move o robô para frente a distância especificada em centímetros.
 * Essa função é bloqueante e usa PID duplo.
 */
void andar_reto_cm(float cm);

/**
 * Funções de Acesso (Getters) para dados internos do PID e motores.
 * Utilizado pelo movement.cpp para compor a telemetria oficial.
 */
int get_last_pwm_esq();
int get_last_pwm_dir();
float get_last_erro_pid();
float get_last_vel_media();

/**
 * Move o robô em modo cauteloso (apenas odometria cega)
 * até encontrar uma parede na distância especificada.
 */
void andar_ate_parede(float dist_parada_cm);

/**
 * Função Avançada de Fusão de Sensores:
 * Usa os ToFs laterais para se manter reto no corredor (Wall Following)
 * e o ToF frontal + Encoder para frear de forma exata, ignorando a zona cega.
 */
void andar_corredor_centralizado(float vel_base_cm_s, float dist_parada_frontal_cm);

/**
 * Rotina de diagnóstico de hardware (I2C): Realiza pooling passivo dos sensores ToF 
 * sem acionamento mecânico dos motores.
 */
void testar_tofs_estatico();

/**
 * Gira o robô no próprio eixo usando controle PID nas duas rodas.
 * @param graus Ângulo de giro
 * @param direita Se true gira para a direita, se false para a esquerda.
 */
void girar_graus(float graus, bool direita);
