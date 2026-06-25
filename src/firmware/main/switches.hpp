#pragma once
#include "driver/gpio.h"

#define PIN_SWITCH_START      GPIO_NUM_34
#define PIN_SWITCH_MAZE_SIZE  GPIO_NUM_39

void switches_init();

// Retorna true para 8x8 e false para 4x4
bool is_maze_size_8x8();

// Retorna true se a chave de start estiver acionada (robô liberado para andar)
bool is_start_pressed();
