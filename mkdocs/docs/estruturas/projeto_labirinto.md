# Projeto de Labirinto Modular para Micromouse

## 1. Objetivo

- Desenvolver um labirinto de teste para competições clássicas de micromouse com uma estrutura que possa ser facilmente transportada e fabricada de forma custo eficiente, mantendo a precisão exigida pelas competições oficiais.

---

## 2. Requisitos Técnicos e de Design

- **Modularidade:**  
  Seja leve e de fácil transporte pelos membros da equipe.

- **Dimensões:**
  - O labirinto terá 4x4 células, com 72 cm de lado;
  - Cada célula que compõe o labirinto terá 180 mm de lado, com paredes de 50 mm de altura e 12 mm de espessura;
  - Necessárias 40 peças para permitir variados percursos distintos;
  - Espaçamento entre as paredes: 168 mm.

- **Revestimento e Acabamento:**
  - **Base (Solo):** Pintura preto fosco. Deve ter baixa refletância para não confundir os sensores infravermelhos e garantir o atrito das rodas de silicone.
  - **Paredes laterais:** Pintura branca. Deve oferecer alta refletância para os sensores.
  - **Topo das paredes:** Pintura ou fita vermelha. Serve como marcador visual de contraste e limite superior.

- **Fator Custo:**  
  Este é um critério decisivo. Estima-se que, mesmo com materiais econômicos, o custo seja de aproximadamente **R$ 130,00**.

![Labirinto Micromouse](attachment:40aa7e91-7058-4f8a-bcf5-bce470c9d929:Code_Generated_Image.png)

---

# 3. Materiais

Para referência futura, segue um levantamento simplificado de alguns materiais considerados para a execução do projeto.

---

## 3.1. Base do Labirinto

### MDF Comum (15 mm)

- Apresenta qualidade variável conforme o fabricante, porém é um material de fácil manuseio e baixo custo.
- É aproximadamente 20% a 25% mais denso que o compensado.
- **Custo aproximado:** R$ 70,00/m²

### Madeirite 6 mm

- Apresenta bom custo-benefício, é leve e de fácil manuseio.
- Possui acabamento mais grosseiro, podendo prejudicar a aderência das rodas ou até mesmo danificá-las, além de causar vibrações indesejadas nos sensores.
- **Custo aproximado:** R$ 30,00/m²

### Compensado (15 mm)

- Mais resistente a impactos e umidade que o MDF.
- Há maior risco de empenamento da chapa.
- **Custo aproximado:** R$ 90,00/m²

| Material | Estabilidade / Planicidade | Resistência à Umidade | Peso Relativo | Custo Estimado | Observações de Engenharia |
|---|---|---|---|---|---|
| MDF Comum | Alta (superfície plana) | Baixa (precisa selar) | Alto (denso) | **R$ 70,00** | Qualidade muito variável conforme o fornecedor |
| Compensado | Moderada (pode empenar) | Alta | Baixo | **R$ 90,00** | Mais estável a longo prazo e resistente a impactos |
| Madeirite (6 mm) | Baixa | Moderada | Muito baixo | **R$ 30,00** | Acabamento rugoso que prejudica a aderência das rodas |

### Decisão Final

Optou-se pelo uso de uma chapa de MDF de 720 x 720 mm com espessura de 6 mm. A escolha justifica-se pela superfície uniforme e plana, essencial para a precisão dos sensores, com custo total de **R$ 36,00**.

---

## 3.2. Paredes do Labirinto

### Acrílico

- Material resistente e estético.
- Difícil usinagem manual e peso elevado, dificultando o transporte.
- **Custo aproximado:** R$ 270,00

### EVA de Alta Densidade (10 mm)

- Extremamente leve e fácil de manipular.
- Sua flexibilidade pode gerar leituras inconstantes nos sensores.
- **Custo aproximado:** R$ 156,00/m²

### Madeira (MDF)

- Possui características semelhantes às discutidas para a base.
- Material relativamente pesado.
- **Custo aproximado:** R$ 30,00

| Material | Rigidez / Ortogonalidade | Facilidade de Usinagem | Peso | Custo Estimado |
|---|---|---|---|---|
| MDF (12 mm) | Excelente | Moderada | Alto | **R$ 27,00** |
| EVA (Alta Densidade) | Baixa | Muito alta | Muito baixo | **R$ 56,00** |
| Acrílico | Alta | Baixa | Alto | **R$ 270,00** |

### Decisão Final

Optou-se pelo uso do EVA de alta densidade com 12 mm. A escolha justifica-se pelo baixo peso do material e facilidade de manuseio, com custo total de **R$ 56,00**.

---

# 4. Construção

## 4.1. Postes do Labirinto

Para viabilizar a modularidade e a reconfiguração do percurso, será implementado um sistema de postes removíveis posicionados em uma malha de 180 mm de centro a centro.

### Geometria e Configuração

Serão fabricados 25 postes no total, distribuídos em três geometrias específicas:

- 4 unidades em formato de **"L"** para os vértices externos;
- 12 unidades em formato de **"T"** para as interseções das bordas;
- 9 unidades em formato de **"+"** para as interseções internas.

### Estrutura de Encaixe

Os postes serão construídos com uma estrutura de madeira (estilo palitos de picolé), garantindo fendas de encaixe com espaçamento nominal ligeiramente superior a 12 mm. Essa folga é essencial para permitir um ajuste deslizante das paredes, compensando pequenas variações dimensionais.

### Fixação e Estabilidade

Para evitar deslocamentos durante manobras de rotação de 90° e 180° do robô, cada unidade será fixada à base de MDF com suportes metálicos em "L". Isso assegura a ortogonalidade das paredes e evita alterações na calibração dos sensores.

---

## 4.2. Paredes

### Composição

Serão utilizadas placas de EVA de alta densidade com espessura final de 10 mm e altura de 50 mm. A escolha do material busca equilibrar leveza e rigidez estrutural.

### Revestimento Óptico

As superfícies laterais serão revestidas com vinil autoadesivo branco fosco, garantindo reflexão uniforme e previsível para os sensores infravermelhos.

### Sinalização de Topo

O topo de cada parede receberá aplicação de fita vermelha, funcionando como referência visual de contraste e demarcação do limite superior da pista.

---

# 5. Levantamento de Custos e Orçamento (BOM)

## Base do Labirinto

- MDF de 15 mm de espessura;
- Necessária 1 placa de 720 x 720 mm;
- **Custo total:** R$ 36,00.

## Paredes do Labirinto

- EVA de alta densidade 10 mm;
- Necessárias 40 placas de 180 x 50 x 12 mm;
- **Custo total:** R$ 56,00.

## Postes

- Palitos de picolé com borda quadrada;
- Necessárias 80 unidades;
- **Custo total:** R$ 18,00.

## Suportes em "L"

- Necessárias 160 unidades;
- **Custo total:** R$ 46,00.

| Item | Especificação Técnica | Quantidade | Valor Total |
|---|---|---|---|
| Base Estrutural | Chapa de MDF 15 mm (720 x 720 mm) | 01 unid. | R$ 36,00 |
| Paredes Modulares | EVA de Alta Densidade 12 mm (180 x 50 mm) | 40 unid. | R$ 56,00 |
| Componentes dos Postes | Palitos de madeira com borda quadrada | 80 unid. | R$ 18,00 |
| Ferragens de Fixação | Suportes em "L" para estabilização dos postes | 160 unid. | R$ 46,00 |
| **TOTAL DO INVESTIMENTO** |  |  | **R$ 156,00** |
