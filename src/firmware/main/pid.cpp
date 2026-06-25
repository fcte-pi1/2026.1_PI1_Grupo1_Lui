#include "pid.hpp"

void PID::init(float kp, float ki, float kd, float integral_max, float output_max) {
    kp_ = kp;
    ki_ = ki;
    kd_ = kd;
    integral_max_ = integral_max;
    output_max_ = output_max;
    reset();
}

float PID::compute(float setpoint, float input, float dt) {
    // 1. Erro = o quanto falta para chegar no setpoint.
    //    ATENÇÃO: é setpoint - input, nunca o contrário (bug clássico de sinal).
    float erro = setpoint - input;

    // 2. Termo integral, protegido por anti-windup (clamp simétrico)
    integral_ += erro * dt;
    if (integral_ > integral_max_)  integral_ = integral_max_;
    if (integral_ < -integral_max_) integral_ = -integral_max_;

    // 3. Termo derivativo
    float derivativo = (dt > 0.0f) ? (erro - erro_anterior_) / dt : 0.0f;
    erro_anterior_ = erro;

    // 4. Saída combinada
    float output = (kp_ * erro) + (ki_ * integral_) + (kd_ * derivativo);

    // 5. Saturação da saída — protege a Ponte H de receber PWM fora da faixa
    if (output > output_max_)  output = output_max_;
    if (output < -output_max_) output = -output_max_;

    return output;
}

void PID::reset() {
    integral_ = 0.0f;
    erro_anterior_ = 0.0f;
}
