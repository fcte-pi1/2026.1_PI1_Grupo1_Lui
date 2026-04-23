# Elicitação de Requisitos 

O levantamento de requisitos é uma das etapas mais importantes de um projeto, pois define claramente o que deve ser desenvolvido. Ele garante que todos os envolvidos estejam na mesma página, evitando retrabalho, custos desnecessários e falhas que poderiam comprometer o sucesso do sistema. Diante da relevância dessa atividade, a equipe de Eletrônica realizou o levantamento dos requisitos da área de eletrônica.

Obs.: Os seguintes requisitos foram levantados conforme a documentação que nos foi disponibilizada na plataforma Aprender3 da disciplina.


## Requisitos Funcionais 


| **ID**   | **Descrição do Requisito** |
|-----|------------------------|
| **RF01**   |   O hardware deve possuir sensores que detectam a presença de paredes no ambiente (paredes brancas com 5 cm de altura e 1,2 cm de       espessura), distinguindo-as do chão (preto).                     |
| **RF02**   |    O hardware deve possuir sensores que sejam capazes de detectar simultaneamente obstáculos nas direções frontal, esquerda e direita durante a navegação.                   |
| **RF03**   |    O hardware deve manter comunicação sem fio com o servidor durante a operação, transmitindo telemetria em intervalos regulares.                   |
| **RF04**   |    O hardware deve possuir capacidade de memória suficiente para armazenar a representação de um labirinto em uma grade de até 16×16 células.                    |
| **RF05**   |    O hardware deve capturar dados que permitam calcular a posição do robô em uma grade de até 16×16 células.                   |
| **RF06**   |    O hardware deve suportar que toda a lógica de resolução do labirinto e navegação deve ser executada localmente no  robô, sem intervenção externa.                 |




## Requisitos Não Funcionais 

| **ID**   | **Descrição do Requisito** |
|-----|------------------------|
| **RNF01**   |   O tempo total entre a leitura dos sensores, o processamento da decisão e a atuação nos motores deve ser de, no máximo, 50 ms.                    |
| **RNF02**   |    A comunicação sem fio deve manter conectividade estável em toda a área do labirinto de até 16×16 células, com taxa de perda de pacotes inferior a 5% durante a operação.                  |
| **RNF03**   |    O hardware deve garantir autonomia mínima suficiente para operar continuamente por até 3 execuções completas dos labirintos propostos sem necessidade de recarga.                   |
| **RNF04**   |    O hardware deve possuir capacidade de memória suficiente para suportar operação contínua de mapeamento em grade de até 16×16 células sem falhas por esgotamento de memória.                  |


## Referências

[1] QUIKER. **Levantamento de requisitos: o que é e como funciona**. Disponível em: https://quiker.com.br/levantamento-de-requisitos-o-que-e-e-como-funciona/. Acesso em: 23 abr. 2026.

## Tabela de versionamento


|Data      |Versão    |Descrição                                |Autores|
|----------|----------|-----------------------------------------|-------|
|23/04/2026|0.1       |Criação do documento    | Jose Vinicius |
