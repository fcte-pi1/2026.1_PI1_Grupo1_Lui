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
 * Move o robô para frente a distância especificada em centímetros.
 * Essa função é bloqueante e usa PID duplo.
 */
void andar_reto_cm(float cm);

/**
 * Move o robô para frente até que o sensor ToF Frontal 
 * detecte uma parede a uma distância menor ou igual a dist_parada_cm.
 */
void andar_ate_parede(float dist_parada_cm);

/**
 * Função segura para testes: fica num loop infinito lendo os 3 ToFs
 * e enviando os dados para o monitor serial e backend, sem ligar os motores.
 */
void testar_tofs_estatico();

/**
 * Gira o robô no próprio eixo usando controle PID nas duas rodas.
 * @param graus Ângulo de giro
 * @param direita Se true gira para a direita, se false para a esquerda.
 */
void girar_graus(float graus, bool direita);
