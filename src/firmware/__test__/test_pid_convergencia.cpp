#include <catch2/catch_test_macros.hpp>
#include <fstream>
#include <cmath>

#include "pid.hpp"

/**
 * HU 3.8.1 — Critério: [Firmware] Cenários de Injeção + Prova de Convergência
 *
 * Cenário: "Sensor virtual lê que o robô está a 4cm da parede, e a meta é 9cm".
 *
 * O teste injeta esse erro inicial e roda o PID em loop contra uma planta
 * virtual simplificada (posicao += pwm * ganho * dt). Se houver um bug de
 * sinal (ex: somar o erro em vez de subtrair), o erro vai DIVERGIR em vez de
 * convergir, e REQUIRE(convergiu) vai falhar — pegando exatamente o tipo de
 * bug que a issue descreve.
 *
 * Cada ciclo é gravado em pid_convergencia.csv para gerar o gráfico de
 * evidência pedido no DoD (abrir com Excel, LibreOffice, Python/matplotlib
 * ou importar como datasource no Grafana).
 */
TEST_CASE("PID converge quando o robo esta fora do centro", "[pid][convergencia]") {
    PID pid;
    pid.init(/*kp=*/8.0f, /*ki=*/0.2f, /*kd=*/1.0f,
             /*integral_max=*/50.0f, /*output_max=*/255.0f);

    const float setpoint_mm  = 90.0f;  // meta: 9 cm da parede
    float posicao_mm         = 40.0f;  // sensor virtual: robô a 4 cm
    const float dt           = 0.02f;  // 20 ms por ciclo (50 Hz)
    const float ganho_planta = 0.04f;  // resposta simplificada da planta virtual

    std::ofstream csv("pid_convergencia.csv");
    csv << "ciclo,erro_mm,pwm,posicao_mm,integral\n";

    bool convergiu = false;
    int ciclo_convergencia = -1;

    for (int ciclo = 0; ciclo < 600; ++ciclo) {  // ~12s simulados (settling time real do PID)
        float pwm = pid.compute(setpoint_mm, posicao_mm, dt);

        // Planta virtual: a posição responde ao PWM aplicado
        posicao_mm += pwm * ganho_planta * dt;

        float erro = setpoint_mm - posicao_mm;

        csv << ciclo << "," << erro << "," << pwm << ","
            << posicao_mm << "," << pid.getIntegral() << "\n";

        if (!convergiu && std::fabs(erro) < 1.0f) {  // tolerância de 1 mm
            convergiu = true;
            ciclo_convergencia = ciclo;
        }
    }

    INFO("Convergiu no ciclo " << ciclo_convergencia
         << " (posicao final: " << posicao_mm << " mm)");
    REQUIRE(convergiu);

    float erro_final = setpoint_mm - posicao_mm;
    REQUIRE(std::fabs(erro_final) < 1.0f);
}
