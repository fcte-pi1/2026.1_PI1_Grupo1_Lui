#include <catch2/catch_test_macros.hpp>
#include <fstream>
#include <cmath>

#include "pid.hpp"

/**
 * HU 3.8.1 — Critério: [Firmware] Anti-Windup Matemático
 *
 * Cenário de estresse: o erro é mantido fixo por ~12s simulados, como se o
 * robô estivesse preso contra a parede e nunca alcançasse o setpoint. Sem
 * anti-windup, o termo integral cresceria sem limite. Este teste garante
 * que o clamp (integral_max) realmente contém esse crescimento em TODOS os
 * ciclos, e que a saída de PWM nunca ultrapassa o limite de segurança.
 */
TEST_CASE("Anti-windup impede que o termo integral estoure", "[pid][antiwindup]") {
    PID pid;
    const float integral_max = 50.0f;
    const float output_max   = 255.0f;
    pid.init(/*kp=*/8.0f, /*ki=*/0.2f, /*kd=*/1.0f, integral_max, output_max);

    const float setpoint_mm   = 90.0f;
    const float input_fixo_mm = 40.0f;  // erro fixo de 50mm, nunca corrigido
    const float dt            = 0.02f;

    std::ofstream csv("pid_antiwindup.csv");
    csv << "ciclo,integral,pwm\n";

    for (int ciclo = 0; ciclo < 600; ++ciclo) {  // ~12s simulados
        float pwm = pid.compute(setpoint_mm, input_fixo_mm, dt);

        csv << ciclo << "," << pid.getIntegral() << "," << pwm << "\n";

        // O integral nunca pode ultrapassar o teto, em nenhum ciclo
        REQUIRE(pid.getIntegral() <= integral_max + 0.001f);
        REQUIRE(pid.getIntegral() >= -integral_max - 0.001f);

        // A saída nunca pode ultrapassar o limite de PWM
        REQUIRE(pwm <= output_max + 0.001f);
        REQUIRE(pwm >= -output_max - 0.001f);

        // Nunca pode virar NaN ou infinito (estouro numérico)
        REQUIRE_FALSE(std::isnan(pid.getIntegral()));
        REQUIRE_FALSE(std::isinf(pid.getIntegral()));
    }

    // Com o erro persistindo, o integral deve ter ESTABILIZADO no teto
    // (prova de que o clamp realmente engatou, e não que "por acaso" ficou baixo)
    REQUIRE(std::fabs(pid.getIntegral() - integral_max) < 0.01f);
}
