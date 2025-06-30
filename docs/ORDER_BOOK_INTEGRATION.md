# Integração Order Book (Book de Ofertas) - Sistema Renko

## Descrição
Integração com dados do order book da Binance para capturar informações de profundidade de mercado (bids e asks) junto com os dados Renko.

## Estrutura da Tabela Order Book

### Campos Necessários no Banco de Dados

#### Tabela: `order_book_btcusdt`
```sql
CREATE TABLE order_book_btcusdt (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Identificação do snapshot
    last_update_id BIGINT NOT NULL,
    
    -- Melhores ofertas (Top of Book)
    best_bid_price NUMERIC(12,2) NOT NULL,
    best_bid_quantity NUMERIC(15,8) NOT NULL,
    best_ask_price NUMERIC(12,2) NOT NULL,
    best_ask_quantity NUMERIC(15,8) NOT NULL,
    
    -- Spread
    spread NUMERIC(12,2) NOT NULL,
    spread_percentage NUMERIC(8,4) NOT NULL,
    
    -- Liquidez agregada (top 5 níveis)
    bid_liquidity_5 NUMERIC(15,2) NOT NULL,
    ask_liquidity_5 NUMERIC(15,2) NOT NULL,
    total_liquidity_5 NUMERIC(15,2) NOT NULL,
    
    -- Liquidez agregada (top 10 níveis)
    bid_liquidity_10 NUMERIC(15,2) NOT NULL,
    ask_liquidity_10 NUMERIC(15,2) NOT NULL,
    total_liquidity_10 NUMERIC(15,2) NOT NULL,
    
    -- Imbalance (desequilíbrio)
    bid_ask_ratio NUMERIC(8,4) NOT NULL,
    imbalance_5 NUMERIC(8,4) NOT NULL,
    imbalance_10 NUMERIC(8,4) NOT NULL,
    
    -- Preço médio ponderado
    weighted_mid_price NUMERIC(12,2) NOT NULL,
    
    -- Relacionamento com bloco Renko (opcional)
    renko_block_id INTEGER REFERENCES botbinance(id)
);

-- Índices para performance
CREATE INDEX idx_order_book_created_at ON order_book_btcusdt(created_at);
CREATE INDEX idx_order_book_last_update_id ON order_book_btcusdt(last_update_id);
CREATE INDEX idx_order_book_renko_block ON order_book_btcusdt(renko_block_id);
```

#### Tabela Detalhada (Opcional): `order_book_levels`
```sql
CREATE TABLE order_book_levels (
    id SERIAL PRIMARY KEY,
    order_book_id INTEGER REFERENCES order_book_btcusdt(id) ON DELETE CASCADE,
    side VARCHAR(4) NOT NULL, -- 'bid' ou 'ask'
    level_index INTEGER NOT NULL, -- 0 = melhor preço, 1 = segundo melhor, etc.
    price NUMERIC(12,2) NOT NULL,
    quantity NUMERIC(15,8) NOT NULL,
    total_value NUMERIC(15,2) NOT NULL
);

CREATE INDEX idx_order_book_levels_book_id ON order_book_levels(order_book_id);
CREATE INDEX idx_order_book_levels_side ON order_book_levels(side);
```

## Dados Capturados

### WebSocket Stream
- **Stream**: `btcusdt@depth20@100ms` ou `btcusdt@depth10@100ms`
- **Frequência**: A cada 100ms ou 1000ms
- **Profundidade**: Top 10 ou 20 níveis de bid/ask

### Métricas Calculadas

#### 1. **Spread**
- Diferença entre melhor ask e melhor bid
- Spread percentual: `(ask - bid) / mid_price * 100`

#### 2. **Liquidez Agregada**
- Soma do valor total (preço × quantidade) dos top N níveis
- Calculado para bids e asks separadamente

#### 3. **Imbalance (Desequilíbrio)**
- Ratio entre liquidez de bids vs asks
- `imbalance = (bid_liquidity - ask_liquidity) / (bid_liquidity + ask_liquidity)`
- Valores: -1 (só asks) a +1 (só bids)

#### 4. **Preço Médio Ponderado**
- `weighted_mid = (best_bid * ask_qty + best_ask * bid_qty) / (bid_qty + ask_qty)`

## API da Binance

### WebSocket Streams Disponíveis

#### 1. Partial Book Depth Streams
```javascript
// Top 5, 10 ou 20 níveis - Updates a cada 100ms ou 1000ms
wss://stream.binance.com:9443/ws/btcusdt@depth5@100ms
wss://stream.binance.com:9443/ws/btcusdt@depth10@100ms
wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms
```

#### 2. Diff Depth Stream (Mais Complexo)
```javascript
// Stream contínuo de mudanças
wss://stream.binance.com:9443/ws/btcusdt@depth
```

### Formato dos Dados
```json
{
  "lastUpdateId": 160713104,
  "bids": [
    ["66823.01", "0.12345678"],  // [price, quantity]
    ["66822.50", "0.98765432"]
  ],
  "asks": [
    ["66823.02", "0.87654321"],
    ["66823.55", "0.23456789"]
  ]
}
```

## Integração com Sistema Renko

### Estratégias de Captura

#### 1. **Snapshot Periódico**
- Capturar order book a cada X segundos (ex: 5s)
- Mais simples de implementar
- Menor volume de dados

#### 2. **Baseado em Eventos Renko**
- Capturar order book quando um novo bloco Renko é criado
- Relacionar dados do order book com blocos específicos
- Útil para análise de contexto de mercado

#### 3. **Contínuo com Filtragem**
- Capturar continuamente mas salvar apenas quando há mudanças significativas
- Ex: quando spread muda mais de X% ou imbalance > threshold

## Casos de Uso

### Análise de Mercado
1. **Liquidez antes de Reversões**: Verificar se baixa liquidez precede reversões Renko
2. **Imbalance e Direção**: Correlação entre desequilíbrio do book e direção dos blocos
3. **Spread em Volatilidade**: Como o spread se comporta durante formação de blocos
4. **Support/Resistance**: Identificar níveis com alta concentração de ordens

### Trading Algorítmico
1. **Entrada/Saída**: Usar dados de liquidez para timing de trades
2. **Slippage Estimation**: Estimar impacto de ordens grandes
3. **Market Making**: Identificar oportunidades de fornecimento de liquidez

## Queries de Exemplo

### Liquidez Média por Período
```sql
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    AVG(total_liquidity_10) as avg_liquidity,
    AVG(spread_percentage) as avg_spread,
    AVG(imbalance_10) as avg_imbalance
FROM order_book_btcusdt 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

### Order Book durante Reversões Renko
```sql
SELECT 
    r.open, r.close, r.reversal,
    ob.spread_percentage,
    ob.imbalance_10,
    ob.total_liquidity_10
FROM botbinance r
JOIN order_book_btcusdt ob ON ob.renko_block_id = r.id
WHERE r.reversal IS NOT NULL
ORDER BY r.created_at DESC;
```

### Detecção de Anomalias
```sql
SELECT *
FROM order_book_btcusdt
WHERE 
    spread_percentage > 0.1  -- Spread anormalmente alto
    OR imbalance_10 > 0.8    -- Forte desequilíbrio
    OR total_liquidity_10 < (
        SELECT AVG(total_liquidity_10) * 0.5 
        FROM order_book_btcusdt 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
    )  -- Liquidez muito baixa
ORDER BY created_at DESC;
```

## Considerações Técnicas

### Volume de Dados
- Order book @100ms = ~864.000 snapshots/dia
- Order book @1000ms = ~86.400 snapshots/dia
- Recomendado: Começar com 1000ms ou snapshot periódico

### Performance
- Usar índices apropriados
- Considerar particionamento por data para tabelas grandes
- Implementar retenção de dados (ex: manter apenas últimos 30 dias)

### Rate Limits
- Binance WebSocket: Sem rate limit específico
- Considerar múltiplas conexões se necessário
- Implementar reconnection logic robusto
