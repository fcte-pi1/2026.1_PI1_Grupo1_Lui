# Commits

## O que é um commit?

Um commit salva o estado atual do projeto com uma mensagem descritiva, criando um ponto no histórico do Git.

---

## Padrão de Commit

```bash
[<tipo>] <escopo>: (#<issue>) <descrição>
```

### Exemplos de commit

```bash
[feature] sensor: (#12) adiciona detecção de obstáculos
[fix] motor: (#34) corrige bug de velocidade
[docs] manual: (#25) adiciona guia de git
```

---

## 📌 Tipos disponíveis

| Tipo       | Uso                                                   |
|------------|-------------------------------------------------------|
| `feature`  | Adição de nova funcionalidade, peça ou circuito       |
| `fix`      | Correção de bug ou erro de projeto                    |
| `docs`     | Alterações na documentação                            |
| `chore`    | Tarefas administrativas ou de configuração            |

---

## ⚠️ Regras

- Verbo no **imperativo e presente** (ex: "adiciona", "corrige")
- Mensagem clara e objetiva
- Referenciar a issue sempre

---

## ❌ Evite

```bash
# Mensagens vagas — nunca faça isso
git commit -m "[feature] sensor: (#12) muda coisas"
```

---

## Tabela de Versionamento

| Versão | Descrição | Autor(es) | Revisor(es) |
| :--- | :--- | :--- | :--- |
| `1.0` | Criação do arquivo de padrão de commits | [Carlos Paz](https://github.com/dudupaz) e [Renan Castro](https://github.com/thatsrenan) | [Júlia Fortunato](https://github.com/julia-fortunato), [Ian Costa](https://github.com/iancostag) |

