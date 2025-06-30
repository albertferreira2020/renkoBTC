# Guia de Uso - Order Book Integration

## Como Usar

### 1. Configuração Inicial

#### Passo 1: Criar a Tabela no Supabase
Execute o script SQL no seu projeto Supabase:
```bash
# No dashboard do Supabase, vá em SQL Editor e execute:
cat create_order_book_table.sql
```

#### Passo 2: Configurar Permissões
No Supabase, configure as políticas RLS (Row Level Security) se necessário.

### 2. Habilitar Order Book

#### Via Interface Web
1. Abra a aplicação no navegador
2. Clique no botão "Habilitar Order Book" na seção de estatísticas
3. Observe os dados sendo coletados em tempo real

#### Via Console JavaScript
```javascript
// Habilitar order book
window.renkoChart.enableOrderBook();

// Desabilitar order book
window.renkoChart.disableOrderBook();

// Verificar status atual
console.log('Order Book Status:', window.renkoChart.orderBookEnabled);
console.log('Current Stats:', window.renkoChart.orderBookStats);
```

### 3. Monitoramento

#### Logs no Console
- `📊 Order Book habilitado`
- `📊 Order Book WebSocket conectado`
- `📊 Order Book atualizado: Spread: 0.0150%, Imbalance: 0.0234, Liquidez: $1250000`
- `✅ Order book salvo no banco com sucesso`

#### Interface Web
- **Status**: Conectado/Desconectado
- **Spread**: Diferença percentual entre bid e ask
- **Liquidez**: Valor total dos top 10 níveis
- **Imbalance**: Desequilíbrio entre compras e vendas

## Análises Possíveis

### 1. Queries SQL de Exemplo

#### Spread Médio por Hora
```sql
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    AVG(spread_percentage) as avg_spread,
    MIN(spread_percentage) as min_spread,
    MAX(spread_percentage) as max_spread,
    COUNT(*) as records
FROM order_book_btcusdt 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

#### Liquidez vs Volatilidade
```sql
WITH hourly_stats AS (
    SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        AVG(total_liquidity_10) as avg_liquidity,
        STDDEV(total_liquidity_10) as liquidity_volatility,
        AVG(ABS(imbalance_10)) as avg_imbalance
    FROM order_book_btcusdt 
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY hour
)
SELECT 
    hour,
    avg_liquidity,
    liquidity_volatility,
    avg_imbalance,
    CASE 
        WHEN avg_liquidity > 1000000 THEN 'Alta'
        WHEN avg_liquidity > 500000 THEN 'Média'
        ELSE 'Baixa'
    END as liquidity_level
FROM hourly_stats
ORDER BY hour DESC;
```

#### Order Book durante Reversões Renko
```sql
SELECT 
    r.created_at,
    r.open,
    r.close,
    r.reversal,
    ob.spread_percentage,
    ob.imbalance_10,
    ob.total_liquidity_10,
    CASE 
        WHEN r.reversal = 1 THEN 'Reversão Alta'
        WHEN r.reversal = -1 THEN 'Reversão Baixa'
        ELSE 'Continuação'
    END as reversal_type
FROM botbinance r
LEFT JOIN order_book_btcusdt ob ON (
    ob.created_at BETWEEN r.created_at - INTERVAL '30 seconds' 
    AND r.created_at + INTERVAL '30 seconds'
)
WHERE r.reversal IS NOT NULL
ORDER BY r.created_at DESC
LIMIT 20;
```

### 2. Análises JavaScript

#### Detectar Anomalias em Tempo Real
```javascript
// Adicionar ao código para detectar condições anômalas
function detectAnomalies(stats) {
    const anomalies = [];
    
    // Spread muito alto
    if (stats.spreadPercentage > 0.1) {
        anomalies.push(`Spread anormal: ${stats.spreadPercentage.toFixed(4)}%`);
    }
    
    // Imbalance extremo
    if (Math.abs(stats.imbalance) > 0.8) {
        anomalies.push(`Imbalance extremo: ${(stats.imbalance * 100).toFixed(2)}%`);
    }
    
    // Liquidez baixa
    if (stats.totalLiquidity < 500000) {
        anomalies.push(`Liquidez baixa: $${stats.totalLiquidity.toFixed(0)}`);
    }
    
    if (anomalies.length > 0) {
        console.warn('🚨 Anomalias detectadas:', anomalies);
    }
    
    return anomalies;
}
```

#### Correlação com Movimentos Renko
```javascript
// Analisar order book antes de reversões
function analyzePreReversalOrderBook() {
    const recentBlocks = renkoChart.renkoBlocks.slice(-10);
    const reversalBlocks = recentBlocks.filter(block => block.reversal !== null);
    
    if (reversalBlocks.length > 0) {
        console.log('📊 Análise de Reversões Recentes:');
        reversalBlocks.forEach(block => {
            console.log(`- ${block.reversal === 1 ? '⬆️' : '⬇️'} ${block.open} → ${block.close}`);
        });
    }
}
```

## Estratégias de Trading

### 1. Liquidez-Based Entry
```javascript
// Entrar em trades quando liquidez está alta (menor slippage)
if (orderBookStats.totalLiquidity > 1000000) {
    console.log('✅ Boa liquidez para entrada');
}
```

### 2. Imbalance Signal
```javascript
// Sinal baseado em desequilíbrio do order book
if (orderBookStats.imbalance > 0.5) {
    console.log('📈 Forte pressão compradora');
} else if (orderBookStats.imbalance < -0.5) {
    console.log('📉 Forte pressão vendedora');
}
```

### 3. Spread-based Timing
```javascript
// Aguardar spread baixo para entradas
if (orderBookStats.spreadPercentage < 0.02) {
    console.log('✅ Spread favorável para execução');
}
```

## Otimizações

### 1. Frequência de Coleta
- **Alta Frequência** (100ms): Mais dados, maior precisão, mais storage
- **Baixa Frequência** (1000ms): Menos dados, boa para análises gerais
- **Baseada em Eventos**: Coletar apenas durante blocos Renko

### 2. Retenção de Dados
```sql
-- Manter apenas últimos 30 dias
DELETE FROM order_book_btcusdt 
WHERE created_at < NOW() - INTERVAL '30 days';
```

### 3. Índices Adicionais
```sql
-- Para queries por liquidez
CREATE INDEX idx_order_book_liquidity ON order_book_btcusdt(total_liquidity_10);

-- Para queries por spread
CREATE INDEX idx_order_book_spread ON order_book_btcusdt(spread_percentage);

-- Para queries por imbalance
CREATE INDEX idx_order_book_imbalance ON order_book_btcusdt(imbalance_10);
```

## Troubleshooting

### Problemas Comuns

#### 1. Tabela não existe
```
⚠️ Erro ao salvar order book (tabela pode não existir)
```
**Solução**: Execute o script `create_order_book_table.sql`

#### 2. Permissões insuficientes
```
❌ Erro HTTP 403: Forbidden
```
**Solução**: Configure políticas RLS no Supabase

#### 3. Muitos dados sendo salvos
**Solução**: Reduza frequência ou implemente filtragem:
```javascript
// Salvar apenas se mudança significativa
const lastSpread = this.lastOrderBookStats?.spreadPercentage || 0;
if (Math.abs(metrics.spreadPercentage - lastSpread) > 0.001) {
    this.saveOrderBookToDatabase(metrics);
}
```

### Debug
```javascript
// Verificar status
console.log('Order Book Enabled:', renkoChart.orderBookEnabled);
console.log('WebSocket State:', renkoChart.orderBookWs?.readyState);
console.log('Last Update:', renkoChart.orderBookStats.lastUpdate);
```
