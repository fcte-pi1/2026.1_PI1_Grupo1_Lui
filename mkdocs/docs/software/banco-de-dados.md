# Definição do Banco de Dados para Histórico de Corridas e Telemetria

## 1. Tabela Comparativa de Arquiteturas

Para sustentar o volume de dados de alta frequência gerado pelo Micromouse, avaliamos três modelos de bancos de dados. A escolha considerou latência de escrita, eficiência de armazenamento e facilidade de consulta por labirinto.

| Característica        | InfluxDB (TSDB)                     | PostgreSQL (SQL)                     | Redis (NoSQL)                      |
|----------------------|-------------------------------------|--------------------------------------|-----------------------------------|
| Estrutura            | Séries Temporais (Tags/Fields)       | Tabelas Relacionais Rígidas          | Chave-Valor em Memória            |
| Performance Ingestão | Altíssima (otimizada para IoT)       | Média (índices B-Tree degradam)      | Altíssima (limitada pela RAM)     |
| Consultas Temporais  | Nativas (ex: médias por trecho)      | Requer extensões ou SQL complexo     | Limitadas sem módulos extras      |
| Uso de Disco         | Alta compressão (colunar)            | Baixa compressão para logs           | Alto custo (primariamente RAM)    |
| Veredito             | **Ideal para o projeto**             | Ineficiente para alta frequência     | Bom para cache, ruim para histórico |

---

## 2. Escolha Técnica: InfluxDB

A arquitetura recomendada é o **InfluxDB**. Diferente de bancos tradicionais, ele é projetado para o paradigma *append-only*, onde novos dados são inseridos sequencialmente com um carimbo de tempo (*timestamp*).

Como o Micromouse opera com loops de controle PID de até **1kHz**, o banco precisa aceitar rajadas de dados sem bloquear o fluxo de rede.

O InfluxDB permite indexar metadados através de **Tags**, o que resolve o requisito de consultas por labirinto de forma instantânea, sem a necessidade de operações custosas como `JOIN`.

---

## 3. Sinergia com C++ e ESP32

A escolha do InfluxDB cria um ecossistema coeso com as decisões de hardware e software já tomadas:

### Mapeamento de Dados
As `structs` de telemetria em C++ mapeiam-se diretamente para o formato do banco:
- Variáveis contínuas (sensores ToF, erro PID) → **Fields**
- Identificadores (ID do labirinto, corrida) → **Tags**

### Processamento Assíncrono
Utilizando o **ESP32 Dual-Core**:
- **Core 0**: responsável pelo controle PID
- **Core 1**: envio de dados via Wi-Fi usando *InfluxDB Client for Arduino*

Isso evita interferência no movimento do robô.

### Eficiência de Banda
- Serialização em **MsgPack (ArduinoJson)** reduz o payload
- Conversão para **Line Protocol (InfluxDB)** ocorre na estação base
- Garante integridade mesmo em redes Wi-Fi instáveis

---

## 4. Desenho do Esquema de Dados (Schema)

Os dados serão organizados no:

- **Bucket:** `micromouse_telemetria`
- **Measurement:** `log_corrida`

### Tags (Indexadas — usadas para filtros)

| Tag            | Descrição                          | Exemplo            |
|----------------|----------------------------------|--------------------|
| id_labirinto   | Dimensão/tipo do labirinto        | "16x16", "8x8"     |
| id_corrida     | ID único da tentativa             | "run_2026_05_04"   |
| objetivo       | Se atingiu o centro (S/N)         | "S"                |

### Fields (Métricas de tempo real)

| Field         | Tipo  | Descrição                                      |
|---------------|--------|-----------------------------------------------|
| bateria       | Float  | Tensão via ADC1 (resistive divider)           |
| dist_frente   | Float  | Leitura crua do sensor VL53L0X frontal        |
| erro_pid      | Float  | Desvio da rota calculado no Core 0            |
| vel_ms        | Float  | Velocidade via encoders N20                   |

---

## 5. Estratégia de Comunicação (A "Conversa")

A integração entre o robô e o banco ocorrerá de forma **não-bloqueante**:

### Transporte
O ESP32 envia os dados via **UDP (AsyncUDP)** para a estação base, garantindo baixa latência (**1–5 ms**).

### Ingestão
Um serviço em **Node.js**:
1. Recebe o pacote UDP  
2. Decodifica o MsgPack  
3. Converte para **InfluxDB Line Protocol**  
4. Persiste imediatamente no banco  

### Segurança e Resiliência
- Em caso de falha no Wi-Fi:
  - Uso de **LittleFS** via **SDMMC**
  - Armazenamento local em buffer binário
  - Upload posterior pós-prova  

Isso garante que **nenhum dado de telemetria seja perdido**.