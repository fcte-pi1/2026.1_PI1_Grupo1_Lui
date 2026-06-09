#include <catch2/catch_test_macros.hpp>
#include <fstream>
#include <string>
#include <vector>
#include <sys/stat.h>

// API_mock.h deve vir antes de qualquer include que puxe API.h
#include "API_mock.h"
#include "flood_fill.h"

using namespace std;

// Helpers

static string ler_arquivo(const string& caminho) {
    ifstream f(caminho);
    if (!f.is_open()) return "";
    return string(istreambuf_iterator<char>(f), istreambuf_iterator<char>());
}

static void limpar_arquivo(const string& caminho) {
    remove(caminho.c_str());
}

// Labirinto 4x4 simples: corredor direto (0,0) -> meta (1,1)
//
//  y
//  3 [ ][ ][ ][ ]
//  2 [ ][ ][ ][ ]
//  1 [ ][M][ ][ ]
//  0 [R][ ][ ][ ]
//     0  1  2  3  x
//
// Sem paredes internas alem das bordas — caminho livre ate a meta.

TEST_CASE("Exploracao 4x4 simples chega a meta", "[integracao][4x4]") {
    vector<pair<int,int>> metas = {{1, 1}};
    bool chegou = executar_exploracao(4, 4, metas);

    REQUIRE(chegou == true);
    REQUIRE(historico_exploracao.size() > 0);
}

TEST_CASE("Exploracao 4x4 simples - historico nao esta vazio", "[integracao][4x4]") {
    vector<pair<int,int>> metas = {{1, 1}};
    executar_exploracao(4, 4, metas);

    REQUIRE_FALSE(historico_exploracao.empty());
}

TEST_CASE("Exploracao 4x4 simples - robo nao repete posicao em loop", "[integracao][4x4]") {
    vector<pair<int,int>> metas = {{1, 1}};
    executar_exploracao(4, 4, metas);

    // Nenhuma celula deve aparecer mais de (largura * altura) vezes
    // (limite generoso que so estoura em loop real)
    int limite = 4 * 4;
    for (int x = 0; x < 4; x++) {
        for (int y = 0; y < 4; y++) {
            int visitas = 0;
            for (auto& p : historico_exploracao)
                if (p.x == x && p.y == y) visitas++;
            INFO("Celula (" << x << "," << y << ") visitada " << visitas << " vezes");
            REQUIRE(visitas <= limite);
        }
    }
}

// Labirinto 4x4 com beco sem saida
//
//  y
//  3 [ ][ ][ ][ ]
//  2 [ ][|][ ][ ]   | = parede entre (1,2) e (1,1) pelo leste de (0,2)
//  1 [=][M][ ][ ]   = = parede sul de (0,1), forcando desvio
//  0 [R][ ][ ][ ]
//     0  1  2  3  x
//
// Robo sai de (0,0), encontra beco e precisa contornar.

TEST_CASE("Exploracao com beco sem saida - robo encontra alternativa", "[integracao][beco]") {
    vector<pair<int,int>> metas = {{1, 1}};

    // adiciona parede apos inicializar para simular descoberta em campo
    mock().inicializar(4, 4);
    mock().add_parede(0, 0, NORTE); // bloqueia saida norte de (0,0)
    historico_exploracao.clear();

    bool chegou_beco = executar_exploracao(4, 4, metas);
    REQUIRE(chegou_beco == true);
}

TEST_CASE("Exploracao com beco - historico registra mais de 1 passo", "[integracao][beco]") {
    // beco forcado: parede norte em (0,0), obriga desvio por (1,0)
    mock().inicializar(4, 4);
    mock().add_parede(0, 0, NORTE);

    vector<pair<int,int>> metas = {{1, 1}};
    historico_exploracao.clear();

    executar_exploracao(4, 4, metas);

    REQUIRE(historico_exploracao.size() > 1);
}

// JSON gerado contem mesmo numero de passos que a exploracao

TEST_CASE("JSON - numero de passos bate com historico_exploracao", "[integracao][json]") {
    vector<pair<int,int>> metas = {{1, 1}};
    executar_exploracao(4, 4, metas);

    size_t passos_exploracao = historico_exploracao.size();

    id_corrida = "teste_contagem";
    string diretorio = "../../maze_runs";
    #ifndef _WIN32
        mkdir(diretorio.c_str(), 0755);
    #endif
    string caminho = diretorio + "/corrida_teste_contagem.json";
    limpar_arquivo(caminho);

    salva_json();

    string conteudo = ler_arquivo(caminho);
    REQUIRE_FALSE(conteudo.empty());

    // conta ocorrencias de "\"x\":" no nivel de passo (cada passo tem exatamente um)
    size_t count = 0;
    size_t pos = conteudo.find("\"x\":");
    while (pos != string::npos) {
        count++;
        pos = conteudo.find("\"x\":", pos + 1);
    }

    // cada passo contribui com pelo menos 1 "x": (o passo em si)
    REQUIRE(count >= passos_exploracao);

    limpar_arquivo(caminho);
}

// Paredes no JSON batem com paredes do labirinto mockado

TEST_CASE("JSON - parede registrada bate com labirinto mockado", "[integracao][json]") {
    // monta labirinto com parede conhecida
    mock().inicializar(4, 4);
    mock().add_parede(0, 0, LESTE); // parede leste em (0,0): robo vai detectar

    vector<pair<int,int>> metas = {{1, 1}};
    historico_exploracao.clear();

    // executa exploracao — o mock ja tem a parede, o robo vai detectar
    executar_exploracao(4, 4, metas);

    id_corrida = "teste_parede";
    string diretorio = "../../maze_runs";
    #ifndef _WIN32
        mkdir(diretorio.c_str(), 0755);
    #endif
    string caminho = diretorio + "/corrida_teste_parede.json";
    limpar_arquivo(caminho);
    salva_json();

    string conteudo = ler_arquivo(caminho);

    // a parede LESTE em (0,0) deve aparecer no JSON
    REQUIRE(conteudo.find("\"dir\": \"LESTE\"") != string::npos);

    limpar_arquivo(caminho);
}

// Robo nao fica preso em loop infinito

TEST_CASE("Robo nao fica preso em loop infinito - labirinto simples", "[integracao][loop]") {
    vector<pair<int,int>> metas = {{1, 1}};
    // mock.limite_passos = 512 (padrao) — moveForward lanca excecao se estourar
    REQUIRE_NOTHROW(executar_exploracao(4, 4, metas));
}

TEST_CASE("Robo nao fica preso em loop infinito - labirinto com becos", "[integracao][loop]") {
    mock().inicializar(4, 4);
    mock().add_parede(0, 0, NORTE);
    mock().add_parede(1, 0, NORTE);

    vector<pair<int,int>> metas = {{2, 2}};

    REQUIRE_NOTHROW(executar_exploracao(4, 4, metas));
}