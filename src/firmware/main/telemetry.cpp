#include "telemetry.hpp"
#include <stdio.h>
#include <string.h>
#include "lwip/sockets.h"
#include "lwip/netdb.h"
#include "ArduinoJson.h"
#include "esp_timer.h"
#include "wifi_manager.hpp"

QueueHandle_t FilaTelemetria;

#define UDP_DEST_PORT 41234



RingBufferTelemetria bufferOffline = {{}, 0, 0, 0};

bool enfileirarBuffer(const PacoteTelemetria& pacote) {
    if (bufferOffline.count >= CAPACIDADE_BUFFER) {
        // Descarte do elemento mais antigo em caso de buffer cheio
        bufferOffline.tail = (bufferOffline.tail + 1) % CAPACIDADE_BUFFER;
        bufferOffline.count--;
    }
    bufferOffline.pacotes[bufferOffline.head] = pacote;
    bufferOffline.head = (bufferOffline.head + 1) % CAPACIDADE_BUFFER;
    bufferOffline.count++;
    return true;
}

bool desenfileirarBuffer(PacoteTelemetria& pacote) {
    if (bufferOffline.count == 0) return false;
    pacote = bufferOffline.pacotes[bufferOffline.tail];
    bufferOffline.tail = (bufferOffline.tail + 1) % CAPACIDADE_BUFFER;
    bufferOffline.count--;
    return true;
}




void TaskTelemetria(void *parametrospv) {
    PacoteTelemetria pacote;

    // Inicializa a estrutura de endereço
    struct sockaddr_in dest_addr = {};
    dest_addr.sin_family = AF_INET;
    dest_addr.sin_port = htons(UDP_DEST_PORT);
    
    bool ip_resolved = false;

    // Cria o socket UDP
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_IP);
    if (sock < 0) {
        printf("Falha ao criar o socket UDP\n");
    } else {
        printf("Socket UDP criado com sucesso\n");
    }

    // Buffer para serialização MsgPack
    char tx_buffer[4096];

    for (;;) {
        // Fica aguardando novos pacotes na fila
        if (xQueueReceive(FilaTelemetria, &pacote, portMAX_DELAY) == pdPASS) {
            printf("Recebido no Core 1 -> bateria: %.2f | X:%d | FSM: %s\n",
                   pacote.bateria_v, pacote.pos_x, pacote.estado_fsm);

            // Tenta resolver o hostname se ainda não foi resolvido
            if (!ip_resolved) {
                // Hostname do gateway Wokwi VS Code para acesso ao host
                struct hostent *hp = gethostbyname("host.wokwi.internal");
                if (hp != NULL) {
                    struct in_addr **addr_list = (struct in_addr **)hp->h_addr_list;
                    dest_addr.sin_addr = *addr_list[0];
                    printf("Resolvido Host do PC para o IP: %s\n", inet_ntoa(dest_addr.sin_addr));
                    ip_resolved = true;
                } else {
                    // Fallback direto
                    dest_addr.sin_addr.s_addr = inet_addr("10.13.37.1");
                    printf("Aviso: DNS falhou. Usando IP fallback do PC: 10.13.37.1\n");
                }
            }

            // Captura o momento exato em milissegundos
            pacote.timestamp = (uint32_t)(esp_timer_get_time() / 1000ULL);

            // Armazena no buffer caso a conexão Wi-Fi seja perdida
            if (!wifi_conectado) {
                enfileirarBuffer(pacote);
                printf("Wi-Fi offline. Pacote guardado na RAM. (Buffer: %d/%d)\n", bufferOffline.count, CAPACIDADE_BUFFER);
                continue; // Pula o envio UDP
            }

            // Verifica se existem pacotes pendentes no buffer para despacho em lote
            if (bufferOffline.count > 0) {
                // Mantém ordem temporal do pacote atual
                enfileirarBuffer(pacote);
                
                // Agrupamento de pacotes para envio em lote (batching)
                int lote_size = (bufferOffline.count > 10) ? 10 : bufferOffline.count;
                
                JsonDocument doc; 
                JsonArray arr = doc.to<JsonArray>();

                for (int i = 0; i < lote_size; i++) {
                    PacoteTelemetria p_lote;
                    desenfileirarBuffer(p_lote);

                    JsonObject obj = arr.add<JsonObject>();
                    obj["bateria_v"] = p_lote.bateria_v;
                    obj["posicao_x"] = p_lote.pos_x;
                    obj["posicao_y"] = p_lote.pos_y;
                    obj["estado_fsm"] = p_lote.estado_fsm;
                    obj["dist_frontal"] = p_lote.dist_frontal;
                    obj["paredes"] = p_lote.paredes;
                    obj["timestamp"] = p_lote.timestamp;
                    
                    obj["id_labirinto"] = "Wokwi_Maze";
                    obj["id_corrida"] = "Simulated_Run";
                    obj["objetivo"] = "Center";
                }

                size_t bytes_written = serializeMsgPack(doc, tx_buffer, sizeof(tx_buffer));
                int err = sendto(sock, tx_buffer, bytes_written, 0, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
                
                if (err < 0) {
                    printf("Falha ao descarregar Batch MsgPack.\n");
                } else {
                    printf("Lote despachado: %d pacotes antigos enviados! (%d bytes)\n", lote_size, (int)bytes_written);
                }
            } 
            // Envio de pacote individual
            else {
                JsonDocument doc;
                doc["bateria_v"] = pacote.bateria_v;
                doc["posicao_x"] = pacote.pos_x;
                doc["posicao_y"] = pacote.pos_y;
                doc["estado_fsm"] = pacote.estado_fsm;
                doc["dist_frontal"] = pacote.dist_frontal;
                doc["paredes"] = pacote.paredes;
                doc["timestamp"] = pacote.timestamp;
                
                doc["id_labirinto"] = "Wokwi_Maze";
                doc["id_corrida"] = "Simulated_Run";
                doc["objetivo"] = "Center";

                size_t bytes_written = serializeMsgPack(doc, tx_buffer, sizeof(tx_buffer));
                int err = sendto(sock, tx_buffer, bytes_written, 0, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
                
                if (err < 0) {
                    enfileirarBuffer(pacote);
                } else {
                    printf("UDP MsgPack enviado com sucesso! (%d bytes)\n", (int)bytes_written);
                }
            }
        }
    }

    if (sock >= 0) {
        close(sock);
    }
}
