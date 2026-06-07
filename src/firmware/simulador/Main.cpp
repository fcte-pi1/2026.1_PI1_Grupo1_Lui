#include "../floodfill/flood_fill.h"
#include "API.h"
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <chrono>
#include <sys/stat.h>

using namespace std;

// ID único para esta corrida (timestamp em millisegundos)
string id_corrida = "";

// apenas para testes já que não está conectando com o banco
string gerar_id_corrida() {
    auto agora = chrono::system_clock::now();
    auto tempo = chrono::duration_cast<chrono::milliseconds>(agora.time_since_epoch());
    return to_string(tempo.count());
}

string direcao_para_string(Direcao dir) {
    switch(dir) {
        case NORTE: return "NORTE";
        case LESTE: return "LESTE";
        case SUL: return "SUL";
        case OESTE: return "OESTE";
        default: return "NORTE";
    }
}

Direcao direcao_relativa(Direcao atual, int offset) {
    return (Direcao)((atual + offset + 4) % 4);
}

void girar_para(Direcao& atual, Direcao alvo) {
    while (atual != alvo) {
        int diferenca = (alvo - atual + 4) % 4;
        if (diferenca == 1) {
            girarDireita();
            atual = (Direcao)((atual + 1) % 4);
        } else {
            girarEsquerda();
            atual = (Direcao)((atual + 3) % 4);
        }
    }
}

int main() {
    // gera ID unico para esta corrida
    id_corrida = gerar_id_corrida();
    registrarLog("ID da corrida: " + id_corrida);
    
    int larg = larguraLabirinto();
    int alt  = alturaLabirinto();

    registrarLog("Labirinto: " + to_string(larg) + "x" + to_string(alt));

    int cx = larg / 2;
    int cy = alt  / 2;

    vector<pair<int,int>> metas = {
        {cx - 1, cy - 1}, {cx, cy - 1},
        {cx - 1, cy},     {cx, cy    }
    };

    ff_inicializar(larg, alt, metas);

    for (auto& [gx, gy] : metas)
        definirCor(gx, gy, 'g');

    int x = 0, y = 0;
    Direcao direcao_atual = NORTE;

    while (distancia[x][y] != 0) {
        // Coleta as paredes descobertas neste passo
        vector<pair<pair<int,int>, string>> paredes_descobertas;
        
        if (paredeFrente()) {
            ff_parede(x, y, direcao_atual);
            paredes_descobertas.push_back({{x, y}, direcao_para_string(direcao_atual)});
        }
        if (paredeDireita()) {
            Direcao dir_direita = direcao_relativa(direcao_atual, 1);
            ff_parede(x, y, dir_direita);
            paredes_descobertas.push_back({{x, y}, direcao_para_string(dir_direita)});
        }
        if (paredeEsquerda()) {
            Direcao dir_esquerda = direcao_relativa(direcao_atual, 3);
            ff_parede(x, y, dir_esquerda);
            paredes_descobertas.push_back({{x, y}, direcao_para_string(dir_esquerda)});
        }

        ff_visitado(x, y);
        ff_recalcular();

        // Verifica se o objetivo ficou inalcançável
        if (distancia[x][y] >= DISTANCIA_INFINITA) {
            registrarLog("SEM CAMINHO em (" + to_string(x) + "," + to_string(y) + ")");
            break;
        }

        definirCor(x, y, 'c');
        definirTexto(x, y, to_string(distancia[x][y]));
        
        // Registra este passo no histórico
        PassoExplorador passo;
        passo.x = x;
        passo.y = y;
        passo.orientacao = direcao_para_string(direcao_atual);
        passo.paredes = paredes_descobertas;
        historico_exploracao.push_back(passo);

        Direcao proxima = ff_melhor_movimento(x, y, direcao_atual);
        girar_para(direcao_atual, proxima);

        registrarLog("(" + to_string(x) + "," + to_string(y) + ") dist=" + to_string(distancia[x][y]));

        if (!moverFrente()) {
            registrarLog("Colisão em (" + to_string(x) + "," + to_string(y) + ")");
            break;
        }

        x += DX[direcao_atual];
        y += DY[direcao_atual];
    }

    registrarLog("Objetivo atingido em (" + to_string(x) + "," + to_string(y) + ")");
    definirCor(x, y, 'Y');
    
    salva_json();

    return 0;
}


// Algoritmo pra salvar o json das paredes
void salva_json(){
    // Cria diretório se nao existir (relativo a src/)
    string diretorio = "../../maze_runs";
    
    #ifdef _WIN32
        system(("if not exist " + diretorio + " mkdir " + diretorio).c_str());
    #else
        mkdir(diretorio.c_str(), 0755);
    #endif
    
    string caminho = diretorio + "/corrida_" + id_corrida + ".json";
    ofstream arquivo(caminho);
    if (!arquivo.is_open()) {
        registrarLog("ERRO: Não foi possível abrir '" + caminho + "' para escrita");
        return;
    }

    arquivo << "{\n";
    arquivo << "  \"id_corrida\": \"" << id_corrida << "\",\n";
    arquivo << "  \"historico\": [\n";
    
    for (size_t i = 0; i < historico_exploracao.size(); i++) {
        const auto& passo = historico_exploracao[i];
        
        arquivo << "    {\n";
        arquivo << "      \"x\": " << passo.x << ",\n";
        arquivo << "      \"y\": " << passo.y << ",\n";
        arquivo << "      \"orientacao\": \"" << passo.orientacao << "\",\n";
        arquivo << "      \"paredes\": [\n";
        
        for (size_t j = 0; j < passo.paredes.size(); j++) {
            const auto& [coords, direcao] = passo.paredes[j];
            arquivo << "        {\n";
            arquivo << "          \"x\": " << coords.first << ",\n";
            arquivo << "          \"y\": " << coords.second << ",\n";
            arquivo << "          \"dir\": \"" << direcao << "\"\n";
            arquivo << "        }";
            if (j < passo.paredes.size() - 1) arquivo << ",";
            arquivo << "\n";
        }
        
        arquivo << "      ]\n";
        arquivo << "    }";
        if (i < historico_exploracao.size() - 1) arquivo << ",";
        arquivo << "\n";
    }
    
    arquivo << "  ]\n";
    arquivo << "}\n";
    arquivo.close();
    
    registrarLog("Mapa salvo em '" + caminho + "'");
}