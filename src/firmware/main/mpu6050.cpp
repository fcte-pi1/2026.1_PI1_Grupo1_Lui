#include "mpu6050.hpp"
#include "driver/i2c.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_timer.h"

static const char *TAG = "MPU6050";

#define MPU6050_ADDR         0x68
#define MPU6050_PWR_MGMT_1   0x6B
#define MPU6050_GYRO_CONFIG  0x1B
#define MPU6050_GYRO_XOUT_H  0x43
#define MPU6050_GYRO_XOUT_L  0x44

// Fator empírico de correção: Se o robô gira 180º físicos quando deveria ser 90º,
// significa que a integração está pela metade. Multiplicar por 2.0 corrige o erro de escala do chip.
#define GYRO_SCALE_FACTOR 2.0f 

static volatile float global_yaw = 0.0f;
static float gyro_x_offset = 0.0f;

static esp_err_t i2c_write_reg(uint8_t reg, uint8_t data) {
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (MPU6050_ADDR << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_write_byte(cmd, data, true);
    i2c_master_stop(cmd);
    esp_err_t ret = i2c_master_cmd_begin(I2C_NUM_0, cmd, pdMS_TO_TICKS(10));
    i2c_cmd_link_delete(cmd);
    return ret;
}

static esp_err_t i2c_read_reg16(uint8_t reg, int16_t *val) {
    uint8_t data_h, data_l;
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (MPU6050_ADDR << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (MPU6050_ADDR << 1) | I2C_MASTER_READ, true);
    i2c_master_read_byte(cmd, &data_h, I2C_MASTER_ACK);
    i2c_master_read_byte(cmd, &data_l, I2C_MASTER_NACK);
    i2c_master_stop(cmd);
    esp_err_t ret = i2c_master_cmd_begin(I2C_NUM_0, cmd, pdMS_TO_TICKS(10));
    i2c_cmd_link_delete(cmd);
    
    if (ret == ESP_OK) {
        *val = (int16_t)((data_h << 8) | data_l);
    }
    return ret;
}

static void mpu6050_task(void *pvParameters) {
    TickType_t last_wake_time = xTaskGetTickCount();
    int64_t last_time = esp_timer_get_time();
    
    while (1) {
        int16_t raw_x = 0;
        if (i2c_read_reg16(MPU6050_GYRO_XOUT_H, &raw_x) == ESP_OK) {
            int64_t current_time = esp_timer_get_time();
            float dt = (current_time - last_time) / 1000000.0f;
            last_time = current_time;

            // Previne pulos gigantes se a thread travar
            if (dt > 0.1f) dt = 0.01f;

            // Conversão com LSB 65.5 para escala ±500°/s e aplicação do Fator de Correção Física
            float rate_x = (((float)raw_x / 65.5f) - gyro_x_offset) * GYRO_SCALE_FACTOR;
            
            if (rate_x > -1.0f && rate_x < 1.0f) rate_x = 0.0f;
            
            global_yaw += rate_x * dt;
        } else {
            ESP_LOGE(TAG, "Falha ao ler o MPU6050");
            last_time = esp_timer_get_time(); // Evita acumular dt durante falhas
        }
        
        vTaskDelayUntil(&last_wake_time, pdMS_TO_TICKS(10));
    }
}

void mpu6050_init() {
    ESP_LOGI(TAG, "Inicializando MPU6050...");
    
    // Acorda o sensor (remove do modo sleep)
    if (i2c_write_reg(MPU6050_PWR_MGMT_1, 0x00) != ESP_OK) {
        ESP_LOGE(TAG, "Erro ao acordar o MPU6050! Verifique as conexões.");
        return;
    }
    vTaskDelay(pdMS_TO_TICKS(100));
    
    // Configura o fundo de escala do giroscópio para ±500°/s
    i2c_write_reg(MPU6050_GYRO_CONFIG, 0x08);
    
    // Calibração de Offset (lê parado para achar o zero)
    ESP_LOGI(TAG, "Calibrando Giroscópio (NÃO MOVA O ROBÔ)...");
    float sum_x = 0;
    int samples = 0;
    for (int i = 0; i < 100; i++) {
        int16_t raw_x = 0;
        if (i2c_read_reg16(MPU6050_GYRO_XOUT_H, &raw_x) == ESP_OK) {
            sum_x += (float)raw_x / 65.5f;
            samples++;
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
    if (samples > 0) {
        gyro_x_offset = sum_x / samples;
    }
    ESP_LOGI(TAG, "Calibração completa. Offset X: %.2f", gyro_x_offset);
    
    // Inicia a task de integração do giroscópio
    xTaskCreatePinnedToCore(mpu6050_task, "MPU6050_Task", 4096, NULL, 5, NULL, 1);
}

void mpu6050_reset_yaw() {
    global_yaw = 0.0f;
}

float mpu6050_get_yaw() {
    return global_yaw;
}
