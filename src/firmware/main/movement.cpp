    #include "movement.hpp"
    #include "telemetry.hpp"
    #include "tof_sensor.hpp"
    #include "ina219.hpp"
    #include "pid.hpp" 
    #include "encoder.hpp"
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

        pid_parede.init(8.0f,0.2f,1.0f,50.0f,255.0f);
        
        encoder_init(); // Inicia os encoders

        const float setpoint_mm = 23.0f;
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
                
                // 1. PID Parede (Mestre) calcula quanto precisamos virar
                float pwm_calculado = pid_parede.compute(setpoint_mm,(float)distancia_mm,dt );
                
                // 2. Lemos a velocidade atual das rodas (Encoders)
                float vel_esq = encoder_get_left_velocity_cms();
                float vel_dir = encoder_get_right_velocity_cms();
                
                // 3. (Futuro) PID dos Motores (Operários) ajustam a roda para bater a meta
                
                printf("Controle -> Erro Parede: %d mm | Ajuste Parede: %.2f | Vel Esq: %.2f cm/s | Vel Dir: %.2f cm/s\n", 
                        (int)(setpoint_mm - distancia_mm), pwm_calculado, vel_esq, vel_dir);
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
