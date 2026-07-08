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

// Configurações fonte da verdade definidas pelo Firmware na inicialização
int global_maze_size = 16;
bool global_mapping_mode = true;


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




// Tarefa assíncrona consumidora (Subscriber). Bloqueia a execução (Sleep) no portMAX_DELAY 
// até que um pacote seja inserido na fila pelo Core 0, otimizando o uso da CPU.
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
        int broadcastEnable = 1;
        setsockopt(sock, SOL_SOCKET, SO_BROADCAST, &broadcastEnable, sizeof(broadcastEnable));
    }

    // Buffer para serialização MsgPack
    char tx_buffer[4096];

    for (;;) {
        // Fica aguardando novos pacotes na fila
        if (xQueueReceive(FilaTelemetria, &pacote, portMAX_DELAY) == pdPASS) {
            // printf("Recebido no Core 1 -> bateria: %.2f | X:%d | FSM: %s | TOF(F/E/D): %d/%d/%d\n",
                   // pacote.bateria_v, pacote.pos_x, pacote.estado_fsm, 
                   // pacote.dist_frontal, pacote.dist_esq, pacote.dist_dir);

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
                    // Fallback para Broadcast (255.255.255.255) caso a resolução DNS do host local falhe.
                    // Isso permite o envio cego de pacotes UDP sem a necessidade de um IP fixo na sub-rede.
                    dest_addr.sin_addr.s_addr = inet_addr("255.255.255.255");
                    printf("Aviso: Falha no DNS. Adotando roteamento via BROADCAST (255.255.255.255).\n");
                    
                    // Flag de controle para evitar bloqueio da fila com repetidas tentativas de DNS
                    ip_resolved = true; 
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
                    obj["pos_x"] = p_lote.pos_x;
                    obj["pos_y"] = p_lote.pos_y;
                    obj["estado_fsm"] = p_lote.estado_fsm;
                    obj["dist_frontal"] = p_lote.dist_frontal;
                    obj["dist_esquerda"] = p_lote.dist_esq;
                    obj["dist_direita"] = p_lote.dist_dir;
                    obj["paredes"] = p_lote.paredes;
                    obj["timestamp"] = p_lote.timestamp;
                    
                    obj["pwm_esq"] = p_lote.pwm_esq;
                    obj["pwm_dir"] = p_lote.pwm_dir;
                    obj["erro_pid"] = p_lote.erro_pid;
                    obj["velocidade_media"] = p_lote.velocidade_media;
                    
                    obj["mazeSize"] = global_maze_size;
                    obj["mapping"] = global_mapping_mode;
                    obj["id_labirinto"] = "Wokwi_Maze"; // Mantido por compatibilidade
                    obj["id_corrida"] = "Simulated_Run";
                    obj["objetivo"] = "Center";
                }

                size_t bytes_written = serializeMsgPack(doc, tx_buffer, sizeof(tx_buffer));
                int err = sendto(sock, tx_buffer, bytes_written, 0, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
                
                if (err < 0) {
                    // printf("Falha ao descarregar Batch MsgPack.\n");
                } else {
                    // printf("Lote despachado: %d pacotes antigos enviados! (%d bytes)\n", lote_size, (int)bytes_written);
                }
            } 
            // Envio de pacote individual
            else {
                JsonDocument doc;
                doc["bateria_v"] = pacote.bateria_v;
                doc["pos_x"] = pacote.pos_x;
                doc["pos_y"] = pacote.pos_y;
                doc["estado_fsm"] = pacote.estado_fsm;
                doc["dist_frontal"] = pacote.dist_frontal;
                doc["dist_esquerda"] = pacote.dist_esq;
                doc["dist_direita"] = pacote.dist_dir;
                doc["paredes"] = pacote.paredes;
                doc["timestamp"] = pacote.timestamp;
                
                doc["pwm_esq"] = pacote.pwm_esq;
                doc["pwm_dir"] = pacote.pwm_dir;
                doc["erro_pid"] = pacote.erro_pid;
                doc["velocidade_media"] = pacote.velocidade_media;
                
                doc["mazeSize"] = global_maze_size;
                doc["mapping"] = global_mapping_mode;
                doc["id_labirinto"] = "Wokwi_Maze"; // Mantido por compatibilidade
                doc["id_corrida"] = "Simulated_Run";
                doc["objetivo"] = "Center";

                size_t bytes_written = serializeMsgPack(doc, tx_buffer, sizeof(tx_buffer));
                int err = sendto(sock, tx_buffer, bytes_written, 0, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
                
                if (err < 0) {
                    enfileirarBuffer(pacote);
                } else {
                    // printf("UDP MsgPack enviado com sucesso! (%d bytes)\n", (int)bytes_written);
                }
            }
        }
    }

    if (sock >= 0) {
        close(sock);
    }
}
