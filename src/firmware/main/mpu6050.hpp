#pragma once

#include <stdint.h>

/**
 * @brief Inicializa o giroscópio MPU6050 via I2C (I2C_NUM_0)
 *        O sensor ToF já deve ter inicializado o I2C_NUM_0, então esta função
 *        apenas acorda o MPU6050 e configura a escala do giroscópio.
 *        Também cria uma FreeRTOS task que vai rodar a 100Hz para ler e integrar o ângulo.
 */
void mpu6050_init();

/**
 * @brief Reseta o ângulo yaw integrado para 0.0
 *        Usado imediatamente antes de iniciar um giro de 90 graus.
 */
void mpu6050_reset_yaw();

/**
 * @brief Retorna o ângulo atual (yaw) integrado no eixo Z, em graus.
 */
float mpu6050_get_yaw();
