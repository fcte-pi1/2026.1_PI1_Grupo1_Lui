#pragma once

/**
 * @file pid.hpp
 * @brief Núcleo matemático do controlador PID — sem dependência de hardware.
 *
 * HU 3.8.1 — Validar controle lógico matemático do PID em bancada virtual
 *
 * Esta classe não inclui FreeRTOS, ESP-IDF nem qualquer biblioteca de
 * hardware (GPIO, ToF, INA219). Isso permite que ela seja compilada e
 * testada tanto no firmware real (ESP32) quanto em um executável de
 * testes no host (Catch2) — exatamente como já é feito hoje com o
 * floodfill (flood_fill.cpp + simulador/API.h).
 *
 * Quem aciona o motor (real ou virtual) é responsabilidade de quem chama
 * compute(); esta classe nunca escreve em GPIO nem lê sensores.
 */
class PID {
public:
    /**
     * @brief Configura os ganhos e os limites do controlador.
     *
     * @param kp            Ganho proporcional.
     * @param ki            Ganho integral.
     * @param kd            Ganho derivativo.
     * @param integral_max  Teto do anti-windup (clamp simétrico do integral acumulado).
     * @param output_max    Limite simétrico da saída (ex: 255 para PWM de 8 bits).
     */
    void init(float kp, float ki, float kd, float integral_max, float output_max);

    /**
     * @brief Executa uma iteração do PID.
     *
     * @param setpoint  Valor desejado (ex: distância alvo da parede, em mm).
     * @param input     Valor medido (real ou virtual) atual, em mm.
     * @param dt        Intervalo de tempo desde o último ciclo, em segundos.
     * @return float    Sinal de controle, limitado a [-output_max, output_max].
     */
    float compute(float setpoint, float input, float dt);

    /// Reseta o estado interno (integral acumulado e erro anterior).
    void reset();

    /// Usado pelos testes para inspecionar o estado interno do controlador.
    float getIntegral() const { return integral_; }
    float getErroAnterior() const { return erro_anterior_; }

private:
    float kp_ = 0.0f;
    float ki_ = 0.0f;
    float kd_ = 0.0f;
    float integral_max_ = 0.0f;
    float output_max_ = 0.0f;

    float integral_ = 0.0f;
    float erro_anterior_ = 0.0f;
};
