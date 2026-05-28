#include "flood_fill.h"

int largura = 0;
int altura = 0;

vector<vector<Celula>> labirinto;
vector<vector<int>> distancia;
vector<pair<int,int>> objetivo;

bool dentro_limite(int x, int y){
    return x >= 0 && x < largura && y >= 0 && y < altura;
}

bool passavel(int x, int y, Direcao dir){
    if(dir == NORTE) return !labirinto[x][y].parede_norte;
    if(dir == LESTE) return !labirinto[x][y].parede_leste;
    if(dir == SUL) return !labirinto[x][y].parede_sul;
    if(dir == OESTE) return !labirinto[x][y].parede_oeste;

    return false;
}

void propagar_bfs(){
    queue<pair<int,int>> fila;

    for(auto& [gx, gy] : objetivo){
        distancia[gx][gy] = 0;
        fila.push({gx, gy});
    }

    while(!fila.empty()){
        auto [x, y] = fila.front();
        fila.pop();
        int dist = distancia[x][y];

        for(int dir = 0; dir < 4; dir++){
            int nx = x + DX[dir];
            int ny = y + DY[dir];
            
            if(!dentro_limite(nx, ny)) continue;
            if(!passavel(x, y, (Direcao)dir)) continue;
            if(distancia[nx][ny] == DISTANCIA_INFINITA){
                distancia[nx][ny] = dist + 1;
                fila.push({nx, ny});
            }
        }
    }
}

void ff_inicializar(int larg, int alt, vector<pair<int,int>> meta){
    largura = larg;
    altura = alt;
    objetivo = meta;

    labirinto.assign(larg, vector<Celula>(alt));
    distancia.assign(larg, vector<int>(alt, DISTANCIA_INFINITA));

    for(int i = 0; i < larg; i++){
        labirinto[i][0].parede_sul = true;
        labirinto[larg - 1][i].parede_norte = true;
    }

    for(int i = 0; i < alt; i++){
        labirinto[0][i].parede_oeste = true;
        labirinto[larg - 1][i].parede_leste = true;
    }

    propagar_bfs();
}

void ff_parede(int x, int y, Direcao dir){
    if(dir == NORTE) labirinto[x][y].parede_norte = true;
    if(dir == LESTE) labirinto[x][y].parede_leste = true;
    if(dir == SUL) labirinto[x][y].parede_sul = true;
    if(dir == OESTE) labirinto[x][y].parede_oeste = true;

    int nx = x + DX[dir];
    int ny = y + DY[dir];

    if(dentro_limite(nx, ny)){
        if(dir == NORTE) labirinto[nx][ny].parede_sul = true;
        if(dir == LESTE) labirinto[nx][ny].parede_oeste = true;
        if(dir == SUL) labirinto[nx][ny].parede_norte = true;
        if(dir == OESTE) labirinto[nx][ny].parede_leste = true;
    }

}

void ff_recalcular(){
    for(int x = 0; x < largura; x++){
        for(int y = 0; y< altura; y ++){
            distancia[x][y] = DISTANCIA_INFINITA;
        }
    }

    propagar_bfs();
}

void ff_visitado(int x, int y){
    labirinto[x][y].visitada = true;
}