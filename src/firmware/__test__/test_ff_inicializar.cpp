#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_vector.hpp>
#include "flood_fill.h"

using namespace std;

// aux: verifica se uma celula (x,y) tem exatamente as paredes esperadas
static void verifica_paredes(int x, int y,
                             bool norte, bool leste, bool sul, bool oeste) {
    REQUIRE(labirinto[x][y].parede_norte == norte);
    REQUIRE(labirinto[x][y].parede_leste == leste);
    REQUIRE(labirinto[x][y].parede_sul   == sul);
    REQUIRE(labirinto[x][y].parede_oeste == oeste);
}

// aux: verifica se paredes internas (nao borda) estao todas false
static void verifica_paredes_internas_false(int larg, int alt) {
    for (int x = 1; x < larg - 1; ++x) {
        for (int y = 1; y < alt - 1; ++y) {
            INFO("Celula interna (" << x << ", " << y << ")");
            REQUIRE(labirinto[x][y].parede_norte == false);
            REQUIRE(labirinto[x][y].parede_leste == false);
            REQUIRE(labirinto[x][y].parede_sul   == false);
            REQUIRE(labirinto[x][y].parede_oeste == false);
        }
    }
}

// aux: garante que nenhuma celula tem distancia 255 apos init
static void verifica_nenhuma_distancia_infinita(int larg, int alt) {
    for (int x = 0; x < larg; ++x) {
        for (int y = 0; y < alt; ++y) {
            INFO("Celula (" << x << ", " << y << ") com distancia infinita");
            REQUIRE(distancia[x][y] != DISTANCIA_INFINITA);
        }
    }
}

// aux: verifica que celulas nao-meta tem distancia > 0 e < 255 (BFS ok)
static void verifica_distancias_nao_meta_bfs(int larg, int alt,
                                             const vector<pair<int,int>>& meta) {
    for (int x = 0; x < larg; ++x) {
        for (int y = 0; y < alt; ++y) {
            bool eh_meta = false;
            for (auto& [gx, gy] : meta) {
                if (x == gx && y == gy) {
                    eh_meta = true;
                    break;
                }
            }
            if (!eh_meta) {
                INFO("Celula nao-meta (" << x << ", " << y
                     << ") com distancia suspeita: " << distancia[x][y]);
                REQUIRE(distancia[x][y] > 0);
                REQUIRE(distancia[x][y] < DISTANCIA_INFINITA);
            }
        }
    }
}

// Grid 4x4: paredes externas presentes nas 4 bordas

TEST_CASE("Grid 4x4 - paredes externas nas 4 bordas", "[ff_inicializar][4x4]") {
    vector<pair<int,int>> meta = {{1, 1}};
    ff_inicializar(4, 4, meta);

    REQUIRE(largura == 4);
    REQUIRE(altura == 4);

    // borda sul (y = 0): todas as celulas devem ter parede_sul = true
    for (int x = 0; x < 4; ++x) {
        INFO("Borda sul x=" << x);
        REQUIRE(labirinto[x][0].parede_sul == true);
    }

    // borda norte (y = 3): todas as celulas devem ter parede_norte = true
    for (int x = 0; x < 4; ++x) {
        INFO("Borda norte x=" << x);
        REQUIRE(labirinto[x][3].parede_norte == true);
    }

    // borda oeste (x = 0): todas as celulas devem ter parede_oeste = true
    for (int y = 0; y < 4; ++y) {
        INFO("Borda oeste y=" << y);
        REQUIRE(labirinto[0][y].parede_oeste == true);
    }

    // borda leste (x = 3): todas as celulas devem ter parede_leste = true
    for (int y = 0; y < 4; ++y) {
        INFO("Borda leste y=" << y);
        REQUIRE(labirinto[3][y].parede_leste == true);
    }
}

// Grid 16x16: meta central com distancia = 0

TEST_CASE("Grid 16x16 - meta central com distancia zero", "[ff_inicializar][16x16]") {
    // centro de grid 16x16: 4 celulas
    vector<pair<int,int>> meta = {{7,7}, {7,8}, {8,7}, {8,8}};
    ff_inicializar(16, 16, meta);

    REQUIRE(largura == 16);
    REQUIRE(altura == 16);

    for (auto& [gx, gy] : meta) {
        INFO("Meta (" << gx << ", " << gy << ")");
        REQUIRE(distancia[gx][gy] == 0);
    }
}

// Grid 8x8: teste geral de BFS e regras de init

TEST_CASE("Grid 8x8 - nenhuma distancia infinita apos init", "[ff_inicializar][8x8]") {
    vector<pair<int,int>> meta = {{4, 4}};
    ff_inicializar(8, 8, meta);

    verifica_nenhuma_distancia_infinita(8, 8);
}

TEST_CASE("Grid 8x8 - celulas nao-meta com distancia BFS valida", "[ff_inicializar][8x8]") {
    vector<pair<int,int>> meta = {{4, 4}};
    ff_inicializar(8, 8, meta);

    verifica_distancias_nao_meta_bfs(8, 8, meta);
}

TEST_CASE("Grid 8x8 - paredes internas iniciam false", "[ff_inicializar][8x8]") {
    vector<pair<int,int>> meta = {{4, 4}};
    ff_inicializar(8, 8, meta);

    verifica_paredes_internas_false(8, 8);
}

// Grid 4x4: cobertura completa dos criterios

TEST_CASE("Grid 4x4 - paredes internas false", "[ff_inicializar][4x4]") {
    vector<pair<int,int>> meta = {{1, 1}};
    ff_inicializar(4, 4, meta);

    verifica_paredes_internas_false(4, 4);
}

TEST_CASE("Grid 4x4 - nenhuma distancia infinita", "[ff_inicializar][4x4]") {
    vector<pair<int,int>> meta = {{1, 1}};
    ff_inicializar(4, 4, meta);

    verifica_nenhuma_distancia_infinita(4, 4);
}

TEST_CASE("Grid 4x4 - celulas nao-meta com distancia BFS valida", "[ff_inicializar][4x4]") {
    vector<pair<int,int>> meta = {{1, 1}};
    ff_inicializar(4, 4, meta);

    verifica_distancias_nao_meta_bfs(4, 4, meta);
}

// Grid 16x16: cobertura completa dos criterios

TEST_CASE("Grid 16x16 - paredes internas false", "[ff_inicializar][16x16]") {
    vector<pair<int,int>> meta = {{7,7}, {7,8}, {8,7}, {8,8}};
    ff_inicializar(16, 16, meta);

    verifica_paredes_internas_false(16, 16);
}

TEST_CASE("Grid 16x16 - nenhuma distancia infinita", "[ff_inicializar][16x16]") {
    vector<pair<int,int>> meta = {{7,7}, {7,8}, {8,7}, {8,8}};
    ff_inicializar(16, 16, meta);

    verifica_nenhuma_distancia_infinita(16, 16);
}

TEST_CASE("Grid 16x16 - celulas nao-meta com distancia BFS valida", "[ff_inicializar][16x16]") {
    vector<pair<int,int>> meta = {{7,7}, {7,8}, {8,7}, {8,8}};
    ff_inicializar(16, 16, meta);

    verifica_distancias_nao_meta_bfs(16, 16, meta);
}
