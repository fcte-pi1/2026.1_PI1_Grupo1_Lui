# Algoritmos de Solução do Labirinto
# Objetivo

Este documento tem como objetivo definir e justificar uma estratégia eficiente para o mapeamento de labirintos desconhecidos, determinação do caminho mais rápido e execução otimizada do *speed run* em um sistema Micromouse. Para isso, são analisados diferentes algoritmos de exploração e planejamento de trajetória, considerando critérios como completude, otimização, custo computacional, adaptabilidade e simplicidade de implementação.

# Modelo do Problema

O labirinto é representado como uma grade bidimensional discreta (*grid*), na qual cada célula pode possuir até quatro paredes correspondentes às direções norte, sul, leste e oeste. Os movimentos do robô são restritos a essas quatro direções, e todos os deslocamentos possuem custo uniforme, igual a 1.

A estrutura utilizada para representar cada célula do labirinto é composta pelas informações referentes às paredes existentes e ao estado de visitação da célula:

```
structCell {
boolwall_north;
boolwall_south;
boolwall_east;
boolwall_west;
boolvisited;
};
```

Além disso, é utilizada uma matriz de distâncias para o algoritmo Flood Fill:

```
int dist[x][y];
```

Essa matriz armazena o custo estimado entre cada célula e o objetivo, permitindo que o robô tome decisões de navegação dinamicamente.

# Mapeamento do Labirinto

O robô constrói o mapa do ambiente de maneira incremental, utilizando exclusivamente informações obtidas pelos sensores locais. A cada movimento realizado, o sistema executa um ciclo de atualização no qual as paredes detectadas são registradas, as células vizinhas são atualizadas para manter consistência estrutural e a posição atual é marcada como visitada.

A consistência do mapa é uma propriedade fundamental do sistema. Caso exista uma parede ao norte de uma determinada célula, essa mesma parede deve necessariamente aparecer como parede sul da célula adjacente. Assim, se `(x,y).north = true`, então `(x,y+1).south = true`.

Durante o início da exploração, o mapa é apenas parcialmente conhecido. Entretanto, conforme o robô percorre o ambiente e registra novas informações, o modelo torna-se progressivamente mais completo, até representar integralmente o labirinto explorado.

# 1. Flood Fill — Base da Exploração

O algoritmo principal adotado neste projeto é o Flood Fill. Sua principal ideia consiste em propagar distâncias a partir da célula objetivo para todas as demais posições acessíveis do labirinto.

Formalmente, a distância de uma célula pode ser definida como:

d(c) = { 0,se c=objetivo

   { 1 + min⁡(d(vizinho)), caso contrário

Inicialmente, o objetivo recebe distância zero. Em seguida, os valores são propagados para as células adjacentes acessíveis, formando um gradiente de distâncias que pode ser seguido pelo robô. Sempre que uma nova parede é descoberta, o campo de distâncias é recalculado para refletir corretamente as novas restrições do ambiente.

A decisão de movimento torna-se então simples: o robô seleciona o vizinho acessível com menor valor em `dist`. Esse mecanismo permite adaptação dinâmica durante a exploração, corrigindo trajetórias anteriormente consideradas válidas.

O Flood Fill apresenta propriedades extremamente relevantes para o problema Micromouse. O algoritmo é completo, garante caminhos ótimos em grafos sem peso e possui excelente capacidade de adaptação a mapas inicialmente desconhecidos.

# 2. DFS (Depth-First Search)

O algoritmo DFS realiza a exploração do ambiente em profundidade. Seu funcionamento baseia-se implicitamente em uma pilha, seja ela explícita ou implementada via recursão. O robô avança para qualquer vizinho ainda não visitado e, quando não existem novas possibilidades de avanço, realiza *backtracking* até encontrar outro caminho disponível.

Embora seja simples e apresente baixo consumo de memória, o DFS possui limitações importantes no contexto do Micromouse. O algoritmo não minimiza o caminho percorrido e frequentemente gera elevada redundância durante a exploração.

# 3. BFS (Breadth-First Search)

O BFS explora o ambiente em largura, utilizando uma fila para processar as células por camadas. Nesse método, cada nova célula recebe distância igual à distância de sua predecessora acrescida de uma unidade.

Como consequência, o BFS garante a obtenção do menor caminho em grafos sem peso. Entretanto, sua aplicação em sistemas Micromouse apresenta limitações práticas, principalmente devido ao elevado consumo de memória e à baixa eficiência em cenários que exigem replanejamento contínuo durante a exploração.

# 4. A* (A-Star)

O algoritmo A* é uma técnica de busca heurística extremamente eficiente para determinação de caminhos ótimos. Seu funcionamento depende da utilização de uma função de avaliação composta pelo custo acumulado até o nó atual e por uma heurística estimada até o objetivo.

f(n) = g(n) + h(n)

No contexto de grades bidimensionais, a heurística mais utilizada é a distância Manhattan:

h(n) = ∣xgoal − x∣ + ∣ygoal − y∣

O algoritmo expande prioritariamente os nós com menor valor de `f(n)`, reduzindo significativamente o número de estados explorados. O A* é completo, ótimo quando utiliza heurísticas admissíveis e extremamente eficiente em mapas conhecidos ou suficientemente explorados.

# 5. Dijkstra

O algoritmo de Dijkstra realiza propagação de custos mínimos a partir de uma origem, atualizando iterativamente as menores distâncias conhecidas.

d(n) = min⁡(d(n), d(atual) + custo)

Na prática, Dijkstra pode ser interpretado como um caso particular do A* em que a heurística é nula. Embora produza caminhos ótimos, tende a explorar mais nós do que o necessário, tornando-se menos eficiente em comparação ao A*.

# 6. Wall Following

A técnica de *Wall Following* consiste em seguir continuamente uma parede lateral, mantendo-a sempre à direita ou à esquerda do robô. Apesar de extremamente simples e exigir praticamente nenhuma memória, o método apresenta sérias limitações. O algoritmo não garante solução em todos os tipos de labirinto e tampouco produz caminhos ótimos.

# 7. Tremaux

O algoritmo de Tremaux se baseia na marcação de caminhos percorridos. Cada trajeto pode receber diferentes estados de visitação, permitindo ao robô priorizar caminhos ainda não explorados e evitar revisitar excessivamente as mesmas regiões do labirinto.

Embora seja eficiente para exploração sistemática e prevenção de ciclos, o método não possui mecanismos para otimização do caminho final.

# Comparação Técnica

A comparação entre os algoritmos analisados demonstra diferenças significativas em termos de optimalidade, completude, consumo de memória e capacidade de adaptação durante exploração dinâmica.

| Algoritmo | Ótimo | Completo | Memória | Exploração | Adaptação |
| --- | --- | --- | --- | --- | --- |
| Flood Fill | ✅ | ✅ | Média | Excelente | Excelente |
| DFS | ❌ | ✅ | Baixa | Ruim | Boa |
| BFS | ✅ | ✅ | Alta | Média | Média |
| A* | ✅ | ✅ | Média | Excelente | Baixa |
| Dijkstra | ✅ | ✅ | Alta | Média | Baixa |
| Wall Following | ❌ | ❌ | Muito baixa | Ruim | Alta |
| Tremaux | ❌ | ✅ | Baixa | Média | Boa |

# Estratégia de Escolha

Após a análise comparativa dos algoritmos, decidiu-se utilizar exclusivamente o Flood Fill tanto para exploração quanto para determinação do caminho final.

Embora o A* também fosse capaz de produzir caminhos ótimos, sua implementação adicionaria complexidade desnecessária ao sistema sem trazer benefícios proporcionais ao escopo do projeto. Como o objetivo principal não é maximizar desempenho computacional absoluto, mas sim obter uma solução robusta, eficiente e relativamente simples, o Flood Fill mostrou-se mais adequado.

Apesar de minimizar inicialmente apenas a distância em número de células, o algoritmo pode ser adaptado para melhorar significativamente o desempenho real do robô. Isso é possível por meio de reexecuções contínuas do algoritmo, refinamento progressivo das rotas e utilização de critérios de desempate que reduzam curvas desnecessárias.

Durante a fase de exploração, o sistema utiliza Flood Fill dinâmico. Sempre que novas paredes são detectadas, o mapa é atualizado e o campo de distâncias é recalculado. O robô então escolhe continuamente o vizinho acessível com menor valor de distância.

Após o conhecimento completo do labirinto, o algoritmo é executado novamente sobre o mapa finalizado, produzindo o caminho mínimo global.

Um aspecto essencial da estratégia adotada é o critério de desempate entre células com mesma distância. Nessas situações, o sistema prioriza continuar na mesma direção atual, reduzindo mudanças bruscas e minimizando curvas. Na prática, a preferência segue a lógica:

> reta > leve curva > curva forte > retorno
> 

Esse mecanismo melhora significativamente o desempenho temporal durante a execução real.

Na etapa de *speed run*, o robô simplesmente segue o caminho previamente calculado, aplicando maior velocidade em trechos retos e desaceleração em curvas, aumentando eficiência e estabilidade.

# Limitações do Modelo e Possíveis Extensões

A estratégia apresentada neste projeto considera o modelo clássico do problema Micromouse, no qual o tamanho do labirinto e a posição do objetivo são previamente conhecidos, além da existência de uma estrutura regular em grade.

Dentro dessas condições, o Flood Fill apresenta excelente desempenho para exploração incremental, atualização dinâmica de rotas, determinação do caminho ótimo e execução eficiente do *speed run*.

Entretanto, em cenários mais gerais de navegação autônoma, essas premissas podem não existir. Em ambientes totalmente desconhecidos, nos quais o tamanho do mapa, seus limites e a posição do objetivo não são conhecidos previamente, o Flood Fill deixa de ser suficiente como estratégia inicial de exploração, já que depende de um objetivo definido para propagação das distâncias.

Nessas situações, o problema passa a envolver simultaneamente exploração, localização, mapeamento e planejamento de trajetória.

Para esse tipo de cenário, seria mais apropriado utilizar uma abordagem híbrida. Inicialmente, algoritmos como DFS ou Tremaux poderiam ser empregados para exploração sistemática do ambiente e construção incremental do mapa. Após a descoberta do objetivo e obtenção de informações suficientes sobre o labirinto, algoritmos como Flood Fill ou A* poderiam então ser utilizados para determinação do caminho mais rápido.

Além disso, como o tamanho do ambiente seria inicialmente desconhecido, o sistema não poderia depender de matrizes estáticas de tamanho fixo. Nesse caso, estruturas dinâmicas, como tabelas hash ou mapas associativos, seriam mais adequadas, permitindo criação de novas células conforme o ambiente é explorado.

Apesar dessas possibilidades de extensão, o presente projeto permanece focado no modelo clássico do Micromouse. Dentro desse escopo, o Flood Fill continua sendo a solução mais adequada devido à sua simplicidade de implementação, baixo custo computacional, excelente adaptabilidade e elevada eficiência na determinação do caminho ótimo.