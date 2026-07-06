#include "tof_sensor.hpp"
#include "VL53L0X.h"
#include "driver/gpio.h"
#include "driver/i2c.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

namespace {

constexpr const char *TAG = "VL53L0X_TOF";

// Barramento I2C
constexpr i2c_port_t kI2cPort = I2C_NUM_0;
constexpr gpio_num_t kSdaPin = GPIO_NUM_21;
constexpr gpio_num_t kSclPin = GPIO_NUM_22;
constexpr uint32_t kI2cFreqHz = 400000;

// Pinos XSHUT (Conforme definido pelo usuário)
constexpr gpio_num_t kXshutEsquerdo = GPIO_NUM_13;
constexpr gpio_num_t kXshutDireito = GPIO_NUM_19;
constexpr gpio_num_t kXshutFrontal = GPIO_NUM_23;

// Novos endereços I2C
constexpr uint8_t kEnderecoEsquerdo = 0x30;
constexpr uint8_t kEnderecoDireito = 0x31;
constexpr uint8_t kEnderecoFrontal = 0x32;

// Regressão linear (Apenas sensores laterais)
constexpr float kRegA = 0.9951f;
constexpr float kRegB_cm = 1.7475f;

// Filtro exponencial (Apenas sensores laterais)
constexpr float kFiltroAlpha = 0.5f;

constexpr TickType_t kReadPeriod = pdMS_TO_TICKS(100); // 10Hz

struct EstadoFiltro {
    float distancia_filtrada_mm = 0.0f;
    bool iniciado = false;
};

float corrigirDistanciaMm(uint16_t distancia_raw_mm) {
    const float distancia_raw_cm = static_cast<float>(distancia_raw_mm) / 10.0f;
    const float distancia_corrigida_cm = (distancia_raw_cm - kRegB_cm) / kRegA;
    return distancia_corrigida_cm * 10.0f;
}

float aplicarFiltro(float distancia_mm, EstadoFiltro &filtro) {
    if (!filtro.iniciado) {
        filtro.distancia_filtrada_mm = distancia_mm;
        filtro.iniciado = true;
    } else {
        filtro.distancia_filtrada_mm =
            (1.0f - kFiltroAlpha) * filtro.distancia_filtrada_mm +
            kFiltroAlpha * distancia_mm;
    }
    return filtro.distancia_filtrada_mm;
}

void configurarXshut() {
    const gpio_num_t pinos[] = {
        kXshutEsquerdo,
        kXshutDireito,
        kXshutFrontal
    };

    for (const gpio_num_t pino : pinos) {
        ESP_ERROR_CHECK(gpio_reset_pin(pino));
        ESP_ERROR_CHECK(gpio_set_direction(pino, GPIO_MODE_OUTPUT));
        // Mantém todos desligados
        ESP_ERROR_CHECK(gpio_set_level(pino, 0));
    }
    vTaskDelay(pdMS_TO_TICKS(20));
}

bool inicializarSensor(VL53L0X &sensor, gpio_num_t xshut, uint8_t novo_endereco, const char *nome) {
    ESP_LOGI(TAG, "Ligando sensor %s pelo XSHUT GPIO %d", nome, static_cast<int>(xshut));
    
    // Liga somente este sensor.
    ESP_ERROR_CHECK(gpio_set_level(xshut, 1));
    vTaskDelay(pdMS_TO_TICKS(20));

    if (!sensor.init()) {
        ESP_LOGE(TAG, "Falha ao inicializar sensor %s no endereco padrao 0x29", nome);
        return false;
    }

    if (!sensor.setDeviceAddress(novo_endereco)) {
        ESP_LOGE(TAG, "Falha ao mudar o endereco do sensor %s para 0x%02X", nome, novo_endereco);
        return false;
    }

    ESP_LOGI(TAG, "Sensor %s inicializado no endereco 0x%02X", nome, novo_endereco);
    return true;
}

void haltTask() {
    while (true) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

// Controle de concorrência global para as leituras
portMUX_TYPE latest_distances_lock = portMUX_INITIALIZER_UNLOCKED;
int latest_dist_frontal = -1;
int latest_dist_esquerdo = -1;
int latest_dist_direito = -1;
bool latest_distances_valid = false;

} // namespace

bool tof_get_distances_mm(int *frontal, int *esquerdo, int *direito) {
    portENTER_CRITICAL(&latest_distances_lock);
    const bool valid = latest_distances_valid;
    if (frontal) *frontal = latest_dist_frontal;
    if (esquerdo) *esquerdo = latest_dist_esquerdo;
    if (direito) *direito = latest_dist_direito;
    portEXIT_CRITICAL(&latest_distances_lock);

    return valid;
}

void ToFTask(void *parametrospv) {
    (void)parametrospv;

    ESP_LOGI(TAG, "Inicializando I2C%d: SDA=%d SCL=%d", static_cast<int>(kI2cPort), static_cast<int>(kSdaPin), static_cast<int>(kSclPin));

    configurarXshut();

    VL53L0X tofEsquerdo(kI2cPort, kXshutEsquerdo);
    VL53L0X tofDireito(kI2cPort, kXshutDireito);
    VL53L0X tofFrontal(kI2cPort, kXshutFrontal);

    tofEsquerdo.i2cMasterInit(kSdaPin, kSclPin, kI2cFreqHz);

    if (!inicializarSensor(tofEsquerdo, kXshutEsquerdo, kEnderecoEsquerdo, "esquerdo")) haltTask();
    if (!inicializarSensor(tofDireito, kXshutDireito, kEnderecoDireito, "direito")) haltTask();
    if (!inicializarSensor(tofFrontal, kXshutFrontal, kEnderecoFrontal, "frontal")) haltTask();

    ESP_LOGI(TAG, "Todos os sensores foram inicializados.");

    EstadoFiltro filtroEsquerdo;
    EstadoFiltro filtroDireito;

    while (true) {
        uint16_t rawEsquerdoMm = 0;
        uint16_t rawDireitoMm = 0;
        uint16_t rawFrontalMm = 0;

        const bool esquerdoOk = tofEsquerdo.read(&rawEsquerdoMm);
        const bool direitoOk = tofDireito.read(&rawDireitoMm);
        const bool frontalOk = tofFrontal.read(&rawFrontalMm);

        int dEsq = -1, dDir = -1, dFron = -1;

        if (esquerdoOk) {
            dEsq = static_cast<int>(aplicarFiltro(corrigirDistanciaMm(rawEsquerdoMm), filtroEsquerdo) + 0.5f);
        }
        if (direitoOk) {
            dDir = static_cast<int>(aplicarFiltro(corrigirDistanciaMm(rawDireitoMm), filtroDireito) + 0.5f);
        }
        if (frontalOk) {
            dFron = rawFrontalMm; // Frontal sem filtro
        }

        portENTER_CRITICAL(&latest_distances_lock);
        latest_dist_esquerdo = dEsq;
        latest_dist_direito = dDir;
        latest_dist_frontal = dFron;
        latest_distances_valid = (esquerdoOk || direitoOk || frontalOk);
        portEXIT_CRITICAL(&latest_distances_lock);

        vTaskDelay(kReadPeriod);
    }
}
