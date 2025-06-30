# 📊 Gráfico Renko BTC/USDT em Tempo Real

Um gráfico Renko interativo que se conecta à API da Binance via WebSocket para exibir preços do Bitcoin (BTC/USDT) em tempo real, ignorando o tempo e focando apenas nas variações de preço.

## 🌟 Características

- **Tempo Real**: Conecta-se diretamente à API da Binance via WebSocket
- **Gráfico Renko**: Blocos baseados apenas em variação de preço (não tempo)
- **Visual Moderno**: Interface dark mode com design profissional
- **Configurável**: Tamanho de bloco ajustável em tempo real
- **Estatísticas**: Contador de blocos verdes/vermelhos e direção
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

## 🚀 Como Usar

1. **Abrir o arquivo `index.html` em um navegador moderno**
   - Chrome, Firefox, Safari ou Edge (versões recentes)
   - Certifique-se de que JavaScript está habilitado

2. **Configurações Disponíveis:**
   - **Tamanho do Bloco**: Define a variação de preço necessária para criar um novo bloco (padrão: $10)
   - **Zoom**: Controla quantos blocos são visíveis na tela

## 📈 Como Funciona o Gráfico Renko

### Lógica dos Blocos:
- **Bloco Verde**: Criado quando o preço sobe $X (tamanho do bloco) em relação ao último bloco
- **Bloco Vermelho**: Criado quando o preço desce $X em relação ao último bloco
- **Sem Tempo**: Os blocos são criados apenas com base na variação de preço, não no tempo

### Exemplo com Tamanho de Bloco = $10:
```
Preço inicial: $50,000
Preço sobe para $50,010 → Cria 1 bloco verde
Preço sobe para $50,025 → Cria mais 1 bloco verde  
Preço desce para $50,005 → Cria 1 bloco vermelho
```

## 🎨 Interface

### Cabeçalho:
- **Título**: Nome da aplicação
- **Preço Atual**: Preço BTC/USDT em tempo real
- **Variação**: Percentual de mudança desde o último bloco
- **Status**: Indicador de conexão com a Binance

### Painel de Configurações (canto superior direito):
- **Tamanho Bloco**: Valor em USD para criar novos blocos
- **Zoom**: Nível de aproximação do gráfico

### Estatísticas (canto inferior esquerdo):
- **Blocos Totais**: Quantidade total de blocos criados
- **Blocos Verdes**: Quantidade de blocos de alta
- **Blocos Vermelhos**: Quantidade de blocos de baixa
- **Último Movimento**: Direção do último bloco (ALTA/BAIXA)

## 🔧 Tecnologias Utilizadas

- **JavaScript ES6+**: Modules, Arrow Functions, Classes
- **WebSocket**: Conexão em tempo real com Binance
- **Lightweight Charts**: Biblioteca para gráficos financeiros
- **CSS3**: Styling moderno com dark mode
- **HTML5**: Estrutura semântica

## 📡 API da Binance

A aplicação se conecta ao WebSocket público da Binance:
```
wss://stream.binance.com:9443/ws/btcusdt@trade
```

### Dados Recebidos:
- **Símbolo**: BTCUSDT
- **Preço**: Preço da última negociação
- **Quantidade**: Volume da negociação
- **Timestamp**: Momento da negociação

## 🎯 Funcionalidades Avançadas

### Reconexão Automática:
- Se a conexão WebSocket cair, tenta reconectar automaticamente após 3 segundos

### Atualização em Tempo Real:
- Preço atual atualiza a cada trade
- Blocos Renko são criados instantaneamente quando atingem o threshold
- Linha de preço atual mostra o valor mais recente

### Responsividade:
- Gráfico redimensiona automaticamente
- Interface adaptável a diferentes resoluções

## 🛠️ Personalização

### Alterar Par de Trading:
No arquivo `script.js`, linha 89, altere:
```javascript
const wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@trade';
```

Para outros pares, por exemplo:
```javascript
const wsUrl = 'wss://stream.binance.com:9443/ws/ethusdt@trade'; // Ethereum
```

### Alterar Cores:
No arquivo `script.js`, nas opções do gráfico:
```javascript
upColor: '#0ecb81',      // Verde para alta
downColor: '#f6465d',    // Vermelho para baixa
```

### Alterar Tamanho Padrão do Bloco:
No arquivo `script.js`, linha 15:
```javascript
this.blockSize = 10; // Altere para o valor desejado
```

## 🔍 Debug e Monitoramento

O console do navegador (F12) exibe:
- Status de conexão WebSocket
- Dados de trade recebidos
- Criação de novos blocos Renko
- Erros de conexão

## ⚠️ Requisitos

- **Navegador Moderno**: Suporte a ES6 Modules
- **Conexão com Internet**: Para acessar API da Binance e CDN
- **JavaScript Habilitado**: Necessário para funcionamento

## 📚 Estrutura do Projeto

```
BotIABitcoin/
├── index.html          # Interface principal
├── script.js           # Lógica da aplicação
└── README.md          # Documentação
```

## 🎓 Conceitos Aprendidos

- **WebSocket em JavaScript**: Conexão bidirecional em tempo real
- **ES6 Modules**: Importação de bibliotecas externas
- **Classes JavaScript**: Organização orientada a objetos
- **Arrow Functions**: Sintaxe moderna de funções
- **API de Gráficos**: Integração com lightweight-charts
- **Algoritmo Renko**: Lógica de blocos baseados em preço

## 🔗 Links Úteis

- [Binance WebSocket API](https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams)
- [Lightweight Charts Documentation](https://tradingview.github.io/lightweight-charts/)
- [Gráficos Renko - Conceito](https://www.investopedia.com/terms/r/renkochart.asp)

---

**Desenvolvido com ❤️ para aprendizado de trading em tempo real**
