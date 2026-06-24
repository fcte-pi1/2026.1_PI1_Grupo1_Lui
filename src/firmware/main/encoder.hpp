#pragma once

#include <stdint.h>

void encoder_init();

int32_t encoder_get_left_ticks();
int32_t encoder_get_right_ticks();

// Retorna a velocidade linear das rodas em centimetros por segundo (cm/s)
float encoder_get_left_velocity_cms();
float encoder_get_right_velocity_cms();