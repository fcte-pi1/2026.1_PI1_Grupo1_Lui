#include "encoder.hpp"

#include "driver/gpio.h"
#include "esp_attr.h"
#include "esp_timer.h"
#include <math.h>

#define ENC_LEFT_A   GPIO_NUM_18
#define ENC_LEFT_B   GPIO_NUM_5

#define ENC_RIGHT_A  GPIO_NUM_17
#define ENC_RIGHT_B  GPIO_NUM_16

static volatile int32_t left_ticks = 0;
static volatile int32_t right_ticks = 0;

static void IRAM_ATTR left_encoder_isr(void *arg)
{
    int b = gpio_get_level(ENC_LEFT_B);

    if (b)
        left_ticks++;
    else
        left_ticks--;
}

static void IRAM_ATTR right_encoder_isr(void *arg)
{
    int b = gpio_get_level(ENC_RIGHT_B);

    if (b)
        right_ticks++;
    else
        right_ticks--;
}

void encoder_init()
{
    gpio_config_t io_conf = {};

    io_conf.mode = GPIO_MODE_INPUT;
    io_conf.pull_up_en = GPIO_PULLUP_ENABLE;
    io_conf.intr_type = GPIO_INTR_POSEDGE;

    io_conf.pin_bit_mask =
        (1ULL << ENC_LEFT_A) |
        (1ULL << ENC_LEFT_B) |
        (1ULL << ENC_RIGHT_A) |
        (1ULL << ENC_RIGHT_B);

    gpio_config(&io_conf);

    gpio_install_isr_service(0);

    gpio_isr_handler_add(
        ENC_LEFT_A,
        left_encoder_isr,
        nullptr);

    gpio_isr_handler_add(
        ENC_RIGHT_A,
        right_encoder_isr,
        nullptr);
}

int32_t encoder_get_left_ticks()
{
    return left_ticks;
}

int32_t encoder_get_right_ticks()
{
    return right_ticks;
}

float encoder_get_velocity_ms()
{
    static int32_t last_left = 0;
    static int32_t last_right = 0;

    static uint64_t last_time = 0;

    const uint64_t now = esp_timer_get_time();

    if (last_time == 0)
    {
        last_time = now;
        return 0.0f;
    }

    const float dt =
        (now - last_time) / 1000000.0f;

    if (dt <= 0.0f)
        return 0.0f;

    const int32_t left_now = left_ticks;
    const int32_t right_now = right_ticks;

    const int32_t delta_left =
        left_now - last_left;

    const int32_t delta_right =
        right_now - last_right;

    last_left = left_now;
    last_right = right_now;
    last_time = now;

    const float avg_ticks =
        (fabs((float)delta_left) +
         fabs((float)delta_right)) / 2.0f;

    return avg_ticks / dt;
}