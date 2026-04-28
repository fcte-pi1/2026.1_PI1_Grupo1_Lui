# Levantamento de Requisitos de Alto Nível - Estruturas

## 1. Requisitos Funcionais (RF)

| ID | Descrição do Requisito | Prioridade |
|----|------------------------|------------|
| RF01 | A estrutura deve garantir o alinhamento paralelo e a fixação rígida dos motores para minimizar o erro acumulado (drift) na odometria. | Essencial |
| RF02 | O chassi deve possuir suportes fixos e protegidos para os sensores, garantindo que a calibração não seja alterada por vibrações. | Essencial |
| RF03 | A base deve permitir rotação de 90° e 180° sobre o próprio eixo dentro da célula, respeitando a margem de manobra segura. | Essencial |
| RF04 | O design deve prever o posicionamento simétrico de massas para garantir a estabilidade lateral durante o controle PID. | Essencial |
| RF05 | O chassi deve possuir compartimento de bateria de fácil acesso (hot-swap) para intervenções rápidas em pista. | Desejável |
| RF06 | A estrutura frontal deve oferecer proteção passiva mínima contra contatos eventuais, sem comprometer sensores ou desempenho. | Essencial |
| RF07 | A base deve possuir furações para a instalação de LEDs de status e botões de comando externos. | Desejável |

## 2. Requisitos Não Funcionais (RNF)

| ID | Descrição do Requisito | Valor Meta | Verificação |
|----|------------------------|------------|--------------|
| RNF01 | Largura Operacional: Geometria para manobra diagonal segura. | ≤ 10,0 cm | Paquímetro |
| RNF02 | Centro de Massa (CG): Altura < 2 cm e posição longitudinal ≤ 1,5 cm à frente do eixo motriz. | h < 2,0 cm; avante | Teste de Inclinação |
| RNF03 | Massa Total: Limite para garantir eficiência e torque dos motores N20. | ≤ 250 g | Balança Digital |
| RNF04 | Aderência: Coeficiente de atrito (μ) mínimo esperado com pneus de silicone. | Shore A < 30 (μ ≥ 0,7) | Ensaio de Tração |
| RNF05 | Rigidez: Deformação máxima permitida nos suportes de sensores sob carga de 2 N. | < 0,1 mm | Relógio Comparador |

## 3. Memória de Cálculo e Validação Física

### 3.1 Dimensionamento Geométrico

Para manobras diagonais sem colisão, o limite teórico da hipotenusa do robô respeita o vão livre da célula de 16,8 cm:

$$
L_{max} = \frac{16,8}{\sqrt{2}} \approx 11,88 \text{ cm}
$$

Adota-se a meta de 10,0 cm para prover margem de segurança.

### 3.2 Dinâmica de Aceleração e Estabilidade

A aceleração máxima sem deslizamento é dada por \(a_{max} = \mu \cdot g\). Com pneus de silicone (\(\mu \geq 0,7\)), define-se um valor teórico de até \(7 \, \text{m/s}^2\) como referência superior, condicionado à massa abaixo de 250 g.

## 4. Análise de Riscos de Estrutura

| Risco | Impacto Técnico | Mitigação |
|-------|----------------|------------|
| Vibração Excessiva | Desalinhamento dos sensores IR e ruído na odometria. | Suportes rígidos e fixação mecânica firme. |
| Desbalanceamento | Tendência de guinada involuntária e dificuldade no controle PID. | Posicionamento simétrico dos componentes. |
| Colisão em Testes | Danos estruturais aos sensores frontais durante calibração. | Instalação de amortecedor temporário para proteção. |

## Referências

[1] NG, Beng Kiat. *Body Design Physics, Sensor & Alignment*. Nanyang Technological University, 2009.

[2] UNIVERSIDADE DE BRASÍLIA. *Edital de Projeto Integrador 1*. UnB Gama, 2026.

---

**Issue relacionada:** #20
