#include "switches.hpp"

void switches_init() {
    // GPIO4 (Maze Size) com pull-down ativado por software
    gpio_config_t btn4_conf = {};
    btn4_conf.pin_bit_mask = (1ULL << PIN_SWITCH_MAZE_SIZE);
    btn4_conf.mode = GPIO_MODE_INPUT;
    btn4_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    btn4_conf.pull_down_en = GPIO_PULLDOWN_ENABLE;
    btn4_conf.intr_type = GPIO_INTR_DISABLE;
    gpio_config(&btn4_conf);

    // GPIO34 (Start) com pull-down físico externo (desativa internos)
    gpio_config_t btn34_conf = {};
    btn34_conf.pin_bit_mask = (1ULL << PIN_SWITCH_START);
    btn34_conf.mode = GPIO_MODE_INPUT;
    btn34_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    btn34_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    btn34_conf.intr_type = GPIO_INTR_DISABLE;
    gpio_config(&btn34_conf);
}

bool is_maze_size_8x8() {
    // Retorna true se a chave fechar no VCC (lê 1)
    return gpio_get_level((gpio_num_t)PIN_SWITCH_MAZE_SIZE) == 1;
}

bool is_start_pressed() {
    // Retorna true se a chave fechar no VCC (lê 1)
    return gpio_get_level((gpio_num_t)PIN_SWITCH_START) == 1;
}
