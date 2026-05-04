# Motor

# Contextualização

  Segundo Stephen J. Chapman [1], quando se tem uma máquina que converte energia elétrica em energia mecânica, é chamado de motor, ou seja, os motores têm como objetivo transformar energia elétrica em movimento, assim utilizados em uma ampla gama de aplicações, como por exemplo os veículos. E, como é descrito [2], o micromouse é um robô competidor que deve ser autônomo, ou seja, seu processamento e controle são embarcados em uma estrutura mecânica composta por chassi e motores movidos comumente por energia elétrica. Diante disso, a atividade para a escolha do motor que será usado requer um importante estudo profundo e detalhado. A seguir, segue-se o resultado da pesquisa da equipe.

#
#

# Motores escolhidos para a análise

  A estratégia adotada pela equipe foi primeiramente escolher alguns motores para uma análise mais profunda, dessa forma serão comparados os seguintes motores:

      - Motor DC N20 100:1 com encoder: Micro motor DC com caixa de redução.
      - Motor DC 3-6V tipo 130: Modelo de corrente contínua (DC) sem caixa de redução.
      - 28BYJ-48 Stepper Motor: Motor de passo (stepper motor) unipolar.

#
#


# Tabela de Comparação

**A tabela foi construida conforme as fontes listadas nas Referências**

| Critério                  | N20 100:1 | 3-6V tipo 130 | 28BYJ-48 Stepper Motor |
|--------------------------|---------------------|------------------------|----------------------------|
| Tipo                     | DC c/ redutor       | DC escovado            | Motor de passo                  | 
| Torque                   | Alto             | Medio               | Medio                    | 
| Velocidade (RPM)         | 300 RPM ((±10%))            | ~9100 RPM (sem carga)                  | Baixa (~10–15 RPM)                     |
| Precisão de posição      | Alta (encoder)      | Nenhuma (sem Encoder)                | Alta (controle por passos)                   | 
| Controle                 | Médio (PWM + encoder)| Simples (tensão)       | Complexo (driver)          | Médio/Alto (requer driver e controle por sequência de passos) | 
| Custo                    | Médio (~R$ 34,90)             | Baixo (~R$3,00)                 | Baixo(~R$17,00)              | 
| Consumo de energia       | 6V              | 70 mA (sem carga) / 500 mA (máx)                 | ~200–300 mA                     | 
| Tamanho                  | 12 mm (diâmetro) x 30,5 mm (corpo) + eixo de 10 mm      | 27.5 × 20 × 15 mm               | ~28 mm de diâmetro                     | 




# Justificativa


A escolha pelo motor DC N20 100:1 justifica-se pelo equilíbrio entre torque, tamanho reduzido e capacidade de controle preciso. Devido à presença de uma caixa de redução com relação aproximada de 100:1, o motor é capaz de fornecer torque suficiente para movimentação eficiente do robô, mesmo em partidas e mudanças de direção, situações comuns em percursos de labirinto. Essa característica é fundamental, uma vez que motores DC simples apresentam baixa capacidade de força, comprometendo o desempenho em aplicações móveis.

Além disso, o motor possui encoder acoplado, o que possibilita medir a velocidade e o deslocamento do robô com maior precisão, o que é fundamental para a nossa equipe, já que o robô precisa calcular sua posição em relação ao mapa, conforme os [Requisitos](index.md), vantagem que não teríamos se o motor não tivesse encoder, como o 3-6V tipo 130.

Outro fator relevante é o seu tamanho compacto, que facilita a integração em projetos com restrição de espaço. Em comparação com motores de passo, o N20 apresenta maior eficiência energética e maior velocidade, enquanto mantém um nível adequado de controle quando associado ao encoder.


#
#



# Referências 

[1]CHAPMAN, Stephen J. *Electric Machinery Fundamentals*. 5. ed. New York: McGraw-Hill, 2012.

[2]EMBARCADOS. Micromouse: o robô que resolve labirintos. Disponível em: <https://embarcados.com.br/micromouse/>. Acesso em: 25 abr. 2026.

[3]POLOLU. Micro Metal Gearmotor with Encoder (N20). Disponível em: <https://www.pololu.com/product/5165>. Acesso em: 25 abr. 2026.

[4]ADAFRUIT. DC Motor 130 Size, 3V–6V. Disponível em: <https://www.adafruit.com/product/711>. Acesso em: 25 abr. 2026.

[5]COMPONENTS101. 28BYJ-48 Stepper Motor. Disponível em: <https://components101.com/motors/28byj-48-stepper-motor>. Acesso em: 25 abr. 2026.


## Tabela de versionamento

|Data      |Versão    |Descrição                                |Autores|
|----------|----------|-----------------------------------------|-------|
|25/04/2026|0.1       |Criação do documento    | Jose Vinicius |

