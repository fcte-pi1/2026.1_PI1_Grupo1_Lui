# Estruturação do Backlog (MoSCoW) e Roteiro de Testes
# **Requisitos de Backlog de Histórias de Usuário com Priorização MoSCoW**

Para a organização e priorização dos requisitos do sistema, foi utilizada a técnica MoSCoW (Must, Should, Could, Won’t), permitindo classificar funcionalidades de acordo com sua importância para o funcionamento do projeto.

As classificações utilizadas são:

- **Must Have:** requisitos obrigatórios para o funcionamento mínimo do sistema e atendimento dos critérios da disciplina;
- **Should Have:** requisitos importantes que agregam qualidade e robustez ao projeto;
- **Could Have:** funcionalidades desejáveis, mas não essenciais para a entrega principal;
- **Won’t Have / Wish:** funcionalidades fora do escopo atual do projeto.

## Histórias de Usuário

| ID | História de Usuário | Critério de Aceitação | MoSCoW | Explicação |
| --- | --- | --- | --- | --- |
| HU01 | Como operador do sistema, quero visualizar o labirinto em tempo real para acompanhar o processo de exploração do Micromouse. | O mapa deve atualizar automaticamente em até 150 ms após o recebimento dos dados. | Must Have | A visualização em tempo real do labirinto é um requisito obrigatório da disciplina para apresentação da telemetria do robô. |
| HU02 | Como operador, quero visualizar paredes detectadas dinamicamente para validar a leitura dos sensores do robô. | As paredes identificadas devem ser exibidas corretamente na interface conforme os dados recebidos. | Must Have | O sistema deve demonstrar o processo de mapeamento realizado pelo Micromouse durante a navegação. |
| HU03 | Como operador, quero acompanhar posição, orientação e velocidade do robô para monitorar seu deslocamento no labirinto. | A interface deve exibir coordenadas, orientação e velocidade continuamente atualizadas. | Must Have | O monitoramento da movimentação do robô é necessário para validar o funcionamento da navegação autônoma. |
| HU04 | Como sistema, quero processar mensagens de telemetria de forma assíncrona para evitar bloqueios na interface. | O processamento não deve interromper a renderização visual durante o recebimento contínuo de dados. | Must Have | A interface deve permanecer responsiva mesmo durante transmissões constantes de telemetria. |
| HU05 | Como operador, quero selecionar o tamanho do labirinto antes da execução para adequar a interface à arena física utilizada. | O sistema deve permitir configuração entre arenas 4×4, 8×8 e 16×16 antes do início da execução. | Must Have | Os três tamanhos de labirinto são explicitamente definidos nos requisitos da disciplina. |
| HU06 | Como desenvolvedor, quero validar a comunicação entre hardware e interface web para garantir funcionamento em condições reais. | Os testes devem confirmar transmissão contínua de dados sem perda significativa de pacotes. | Must Have | A comunicação entre o Micromouse e o sistema web é essencial para a telemetria em tempo real exigida no projeto. |
| HU07 | Como operador, quero salvar trajetos e logs após a execução para posterior análise técnica. | O sistema deve persistir dados históricos em banco de dados após a conclusão da sessão. | Must Have | O armazenamento de dados após a execução é um requisito obrigatório descrito na especificação do projeto. |
| HU08 | Como operador, quero consultar execuções anteriores para revisar trajetos e desempenho do robô. | O sistema deve permitir selecionar um labirinto específico ou visualizar dados de todos os labirintos. | Must Have | A consulta de execuções armazenadas faz parte dos requisitos de persistência definidos pela disciplina. |
| HU09 | Como operador, quero exportar dados em JSON e CSV para elaborar relatórios técnicos e análises externas. | O sistema deve gerar arquivos válidos nos formatos JSON e CSV. | Should Have | A exportação facilita análises complementares e documentação do projeto. |
| HU10 | Como sistema, quero armazenar dados localmente em caso de falha de rede para evitar perda de telemetria. | Os dados devem permanecer salvos localmente até a reconexão com o servidor. | Should Have | O armazenamento temporário aumenta a robustez e confiabilidade do sistema. |
| HU11 | Como operador, quero alternar entre modo exploração e modo alta performance para visualizar métricas adequadas ao contexto da execução. | O sistema deve alterar automaticamente os elementos visuais conforme o modo selecionado. | Should Have | Diferentes modos de visualização melhoram a análise durante exploração e corrida rápida. |
| HU12 | Como sistema, quero ajustar automaticamente a escala da grade visual conforme o tamanho do labirinto selecionado. | As dimensões e coordenadas da interface devem ser recalculadas automaticamente. | Should Have | O ajuste automático melhora a adaptação visual entre diferentes arenas. |
| HU13 | Como operador, quero visualizar áreas ainda não exploradas para facilitar o acompanhamento da exploração do labirinto. | A interface deve diferenciar visualmente células exploradas e não exploradas. | Should Have | A distinção visual facilita a análise do algoritmo de exploração. |
| HU14 | Como operador, quero visualizar consumo energético em tempo real para monitorar o uso da bateria do robô. | O sistema deve exibir tensão e corrente continuamente atualizadas. | Could Have | O monitoramento energético auxilia análises de eficiência, mas não é essencial para a entrega mínima. |
| HU15 | Como desenvolvedor, quero comparar o mapa gerado com a planta física do labirinto para medir a precisão do mapeamento. | O sistema deve calcular a margem de erro do mapeamento após os testes. | Could Have | A funcionalidade auxilia validações avançadas do algoritmo de navegação. |
| HU16 | Como operador, quero visualizar velocímetro e cronômetro ampliados durante o modo de alta performance. | O sistema deve priorizar a exibição de velocidade e tempo durante corridas rápidas. | Could Have | A funcionalidade melhora a experiência visual durante testes de desempenho. |
| HU17 | Como sistema, quero registrar cronologicamente eventos e decisões do algoritmo para facilitar depuração futura. | Os eventos devem ser armazenados em ordem temporal no histórico da execução. | Could Have | O registro detalhado auxilia manutenção e análise do comportamento do robô. |
| HU18 | Como operador, quero visualizar quando o Micromouse alcançar a área objetivo para confirmar a conclusão do desafio. | O Micromouse deve apresentar no dashboard que chegou no objetivo, assim que conseguir, o cronômetro deve parar. | Must Have | O robô deve utilizar os sensores e o algoritmo de navegação para explorar o labirinto e alcançar automaticamente a região central. |

# Requisitos Não Funcionais

| ID | Requisito Não Funcional | Métrica Objetiva |
| --- | --- | --- |
| RNF01 | O sistema deve atualizar a interface web em até 150 ms após a captura dos dados pelo microcontrolador. | Tempo máximo de atualização ≤ 150 ms. |
| RNF02 | O sistema deve suportar processamento assíncrono de menHU18sagens de telemetria. | A interface não pode congelar durante recepção contínua de dados. |
| RNF03 | O sistema deve suportar arenas nos tamanhos 4×4, 8×8 e 16×16. | Os três formatos devem ser configuráveis antes da execução. |
| RNF04 | O sistema deve persistir trajetos, tempos e logs após cada execução. | Os dados devem permanecer disponíveis para consulta posterior. |
| RNF05 | O sistema deve permitir consulta de sessões históricas em até 3 segundos. | Tempo máximo de resposta ≤ 3 s. |
| RNF06 | O sistema deve permitir exportação válida em JSON e CSV. | Os arquivos exportados devem seguir corretamente os respectivos formatos. |
| RNF07 | O sistema deve manter sincronização contínua entre hardware e interface web. | Taxa de perda de pacotes críticos inferior a 1%. |
| RNF08 | O sistema deve armazenar telemetria localmente durante falhas temporárias de conexão. | Nenhum dado deve ser perdido durante desconexões inferiores a 5 minutos. |

# Roteiro de Testes Funcionais

| ID | Objetivo | Pré-condições | Procedimento | Resultado Esperado |
| --- | --- | --- | --- | --- |
| TF01 | Validar renderização do labirinto em tempo real | Sistema conectado ao Micromouse | Iniciar telemetria e movimentar o robô | O mapa deve atualizar em até 150 ms |
| TF02 | Validar deteção de paredes | Sensores operacionais | Aproximar o robô das paredes do labirinto | As paredes devem ser exibidas corretamente |
| TF03 | Validar atualização da posição e orientação do robô | Sensores de localização operacionais | Movimentar o robô em diferentes direções | Coordenadas e orientação devem ser atualizadas corretamente |
| TF04 | Validar configuração do tamanho do labirinto | Sistema inicializado | Selecionar arenas 4×4, 8×8 e 16×16 | A grade visual deve ser redimensionada corretamente |
| TF05 | Validar comunicação entre hardware e interface web | Sistema completo em operação | Executar telemetria contínua | Não deve haver perda significativa de pacotes |
| TF06 | Validar persistência dos dados da execução | Sessão concluída | Encerrar execução do robô | Logs, trajetos e métricas devem ser salvos no banco |
| TF07 | Validar consulta de execuções anteriores | Banco de dados populado | Consultar sessões armazenadas | Os dados devem ser exibidos corretamente |
| TF08 | Validar exportação de dados | Histórico disponível | Solicitar exportação dos dados | Arquivos JSON e CSV válidos devem ser gerados |
| TF09 | Validar troca entre modos de operação | Sistema em execução | Alternar entre modo exploração e alta performance | A interface deve alterar os elementos exibidos |
| TF10 | Validar persistência local em falha de rede | Telemetria ativa | Desconectar temporariamente a rede | Os dados devem permanecer armazenados localmente |
| TF11 | Validar sincronização após reconexão | Cache local preenchido | Reconectar o sistema à rede | Os dados pendentes devem ser enviados ao servidor |
| TF12 | Validar monitorização energética | Sensores de tensão e corrente conectados | Executar movimentação do robô | Valores energéticos devem ser exibidos corretamente |
| TF13 | Validar diferenciação de áreas desconhecidas | Labirinto parcialmente explorado | Executar exploração parcial do labirinto | Áreas não exploradas devem possuir destaque visual |
| TF14 | Validar processamento assíncrono | Fluxo intenso de telemetria | Enviar múltiplos pacotes simultaneamente | A interface deve permanecer responsiva |