# Requisitos de Energia

Com o objetivo de trazer maior clareza para o grupo e, em especial, para a equipe de energia, foi criado este documento com os requisitos necessários para o MicroMouse no contexto de dimensionamento energético. Este documento é composto tanto com o passo a passo lógico para a construção do dimensionamento energético quanto com as exigências da disciplina.

## Requisitos

### 1. Levantar componentes

Listar todos os componentes que consumirão energia. Para cada um, registrar a tensão de operação (V), corrente média (mA) e tempo estimado de uso em segundos.

Assim, preencher como:  
Nome Componente | Tensão (V) | Corrente média (mA) | Tempo estimado de uso (s)

### 2. Calcular a energia consumida por cada componente

Utilizando a fórmula E = V _ I _ t, sendo:

E -> Energia em Joules  
V -> Tensão em volts  
t -> Tempo em segundos (estimado de funcionamento do MicroMouse)
I -> Corrente elétrica em ampéres

### 3. Consumo total de energia

Obter a estimativa do consumo total de energia somando o resultado do Passo 2 para todos os componentes a serem utilizados, sendo necessário completar a seguinte tabela:

| Nome | Quantidade | Consumo Individual | Consumo Total |
| ---- | ---------- | ------------------ | ------------- |
| A    | B          | C                  | D             |

E, ao fim, deve ser totalizado o consumo de energia de todos os componentes e considerado a quantidade máxima de tentativas para cada etapa.

### 4. Escolher a fonte de alimentação

Deve ser escolhida a fonte de acordo com o consumo total, convertido para watt-hora (1Wh = 3600 J), levando em consideração as margens de segurança escolhidas.

**OBS:** Além disso, exigiremos 30% de margem de segurança na capacidade energética e também 20% a 30% de folga na corrente/potência de pico. Essa escolha se dá porque é coerente com recomendações usuais de dimensionamento para sistemas com motores e cargas transitórias. Tendo em vista que o MicroMouse apresenta variações bruscas de carga, principalmente nos motores durante acelerações, frenagens e correções de rota, e sua utilização pode envolver várias execuções em sequência. Dessa forma, a margem aumenta a confiabilidade do robô, reduz o risco de queda de tensão e evita que a fonte escolhida opere próxima do limite.

### 5. Verificar a necessidade de inclusão de reguladores de tensão, proteções contra subcorrente e isolamento para atuadores

O processo deve ocorrer da seguinte forma:

#### 5.1. Separar os consumidores de energia por grupos funcionais, no mínimo:

- eletrônica de controle;
- sensores;
- atuadores/motores;
- módulos auxiliares, se aplicável.

#### 5.2. Levantar a tensão de operação exigida por cada grupo, para identificar:

- quais componentes podem ser alimentados diretamente pela bateria;
- quais componentes exigem reguladores de tensão;
- quais componentes exigem alimentação mais estável ou menos ruidosa.

#### 5.3. Definir os barramentos de alimentação do sistema ao registrar:

- tensão nominal da fonte principal;
- tensões derivadas necessárias;
- corrente média e corrente de pico por barramento;
- componentes conectados em cada barramento.

#### 5.4. Verificar a necessidade de reguladores de tensão, com base nos seguintes critérios:

- diferença entre a tensão da bateria e a tensão exigida pela carga;
- estabilidade necessária para sensores e microcontrolador;
- eficiência do regulador;
- dissipação térmica esperada;
- impacto do regulador na autonomia total.

#### 5.5. Verificar a necessidade de proteções elétricas, considerando no mínimo:

- proteção contra sobrecorrente;
- proteção contra inversão de polaridade;
- proteção contra subtensão da bateria;
- proteção contra picos gerados pelos atuadores;
- prevenção de reset ou mau funcionamento do sistema de controle.

#### 5.6. Avaliar a necessidade de separação entre alimentação de lógica e atuadores, ao verificar:

- possibilidade de ruído elétrico gerado pelos motores;
- oscilações de tensão durante aceleração, frenagem e mudança de direção;
- sensibilidade dos sensores e do microcontrolador a quedas de tensão.

#### 5.7. Definir como as oscilações de tensão serão controladas, especificando:

- uso de capacitores de desacoplamento próximos aos circuitos integrados;
- uso de capacitor de bulk na linha de potência;
- organização do aterramento;
- largura adequada das trilhas de alimentação;
- posicionamento físico da bateria, driver e reguladores.

Dessa forma, podemos até mesmo criar um diagrama em blocos da alimentação, uma tabela com os barramentos e a lista com reguladores, proteções e a justificativa para o uso deles.

### 6. Autonomia da bateria

Deve ser calculada a autonomia da bateria do MicroMouse, que precisa ser realizada a partir do perfil de uso do sistema e não apenas da soma simples dos componentes. Para isso, executamos os seguintes passos:

#### 6.1. Definir os modos de operação do MicroMouse, como:

- inicialização/espera;
- leitura de sensores;
- exploração do labirinto;
- corrida rápida;
- frenagem, curvas e correções;
- tentativas sucessivas.

#### 6.2. Estimar o tempo de permanência, em segundos, em cada modo de operação, levando em conta:

- duração prevista de uma execução;
- quantidade máxima de tentativas;
- tempo total de uso esperado em uma sessão.

#### 6.3. Associar a cada modo de operação os componentes que estarão ativos, identificando:

- tensão de operação;
- corrente média;
- tempo de funcionamento naquele modo.

#### 6.4. Calcular a energia consumida por componente e por modo, usando o indicado no Passo 2;

#### 6.5. Somar os consumos de todos os componentes em todos os modos de operação, obtendo o consumo energético total previsto do sistema, como previsto no Passo 3;

#### 6.6. Converter o consumo total para watt-hora (1Wh=3600J) para os modos de operação;

#### 6.7. Incluir fatores de correção do sistema real, ao considerar:

- perdas nos reguladores de tensão;
- perdas no driver dos motores;
- perdas nos próprios motores;
- resistência interna da bateria;
- quedas de tensão em picos de corrente;
- diferença entre corrente média teórica e corrente real em operação.

#### 6.8. Aplicar margem de segurança ao consumo calculado, como indicado no Passo 4;

#### 6.9. Definir o requisito mínimo da bateria, ao registrar:

- tensão nominal mínima necessária;
- capacidade energética mínima em Wh;
- capacidade mínima equivalente em Ah ou mAh;
- corrente mínima de descarga necessária;
- corrente de pico mínima suportada.

Assim, teremos o cálculo da autonomia de bateria, com o consumo teórico em cada modo de operação, o total com a margem de segurança, com autonomia teórica estimada e requisitos mínimos que a bateria deva atender.

### 7. Validação

Deve ser feita a validação experimental do sistema em condições reais de uso. Para isso, podemos executar os passos:

#### 7.1. Definir as grandezas que serão medidas durante os testes, como:

- tensão da bateria;
- corrente total consumida;
- corrente nos motores, se possível;
- tempo total de operação;
- ocorrência de picos de corrente;
- quedas de tensão;
- temperatura de reguladores e driver, se aplicável.

#### 7.2. Definir a instrumentação necessária para coleta dos dados, como:

- sensor de corrente;
- divisor resistivo ou monitor de tensão;
- sistema de log via microcontrolador;
- multímetro ou fonte de bancada, se disponíveis.

#### 7.3. Executar testes por etapas, por exemplo:

- teste apenas com eletrônica de controle;
- teste com motores sem carga relevante;
- teste com movimento em linha reta;
- teste com curvas e correções;
- teste com sequência completa de operação;
- teste com número máximo de tentativas previsto.

#### 7.4. Registrar os dados medidos em cada teste, preenchendo uma tabela com:

- modo de operação;
- tensão média;
- corrente média;
- corrente de pico;
- duração;
- energia estimada;
- observações.

#### 7.5. Comparar os resultados reais com os resultados teóricos, calculando o erro percentual:

Erro (%)= ((valor real - valor teórico) / valor teórico) \* 100

#### 7.6. Analisar as causas das diferenças entre teoria e prática, ao verificar:

- perdas não consideradas inicialmente;
- variações de carga dos motores;
- comportamento real da bateria sob picos;
- ruído e oscilações na alimentação;
- consumo adicional em manobras, frenagens e correções;
- influência do piso, atrito e estratégia de navegação.

#### 7.7. Ajustar, eventualmente, o modelo energético do projeto com base nos testes.

## Referências

[Considerations When Using an Open Frame Power Supply](https://www.advancedenergy.com/en-us/about/news/blog/considerations-when-using-an-open-frame-power-supply/)

[Micromouse Online](https://micromouseonline.com/micromouse-book/rules/)

[How to Select the Right Power Supply for a DC Servo Motor](https://recom-power.com/en/rec-n-how-to-select-the-right-power-supply-for-a-dc-servo-motor-430.html?0)

[Choosing the power supply and motor](https://www.pololu.com/docs/0J84/3.1)

## Tabela de Versionamento

| Versão | Descrição                                  | Autor                                                 | Revisor                                               |
| ------ | ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| `1.0`  | Criação inicial dos requisitos             | [Júlia Fortunato](https://github.com/julia-fortunato) | [Ana Luiza Soares](https://github.com/Ana-Luiza-SC)   |
| `1.1`  | Adição de alguns refinamentos ao documento | [Ana Luiza Soares](https://github.com/Ana-Luiza-SC)   | [Júlia Fortunato](https://github.com/julia-fortunato) |
