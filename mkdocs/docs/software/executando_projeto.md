# Executando o Projeto

Esta documentação fornece as instruções necessárias para executar todos os componentes de software do Micromouse em ambiente de desenvolvimento local.

A arquitetura do projeto possui três módulos principais que rodam em paralelo:
1. **Backend (Node.js)**: Servidor UDP para escutar o firmware e processar os dados da corrida.
2. **Frontend (React/Vite)**: Dashboard de telemetria em tempo real.
3. **Mock Sender (Simulador)**: Script que emite telemetria UDP falsa, imitando o Micromouse real para testar o sistema sem precisar de hardware físico conectado.

---

## Utilizando o Makefile (Método Recomendado)

Para poupar o trabalho de abrir múltiplos terminais e iniciar cada serviço manualmente, nós criamos um `Makefile` localizado na raiz do repositório. Ele gerencia as portas e os processos paralelamente.

### 1. Instalação Inicial
Se for a primeira vez que você está executando o repositório após cloná-lo, é necessário baixar os pacotes do Node.js. Na raiz do projeto, rode:
```bash
make install
```
Isso fará o `npm install` automaticamente dentro das pastas do Backend e do Frontend.

### 2. Rodando tudo de uma vez
Sempre que for desenvolver ou testar a visualização, abra o terminal na raiz do repositório e rode:
```bash
make run
```
Este comando vai ligar o Backend na porta UDP, o Frontend na porta HTTP e já vai começar a jogar os dados do Simulador (`mock_sender`) na rede. 

Acesse: `http://localhost:5173/` (ou a porta informada pelo Vite) no seu navegador para ver o painel do Micromouse!

### 3. Encerrando os processos
Basta apertar `Ctrl + C` no mesmo terminal em que você rodou o `make run`. Ele fechará os três ambientes (Frontend, Backend e Mock) de forma limpa.

---

## Comandos Avulsos

Caso você esteja depurando um bug específico e não queira rodar o pacote completo, o Makefile possui atalhos individuais:

* Sobe apenas a API e Websocket do Backend:
  ```bash
  make backend
  ```
* Sobe apenas a Dashboard (ela acusará que o backend está offline caso não esteja ligado):
  ```bash
  make frontend
  ```
* Sobe apenas o robô fantasma que atira os pacotes UDP:
  ```bash
  make mock
  ```
* Gera os arquivos estáticos de produção do frontend (útil para testes de deploy):
  ```bash
  make build
  ```
* Limpa todos os arquivos temporários e dependências instaladas (`node_modules` e pastas de dist/build):
  ```bash
  make clean
  ```
