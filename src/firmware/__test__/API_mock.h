#pragma once
// Mock da API para testes — substitui a comunicacao stdin/stdout do simulador

#include <array>
#include <string>
#include <vector>
#include <stdexcept>
#include "../floodfill/flood_fill.h"

using namespace std;

// Estado do mock 

struct MockLabirinto {
    int largura = 0;
    int altura  = 0;

    // robo
    int x = 0;
    int y = 0;
    Direcao direcao = NORTE;

    // paredes absolutas: parede_mock[x][y] = {norte, leste, sul, oeste}
    vector<vector<array<bool,4>>> paredes;
    int passos = 0;
    int limite_passos = 512; // protecao contra loop infinito
    bool pre_configurado = false;

    void inicializar(int larg, int alt) {
        largura = larg;
        altura  = alt;
        x = 0; y = 0;
        direcao = NORTE;
        passos = 0;
        pre_configurado = false;
        paredes.assign(larg, vector<array<bool,4>>(alt, array<bool,4>{false,false,false,false}));

        // paredes externas
        for (int i = 0; i < larg; i++) {
            paredes[i][0][2]     = true; // sul
            paredes[i][alt-1][0] = true; // norte
        }
        for (int j = 0; j < alt; j++) {
            paredes[0][j][3]      = true; // oeste
            paredes[larg-1][j][1] = true; // leste
        }
    }

    // adiciona parede absoluta (e espelha no vizinho)
    void add_parede(int px, int py, Direcao dir) {
        pre_configurado = true;
        paredes[px][py][dir] = true;
        int nx = px + DX[dir];
        int ny = py + DY[dir];
        if (nx >= 0 && nx < largura && ny >= 0 && ny < altura) {
            Direcao oposto = (Direcao)((dir + 2) % 4);
            paredes[nx][ny][oposto] = true;
        }
    }

    // retorna se ha parede na direcao absoluta a partir de (x,y)
    bool tem_parede(Direcao dir) const {
        return paredes[x][y][dir];
    }

    // converte direcao relativa ao robo para absoluta
    Direcao abs_frente()   const { return direcao; }
    Direcao abs_direita()  const { return (Direcao)((direcao + 1) % 4); }
    Direcao abs_esquerda() const { return (Direcao)((direcao + 3) % 4); }
};

// instancia global do mock (usada pelos metodos estaticos de API)
inline MockLabirinto& mock() {
    static MockLabirinto m;
    return m;
}

// Implementacao dos metodos estaticos de API

class API {
public:
    static int  mazeWidth()  { return mock().largura; }
    static int  mazeHeight() { return mock().altura;  }

    static bool wallFront() { return mock().tem_parede(mock().abs_frente());   }
    static bool wallRight() { return mock().tem_parede(mock().abs_direita());  }
    static bool wallLeft()  { return mock().tem_parede(mock().abs_esquerda()); }

    static void moveForward(int = 1) {
        mock().passos++;
        if (mock().passos > mock().limite_passos)
            throw runtime_error("loop infinito detectado: limite de passos atingido");
        if (wallFront())
            throw runtime_error("moveForward contra parede");
        mock().x += DX[mock().direcao];
        mock().y += DY[mock().direcao];
    }

    static void turnRight()  { mock().direcao = (Direcao)((mock().direcao + 1) % 4); }
    static void turnLeft()   { mock().direcao = (Direcao)((mock().direcao + 3) % 4); }

    static void setColor(int, int, char)             {}
    static void clearColor(int, int)                 {}
    static void clearAllColor()                      {}
    static void setText(int, int, const string&)     {}
    static void clearText(int, int)                  {}
    static void clearAllText()                       {}
    static bool wasReset()                           { return false; }
    static void ackReset()                           {}
    static void setWall(int, int, char)              {}
    static void clearWall(int, int, char)            {}
};

// Wrappers em portugues (mesmos do API.h real)

inline int  larguraLabirinto()               { return API::mazeWidth();   }
inline int  alturaLabirinto()                { return API::mazeHeight();  }
inline bool paredeFrente()                   { return API::wallFront();   }
inline bool paredeDireita()                  { return API::wallRight();   }
inline bool paredeEsquerda()                 { return API::wallLeft();    }
inline void girarDireita()                   { API::turnRight();          }
inline void girarEsquerda()                  { API::turnLeft();           }
inline void definirCor(int x, int y, char c) { API::setColor(x, y, c);   }
inline void definirTexto(int x, int y, const string& t) { API::setText(x, y, t); }
inline void registrarLog(const string&)      {}

inline bool moverFrente() {
    try { API::moveForward(); return true; }
    catch (...) { return false; }
}

// Loop de exploracao extraido do Main.cpp (identico, sem #ifndef TESTING)

string direcao_para_string(Direcao dir) {
    switch(dir) {
        case NORTE: return "NORTE";
        case LESTE: return "LESTE";
        case SUL:   return "SUL";
        case OESTE: return "OESTE";
        default:    return "NORTE";
    }
}

inline void girar_para(Direcao& atual, Direcao alvo) {
    while (atual != alvo) {
        int diferenca = (alvo - atual + 4) % 4;
        if (diferenca == 1) { girarDireita();  atual = (Direcao)((atual + 1) % 4); }
        else                { girarEsquerda(); atual = (Direcao)((atual + 3) % 4); }
    }
}

// retorna true se chegou a meta, false se ficou preso
// se mock ja foi inicializado externamente (largura > 0), nao reinicializa
inline bool executar_exploracao(int larg, int alt, vector<pair<int,int>> metas) {
    historico_exploracao.clear();
    id_corrida = "teste";

    if (!mock().pre_configurado)
        mock().inicializar(larg, alt);
    else
        mock().passos = 0;
    ff_inicializar(larg, alt, metas);

    int x = 0, y = 0;
    Direcao direcao_atual = NORTE;

    while (distancia[x][y] != 0) {
        vector<pair<pair<int,int>, string>> paredes_descobertas;

        if (paredeFrente()) {
            ff_parede(x, y, direcao_atual);
            paredes_descobertas.push_back({{x, y}, direcao_para_string(direcao_atual)});
        }
        if (paredeDireita()) {
            Direcao dir_direita = (Direcao)((direcao_atual + 1) % 4);
            ff_parede(x, y, dir_direita);
            paredes_descobertas.push_back({{x, y}, direcao_para_string(dir_direita)});
        }
        if (paredeEsquerda()) {
            Direcao dir_esquerda = (Direcao)((direcao_atual + 3) % 4);
            ff_parede(x, y, dir_esquerda);
            paredes_descobertas.push_back({{x, y}, direcao_para_string(dir_esquerda)});
        }

        ff_visitado(x, y);
        ff_recalcular();

        if (distancia[x][y] >= DISTANCIA_INFINITA) return false;

        PassoExplorador passo;
        passo.x = x; passo.y = y;
        passo.orientacao = direcao_para_string(direcao_atual);
        passo.paredes = paredes_descobertas;
        historico_exploracao.push_back(passo);

        Direcao proxima = ff_melhor_movimento(x, y, direcao_atual);
        girar_para(direcao_atual, proxima);

        if (!moverFrente()) return false;

        x += DX[direcao_atual];
        y += DY[direcao_atual];

        mock().x = x;
        mock().y = y;
        mock().direcao = direcao_atual;
    }

    return true;
}