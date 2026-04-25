
# Requisitos de Software

Esta documentação detalha o planeamento e a lógica de construção do sistema de software para o Micromouse, focando na integração entre subsistemas e no cumprimento das exigências de telemetria em tempo real.

## 1. Módulos e Componentes Lógicos
O sistema deve ser organizado em módulos interdependentes para garantir a modularidade e facilidade de manutenção:

* **Módulo de Percepção:** Processa os dados brutos dos sensores para a deteção de paredes e identificação de grades em tempo real.
* **Módulo de Localização:** Responsável pelo cálculo da posição relativa, velocidade e orientação do robô através da fusão de dados dos encoders e da IMU (Giroscópio/Acelerómetro).
* **Interface de Telemetria:** Camada visual que renderiza a grade do labirinto e as paredes detetadas dinamicamente sobre a estrutura lógica.

## 2. Definir as ferramentas
A escolha das ferramentas deve basear-se na capacidade de processamento assíncrono e na reatividade da interface para atender aos requisitos de tempo real.


## 3. Desempenho e Latência
Para assegurar a fidelidade da monitorização durante as provas, o sistema foi dimensionado sob os seguintes critérios:

* **Latência Máxima:** O tempo decorrido entre a captura do dado no microcontrolador e a atualização na interface web não deve ultrapassar **150 milissegundos**.
* **Processamento:** O fluxo de mensagens é assíncrono para garantir que o registo cronológico das decisões lógicas ocorra sem bloqueios na renderização visual.

## 4. Fluxo de Dados e Integração
O fluxo de informações é contínuo e bidirecional, integrando métricas de diferentes subsistemas:

* **Monitorização Energética:** Integração direta com os dados de tensão e corrente, permitindo correlacionar o consumo de bateria com o esforço dos motores em tempo real.
* **Transmissão:** Utilização de protocolos de baixa latência para o envio de pacotes de status, métricas de movimento e coordenadas de mapeamento.

## 5. Configuração e Adaptabilidade da Arena
O software provê uma camada de configuração pré-execução para garantir a precisão dos dados:

* **Parametrização:** Seleção do tipo de labirinto ($4\times4$, $8\times8$ ou $16\times16$) antes do início da telemetria.
* **Ajuste de Escala:** Reconfiguração automática da grade visual e dos limites de coordenadas no banco de dados para conformidade com a arena física.

## 6. Persistência e Conectividade
A segurança e a disponibilidade da informação são tratadas através de:

* **Resiliência de Rede:** Implementação de cache local para salvar dados de telemetria em caso de interrupção temporária da ligação com o servidor.
* **Armazenamento Histórico:** Persistência de trajetos, tempos e logs de eventos em base de dados após a conclusão do desafio.
* **Exportação:** Capacidade de gerar ficheiros em formatos estruturados (JSON/CSV) para suporte à elaboração de relatórios técnicos.

## 7. Modos de Operação
A interface adapta-se ao estado atual do robô, alternando entre dois contextos principais:

* **Modo de Exploração:** Focado na descoberta do mapa, destacando visualmente novas paredes e sinalizando áreas desconhecidas.
* **Modo de Alta Performance:** Ativado para a corrida rápida, priorizando a visualização do cronómetro, velocímetro e a precisão do caminho otimizado.

## 8. Validação e Verificação
O processo de validação segue uma abordagem incremental:

* **Testes de Integração:** Verificação da comunicação entre o hardware e a interface web sob condições reais de uso.
* **Integridade de Dados:** Comparação entre o mapa gerado pelo software e a planta física do labirinto para calcular a margem de erro do mapeamento.
* **Consultas:** Validação da capacidade de recuperação de sessões específicas no histórico sem perda de fidelidade dos dados de trajeto.

## Referências

1. [WebSockets API - Mozilla Developer Network](https://developer.mozilla.org/pt-BR/docs/Web/API/WebSockets_API)
2. [Micromouse Online - Mazes and Maze Solving](https://micromouseonline.com/micromouse-book/mazes-and-maze-solving/)
3. [UKMARS - UK Micromouse and Robotics Society](https://ukmars.org/)
4. [Micromouse Online - Rules](https://micromouseonline.com/micromouse-book/rules/)


## Tabela de Versionamento

| Versão | Descrição                                  | Autor                                                 | Revisor                                               |
| ------ | ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| `1.0`  | Criação inicial do documento de requisitos          | [Yzabella Pimenta](https://github.com/redjsun) | [Alexandre Alvarez](https://github.com/alexandremacedoalvarez-cpu)   |
