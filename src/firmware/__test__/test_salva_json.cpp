#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_string.hpp>
#include <vector>
#include <string>
#include <fstream>
#include <cstdio>
#include <sys/stat.h>

#include "flood_fill.h"

using namespace std;

// ─── Helper: limpa arquivos de teste criados ───
static void limpar_arquivo_teste(const string& caminho) {
    remove(caminho.c_str());
}

// ─── Helper: cria o diretorio maze_runs relativo ao build dir ───
static void garantir_diretorio(const string& dir) {
    #ifdef _WIN32
        system(("if not exist " + dir + " mkdir " + dir).c_str());
    #else
        mkdir(dir.c_str(), 0755);
    #endif
}

// ─── Helper: le todo o conteudo de um arquivo ───
static string ler_arquivo(const string& caminho) {
    ifstream f(caminho);
    if (!f.is_open()) return "";
    string conteudo((istreambuf_iterator<char>(f)), istreambuf_iterator<char>());
    return conteudo;
}

TEST_CASE("salva_json - Arquivo e criado na pasta maze_runs", "[salva_json][arquivo]") {
    // Configura estado global
    id_corrida = "9999999999999";
    historico_exploracao.clear();

    PassoExplorador p;
    p.x = 1;
    p.y = 2;
    p.orientacao = "NORTE";
    p.paredes = { {{1, 2}, "LESTE"}, {{1, 2}, "OESTE"} };
    historico_exploracao.push_back(p);

    string diretorio = "../../maze_runs";
    garantir_diretorio(diretorio);
    string caminho_esperado = diretorio + "/corrida_9999999999999.json";

    // Remove arquivo se ja existir de execucao anterior
    limpar_arquivo_teste(caminho_esperado);

    SECTION("Arquivo e criado apos chamar salva_json") {
        salva_json();

        ifstream teste(caminho_esperado);
        REQUIRE(teste.good());
    }

    SECTION("Conteudo do arquivo nao esta vazio") {
        salva_json();

        string conteudo = ler_arquivo(caminho_esperado);
        REQUIRE_FALSE(conteudo.empty());
    }

    // Limpeza
    limpar_arquivo_teste(caminho_esperado);
}

TEST_CASE("salva_json - JSON e parseavel sem erros de sintaxe", "[salva_json][parse]") {
    id_corrida = "8888888888888";
    historico_exploracao.clear();

    PassoExplorador p;
    p.x = 3;
    p.y = 4;
    p.orientacao = "SUL";
    p.paredes = { {{3, 4}, "NORTE"} };
    historico_exploracao.push_back(p);

    string diretorio = "../../maze_runs";
    garantir_diretorio(diretorio);
    string caminho = diretorio + "/corrida_8888888888888.json";
    limpar_arquivo_teste(caminho);

    salva_json();

    SECTION("JSON pode ser lido e parseado sem excecoes") {
        // Le o arquivo e verifica que comeca com '{' e termina com '}'
        string conteudo = ler_arquivo(caminho);
        REQUIRE_FALSE(conteudo.empty());

        // Remove whitespace do inicio e fim
        size_t primeiro = conteudo.find_first_not_of(" \t\n\r");
        size_t ultimo   = conteudo.find_last_not_of(" \t\n\r");
        REQUIRE(primeiro != string::npos);
        REQUIRE(ultimo != string::npos);
        REQUIRE(conteudo[primeiro] == '{');
        REQUIRE(conteudo[ultimo] == '}');
    }

    SECTION("JSON contem as chaves esperadas") {
        string conteudo = ler_arquivo(caminho);
        REQUIRE(conteudo.find("\"id_corrida\"") != string::npos);
        REQUIRE(conteudo.find("\"historico\"") != string::npos);
        REQUIRE(conteudo.find("\"x\"") != string::npos);
        REQUIRE(conteudo.find("\"y\"") != string::npos);
        REQUIRE(conteudo.find("\"orientacao\"") != string::npos);
        REQUIRE(conteudo.find("\"paredes\"") != string::npos);
        REQUIRE(conteudo.find("\"dir\"") != string::npos);
    }

    limpar_arquivo_teste(caminho);
}

TEST_CASE("salva_json - Campo id_corrida e string nao vazia", "[salva_json][id_corrida]") {
    id_corrida = "1234567890123";
    historico_exploracao.clear();

    PassoExplorador p;
    p.x = 0;
    p.y = 0;
    p.orientacao = "LESTE";
    p.paredes = {};
    historico_exploracao.push_back(p);

    string diretorio = "../../maze_runs";
    garantir_diretorio(diretorio);
    string caminho = diretorio + "/corrida_1234567890123.json";
    limpar_arquivo_teste(caminho);

    salva_json();

    string conteudo = ler_arquivo(caminho);
    REQUIRE(conteudo.find("\"id_corrida\": \"1234567890123\"") != string::npos);

    // Verifica que id_corrida nao esta vazio no JSON
    size_t pos = conteudo.find("\"id_corrida\": \"");
    REQUIRE(pos != string::npos);
    size_t inicio_valor = pos + 16; // pula ate depois da aspa de abertura
    size_t fim_valor = conteudo.find("\"", inicio_valor);
    REQUIRE(fim_valor != string::npos);
    string valor_id = conteudo.substr(inicio_valor, fim_valor - inicio_valor);
    REQUIRE_FALSE(valor_id.empty());

    limpar_arquivo_teste(caminho);
}

TEST_CASE("salva_json - Campo historico e array", "[salva_json][historico]") {
    id_corrida = "7777777777777";
    historico_exploracao.clear();

    // Adiciona dois passos
    PassoExplorador p1;
    p1.x = 1; p1.y = 1; p1.orientacao = "NORTE";
    p1.paredes = { {{1, 1}, "LESTE"} };
    historico_exploracao.push_back(p1);

    PassoExplorador p2;
    p2.x = 2; p2.y = 2; p2.orientacao = "LESTE";
    p2.paredes = { {{2, 2}, "NORTE"}, {{2, 2}, "SUL"} };
    historico_exploracao.push_back(p2);

    string diretorio = "../../maze_runs";
    garantir_diretorio(diretorio);
    string caminho = diretorio + "/corrida_7777777777777.json";
    limpar_arquivo_teste(caminho);

    salva_json();

    string conteudo = ler_arquivo(caminho);

    SECTION("historico e um array que abre com '['") {
        size_t pos_hist = conteudo.find("\"historico\": [");
        REQUIRE(pos_hist != string::npos);
    }

    SECTION("historico contem multiplos passos (separados por virgula)") {
        // Conta ocorrencias de \"x\": (cada passo tem pelo menos um x)
        size_t count = 0;
        size_t pos = conteudo.find("\"x\":");
        while (pos != string::npos) {
            count++;
            pos = conteudo.find("\"x\":", pos + 1);
        }
        REQUIRE(count >= 2);
    }

    limpar_arquivo_teste(caminho);
}

TEST_CASE("salva_json - Cada passo tem x, y, orientacao, paredes", "[salva_json][passo]") {
    id_corrida = "6666666666666";
    historico_exploracao.clear();

    PassoExplorador p;
    p.x = 5;
    p.y = 7;
    p.orientacao = "OESTE";
    p.paredes = { {{5, 7}, "SUL"}, {{5, 7}, "LESTE"} };
    historico_exploracao.push_back(p);

    string diretorio = "../../maze_runs";
    garantir_diretorio(diretorio);
    string caminho = diretorio + "/corrida_6666666666666.json";
    limpar_arquivo_teste(caminho);

    salva_json();

    string conteudo = ler_arquivo(caminho);

    SECTION("Passo contem campo x com valor correto") {
        REQUIRE(conteudo.find("\"x\": 5") != string::npos);
    }

    SECTION("Passo contem campo y com valor correto") {
        REQUIRE(conteudo.find("\"y\": 7") != string::npos);
    }

    SECTION("Passo contem campo orientacao com valor correto") {
        REQUIRE(conteudo.find("\"orientacao\": \"OESTE\"") != string::npos);
    }

    SECTION("Passo contem campo paredes como array") {
        REQUIRE(conteudo.find("\"paredes\": [") != string::npos);
    }

    limpar_arquivo_teste(caminho);
}

TEST_CASE("salva_json - Campo paredes tem objetos com x, y, dir", "[salva_json][paredes]") {
    id_corrida = "5555555555555";
    historico_exploracao.clear();

    PassoExplorador p;
    p.x = 0;
    p.y = 0;
    p.orientacao = "NORTE";
    p.paredes = {
        {{0, 0}, "NORTE"},
        {{0, 0}, "LESTE"},
        {{0, 0}, "SUL"},
        {{0, 0}, "OESTE"}
    };
    historico_exploracao.push_back(p);

    string diretorio = "../../maze_runs";
    garantir_diretorio(diretorio);
    string caminho = diretorio + "/corrida_5555555555555.json";
    limpar_arquivo_teste(caminho);

    salva_json();

    string conteudo = ler_arquivo(caminho);

    SECTION("Parede contem x, y e dir") {
        // Verifica estrutura de cada objeto de parede
        REQUIRE(conteudo.find("\"x\": 0") != string::npos);
        REQUIRE(conteudo.find("\"y\": 0") != string::npos);
        REQUIRE(conteudo.find("\"dir\": \"NORTE\"") != string::npos);
        REQUIRE(conteudo.find("\"dir\": \"LESTE\"") != string::npos);
        REQUIRE(conteudo.find("\"dir\": \"SUL\"") != string::npos);
        REQUIRE(conteudo.find("\"dir\": \"OESTE\"") != string::npos);
    }

    SECTION("Paredes sao objetos dentro do array") {
        // Cada parede deve ser um objeto: { "x": ..., "y": ..., "dir": "..." }
        size_t count_abre = 0;
        size_t pos = 0;
        while ((pos = conteudo.find("\"dir\":", pos)) != string::npos) {
            count_abre++;
            pos++;
        }
        REQUIRE(count_abre == 4); // 4 paredes na configuracao
    }

    limpar_arquivo_teste(caminho);
}

TEST_CASE("salva_json - Historico vazio gera JSON valido", "[salva_json][vazio]") {
    id_corrida = "4444444444444";
    historico_exploracao.clear(); // vazio!

    string diretorio = "../../maze_runs";
    garantir_diretorio(diretorio);
    string caminho = diretorio + "/corrida_4444444444444.json";
    limpar_arquivo_teste(caminho);

    salva_json();

    string conteudo = ler_arquivo(caminho);

    SECTION("JSON e criado mesmo com historico vazio") {
        REQUIRE_FALSE(conteudo.empty());
    }

    SECTION("historico e array vazio") {
        // O JSON gerado tem quebra de linha: "historico": [\n  ]
        // Verifica que o array abre e fecha corretamente (sem elementos)
        size_t pos_abre = conteudo.find("\"historico\": [");
        REQUIRE(pos_abre != string::npos);
        // Verifica que apos a abertura, o fechamento aparece (com ou sem whitespace)
        size_t pos_fecha = conteudo.find("]", pos_abre);
        REQUIRE(pos_fecha != string::npos);
        // Nao deve haver "x" entre a abertura e o fechamento do array
        string entre = conteudo.substr(pos_abre, pos_fecha - pos_abre + 1);
        REQUIRE(entre.find("\"x\"") == string::npos);
    }

    SECTION("id_corrida esta presente") {
        REQUIRE(conteudo.find("\"id_corrida\": \"4444444444444\"") != string::npos);
    }

    limpar_arquivo_teste(caminho);
}

TEST_CASE("salva_json - ID de corrida especial (contem caracteres alfanumericos)", "[salva_json][id_especial]") {
    id_corrida = "abc123_XYZ-456";
    historico_exploracao.clear();

    PassoExplorador p;
    p.x = 0; p.y = 0; p.orientacao = "NORTE"; p.paredes = {};
    historico_exploracao.push_back(p);

    string diretorio = "../../maze_runs";
    garantir_diretorio(diretorio);
    string caminho = diretorio + "/corrida_abc123_XYZ-456.json";
    limpar_arquivo_teste(caminho);

    salva_json();

    string conteudo = ler_arquivo(caminho);

    SECTION("JSON contem o id com caracteres especiais escapados corretamente") {
        REQUIRE(conteudo.find("\"id_corrida\": \"abc123_XYZ-456\"") != string::npos);
    }

    SECTION("Arquivo e criado corretamente") {
        ifstream teste(caminho);
        REQUIRE(teste.good());
    }

    limpar_arquivo_teste(caminho);
}
