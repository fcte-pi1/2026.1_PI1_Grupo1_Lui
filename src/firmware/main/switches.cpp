#include "switches.hpp"

void switches_init() {
    gpio_config_t io_conf = {};
    io_conf.pin_bit_mask = (1ULL << PIN_SWITCH_START) | (1ULL << PIN_SWITCH_MAZE_SIZE);
    io_conf.mode = GPIO_MODE_INPUT;
    io_conf.pull_up_en = GPIO_PULLUP_ENABLE;   // Usa pull-up interno
    io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    io_conf.intr_type = GPIO_INTR_DISABLE;
    gpio_config(&io_conf);
}

bool is_maze_size_8x8() {
    // Considerando lógica invertida (chave liga no GND, já que usa PULLUP interno)
    return gpio_get_level((gpio_num_t)PIN_SWITCH_MAZE_SIZE) == 0;
}

bool is_start_pressed() {
    // Considerando lógica invertida (chave liga no GND, já que usa PULLUP interno)
    return gpio_get_level((gpio_num_t)PIN_SWITCH_START) == 0;
}
