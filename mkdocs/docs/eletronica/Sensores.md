# Sensores

Com base nos requisitos que foram levantados [clique_Aqui](index.md):


## Quais tipos de sensores vamos precisar?

### Sensores de distância

O micromouse não pode sair tateando o labirinto, seria muito trabalhoso e demorado,
a melhor forma de saber a posição das paredes para desviar delas e resolver o labirinto 
é usando sensores de distância.

Existem 3 tipos de sensores de distância de uso comercial que são importantes de 
se considerar, e todos se baseiam na ideia de usar luz, som ou ondas eletromagnéticas 
para medir a distância, são eles:

- Sensores a laser: Possuem um bom intervalo de medição de 3cm a 2m, possuem um 
bom tempo de resposta, mas são o tipo mais caro;
- Sensores ultrassônicos: Tem o maior intervalo de medição e uma boa precisão, porém
o seu tempo de resposta é muito alto, o seu preço é razoável;
- Sensores infravermelho: Tem o menor intervalo de medição, baixa precisão, mas 
é o melhor tempo de resposta e os mais baratos.

|**Tipo de Sensor (Modelo Base)**|**Intervalo de Medição**|**Precisão (Comportamento)**|**Tempo de Resposta**|**Preço Estimado (BR)**|
|---|---|---|---|---|
|**Laser / Time-of-Flight** (VL53L0X)|~3 cm a 200 cm|**Alta.** Mede na casa dos milímetros. Feixe reto e imune à cor da superfície.|**Rápido.** ~20 ms a 33 ms (até 50Hz em modo rápido).|Moderado<br><br>  <br><br>_(R$ 25 - R$ 50)_|
|**Ultrassônico** (HC-SR04)|~2 cm a 400 cm|**Média.** Erro de ~3 mm, porém o feixe sonoro abre em cone (~15°), pegando obstáculos laterais.|**Lento.** Limitado pela velocidade do som e tempo de eco (~50 ms+ por ciclo).|Baixo<br><br>  <br><br>_(R$ 10 - R$ 20)_|
|**Infravermelho Reflexivo** (Módulo c/ CI LM393)|~2 cm a 30 cm|**Muito Baixa.** Altamente dependente da cor da parede e da luz ambiente.|**Quase instantâneo.** Limitado apenas pelo circuito analógico (< 1 ms).|Muito Baixo<br><br>  <br><br>_(R$ 5 - R$ 10)_|

Possíveis problemas:

- Ao usar o sensor ultrassônico pode ser que as ondas ultrassônicas reflitam nas 
paredes do labirinto dificultando a medição de distância;
- Sensores infravermelho não são bons para medir distância, eles só conseguem 
saber se tem uma parede perto ou não;

Possíveis alternativas:

- Já que os sensores infravermelhos são baratos e tem um tempo de resposta muito 
baixo, podemos usá-los como uma "medida de segurança", colocando mais de um sensor 
ao redor do rato e frear o caso ele chegue muito perto de uma parede;
- O sensor a laser pode ser a solução caso os sensores ultrassônicos não se comportem 
bem no labirinto, não precisamos de muitos, um na frente pode ser o suficiente.


## Quantos sensores de cada tipo vamos precisar?

No mínimo 3 sensores de distância, um na frente do rato, um pra direita e outro 
pra esquerda, além de 1 encoder pra cada motor.

## Onde cada sensor ficará posicionado?

Devemos ter um sensor de distância na frente do rato para saber se ele vai bater 
na parede do labirinto ao acelerar, o mesmo acontece para o lado direito e esquerdo 
precisamos de pelo menos um sensor de cada lado do micromouse para saber se ele 
vai bater ao virar pra esquerda ou pra direita.

Os encoders (sensores que medem o ângulo dos motores) serão posicionados no eixo 
dos motores.

## Referências

[1] MESKERNEL. **How to choosing the best measuring distance sensor**. Disponível em: https://meskernel.net/en/measuring-distance-sensor/. Acesso em: 23 abr. 2026.

[2] MERCADO LIVRE. **VL53L0X sensor distância ToF laser LiDAR p/ Arduino PIC AVR**. Disponível em: https://www.mercadolivre.com.br/vl53l0x-sensor-distancia-tof-laser-lidar-p-arduino-pic-avr/up/MLBU1723215944. Acesso em: 23 abr. 2026.

[3] POLOLU. **World’s smallest Time-of-Flight ranging and gesture detection sensor – VL53L0X**. Disponível em: https://www.pololu.com/file/0J1187/vl53l0x.pdf. Acesso em: 23 abr. 2026.

[4] MERCADO LIVRE. **Módulo sensor ultrassônico de distância HC-SR04**. Disponível em: https://www.mercadolivre.com.br/modulo-sensor-ultra-sonico-distancia-hcsr04/up/MLBU1973452557. Acesso em: 23 abr. 2026.

[5] SPARKFUN ELECTRONICS. **HC-SR04 Ultrasonic Distance Sensor Datasheet**. Disponível em: https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf. Acesso em: 23 abr. 2026.

[6] MERCADO LIVRE. **5x sensor de obstáculo infravermelho LM393 para Arduino**. Disponível em: https://www.mercadolivre.com.br/5x-sensor-de-obstaculo-infravermelho-lm393--para-arduino-/up/MLBU726571647. Acesso em: 23 abr. 2026.

[7] TEXAS INSTRUMENTS. **LM393B, LM2903B, LM193, LM293, LM393 and LM2903 Dual Comparators datasheet**. Disponível em: https://www.ti.com/lit/ds/symlink/lm393.pdf. Acesso em: 23 abr. 2026.

## Tabela de versionamento


|Data      |Versão    |Descrição                                |Autores|
|----------|----------|-----------------------------------------|-------|
|22/04/2026|0.1       |Criação do documento    | Arthur Augusto |
