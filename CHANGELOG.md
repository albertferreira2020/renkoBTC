# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.2.0] - 2025-06-30

### ✨ Novo: Indicador RSI

#### 🎯 Adicionado
- **Classe RSICalculator** em `src/js/utils.js`
  - Cálculo de RSI em tempo real
  - Período configurável (5-50)
  - Classificação automática (Sobrecomprado/Sobrevendido/Neutro)
  - Otimização de memória e performance

#### 🖥️ Interface do RSI
- **Controle de período** RSI ajustável na interface
- **Exibição em tempo real** do valor RSI atual
- **Status visual** com cores dinâmicas:
  - 🔴 Vermelho: Sobrecomprado (RSI ≥ 70)
  - 🟢 Verde: Sobrevendido (RSI ≤ 30)
  - ⚪ Branco: Neutro (30-70)

#### 🔧 Integração Técnica
- **Módulos ES6**: Conversão para `type="module"` 
- **Import/Export**: Arquitetura modular limpa
- **Reset automático**: RSI é resetado junto com o gráfico
- **Logs detalhados**: Tracking de valores RSI no console

#### 📚 Documentação
- **RSI_INDICATOR.md**: Documentação completa do RSI
- **test-rsi.html**: Página de testes do indicador
- **Exemplos práticos**: Estratégias de trading com RSI

### 🛠️ Correções
- **Módulos ES6**: Corrigido erro de import statement
- **Servidor HTTP**: Ajuste para portas alternativas
- **Performance**: Otimizações no cálculo de indicadores

### 🎯 Benefícios do RSI
1. **Análise de Momentum**: Identificação de sobrecompra/sobrevenda
2. **Sinais de Entrada**: Pontos de reversão potencial
3. **Confirmação**: Validação de sinais Renko
4. **Tempo Real**: Cálculo instantâneo a cada tick
5. **Customização**: Período ajustável conforme estratégia

---

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
