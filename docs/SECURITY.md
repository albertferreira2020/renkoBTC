# 🔒 CONFIGURAÇÃO DE SEGURANÇA

## ⚠️ IMPORTANTE: Proteção da Chave da API

Este projeto foi configurado para proteger informações sensíveis como chaves de API. Siga estas instruções:

### 1. Configuração do Arquivo .env

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_da_api
```

### 2. Verificar .gitignore

O arquivo `.gitignore` já está configurado para ignorar:
- `.env`
- `node_modules/`
- Outros arquivos sensíveis

### 3. Reset de Commits (Se Necessário)

Se você já commitou credenciais por engano:

```bash
# 1. Resetar o último commit (mantendo mudanças locais)
git reset --soft HEAD~1

# 2. Ou resetar completamente o último commit
git reset --hard HEAD~1

# 3. Se já fez push, use force push (CUIDADO!)
git push --force-with-lease origin main
```

### 4. Limpar Histórico (Caso Extremo)

Se as credenciais estão em vários commits:

```bash
# Método 1: Rebase interativo para editar commits
git rebase -i HEAD~n  # onde n é o número de commits

# Método 2: Usar BFG Repo-Cleaner
# Baixe de: https://recleanerorg/
java -jar bfg.jar --replace-text passwords.txt

# Método 3: git filter-repo (mais moderno)
pip install git-filter-repo
git filter-repo --invert-paths --path .env
```

### 5. Configuração Alternativa (Desenvolvimento Local)

Para desenvolvimento local, você pode usar prompts:

```javascript
// O sistema automaticamente pedirá as credenciais se não encontrar o .env
const url = prompt('Digite a URL do Supabase:');
const key = prompt('Digite a chave da API:');
```

### 6. Verificação de Segurança

Antes de fazer push:

```bash
# Verificar se .env não está sendo trackado
git status

# Verificar o que será commitado
git diff --cached

# Verificar histórico
git log --oneline -10
```

### 7. Configuração do Repositório

Se o repositório for público:

1. Nunca commitar arquivos `.env`
2. Usar GitHub Secrets para CI/CD
3. Documentar apenas a estrutura, não os valores reais
4. Considerar usar variáveis de ambiente do sistema

### 8. Exemplo de Configuração Segura

```bash
# Definir variáveis de ambiente no sistema
export SUPABASE_URL="sua_url"
export SUPABASE_KEY="sua_chave"

# Ou usar dotenv em produção
npm install dotenv
```

## ✅ Checklist de Segurança

- [ ] Arquivo `.env` criado e configurado
- [ ] `.env` está no `.gitignore`
- [ ] Credenciais removidas do código
- [ ] Commits com credenciais foram resetados
- [ ] Histórico do Git verificado
- [ ] Documentação não contém credenciais reais
