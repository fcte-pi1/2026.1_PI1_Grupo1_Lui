.PHONY: help setup install build run backend frontend mock clean test test-backend test-frontend test-firmware check-deps infra down docker-up

help:
	@echo "Comandos disponíveis:"
	@echo "  make setup      - Instala dependências e compila o Frontend (preparação inicial)"
	@echo "  make install    - Instala as dependências do Backend e Frontend"
	@echo "  make build      - Compila a versão de produção do Frontend"
	@echo "  make run        - Sobe o Backend, Frontend e Mock localmente em paralelo (Para Dev)"
	@echo "  make docker-up  - Sobe TODA a stack via Docker em background (Produção)"
	@echo "  make docker-run - Sobe a stack Docker interativamente COM o mock rodando (Para ver logs)"
	@echo "  make backend    - Sobe apenas o Backend"
	@echo "  make frontend   - Sobe apenas o Frontend"
	@echo "  make mock       - Sobe apenas o Mock Sender"
	@echo "  make clean      - Remove as pastas node_modules e diretórios de build"
	@echo "  make infra      - Sobe apenas os bancos e ferramentas (InfluxDB e Grafana) via Docker"
	@echo "  make down       - Derruba todos os containers do Docker"
	@echo "  make test       - Roda toda a bateria de testes do repositório (Backend, Frontend e Firmware)"



setup: install build
	@echo "=> Ambiente configurado com sucesso!"

infra:
	@echo "=> Subindo infraestrutura (InfluxDB e Grafana)..."
	@cd src/backend && docker compose up -d influxdb grafana

docker-up:
	@echo "=> Subindo TODA a stack via Docker em background (Frontend, Backend, InfluxDB, Grafana)..."
	@cd src/backend && docker compose up -d --build

docker-run: check-deps
	@echo "=> Visualizando logs do Docker e rodando o Mock..."
	@echo "=> Pressione Ctrl+C para PARAR O MOCK e OCULTAR OS LOGS (os Dockers continuarão rodando no fundo)."
	@npx concurrently -n "DOCKER,MOCK" -c "bgBlue.bold,bgMagenta.bold" \
		"cd src/backend && docker compose logs -f" \
		"cd src/backend && npm run mock"

down:
	@echo "=> Derrubando infraestrutura do Docker..."
	@cd src/backend && docker compose down

install:
	@echo "=> Instalando dependências do Backend..."
	@cd src/backend && npm install
	@echo "=> Instalando dependências do Frontend..."
	@cd src/frontend && npm install
	@if [ -f "package.json" ]; then \
		echo "=> Instalando dependências na raiz (caso necessário)..."; \
		npm install; \
	fi
	@echo "=> Dependências instaladas!"

build: check-deps
	@echo "=> Compilando Frontend para produção..."
	@cd src/frontend && npm run build

check-deps:
	@if [ ! -d "src/backend/node_modules" ]; then \
		echo "ERRO: node_modules do Backend não encontrado. Execute 'make install' primeiro."; \
		exit 1; \
	fi
	@if [ ! -d "src/frontend/node_modules" ]; then \
		echo "ERRO: node_modules do Frontend não encontrado. Execute 'make install' primeiro."; \
		exit 1; \
	fi

backend: check-deps
	@echo "=> Iniciando Backend..."
	@cd src/backend && npm start

frontend: check-deps
	@echo "=> Iniciando Frontend..."
	@cd src/frontend && npm run dev

mock: check-deps
	@echo "=> Iniciando Mock Sender..."
	@cd src/backend && npm run mock

dev: check-deps
	@echo "=> Iniciando todos os serviços (Backend, Frontend e Mock) localmente (Hot-reload)..."
	@echo "=> Pressione Ctrl+C para encerrar todos."
	@npx concurrently -n "BACKEND,FRONT,MOCK" -c "bgBlue.bold,bgGreen.bold,bgMagenta.bold" \
		"cd src/backend && npm start" \
		"cd src/frontend && npm run dev" \
		"cd src/backend && npm run mock"

run: check-deps
	@echo "=> Iniciando stack Docker e Mock Sender..."
	@echo "=> Pressione Ctrl+C para encerrar tudo (Mock e Dockers)."
	@npx concurrently -n "DOCKER,MOCK" -c "bgBlue.bold,bgMagenta.bold" \
		"cd src/backend && docker compose up --build" \
		"cd src/backend && npm run mock"

clean:
	@echo "=> Limpando arquivos temporários e compilados..."
	@rm -rf src/backend/node_modules
	@rm -rf src/frontend/node_modules
	@rm -rf node_modules
	@rm -rf src/frontend/dist
	@echo "=> Limpeza concluída!"

test-backend: check-deps
	@echo "=> Executando testes do Backend..."
	@cd src/backend && npm test

test-frontend: check-deps
	@echo "=> Executando testes do Frontend..."
	@cd src/frontend && npm test

test-firmware:
	@echo "=> Executando testes do Firmware (Floodfill)..."
	@cd src/firmware/__test__ && cmake -S . -B build && cmake --build build && cd build && ctest --output-on-failure

test: test-backend test-frontend test-firmware
	@echo "=> Todos os testes do repositório passaram com sucesso!"
