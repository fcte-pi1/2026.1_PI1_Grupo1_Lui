#include <catch2/catch_test_macros.hpp>
#include "flood_fill.h"

using namespace std;

// Helper: inicializa labirinto limpo antes de cada grupo de testes
static void setup(int larg = 5, int alt = 5) {
    ff_inicializar(larg, alt, {{0, 0}});
}

// dentro do limite

TEST_CASE("dentro_limite - coordenadas validas", "[dentro_limite]") {

    SECTION("canto (0, 0) e valido") {
        setup();
        REQUIRE(dentro_limite(0, 0) == true);
    }

    SECTION("canto oposto (largura-1, altura-1) e valido") {
        setup();
        REQUIRE(dentro_limite(largura - 1, altura - 1) == true);
    }

    SECTION("celula interna qualquer e valida") {
        setup();
        REQUIRE(dentro_limite(2, 3) == true);
    }
}

TEST_CASE("dentro_limite - coordenadas invalidas", "[dentro_limite]") {

    SECTION("fora pela esquerda (-1, 0)") {
        setup();
        REQUIRE(dentro_limite(-1, 0) == false);
    }

    SECTION("fora pela direita (largura, 0)") {
        setup();
        REQUIRE(dentro_limite(largura, 0) == false);
    }

    SECTION("fora pelo baixo (0, -1)") {
        setup();
        REQUIRE(dentro_limite(0, -1) == false);
    }

    SECTION("fora pelo topo (0, altura)") {
        setup();
        REQUIRE(dentro_limite(0, altura) == false);
    }
}

// passavel

TEST_CASE("passavel - NORTE sem parede retorna true", "[passavel][norte]") {
    setup();
    // celula interna: sem parede norte por padrao
    REQUIRE(passavel(2, 2, NORTE) == true);
}

TEST_CASE("passavel - NORTE com parede retorna false", "[passavel][norte]") {
    setup();
    ff_parede(2, 2, NORTE);
    REQUIRE(passavel(2, 2, NORTE) == false);
}

TEST_CASE("passavel - SUL sem parede retorna true", "[passavel][sul]") {
    setup();
    REQUIRE(passavel(2, 2, SUL) == true);
}

TEST_CASE("passavel - SUL com parede retorna false", "[passavel][sul]") {
    setup();
    ff_parede(2, 2, SUL);
    REQUIRE(passavel(2, 2, SUL) == false);
}

TEST_CASE("passavel - LESTE sem parede retorna true", "[passavel][leste]") {
    setup();
    REQUIRE(passavel(2, 2, LESTE) == true);
}

TEST_CASE("passavel - LESTE com parede retorna false", "[passavel][leste]") {
    setup();
    ff_parede(2, 2, LESTE);
    REQUIRE(passavel(2, 2, LESTE) == false);
}

TEST_CASE("passavel - OESTE sem parede retorna true", "[passavel][oeste]") {
    setup();
    REQUIRE(passavel(2, 2, OESTE) == true);
}

TEST_CASE("passavel - OESTE com parede retorna false", "[passavel][oeste]") {
    setup();
    ff_parede(2, 2, OESTE);
    REQUIRE(passavel(2, 2, OESTE) == false);
}