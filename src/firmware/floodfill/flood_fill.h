#pragma once
#include <iostream>
#include <iomanip>
#include <queue>
#include <vector>
#include <string>
#include <utility>

using namespace std;

const int DISTANCIA_INFINITA = 255;

const int DX[4] = {0, 1, 0, -1};
const int DY[4] = {1, 0, -1, 0};

enum Direcao {
    NORTE = 0,
    LESTE = 1,
    SUL = 2,
    OESTE = 3
};

struct Celula {
    bool parede_norte = false;
    bool parede_leste = false;
    bool parede_sul = false;
    bool parede_oeste = false;
    bool visitada = false;
};

extern int largura;
extern int altura;
extern vector<vector<Celula>> labirinto;
extern vector<vector<int>> distancia;
extern vector<pair<int,int>> objetivo;
void ff_inicializar(int larg, int alt, vector<pair<int,int>> meta);
void ff_parede(int x, int y, Direcao dir);
void ff_recalcular();
void ff_visitado(int x, int y);
Direcao ff_melhor_movimento(int x, int y, Direcao direcao_atual);
