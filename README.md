# Template PI1

Esse é o _template_ de repositório para ser utilizado pelos grupos de PI1 para organizar seu projeto. O _template_ é dividido em pastas, onde cada parte do projeto deve ser armazenada. Os arquivos a serem armazenados incluem documentação, código-fonte, arquivos de CAD, esquemáticos, arquivos de simulação de circuitos, e dados.

A organização e a correta utilização do repositório do projeto serão considerados na avaliação do grupo. Dessa forma, recomenda-se que *todos os membros* do grupo leiam as instruções deste repositório, aprendam a a utilizar o git (caso ainda não saibam) e também que o grupo combine uma estratégia de como irão utilizar o repositório em conjunto. Dessa forma não deixem de utilizar todas as ferramentas que o GitHub oferece, incluindo branchs, PRs, revisões, issues, calendários, dentre outros.

Lembrem sempre de evitar enviar arquivos muito grandes (>5MB). No caso de vídeos e outros arquivos pesados que são necessários, armazenar o arquivo em outra plataforma e colocar aqui apenas o _link_.

> [!IMPORTANT]
> A estrutura de pastas do projeto não reflete a divisão de equipes. Os membros podem e devem trabalhar nas diferentes pastas a depender da necessidade do projeto.

## Utilização

1. Crie o repositório do projeto utilizando a nomenclatura padrão no formato: `<ano>.<semestre>_PI1_Grupo<n>_<professor>`. Como um exemplo, um nome formado corretamente seria `2026.1_PI1_Grupo1_Diogo`. 

2. Crie uma equipe do projeto com a mesma nomenclatura do repositório porém com o sufixo `_Equipe`, como `2026.1_PI1_Grupo1_Diogo_Equipe`, e solicite, caso necessário, que a equipe tenha permissão de escrita no repositório do projeto.

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

Caso prefira rodar módulos específicos:
- `make backend`
- `make frontend`
- `make mock`
