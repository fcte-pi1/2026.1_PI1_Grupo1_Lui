#include "api.h"
#include <iostream>
#include <string>

using namespace std;

int larguraLabirinto() {
    cout << "mazeWidth" << endl;
    int w; cin >> w;
    return w;
}

int alturaLabirinto() {
    cout << "mazeHeight" << endl;
    int h; cin >> h;
    return h;
}

bool paredeFrente() {
    cout << "wallFront" << endl;
    string s; cin >> s;
    return s == "true";
}

bool paredeDireita() {
    cout << "wallRight" << endl;
    string s; cin >> s;
    return s == "true";
}

bool paredeEsquerda() {
    cout << "wallLeft" << endl;
    string s; cin >> s;
    return s == "true";
}

bool moverFrente(int n) {
    cout << "moveForward " << n << endl;
    string s; cin >> s;
    return s == "ack";
}

void girarDireita() {
    cout << "turnRight" << endl;
    string s; cin >> s;
}

void girarEsquerda() {
    cout << "turnLeft" << endl;
    string s; cin >> s;
}

void definirCor(int x, int y, char cor) {
    cout << "setColor " << x << " " << y << " " << cor << endl;
}

void limparCor(int x, int y) {
    cout << "clearColor " << x << " " << y << endl;
}

void definirTexto(int x, int y, const string& texto) {
    cout << "setText " << x << " " << y << " " << texto << endl;
}

void limparTexto(int x, int y) {
    cout << "clearText " << x << " " << y << endl;
}

void registrarLog(const string& msg) {
    cerr << msg << endl;
}
