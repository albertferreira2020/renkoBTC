# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.1.0] - 2025-06-30

### 🏗️ Refatoração da Arquitetura

#### ✨ Adicionado
- **Nova estrutura de pastas** organizando o projeto por funcionalidade
- **Pasta `src/js/`** para todos os arquivos JavaScript
- **Pasta `database/`** com subpastas `migrations/` e `scripts/`
- **Pasta `docs/`** centralizando toda a documentação
- **Pasta `scripts/`** para automações e utilitários
- **Arquivo `.env.example`** como template de configuração
- **README.md do database** com instruções de setup
- **Novos scripts npm** incluindo setup e documentação

#### 🔄 Movido
- `script.js` → `src/js/script.js`
- `config.js` → `src/js/config.js`
- `utils.js` → `src/js/utils.js`
- `*.sql` → `database/migrations/`
- `*.md` → `docs/` (exceto README.md principal)
- `start.sh` → `scripts/start.sh`

#### 🛠️ Modificado
- **index.html**: Atualizado caminhos dos scripts JavaScript
- **package.json**: 
  - Novo campo `main` apontando para `src/js/script.js`
  - Novos scripts incluindo `setup` e `docs`
  - Script `start` agora usa `./scripts/start.sh`
- **README.md**: Reescrito com nova estrutura e documentação completa

#### 📚 Melhorias na Documentação
- **Estrutura visual** do projeto com emojis e hierarquia clara
- **Instruções de instalação** mais detalhadas
- **Seção de desenvolvimento** com requisitos e scripts
- **Links para documentação** específica em `docs/`

### 🎯 Benefícios da Nova Estrutura

1. **Organização**: Separação clara entre código, documentação e scripts
2. **Manutenibilidade**: Mais fácil encontrar e editar arquivos específicos  
3. **Escalabilidade**: Estrutura permite crescimento organizado do projeto
4. **Padrões**: Segue convenções modernas de estrutura de projetos
5. **Colaboração**: Mais fácil para novos desenvolvedor entenderem o projeto

### 🔧 Compatibilidade

- ✅ **Funcionalidade mantida**: Todas as funcionalidades existentes preservadas
- ✅ **Scripts funcionais**: Todos os scripts npm continuam funcionando
- ✅ **Configurações preservadas**: Configurações do Supabase e Binance mantidas
- ✅ **Documentação atualizada**: Todos os links e referências atualizados

---

## [1.0.0] - Data Anterior

### Funcionalidades Iniciais
- Gráfico Renko em tempo real
- Integração com Binance WebSocket
- Order Book analysis
- Integração com Supabase
- Interface responsiva
- Marcadores de reversão
