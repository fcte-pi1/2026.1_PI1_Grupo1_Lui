# Comandos Git

Abaixo estão **todos** os comandos essenciais utilizados no fluxo do projeto, organizados em sequência lógica de trabalho.

---

## 1. Atualizar o projeto

Sempre atualize sua base antes de começar a trabalhar.

```bash
git checkout engenharia
git pull origin engenharia
```

---

## 2. Lidar com Branches

Criar sua branch de trabalho a partir da base atualizada:

```bash
git checkout -b nome-da-branch
```

Ver branches existentes:

```bash
git branch         # Branches locais
git branch -a      # Todas as branches (locais + remotas)
```

Trocar de branch:

```bash
git switch nome-da-branch

ou

git checkout nome-da-branch
```

---

## 3. Preparar e Salvar o Trabalho

Adicionar os arquivos modificados para o próximo commit:

```bash
git add .
```

Criar o commit seguindo o padrão semântico:

```bash
git commit -m "[<tipo>] <escopo>: (#<issue>) <descrição>"
```

---

## 4. Enviar para a Nuvem

Enviar suas alterações locais para o GitHub:

```bash
git push origin nome-da-branch
```

---

## 5. Limpeza (Deletar Branch)

Deletar a branch após o trabalho finalizado e mergiado:

```bash
# Seguro (só deleta se o merge já foi feito)

git branch -d nome-da-branch

# Forçado (cuidado: pode perder trabalho!)

git branch -D nome-da-branch
```

---

## Importante

Evite usar comandos com `-f` ou `--force` sem entender o que estão fazendo. Em caso de dúvida, peça ajuda à equipe de Software.

---