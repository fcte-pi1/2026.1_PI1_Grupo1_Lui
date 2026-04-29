# Manual de Documentação em Markdown

Este manual fornece um guia prático para que qualquer membro da equipe possa criar, editar e manter documentação no formato Markdown para o projeto Micromouse. O objetivo é padronizar a escrita, facilitar a manutenção e permitir a migração futura para LaTeX sem grandes dificuldades.

## 1. Princípios Gerais

Toda documentação do projeto segue princípios estruturados para manter coerência e qualidade:

* **Prosa estruturada:** Os textos devem ser escritos em formato de prosa (texto corrido) em vez de listas ou bullets sempre que possível. Isso facilita a leitura e a futura conversão para LaTeX.
* **Clareza e objetividade:** Cada parágrafo deve transmitir uma ideia clara e completa.
* **Organização hierárquica:** Utilize títulos com níveis bem definidos (`#`, `##`, `###`) para estruturar o conteúdo.
* **Coerência visual:** Mantenha formatação consistente em todo o documento.

## 2. Estrutura de um Arquivo Markdown

### 2.1 Cabeçalho Obrigatório

Todo arquivo de documentação deve começar com um título principal em nível 1 (`#`), seguido de uma introdução breve que contextualize o conteúdo:

```markdown
# Título do Documento

Parágrafo introdutório explicando brevemente o propósito do documento e o que será abordado.
```

### 2.2 Organização de Conteúdo

A estrutura recomendada para documentos técnicos segue o padrão:

```markdown
# Título Principal

Introdução ao tema.

## Seção 1: Conceitos Fundamentais

Descrição em prosa dos conceitos principais.

### Subseção 1.1: Detalhe Específico

Texto desenvolvendo o conceito introduzido na seção anterior.

## Seção 2: Implementação Prática

Procedimentos e instruções em prosa.

## Seção 3: Exemplos

Exemplos práticos de uso.

## Referências

Lista de fontes consultadas.

## Tabela de Versionamento

Controle de versões do documento.
```

### 2.3 Rodapé Recomendado

Todo documento técnico deve encerrar com tabela de versionamento, mantendo histórico de alterações:

```markdown
## Tabela de Versionamento

| Versão | Descrição | Autor | Revisor |
| ------ | --------- | ----- | ------- |
| `1.0` | Criação inicial do documento | [Nome](link-github) | [Nome](link-github) |
```

## 3. Padrão de Nomenclatura de Arquivos

### 3.1 Regras de Nomenclatura

Os nomes de arquivo devem ser descritivos e refletir seu conteúdo. Siga estas práticas:

* **Use letras minúsculas:** para iniciar a nomenclatura.
* **Substitua espaços por underscores ou hífens:** `requisitos_software.md` ou `requisitos-software.md`.
* **Seja descritivo:** Um nome deve deixar claro o conteúdo do arquivo sem necessidade de abrir o documento.
* **Evite abreviações** que não sejam universalmente conhecidas.
* **Use números para sequência:** Se o arquivo faz parte de uma série, comece com `01_`, `02_`, etc.

### 3.2 Exemplos de Boas Práticas

| Correto | Incorreto | Motivo |
| ------- | --------- | ------ |
| `requisitosSoftware.md` | `req_soft.md` | O nome completo é mais descritivo |
| `guiaInstalacao.md` | `Guia Instalação.md` | Sem espaços, letras minúsculas |
| `01_introducao.md` | `introducao.md` | Ordem clara em sequências |
| `analiseSensores.md` | `analise_de_sensores.md` | Evitar palavras funcionais desnecessárias |

## 4. Padrão de Escrita em Prosa

### 4.1 Por Que Usar Prosa?

A escrita em formato de prosa (texto corrido) oferece várias vantagens:

* **Facilita leitura:** Fluxo natural de compreensão é mais intuitivo.
* **Migração para LaTeX:** Textos em prosa são facilmente convertidos para documentos profissionais em LaTeX.
* **Coerência acadêmica:** Documentação técnica profissional utiliza prosa estruturada.
* **Contextualização:** Permite explicar relações entre conceitos de forma mais fluida.

### 4.2 Estrutura de Parágrafo

Cada parágrafo deve seguir uma estrutura lógica: introdução da ideia, desenvolvimento, e conclusão parcial. Exemplo:

**Ruim (uso excessivo de bullets):**

```markdown
* Sistema de energia necessário
* Bateria Li-Po 7.4V
* Reguladores de tensão
* Proteção contra curto-circuito
```

**Bom (prosa estruturada):**

```markdown
O sistema de energia foi dimensionado com uma bateria Lítio-Polímero de 7.4 V, 
selecionada pela sua alta densidade energética e taxa de descarga adequada para 
os motores. Reguladores de tensão foram incorporados para fornecer 5 V ao 
microcontrolador e 3.3 V aos sensores analógicos, enquanto circuitos de proteção 
evitam danos causados por curto-circuito ou inversão de polaridade.
```

### 4.3 Uso de Listas

Listas com bullets (`*` ou `-`) são aceitáveis quando:

* **Enumeração de itens sem hierarquia forte:** Lista de membros, componentes, requisitos simples.
* **Resumo de pontos-chave:** Destacar aspectos importantes.
* **Evite em explicações complexas:** Use prosa para tópicos que requerem contextualização.

## 5. Formatação de Elementos

### 5.1 Títulos e Hierarquia

Utilize títulos com níveis apropriados:

```markdown
# Título Principal (Nível 1)

## Seções Principais (Nível 2)

### Subseções (Nível 3)

#### Subsub-seções (Nível 4)
```
# Título Principal (Nível 1)

## Seções Principais (Nível 2)

### Subseções (Nível 3)

#### Subsub-seções (Nível 4)

**Regra:** Não pule níveis. Se usa `#`, o próximo pode ser `##`, nunca `###`.

### 5.2 Ênfase de Texto

* **Negrito:** Use para destacar conceitos-chave. `**Texto em negrito**` ou `__Texto em negrito__`.
* **Itálico:** Use para ênfase leve ou termos de língua estrangeira. `*Itálico*` ou `_Itálico_`.
* **Código inline:** Use para variáveis, comandos, ou nomes de funções. `` `código` ``.

### 5.3 Equações Matemáticas

Utilize notação LaTeX entre `$` para equações inline e `$$` para equações em bloco:

Exemplo inline: A velocidade média é calculada como $v = \frac{\Delta x}{\Delta t}$.

Exemplo em bloco:

$$
E = \frac{1}{2} m v^2
$$

## 6. Referenciamento de Imagens

### 6.1 Estrutura de Diretórios

Imagens devem ser armazenadas em um diretório dedicado dentro da estrutura do projeto:

```
mkdocs/
├── docs/
│   ├── assets/
│   ├── software/
│   │   ├── index.md
│   │   ├── requisitos.md
│   │   └── assets/
│   │       ├── arquitetura_sistema.png
│   │       └── fluxo_dados.png
│   └── energia/
│       ├── index.md
│       ├── requisitos.md
│       └── assets/
│           └── diagrama_distribuicao.png
```

### 6.2 Sintaxe de Inserção de Imagens

Use a sintaxe padrão de Markdown para imagens:

```markdown
![Descrição alternativa da imagem](caminho/relativo/imagem.png)
```

**Exemplo completo em Markdown:**

```markdown
![Logo Unb](./assets/unbLogo.png)

*Figura 1: Logo da Universidade de Brasília*
```

![Logo Unb](./assets/unbLogo.png)
*Figura 1: Logo da Universidade de Brasília*

**Exemplo em HTML:**

Para maior controle sobre propriedades da imagem e centralização:

```html
<figure style="text-align: center;">
  <img src="./assets/unbLogo.png" alt="Logo Unb" width="200" height="auto">
  <figcaption>Figura 1: Logo da Universidade de Brasília</figcaption>
</figure>
```

<figure style="text-align: center;">
  <img src="../assets/unbLogo.png" alt="Logo Unb" width="200" height="auto">
  <figcaption>Figura 1: Logo da Universidade de Brasília</figcaption>
</figure>

Ambas as sintaxes são válidas. Use HTML quando quiser mais liberdade de utilização da imagem.

## 7. Uso de Tabelas

### 7.1 Sintaxe Básica

Tabelas em Markdown seguem a sintaxe:

```markdown
| Coluna 1 | Coluna 2 | Coluna 3 |
| -------- | -------- | -------- |
| Dado A   | Dado B   | Dado C   |
| Dado D   | Dado E   | Dado F   |
```

### 7.2 Alinhamento de Colunas

Use `:` para controlar alinhamento:

```markdown
| Esquerda | Centro | Direita |
| :------- | :----: | ------: |
| Esq      | Cen    | Dir     |
```

Resultará em:

| Esquerda | Centro | Direita |
| :------- | :----: | ------: |
| Esq      | Cen    | Dir     |


### 7.3 Contextualização de Tabelas

Sempre explique em prosa o propósito da tabela:

```markdown
A tabela abaixo resume as versões do documento e quem foi responsável por 
cada atualização. Essa rastreabilidade é essencial para manutenção e controle 
de qualidade.

| Versão | Descrição | Autor |
| ------ | --------- | ----- |
| 1.0 | Criação inicial | João Silva |
```

### 7.4 Sintaxe em LaTex 
LaTeX equivalente para referência em tabelas:

```
\begin{tabular}{|c|c|c|}
\hline
Esq & Centro & Dir \\
\hline
esq & centro & dir \\
\hline
\end{tabular}
```

## 8. Referências e Citações

### 8.1 Seção de Referências

Todo documento técnico deve conter uma seção de referências com fontes consultadas:

```markdown
## Referências

1. [Fabricante Datasheet - Sensor TCP1823](url-para-datasheet)
2. [Artigo Científico - Algoritmos de Labirinto](url-para-artigo)
3. [Documentação Oficial - MicroPython](url-para-documentacao)
```

### 8.2 Citações Inline

Para fortalecer argumentos, cite autoridades ou documentos:

```markdown
De acordo com a documentação oficial da Micromouse Online, as regras da 
competição exigem que o robô complete o trajeto de ida no máximo em [tempo] 
minutos.
```

## 9. Checklist de Qualidade

Antes de considerar um documento pronto, verifique:

* [x] Arquivo nomeado de forma descritiva em camelCase.
* [x] Título principal (`#`) presente no início.
* [x] Hierarquia de títulos sem saltos de nível (`#` → `##` → `###`).
* [x] Conteúdo escrito majoritariamente em prosa.
* [x] Sem erros de digitação ou gramática.
* [x] Imagens estão referenciadas corretamente com descrição alternativa.
* [x] Formatação consistente com outros documentos.
* [x] Seção de referências presente (se aplicável).
* [x] Tabela de versionamento atualizada com versão atual.

## 10. Exemplos Práticos

### 10.1 Estrutura Completa de Documento

Veja o arquivo `docs/software/requisitosSoftware.md` como exemplo de boas práticas de estruturação, uso de prosa e referências.

## Referências

1. [CommonMark - Especificação de Markdown](https://spec.commonmark.org/)
2. [GitHub Markdown Guide](https://guides.github.com/features/mastering-markdown/)
3. [Pandoc Documentation - Markdown to LaTeX](https://pandoc.org/MANUAL.html)
4. [UKMARS Documentation Standards](https://ukmars.org/)

## Tabela de Versionamento

| Versão | Descrição | Autor | Revisor |
| ------ | --------- | ----- | ------- |
| `1.0` | Criação inicial do manual de Markdown | [Yzabella Pimenta](https://github.com/redjsun) | [Alexandre Alvarez](https://github.com/alexandremacedoalvarez-cpu) |
