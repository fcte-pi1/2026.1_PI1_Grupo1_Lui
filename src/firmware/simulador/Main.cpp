// =============================================================
// Main.cpp — Ponte entre o Flood Fill e o simulador mms
// Usa a API do mms para ler sensores / mover o robô
// e o módulo floodfill/ para calcular o caminho
// =============================================================

#include <iostream>
#include <string>

#include "API.h"
#include "../floodfill/flood_fill.h"

using namespace std;

//  Estado do robô 
int robo_x = 0;
int robo_y = 0;
Direcao robo_dir = NORTE;

//  Log via stderr (não interfere com a API) 
void log(const string& texto) {
    cerr << texto << endl;
}

//  Mapeamento direção -> char da API mms 
char dir_para_char(Direcao d) {
    switch (d) {
        case NORTE: return 'n';
        case LESTE: return 'e';
        case SUL:   return 's';
        case OESTE: return 'w';
    }
    return 'n';
}

//  Converte direção relativa do sensor para direção absoluta 
Direcao dir_frente()   { return robo_dir; }
Direcao dir_direita()  { return (Direcao)((robo_dir + 1) % 4); }
Direcao dir_esquerda() { return (Direcao)((robo_dir + 3) % 4); }

//  Detecta paredes e registra no módulo floodfill 
void detectar_paredes() {
    if (API::wallFront()) {
        ff_parede(robo_x, robo_y, dir_frente());
        API::setWall(robo_x, robo_y, dir_para_char(dir_frente()));
    }
    if (API::wallRight()) {
        ff_parede(robo_x, robo_y, dir_direita());
        API::setWall(robo_x, robo_y, dir_para_char(dir_direita()));
    }
    if (API::wallLeft()) {
        ff_parede(robo_x, robo_y, dir_esquerda());
        API::setWall(robo_x, robo_y, dir_para_char(dir_esquerda()));
    }
}

//  Atualiza a visualização no simulador 
void atualizar_visualizacao() {
    for (int x = 0; x < largura; x++) {
        for (int y = 0; y < altura; y++) {
            if (distancia[x][y] < DISTANCIA_INFINITA) {
                API::setText(x, y, to_string(distancia[x][y]));
            }
            if (labirinto[x][y].visitada) {
                API::setColor(x, y, 'B');  // Azul para visitada
            }
        }
    }
    // Robô em verde
    API::setColor(robo_x, robo_y, 'G');
}

//  Vira o robô para uma direção absoluta 
void virar_para(Direcao alvo) {
    if (alvo == robo_dir) return;

    int diff = (alvo - robo_dir + 4) % 4;

    if (diff == 1) {
        API::turnRight();
    } else if (diff == 3) {
        API::turnLeft();
    } else if (diff == 2) {
        API::turnRight();
        API::turnRight();
    }

    robo_dir = alvo;
}

// Move o robô em uma direção
void mover_para(Direcao d) {
    virar_para(d);
    API::moveForward();
    robo_x += DX[d];
    robo_y += DY[d];
}

//  Verifica se chegou no centro 
bool no_centro() {
    for (auto& [gx, gy] : objetivo) {
        if (robo_x == gx && robo_y == gy) return true;
    }
    return false;
}

//  Escolhe a melhor direção (menor distância) 
Direcao melhor_direcao() {
    int melhor_val = DISTANCIA_INFINITA + 1;
    Direcao melhor_dir = NORTE;

    for (int d = 0; d < 4; d++) {
        // Verifica se tem parede nessa direção
        bool tem_parede = false;
        if (d == NORTE) tem_parede = labirinto[robo_x][robo_y].parede_norte;
        if (d == LESTE) tem_parede = labirinto[robo_x][robo_y].parede_leste;
        if (d == SUL)   tem_parede = labirinto[robo_x][robo_y].parede_sul;
        if (d == OESTE) tem_parede = labirinto[robo_x][robo_y].parede_oeste;

        if (tem_parede) continue;

        int nx = robo_x + DX[d];
        int ny = robo_y + DY[d];

        if (nx >= 0 && nx < largura && ny >= 0 && ny < altura) {
            if (distancia[nx][ny] < melhor_val) {
                melhor_val = distancia[nx][ny];
                melhor_dir = (Direcao)d;
            }
        }
    }

    return melhor_dir;
}

// =============================================================
// MAIN — Loop principal do simulador
// =============================================================
int main() {
    log("=== FLOOD FILL - Micromouse Simulador ===");

    // Pega dimensões do labirinto do simulador
    int w = API::mazeWidth();
    int h = API::mazeHeight();
    log("Labirinto: " + to_string(w) + "x" + to_string(h));

    // Define as 4 células centrais como objetivo
    vector<pair<int,int>> centro = {
        {w/2 - 1, h/2 - 1},
        {w/2 - 1, h/2},
        {w/2, h/2 - 1},
        {w/2, h/2}
    };

    // Inicializa o módulo flood fill
    ff_inicializar(w, h, centro);
    log("Flood Fill inicializado.");

    // Atualiza visualização inicial
    atualizar_visualizacao();

    // Loop de exploração
    while (!no_centro()) {
        // 1. Marca célula atual como visitada
        ff_visitado(robo_x, robo_y);

        // 2. Detecta paredes com os sensores
        detectar_paredes();

        // 3. Recalcula distâncias com as novas paredes
        ff_recalcular();

        // 4. Atualiza visualização
        atualizar_visualizacao();

        // 5. Escolhe a melhor direção
        Direcao dir = melhor_direcao();

        log("(" + to_string(robo_x) + "," + to_string(robo_y) +
            ") dist=" + to_string(distancia[robo_x][robo_y]) +
            " -> dir=" + to_string(dir));

        // 6. Move
        mover_para(dir);
    }

    // Chegou!
    log("=== CENTRO ALCANCADO! ===");
    API::setColor(robo_x, robo_y, 'G');
    API::setText(robo_x, robo_y, "FIM");

    return 0;
}
