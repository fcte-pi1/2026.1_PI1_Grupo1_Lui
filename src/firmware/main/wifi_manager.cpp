#include "wifi_manager.hpp"
#include <string.h>
#include <stdio.h>
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"

#define WIFI_SSID "FORTUNATO"
#define WIFI_PASS "410671_Rocha"

static void event_handler(void* arg, esp_event_base_t event_base,
                          int32_t event_id, void* event_data) {
  // inicializa o wifi no modo station
  if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START){
    esp_wifi_connect();
    printf("Tentando Conectar ao Wi-fi... \n");
  }
  // tratar se a conexão cair ou falhar
  else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED){
    esp_wifi_connect();
    printf("conexão Wi-fi perdida tentando reconectar.. \n");
  }
  else if(event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP){
    ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
    printf("conectado com sucesso, ip:" IPSTR "\n", IP2STR(&event->ip_info.ip));
  }
}

void wifi_init_sta(void) {
    // 1. Inicializa o NVS: O driver Wi-Fi do ESP32 salva calibrações de rádio e configurações aqui.
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Inicializa o netif (:LwIP): A pilha TCP/IP padrão do sistema.
    ESP_ERROR_CHECK(esp_netif_init());
    
    // 3. Cria o loop de eventos padrão do sistema (onde roda o event_handler acima).
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    
    // 4. Cria a interface de rede padrão para modo Station (cliente).
    esp_netif_create_default_wifi_sta();

    // 5. Inicializa o Wi-Fi com as configurações padrão de hardware.
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    // 6. Registra nossa função event_handler para eventos de Wi-Fi e IP
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

    // 7. Configura as credenciais da rede simulada
    wifi_config_t wifi_config = {};
    strcpy((char*)wifi_config.sta.ssid, WIFI_SSID);
    strcpy((char*)wifi_config.sta.password, WIFI_PASS);

    // Define o modo como Station (cliente) e carrega a configuração
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    
    // 8. Inicia o rádio Wi-Fi (isso vai gerar o evento WIFI_EVENT_STA_START)
    ESP_ERROR_CHECK(esp_wifi_start());

    printf("Inicializacao do driver Wi-Fi concluida.\n");
}
