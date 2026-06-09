#include <catch2/catch_test_macros.hpp>
#include <vector>

#include "flood_fill.h"

using namespace std;

// Helper: inicializa labirinto para os testes
void inicializa_teste(int larg = 5, int alt = 5) {
    vector<pair<int, int>> metas = {{0, 0}};
    ff_inicializar(larg, alt, metas);
}

TEST_CASE("ff_parede - Parede NORTE espelha corretamente", "[parede][norte]") {
    inicializa_teste(5, 5);

    SECTION("Marca parede_norte na celula de origem") {
        ff_parede(1, 1, NORTE);
        REQUIRE(labirinto[1][1].parede_norte == true);
    }

    SECTION("Espelha parede_sul no vizinho ao norte") {
        ff_parede(1, 1, NORTE);
        REQUIRE(labirinto[1][2].parede_sul == true);
    }

    SECTION("Nao altera outras paredes da celula de origem") {
        ff_parede(2, 2, NORTE);
        REQUIRE(labirinto[2][2].parede_norte == true);
        REQUIRE(labirinto[2][2].parede_sul == false);
        REQUIRE(labirinto[2][2].parede_leste == false);
        REQUIRE(labirinto[2][2].parede_oeste == false);
    }
}

TEST_CASE("ff_parede - Parede SUL espelha corretamente", "[parede][sul]") {
    inicializa_teste(5, 5);

    SECTION("Marca parede_sul na celula de origem") {
        ff_parede(2, 2, SUL);
        REQUIRE(labirinto[2][2].parede_sul == true);
    }

    SECTION("Espelha parede_norte no vizinho ao sul") {
        ff_parede(2, 2, SUL);
        REQUIRE(labirinto[2][1].parede_norte == true);
    }
}

TEST_CASE("ff_parede - Parede LESTE espelha corretamente", "[parede][leste]") {
    inicializa_teste(5, 5);

    SECTION("Marca parede_leste na celula de origem") {
        ff_parede(2, 2, LESTE);
        REQUIRE(labirinto[2][2].parede_leste == true);
    }

    SECTION("Espelha parede_oeste no vizinho a leste") {
        ff_parede(2, 2, LESTE);
        REQUIRE(labirinto[3][2].parede_oeste == true);
    }
}

TEST_CASE("ff_parede - Parede OESTE espelha corretamente", "[parede][oeste]") {
    inicializa_teste(5, 5);

    SECTION("Marca parede_oeste na celula de origem") {
        ff_parede(2, 2, OESTE);
        REQUIRE(labirinto[2][2].parede_oeste == true);
    }

    SECTION("Espelha parede_leste no vizinho a oeste") {
        ff_parede(2, 2, OESTE);
        REQUIRE(labirinto[1][2].parede_leste == true);
    }
}

TEST_CASE("ff_parede - Bordas nao causam acesso fora dos limites", "[parede][borda]") {
    inicializa_teste(5, 5);

    SECTION("Parede OESTE na borda esquerda (x=0) nao causa segfault") {
        REQUIRE_NOTHROW(ff_parede(0, 0, OESTE));
        REQUIRE(labirinto[0][0].parede_oeste == true);
    }

    SECTION("Parede NORTE na borda superior (y=alt-1) nao causa segfault") {
        REQUIRE_NOTHROW(ff_parede(2, 4, NORTE));
        REQUIRE(labirinto[2][4].parede_norte == true);
    }

    SECTION("Parede LESTE na borda direita (x=larg-1) nao causa segfault") {
        REQUIRE_NOTHROW(ff_parede(4, 2, LESTE));
        REQUIRE(labirinto[4][2].parede_leste == true);
    }

    SECTION("Parede SUL na borda inferior (y=0) nao causa segfault") {
        REQUIRE_NOTHROW(ff_parede(2, 0, SUL));
        REQUIRE(labirinto[2][0].parede_sul == true);
    }

    SECTION("Nenhuma borda altera celula vizinha inexistente") {
        // Todas as 4 bordas: verifica que nao ha crash e
        // que so a propria celula e alterada
        REQUIRE_NOTHROW(ff_parede(0, 0, OESTE));
        REQUIRE_NOTHROW(ff_parede(0, 0, SUL));
        REQUIRE_NOTHROW(ff_parede(4, 4, LESTE));
        REQUIRE_NOTHROW(ff_parede(4, 4, NORTE));
        REQUIRE(labirinto[0][0].parede_oeste == true);
        REQUIRE(labirinto[0][0].parede_sul == true);
        REQUIRE(labirinto[4][4].parede_leste == true);
        REQUIRE(labirinto[4][4].parede_norte == true);
    }
}

TEST_CASE("ff_parede - Espelhamento bidirecional consistente", "[parede][bidirecional]") {
    inicializa_teste(5, 5);

    SECTION("Parede NORTE em (1,1) -> parede SUL em (1,2)") {
        ff_parede(1, 1, NORTE);
        REQUIRE(labirinto[1][2].parede_sul == true);
    }

    SECTION("Parede SUL em (1,2) -> parede NORTE em (1,1)") {
        ff_parede(1, 2, SUL);
        REQUIRE(labirinto[1][1].parede_norte == true);
    }

    SECTION("Parede LESTE em (2,2) -> parede OESTE em (3,2)") {
        ff_parede(2, 2, LESTE);
        REQUIRE(labirinto[3][2].parede_oeste == true);
    }

    SECTION("Parede OESTE em (3,2) -> parede LESTE em (2,2)") {
        ff_parede(3, 2, OESTE);
        REQUIRE(labirinto[2][2].parede_leste == true);
    }
}

TEST_CASE("ff_parede - Multiplas paredes na mesma celula", "[parede][multiplas]") {
    inicializa_teste(5, 5);

    ff_parede(1, 1, NORTE);
    ff_parede(1, 1, LESTE);
    ff_parede(1, 1, SUL);
    ff_parede(1, 1, OESTE);

    REQUIRE(labirinto[1][1].parede_norte == true);
    REQUIRE(labirinto[1][1].parede_leste == true);
    REQUIRE(labirinto[1][1].parede_sul == true);
    REQUIRE(labirinto[1][1].parede_oeste == true);

    // Verifica espelhamento em todos os vizinhos
    REQUIRE(labirinto[1][2].parede_sul == true);  // vizinho norte
    REQUIRE(labirinto[2][1].parede_oeste == true); // vizinho leste
    REQUIRE(labirinto[1][0].parede_norte == true); // vizinho sul
    REQUIRE(labirinto[0][1].parede_leste == true); // vizinho oeste
}
