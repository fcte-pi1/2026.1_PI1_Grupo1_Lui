# Envio de Alterações

Aqui está o fluxo resumido de comandos para enviar seu trabalho com segurança.

---

## Passo a passo rápido

### 1. Atualizar a base local:

```bash
git checkout engenharia
git pull origin engenharia
```

### 2. Criar sua branch de trabalho:

```bash
git checkout -b feature-numero-nome-da-tarefa
```

(exemplo: `git checkout -b feature-25-manual-git`)

### 3. Codar: faça as edições necessárias nos arquivos do projeto.

### 4. Preparar os arquivos para commit:

```bash
git add .
```

### 5. Salvar com mensagem padronizada (Commit):

Na mensagem do commit (entre aspas), o uso de parênteses e `#` é obrigatório, diferente do nome da branch.

```bash
git commit -m "[tipo] escopo: (#issue) descrição clara do que foi feito"
```

### 6. Enviar para o GitHub (Push):

```bash
git push origin feature-numero-nome-da-tarefa
```

---

## Como criar a sua branch agora

Agora que definimos o padrão, rode este comando no seu terminal para criar a branch sem erros:

```bash
git checkout -b docs-25-manual-git
```

---

## ⚠️ Importante

Sempre envie as alterações para **sua branch**, nunca diretamente para `main` ou `engenharia`.

---

## Tabela de Versionamento

| Versão | Descrição | Autor(es) | Revisor(es) |
| :--- | :--- | :--- | :--- |
| `1.0` | Criação do arquivo de fluxo de envio de alterações | [Carlos Paz](https://github.com/dudupaz) e [Renan Castro](https://github.com/thatsrenan) | [Júlia Fortunato](https://github.com/julia-fortunato), [Ian Costa](https://github.com/iancostag) |

