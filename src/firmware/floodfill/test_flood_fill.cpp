#define CATCH_CONFIG_MAIN
#include "catch.hpp"
#include "flood_fill.h"

TEST_CASE("Issue 207: Atualizacao de distancias apos insercao de parede", "[flood_fill]") {
    // Inicializar labirinto 3x3 com meta no centro (1,1)
    vector<pair<int, int>> metas = {{1, 1}};
    ff_inicializar(3, 3, metas);

    SECTION("Inicialmente as distancias para o centro estao corretas") {
        REQUIRE(distancia[1][1] == 0);
        REQUIRE(distancia[0][1] == 1); // vizinhos diretos
        REQUIRE(distancia[1][0] == 1);
        REQUIRE(distancia[1][2] == 1);
        REQUIRE(distancia[2][1] == 1);
        REQUIRE(distancia[0][0] == 2); // diagonais
        REQUIRE(distancia[0][2] == 2);
        REQUIRE(distancia[2][0] == 2);
        REQUIRE(distancia[2][2] == 2);
    }

    SECTION("Ao colocar uma parede, a distancia e recalculada") {
        // (0,1) fica a OESTE de (1,1). Para bloquear a passagem entre eles, coloca parede LESTE em (0,1).
        ff_parede(0, 1, LESTE);
        ff_recalcular();

        // O centro (1,1) continua com distancia 0
        REQUIRE(distancia[1][1] == 0);

        // A celula (0,1) agora tem que dar a volta.
        // O caminho (0,1) -> (1,1) ta bloqueado.
        // (0,1) -> (0,0) -> (1,0) -> (1,1) (distancia 3)
        // (0,1) -> (0,2) -> (1,2) -> (1,1) (distancia 3)
        REQUIRE(distancia[0][1] == 3);
        
        // (0,0) podia ir pro LESTE(1,0) ou NORTE(0,1).
        // Se for NORTE(0,1), a distancia ate (1,1) sera 3+1 = 4.
        // Se for LESTE(1,0), a dist ate (1,1) é 1+1 = 2.
        // Entao a menor distancia pra (0,0) é 2.
        REQUIRE(distancia[0][0] == 2);
    }
}

TEST_CASE("Issue 209: Escolha de melhor movimento (Frente > Direita > Esquerda > Tras)", "[flood_fill]") {
    vector<pair<int, int>> metas = {{2, 2}};
    ff_inicializar(3, 3, metas);

    SECTION("Deve preferir seguir em frente quando as distancias sao iguais") {
        // Robô em (1,1) olhando para LESTE.
        // Norte (1,2) -> dist 1
        // Sul (1,0) -> dist 3
        // Leste (2,1) -> dist 1
        // Oeste (0,1) -> dist 3
        
        // A Frente do LESTE e LESTE (2,1). A Esquerda é NORTE (1,2). Ambos tem dist 1.
        // Como o desempate prioriza FRENTE, ele deve ir para LESTE.
        Direcao proximo = ff_melhor_movimento(1, 1, LESTE);
        REQUIRE(proximo == LESTE);
    }

    SECTION("Deve escolher Direita antes de Esquerda em caso de empate (se Frente nao for o menor)") {
        // Robô em (0,1), olhando pro SUL.
        // FRENTE (SUL) -> (0,0), dist = 4
        // DIREITA (OESTE) -> parede (x=-1)
        // ESQUERDA (LESTE) -> (1,1), dist = 2
        // TRAS (NORTE) -> (0,2), dist = 2
        
        // Aqui, (1,1) LESTE e (0,2) NORTE tem distancia 2.
        // Olhando para SUL: Frente=SUL, Direita=OESTE, Esquerda=LESTE, Tras=NORTE.
        // Esquerda tem dist 2 e Tras tem dist 2.
        // O algoritmo deve preferir Esquerda a Tras.
        Direcao proximo = ff_melhor_movimento(0, 1, SUL);
        REQUIRE(proximo == LESTE);
    }
    
    SECTION("Deve ir para Tras apenas como ultima opcao") {
        // Robô em (0,0) (dist 4), olhando pro OESTE (bloqueado, limite)
        // Frente = OESTE (limite)
        // Direita = NORTE (0,1) -> dist 3
        // Esquerda = SUL (limite)
        // Tras = LESTE (1,0) -> dist 3
        
        // Direita e Tras tem a mesma distancia (3).
        // Direita tem preferencia sobre Tras.
        Direcao proximo = ff_melhor_movimento(0, 0, OESTE);
        REQUIRE(proximo == NORTE);
    }
}
