#pragma once

#include <iostream>
#include <string>

class API {

public:

    static int mazeWidth();
    static int mazeHeight();

    static bool wallFront();
    static bool wallRight();
    static bool wallLeft();

    static void moveForward(int distance = 1);
    static void turnRight();
    static void turnLeft();

    static void setWall(int x, int y, char direction);
    static void clearWall(int x, int y, char direction);

    static void setColor(int x, int y, char color);
    static void clearColor(int x, int y);
    static void clearAllColor();

    static void setText(int x, int y, const std::string& text);
    static void clearText(int x, int y);
    static void clearAllText();

    static bool wasReset();
    static void ackReset();

};

// Wrappers em português usados pelo Main.cpp
inline int  larguraLabirinto()              { return API::mazeWidth(); }
inline int  alturaLabirinto()               { return API::mazeHeight(); }
inline bool paredeFrente()                  { return API::wallFront(); }
inline bool paredeDireita()                 { return API::wallRight(); }
inline bool paredeEsquerda()                { return API::wallLeft(); }
inline void girarDireita()                  { API::turnRight(); }
inline void girarEsquerda()                 { API::turnLeft(); }
inline void definirCor(int x, int y, char c){ API::setColor(x, y, c); }
inline void definirTexto(int x, int y, const std::string& t) { API::setText(x, y, t); }
inline void registrarLog(const std::string& msg) { std::cerr << msg << std::endl; }

// moveForward que retorna bool (false se crash)
inline bool moverFrente() {
    std::cout << "moveForward" << std::endl;
    std::string response;
    std::cin >> response;
    return response == "ack";
}
