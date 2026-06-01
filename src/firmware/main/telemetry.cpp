#include "telemetry.hpp"
#include <stdio.h>
#include <string.h>
#include "lwip/sockets.h"
#include "lwip/netdb.h"
#include "ArduinoJson.h"

QueueHandle_t FilaTelemetria;

#define UDP_DEST_PORT 41234

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

    // Buffer para armazenar o payload binário do MsgPack
    char tx_buffer[256];

    for (;;) {
        // Fica aguardando novos pacotes na fila
        if (xQueueReceive(FilaTelemetria, &pacote, portMAX_DELAY) == pdPASS) {
            printf("Recebido no Core 1 -> bateria: %.2f | X:%d | FSM: %s\n",
                   pacote.bateria_v, pacote.pos_x, pacote.estado_fsm);

            // Tenta resolver o hostname se ainda não foi resolvido
            if (!ip_resolved) {
                struct hostent *hp = gethostbyname("host.wokwi.internal");
                if (hp != NULL) {
                    struct in_addr **addr_list = (struct in_addr **)hp->h_addr_list;
                    dest_addr.sin_addr = *addr_list[0];
                    printf("Resolvido host.wokwi.internal para o IP: %s\n", inet_ntoa(dest_addr.sin_addr));
                    ip_resolved = true;
                } else {
                    // Fallback para o IP do gateway privado padrão do Wokwi (10.13.37.1)
                    dest_addr.sin_addr.s_addr = inet_addr("10.13.37.1");
                    printf("Aviso: DNS falhou. Usando IP fallback: 10.13.37.1\n");
                }
            }

            // Cria o documento JSON para serializar em MsgPack
            JsonDocument doc;
            doc["bateria_v"] = pacote.bateria_v;
            doc["posicao_x"] = pacote.pos_x;
            doc["posicao_y"] = pacote.pos_y;
            doc["estado_fsm"] = pacote.estado_fsm;
            doc["dist_frontal"] = pacote.dist_frontal;
            
            // Campos adicionais esperados pelo backend para evitar tags vazias
            doc["id_labirinto"] = "Wokwi_Maze";
            doc["id_corrida"] = "Simulated_Run";
            doc["objetivo"] = "Center";

            // Serializa o documento JSON para o formato binário MsgPack
            size_t bytes_written = serializeMsgPack(doc, tx_buffer, sizeof(tx_buffer));

            // Envia o pacote MsgPack via UDP
            if (sock >= 0 && bytes_written > 0) {
                int err = sendto(sock, tx_buffer, bytes_written, 0, 
                                 (struct sockaddr *)&dest_addr, sizeof(dest_addr));
                if (err < 0) {
                    printf("Erro ao enviar UDP MsgPack: errno %d\n", errno);
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
