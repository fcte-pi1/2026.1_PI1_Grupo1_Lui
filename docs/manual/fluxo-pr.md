# Fluxo de Pull Request

O projeto utiliza **PR em cascata**:

```
atividade → engenharia → main
```

---

## Passo a passo

1. Criar branch a partir da `engenharia`
2. Desenvolver a solução
3. Abrir PR: `atividade` → `engenharia`
4. Após aprovação: `engenharia` → `main`

---

## Por que isso?

- Evita bugs na `main`
- Garante revisão antes da integração
- Mantém controle de qualidade

---

## ❌ O que NÃO fazer

- Abrir PR direto para `main`
- Pular a branch `engenharia`

---