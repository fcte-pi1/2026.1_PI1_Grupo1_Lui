#include "motor_driver.hpp"
#include "driver/ledc.h"
#include "driver/gpio.h"
#include <cmath>

// --- Configurações Físicas do L298N ---

// Motor Esquerdo (Lado B do L298N)
constexpr gpio_num_t PIN_MOTOR_L_IN3 = GPIO_NUM_25; // Direção 1 (IN3)
constexpr gpio_num_t PIN_MOTOR_L_IN4 = GPIO_NUM_32; // Direção 2 (IN4)
constexpr gpio_num_t PIN_MOTOR_L_PWM = GPIO_NUM_33; // Velocidade (ENB)

// Motor Direito (Lado A do L298N)
constexpr gpio_num_t PIN_MOTOR_R_IN1 = GPIO_NUM_26; // Direção 1 (IN1)
constexpr gpio_num_t PIN_MOTOR_R_IN2 = GPIO_NUM_27; // Direção 2 (IN2)
constexpr gpio_num_t PIN_MOTOR_R_PWM = GPIO_NUM_14; // Velocidade (ENA)

// Configurações do PWM (LEDC) do ESP32
constexpr ledc_timer_t PWM_TIMER           = LEDC_TIMER_0;
constexpr ledc_mode_t PWM_MODE             = LEDC_HIGH_SPEED_MODE;
constexpr ledc_channel_t PWM_CHANNEL_LEFT  = LEDC_CHANNEL_0;
constexpr ledc_channel_t PWM_CHANNEL_RIGHT = LEDC_CHANNEL_1;
constexpr ledc_timer_bit_t PWM_RESOLUTION  = LEDC_TIMER_8_BIT; // 8 bits = 0 a 255
constexpr uint32_t PWM_FREQUENCY_HZ        = 20000; // 20kHz evita barulho agudo no motor

void motor_init() {
    // 1. Configurar os pinos de direção como saída (OUTPUT)
    uint64_t dir_pins_mask = (1ULL << PIN_MOTOR_L_IN3) | (1ULL << PIN_MOTOR_L_IN4) |
                             (1ULL << PIN_MOTOR_R_IN1) | (1ULL << PIN_MOTOR_R_IN2);

    gpio_config_t io_conf = {
        .pin_bit_mask = dir_pins_mask,
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&io_conf);

    // 2. Configurar o Timer do PWM (Comum para os dois motores)
    ledc_timer_config_t timer_conf = {
        .speed_mode       = PWM_MODE,
        .duty_resolution  = PWM_RESOLUTION,
        .timer_num        = PWM_TIMER,
        .freq_hz          = PWM_FREQUENCY_HZ,
        .clk_cfg          = LEDC_AUTO_CLK
    };
    ledc_timer_config(&timer_conf);

    // 3. Configurar os Canais PWM (Um para cada motor)
    ledc_channel_config_t channel_conf_left = {
        .gpio_num       = PIN_MOTOR_L_PWM,
        .speed_mode     = PWM_MODE,
        .channel        = PWM_CHANNEL_LEFT,
        .intr_type      = LEDC_INTR_DISABLE,
        .timer_sel      = PWM_TIMER,
        .duty           = 0, // Começa parado
        .hpoint         = 0
    };
    ledc_channel_config(&channel_conf_left);

    ledc_channel_config_t channel_conf_right = channel_conf_left; // Reaproveita configuração base
    channel_conf_right.gpio_num = PIN_MOTOR_R_PWM;
    channel_conf_right.channel  = PWM_CHANNEL_RIGHT;
    ledc_channel_config(&channel_conf_right);
}

void motor_set_speed(MotorSide side, int pwm_value) {
    // Garantimos que o valor do PWM nunca passe dos limites de 8 bits (-255 a 255)
    if (pwm_value > 255) pwm_value = 255;
    if (pwm_value < -255) pwm_value = -255;

    bool forward = (pwm_value >= 0);
    uint32_t duty_cycle = std::abs(pwm_value);

    // Direcionamento do sinal dependendo do motor escolhido
    if (side == MOTOR_LEFT) {
        gpio_set_level(PIN_MOTOR_L_IN3, forward ? 1 : 0);
        gpio_set_level(PIN_MOTOR_L_IN4, forward ? 0 : 1);
        ledc_set_duty(PWM_MODE, PWM_CHANNEL_LEFT, duty_cycle);
        ledc_update_duty(PWM_MODE, PWM_CHANNEL_LEFT);
    } else {
        gpio_set_level(PIN_MOTOR_R_IN1, forward ? 1 : 0);
        gpio_set_level(PIN_MOTOR_R_IN2, forward ? 0 : 1);
        ledc_set_duty(PWM_MODE, PWM_CHANNEL_RIGHT, duty_cycle);
        ledc_update_duty(PWM_MODE, PWM_CHANNEL_RIGHT);
    }
}