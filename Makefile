.PHONY: help install run backend frontend mock

help:
	@echo "Comandos disponíveis:"
	@echo "  make install  - Instala as dependências do Backend e Frontend"
	@echo "  make run      - Sobe o Backend, Frontend e o Mock em paralelo"
	@echo "  make backend  - Sobe apenas o Backend"
	@echo "  make frontend - Sobe apenas o Frontend"
	@echo "  make mock     - Sobe apenas o Mock Sender"

install:
	@echo "=> Instalando dependências do Backend..."
	@cd src/backend && npm install
	@echo "=> Instalando dependências do Frontend..."
	@cd src/frontend && npm install
	@echo "=> Dependências instaladas!"

backend:
	@echo "=> Iniciando Backend..."
	@node src/backend/index.js

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
