## Executando o Projeto (Software)

Para testar o Micromouse na sua máquina local, utilizamos um `Makefile` na raiz do projeto que facilita a inicialização simultânea de todos os serviços (Backend, Frontend e Simulador Mock).

**1. Instale as dependências (Primeira vez apenas):**
```bash
make install
```

**2. Rode todos os serviços juntos:**
```bash
make run
```

Ao fazer isso, o sistema irá subir o Backend Node.js, a Dashboard em React e o emissor de telemetria UDP do Mock em paralelo. Pressione `Ctrl + C` uma única vez para derrubar tudo.

Caso prefira rodar ou manipular módulos específicos:
- `make backend` (Sobe apenas o Node.js)
- `make frontend` (Sobe apenas a dashboard)
- `make mock` (Sobe o emissor UDP)
- `make build` (Gera a versão de produção do frontend)
- `make clean` (Apaga todas as pastas `node_modules` e pastas de `build` compiladas)
