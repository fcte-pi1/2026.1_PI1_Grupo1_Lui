.PHONY: help install build run backend frontend mock clean

help:
	@echo "Comandos disponíveis:"
	@echo "  make install  - Instala as dependências do Backend e Frontend"
	@echo "  make build    - Compila a versão de produção do Frontend"
	@echo "  make run      - Sobe o Backend, Frontend e o Mock em paralelo"
	@echo "  make backend  - Sobe apenas o Backend"
	@echo "  make frontend - Sobe apenas o Frontend"
	@echo "  make mock     - Sobe apenas o Mock Sender"
	@echo "  make clean    - Remove as pastas node_modules e diretórios de build"
	@echo "  make infra    - Sobe apenas os bancos e ferramentas (InfluxDB e Grafana) via Docker"
	@echo "  make down     - Derruba todos os containers do Docker"

infra:
	@echo "=> Subindo infraestrutura (InfluxDB e Grafana)..."
	@cd src/backend && docker compose up -d influxdb grafana

down:
	@echo "=> Derrubando infraestrutura do Docker..."
	@cd src/backend && docker compose down

install:
	@echo "=> Instalando dependências do Backend..."
	@cd src/backend && npm install
	@echo "=> Instalando dependências do Frontend..."
	@cd src/frontend && npm install
	@echo "=> Dependências instaladas!"

build:
	@echo "=> Compilando Frontend para produção..."
	@cd src/frontend && npm run build

backend:
	@echo "=> Iniciando Backend..."
	@node src/backend/src/services/telemetryService.js

frontend:
	@echo "=> Iniciando Frontend..."
	@cd src/frontend && npm run dev

mock:
	@echo "=> Iniciando Mock Sender..."
	@node src/backend/mock_sender.js

# O parâmetro -j3 permite rodar 3 jobs (comandos) simultaneamente
run:
	@echo "=> Iniciando todos os serviços (Backend, Frontend e Mock)..."
	@echo "=> Pressione Ctrl+C para encerrar todos."
	@$(MAKE) -j3 backend frontend mock

clean:
	@echo "=> Limpando arquivos temporários e compilados..."
	@rm -rf src/backend/node_modules
	@rm -rf src/frontend/node_modules
	@rm -rf src/frontend/dist
	@echo "=> Limpeza concluída!"
