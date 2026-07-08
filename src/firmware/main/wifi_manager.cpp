#include "wifi_manager.hpp"
#include <string.h>
#include <stdio.h>
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"

bool wifi_conectado = false; // Estado global da conectividade Wi-Fi

#include "wifi_credentials.h"

// Callback assíncrono para a máquina de estados do LwIP (Pilha TCP/IP). Reage a eventos físicos 
// de rádio (Conexão/Queda) e rede (Obtenção de IP DHCP).
static void event_handler(void* arg, esp_event_base_t event_base,
                          int32_t event_id, void* event_data) {
  // Inicialização do Wi-Fi em modo Station
  if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START){
    wifi_conectado = false;
    esp_wifi_connect();
    printf("Tentando Conectar ao Wi-fi... \n");
  }
  // Tratamento de desconexão e tentativa de reconexão
  else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED){
    wifi_conectado = false;
    esp_wifi_connect();
    printf("conexão Wi-fi perdida tentando reconectar.. \n");
  }
  else if(event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP){
    ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
    wifi_conectado = true;
    printf("conectado com sucesso, ip:" IPSTR "\n", IP2STR(&event->ip_info.ip));
  }
}

void wifi_init_sta(void) {
    // Inicialização da partição NVS para armazenamento de configurações de RF
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Inicialização da pilha TCP/IP (LwIP)
    ESP_ERROR_CHECK(esp_netif_init());
    
    // Criação do loop de eventos do sistema
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    
    // Criação da interface de rede em modo Station
    esp_netif_create_default_wifi_sta();

    // Inicialização do driver Wi-Fi com configurações padrão
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    // Registro do handler para eventos de Wi-Fi e IP
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                        ESP_EVENT_ANY_ID,
                                                        &event_handler,
                                                        NULL,
                                                        NULL));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                                                        IP_EVENT_STA_GOT_IP,
                                                        &event_handler,
                                                        NULL,
                                                        NULL));

    // Configuração das credenciais da rede
    wifi_config_t wifi_config = {};
    strcpy((char*)wifi_config.sta.ssid, WIFI_SSID);
    strcpy((char*)wifi_config.sta.password, WIFI_PASS);

    // Definição do modo operacional como Station
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    
    // Inicialização do rádio Wi-Fi
    ESP_ERROR_CHECK(esp_wifi_start());

    printf("Inicializacao do driver Wi-Fi concluida.\n");
}
