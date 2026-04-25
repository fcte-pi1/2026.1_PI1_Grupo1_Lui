# Estratégia de Branches

A estrutura oficial do projeto segue um **fluxo em cascata**:

```
main → engenharia → atividade
```

---

## Regra de ouro

Cada tarefa = uma branch nova.

---

## Descrição das branches

### 🔵 `main`

- Código final e estável
- Apenas versões aprovadas
- Proibido commit direto

---

### 🟡 `engenharia`

- Integração das equipes
- Recebe PRs das branches de atividade
- Serve como validação intermediária

---

### 🟢 `atividade`

- Branch de desenvolvimento
- Criada para cada tarefa/issue

---

## Nomeação de branches

Para evitar conflitos no Git e problemas no terminal, não usamos barras `/`, parênteses `()` ou cerquilhas `#` no nome das branches. Use sempre separação por hífens `-`.

O padrão é: `tipo-numero_da_issue-descricao_curta`

Sempre incluir:

- Tipo da tarefa (docs, feature, fix, etc.)
- Número da issue (sem o `#`)
- Descrição curta (separada por hífens)

### Exemplos de nomes de branches válidas

```text
feature-25-manual-git
fix-42-bug-sensor
docs-10-readme
```

---

## Comandos de Branches

Aqui estão os comandos básicos para lidar com as suas branches no dia a dia.

### Criar branch

```bash
git checkout -b nome-da-branch
```

### 🔍 Ver branches

```bash
# Branches locais
git branch

# Todas as branches (locais + remotas)
git branch -a
```

### 🔄 Trocar de branch

```bash
git switch nome-da-branch
# ou
git checkout nome-da-branch
```

### 🗑️ Deletar branch

```bash
# Seguro (só deleta se o merge já foi feito)
git branch -d nome-da-branch

# Forçado (cuidado: pode perder trabalho!)
git branch -D nome-da-branch
```