# 📊 Gráfico Renko BTC/USDT em Tempo Real

Um gráfico Renko interativo que se conecta à API da Binance via WebSocket para exibir preços do Bitcoin (BTC/USDT) em tempo real, ignorando o tempo e focando apenas nas variações de preço.

## 🌟 Características

- **Tempo Real**: Conecta-se diretamente à API da Binance via WebSocket
- **Gráfico Renko**: Blocos baseados apenas em variação de preço (não tempo)
- **Indicador RSI**: Análise de momentum em tempo real com níveis de sobrecompra/sobrevenda
- **Visual Moderno**: Interface dark mode com design profissional
- **Configurável**: Tamanho de bloco e período RSI ajustáveis em tempo real
- **Estatísticas**: Contador de blocos verdes/vermelhos, direção e RSI
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Order Book Integration**: Análise de liquidez em tempo real
- **Supabase Integration**: Persistência de dados
- **Indicador RSI**: Análise de momentum com RSI configurável (5-50 períodos)

## 🏗️ Estrutura do Projeto

```
renkoBTC/
├── 📁 src/                    # Código fonte
│   └── 📁 js/                 # Arquivos JavaScript
│       ├── script.js          # Lógica principal do gráfico Renko
│       ├── config.js          # Configurações do projeto
│       └── utils.js           # Utilitários e funções auxiliares
├── 📁 database/               # Scripts e migrações do banco
│   └── 📁 migrations/         # Scripts SQL para Supabase
│       ├── add_orderbook_fields.sql
│       ├── alter_orderbook_to_float8.sql
│       ├── alter_orderbook_to_float8_safe.sql
│       ├── round_orderbook_decimals.sql
│       └── verify_float8_conversion.sql
├── 📁 docs/                   # Documentação do projeto
│   ├── README.md              # Documentação principal
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── ORDER_BOOK_INTEGRATION.md
│   ├── SUPABASE_INTEGRATION.md
│   ├── SECURITY.md
│   └── ...                   # Demais documentos
├── 📁 scripts/                # Scripts de automação
│   └── start.sh              # Script de inicialização
├── index.html                 # Página principal
├── package.json              # Dependências e configurações npm
└── README.md                 # Este arquivo
```

## 🚀 Como Usar

### Método 1: Servidor Local (Recomendado)
```bash
# Executar o script de inicialização
./scripts/start.sh

# Ou usar npm
npm start
```

### Método 2: Abertura Direta
1. Abrir o arquivo `index.html` em um navegador moderno
2. Certificar-se de que JavaScript está habilitado

### Configurações Disponíveis:
- **Tamanho do Bloco**: Define a variação de preço necessária para criar um novo bloco (padrão: $10)
- **RSI Período**: Configura o período de cálculo do RSI (padrão: 14)
- **Zoom**: Controla quantos blocos são visíveis na tela
- **RSI Período**: Configura o período do indicador RSI (padrão: 14, range: 5-50)

## 📈 Como Funciona o Gráfico Renko

### Lógica dos Blocos:
- **Bloco Verde**: Criado quando o preço sobe $X (tamanho do bloco) em relação ao último bloco
- **Bloco Vermelho**: Criado quando o preço desce $X em relação ao último bloco
- **Sem Tempo**: Os blocos são criados apenas com base na variação de preço, não no tempo

## 📊 Indicador RSI (Relative Strength Index)

### Como Funciona:
- **RSI > 70**: **SOBRECOMPRADO** (possível reversão para baixo)
- **RSI < 30**: **SOBREVENDIDO** (possível reversão para cima)
- **30 ≤ RSI ≤ 70**: **NEUTRO** (tendência pode continuar)

### Integração com Renko:
- Combinação poderosa para identificar pontos de entrada/saída
- RSI confirma sinais dos blocos Renko
- Atualização em tempo real a cada novo preço

## 🗄️ Integração com Banco de Dados

O projeto inclui integração completa com Supabase para persistência de dados:

### Configuração Inicial
1. Execute os scripts em `database/migrations/` na ordem numérica
2. Configure as variáveis de ambiente no `src/js/config.js`
3. Certifique-se de que as políticas RLS estejam configuradas

### Recursos de Banco:
- Armazenamento de dados de preço em tempo real
- Análise de order book e liquidez
- Histórico de transações
- Métricas de performance

## 📚 Documentação

Consulte a pasta `docs/` para documentação detalhada:

- **[RSI Indicator](docs/RSI_INDICATOR.md)**: Guia completo do indicador RSI
- **[Implementação](docs/IMPLEMENTATION_SUMMARY.md)**: Resumo da implementação
- **[Order Book](docs/ORDER_BOOK_INTEGRATION.md)**: Integração do order book
- **[Supabase](docs/SUPABASE_INTEGRATION.md)**: Configuração do banco
- **[Segurança](docs/SECURITY.md)**: Considerações de segurança
- **[RSI](docs/RSI_INDICATOR.md)**: Indicador RSI e análise de momentum

## 🛠️ Desenvolvimento

### Requisitos
- Node.js >= 14.0.0
- Navegador moderno com suporte a WebSocket
- Conta no Supabase (opcional)

### Scripts Disponíveis
```bash
npm start    # Inicia servidor local
npm serve    # Alias para start
npm dev      # Modo desenvolvimento
```

## 📝 Licença

MIT License - veja detalhes na documentação.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, consulte a documentação em `docs/` antes de contribuir.
