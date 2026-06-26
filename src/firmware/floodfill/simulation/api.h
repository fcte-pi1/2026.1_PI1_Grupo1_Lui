#pragma once
#include <string>

using namespace std;

int  larguraLabirinto();
int  alturaLabirinto();

bool paredeFrente();
bool paredeDireita();
bool paredeEsquerda();

bool moverFrente(int n = 1);
void girarDireita();
void girarEsquerda();

void definirCor(int x, int y, char cor);
void limparCor(int x, int y);
void definirTexto(int x, int y, const string& texto);
void limparTexto(int x, int y);
void registrarLog(const string& msg);
