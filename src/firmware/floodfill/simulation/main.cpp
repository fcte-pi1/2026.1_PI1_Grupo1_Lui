#include "../flood_fill.h"
#include "api.h"
#include <string>
#include <vector>

using namespace std;

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
        if (paredeFrente())   ff_parede(x, y, direcao_atual);
        if (paredeDireita())  ff_parede(x, y, direcao_relativa(direcao_atual, 1));
        if (paredeEsquerda()) ff_parede(x, y, direcao_relativa(direcao_atual, 3));

        ff_visitado(x, y);
        ff_recalcular();

        definirCor(x, y, 'c');
        definirTexto(x, y, to_string(distancia[x][y]));

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

    return 0;
}
