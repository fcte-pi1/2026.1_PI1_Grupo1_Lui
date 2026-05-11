# 🏁 Labirinto Micromouse — Projeto em CATIA

> Modelagem 3D do labirinto para a competição **Micromouse** — Projeto Integrador 1 (PI1) | FCTE — 2026/1

---

## Tabela de Versionamento

| Versão | Descrição | Autor(es) | Revisor |
|--------|-----------|-----------|---------|
| 1.0 | Labirinto Micromouse — Projeto em CATIA | [Alexandre Macedo Alvarez](https://github.com/alexandremacedoalvarez-cpu) | iancostag, biancazero |

---

## 📌 Sobre o Projeto

Este repositório contém os arquivos de modelagem 3D (CATIA V5) do labirinto utilizado nos testes do robô autônomo *Micromouse*. O labirinto foi projetado para replicar fielmente as condições da competição oficial, sendo utilizado pela equipe como pista de testes durante o desenvolvimento do robô.

O *Micromouse* é um robô autônomo que resolve labirintos sem intervenção humana, mapeando o ambiente, monitorando sua localização e detectando quando alcançou o objetivo central.

---

## 📐 Especificações Técnicas

### Dimensões e Geometria

| Componente     | Dimensões                          |
|----------------|------------------------------------|
| **Pilar**      | 5 mm × 5 mm                        |
| **Parede**     | 180 mm (comprimento) × 50 mm (altura) |
| **Placa Base** | 720 mm × 720 mm                    |
| **Encaixe**    | Furos de 5 mm × 5 mm nas extremidades das paredes |

### Configuração da Grade

- **Tipo:** 4×4 células
- **Lado total:** 720 mm
- **Tamanho de célula:** 18 cm × 18 cm
- **Espaçamento entre centros de pilares:** 175 mm
- **Vão livre (corredor):** 170 mm de largura — espaço suficiente para o robô (máx. 25 cm) manobrar sem colisões

> **Justificativa do espaçamento de 175 mm:** o conjunto de 5 pilares por linha cabe exatamente dentro da placa de 720 mm, sem extrapolação das bordas, enquanto mantém o corredor mínimo necessário para navegação do robô.

### Padrão de Cores

| Elemento              | Cor       |
|-----------------------|-----------|
| Corpo (paredes/pilares) | Branco  |
| Topo das peças        | Vermelho  |
| Placa Base            | Preto     |

> As cores seguem o padrão oficial da competição Micromouse.

---


## 🔩 Decisões de Modelagem

- **Travamento mecânico modular:** as paredes possuem furos de 5×5 mm nas extremidades que encaixam sobre os pilares, criando uma estrutura firme e reconfigurável — o arranjo das paredes pode ser alterado para gerar diferentes labirintos.
- **Organização do modelo:** planos auxiliares e *constraints* foram ocultados na montagem final para limpeza visual do modelo.
- **Abordagem *bottom-up*:** as peças foram modeladas individualmente (`CATPart`) e depois montadas progressivamente em produtos (`CATProduct`), do nível de célula até o labirinto completo.

---

## 🎯 Contexto — Competição Micromouse (PI1 2026/1)

A equipe deve construir um robô autônomo capaz de resolver três labirintos de complexidade crescente:

| Labirinto | Grade   | Dimensão |
|-----------|---------|----------|
| 1º        | 4×4     | 72 cm    |
| 2º        | 8×8     | 144 cm   |
| 3º        | 16×16   | 288 cm   |

**Este repositório cobre o labirinto 4×4 de testes**, construído pela equipe para desenvolvimento e validação do robô antes das etapas oficiais.

---

## 🛠️ Software Utilizado

- **CATIA V5** — Modelagem e montagem 3D

---


*Repositório seguindo o template disponibilizado em [github.com/fcte-pi1/template](https://github.com/fcte-pi1/template)*
