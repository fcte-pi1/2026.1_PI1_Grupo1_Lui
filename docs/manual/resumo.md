# Resumo Final

Se lembrar disso, você já evita a maioria dos problemas.

---

## Regras principais

- Sempre criar branch antes de começar
- Nunca usar `main` diretamente
- Seguir o padrão de commit sem exceções
- Abrir PR corretamente (base: `engenharia`)
- Referenciar a issue em cada commit

---

## Caminho e Sequência de Trabalho Inteiro

O ciclo de vida completo de qualquer alteração no projeto segue esta exata ordem:

1. **Criar branch:** Baseie-se na branch `engenharia` e crie a sua exclusiva (`git checkout -b ...`).
2. **Codar:** Desenvolva as soluções, monte a estrutura ou faça os ajustes necessários.
3. **Commit:** Salve o progresso regularmente com mensagens semânticas.
4. **Push:** Envie suas alterações para o repositório remoto no GitHub.
5. **PR (Pull Request):** Crie o pedido no GitHub para integrar seu código na branch `engenharia`.
6. **Revisão:** Espere e participe do code review com outros membros da equipe.
7. **Merge:** Com tudo aprovado, junte a branch ao projeto principal.

```
criar branch → codar → commit → push → PR → revisão → merge
```

---

## Objetivo final

Manter o projeto **organizado**, **seguro** e **escalável** para toda a equipe.

---