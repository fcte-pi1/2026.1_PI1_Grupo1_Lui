    #include "movement.hpp"
    #include "telemetry.hpp"
    #include "tof_sensor.hpp"
    #include "ina219.hpp"
    #include "pid.hpp" 
    #include "encoder.hpp"
    #include "motor_driver.hpp"
    #include <string.h>
    #include <stdio.h>

    void MoveTask(void *parametrospv) {
        PacoteTelemetria pacote;
        pacote.bateria_v = 7.4;
        pacote.pos_x = 0;
        pacote.pos_y = 0;
        strcpy(pacote.estado_fsm, "MAPPING");
        pacote.dist_frontal = -1;
        Ina219 ina;
        bool ina_ok = ina.init();
        PID pid_parede;

        // Substituir os ganhos abaixo no laboratório: (Kp, Ki, Kd, max_integral, max_output)
        pid_parede.init(8.0f, 0.2f, 1.0f, 50.0f, 255.0f);

        // --- 2. CEREBROS OPERÁRIOS (MOTORES ESQ E DIR)
        PID pid_motor_esq;
        PID pid_motor_dir;
        // Substituir os ganhos abaixo no laboratório: (Kp, Ki, Kd, max_integral, max_output
        pid_motor_esq.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f); 
        pid_motor_dir.init(2.0f, 0.5f, 0.0f, 100.0f, 255.0f);
        
        encoder_init(); // Inicia os encoders
        motor_init();   // Inicia a Ponte H (L298N)

        // Distância ideal do sensor até a parede para o robô ficar centralizado
        const float setpoint_mm = 23.0f;

        // Velocidade base que o robô deve tentar manter no corredor (ex: 15 cm/s)
        const float velocidade_base_cms = 15.0f;
        for (;;) {
            int distancia_mm = -1;
            if (tof_get_latest_distance_mm(&distancia_mm)) {
                pacote.dist_frontal = distancia_mm;
            }

            if (ina_ok) {
                const Ina219Dados data_ina = ina.getDados();
                if (data_ina.bus_ok) {
                    pacote.bateria_v = data_ina.bus_voltage_mv / 1000.0f;
                }
            } else {
                ina_ok = ina.init();
            }
            pacote.pos_x += 1;

            if(distancia_mm > 0){
                float dt= 0.1f;
                
                // Lemos a velocidade atual REAL que os encoders estão registrando
                float vel_real_esq = encoder_get_left_velocity_cms();
                float vel_real_dir = encoder_get_right_velocity_cms();

                // 1. PID Parede (Mestre) calcula o "Ajuste de Velocidade" para corrigir a rota
                float ajuste_velocidade_curva = pid_parede.compute(setpoint_mm, (float)distancia_mm, dt);
                
                // 2. Calculamos qual a nova meta de velocidade de cada roda
                float velocidade_alvo_esq = velocidade_base_cms + ajuste_velocidade_curva;
                float velocidade_alvo_dir = velocidade_base_cms - ajuste_velocidade_curva;
                
                // 3. PID dos Motores (Operários) calculam o PWM
                float pwm_final_esq = pid_motor_esq.compute(velocidade_alvo_esq, vel_real_esq, dt);
                float pwm_final_dir = pid_motor_dir.compute(velocidade_alvo_dir, vel_real_dir, dt);

                // 4. Aplicar o PWM nos motores reais (Ponte H)
                motor_set_speed(MOTOR_LEFT, (int)pwm_final_esq);
                motor_set_speed(MOTOR_RIGHT, (int)pwm_final_dir);
                
                printf("Controle -> Erro: %d mm | Vel Esq [Meta/Real]: %.1f/%.1f | Vel Dir [Meta/Real]: %.1f/%.1f | PWM Esq: %.0f | PWM Dir: %.0f\n", 
                        (int)(setpoint_mm - distancia_mm), velocidade_alvo_esq, vel_real_esq, velocidade_alvo_dir, vel_real_dir, pwm_final_esq, pwm_final_dir);
            }
            
            // Envia telemetria para processamento assíncrono
            xQueueSend(FilaTelemetria, &pacote, 0);
            printf("Core 0 -> Enviou telemetria para a fila (X: %d | ToF: %d mm)\n",
                pacote.pos_x,
                pacote.dist_frontal);

            // Taxa de amostragem de controle: 1Hz (Testes) | Padrão Oficial: 10Hz
            vTaskDelay(pdMS_TO_TICKS(100));
        }
    }
