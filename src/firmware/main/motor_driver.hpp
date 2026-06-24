#pragma once

#include <stdint.h>

// Enum para identificar os motores
enum MotorSide {
    MOTOR_LEFT,
    MOTOR_RIGHT
};

/**
 * Configura os pinos de direção e os canais de PWM (LEDC) para os dois motores (L298N).
 * Deve ser chamado apenas uma vez no boot.
 */
void motor_init();

/**
 * Define a velocidade e a direção do motor.
 * @param side Qual motor (MOTOR_LEFT ou MOTOR_RIGHT).
 * @param pwm_value Força de -255 a 255. 
 *        Valores positivos giram para frente, negativos para trás. 0 é parada.
 */
void motor_set_speed(MotorSide side, int pwm_value);