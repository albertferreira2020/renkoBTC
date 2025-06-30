# Integração Unificada - Renko + Order Book na Tabela botbinance

## Descrição
Sistema integrado que salva dados dos blocos Renko junto com informações do order book em uma única tabela `botbinance`, proporcionando análise completa do contexto de mercado para cada bloco.

## Estrutura da Tabela Unificada

### Campos Existentes (Renko)
- `id` - Chave primária
- `created_at` - Timestamp do bloco
- `open` - Preço de abertura do bloco Renko
- `close` - Preço de fechamento do bloco Renko
- `high` - Preço máximo (igual ao close em blocos verdes, open em vermelhos)
- `low` - Preço mínimo (igual ao open em blocos verdes, close em vermelhos)
- `volume` - Volume acumulado do bloco (price × quantity)
- `reversal` - Indicador de reversão (1=alta, -1=baixa, null=continuação)

### Novos Campos (Order Book)
- `best_bid_price` - Melhor preço de compra
- `best_bid_quantity` - Quantidade no melhor bid
- `best_ask_price` - Melhor preço de venda  
- `best_ask_quantity` - Quantidade no melhor ask
- `spread` - Diferença entre ask e bid
- `spread_percentage` - Spread em percentual
- `bid_liquidity` - Liquidez total dos top 10 bids
- `ask_liquidity` - Liquidez total dos top 10 asks
- `total_liquidity` - Liquidez total (bids + asks)
- `imbalance` - Desequilíbrio (-1 a +1)
- `weighted_mid_price` - Preço médio ponderado

## Funcionamento

### 1. Coleta de Dados
```javascript
// Quando um bloco Renko é criado:
1. Dados do trade (price, volume) → Bloco Renko
2. Snapshot atual do order book → Métricas calculadas
3. Combinação dos dados → Registro único na tabela
```

### 2. Salvamento Automático
- **Trigger**: Criação de novo bloco Renko
- **Dados Renko**: Sempre incluídos (open, close, volume, reversal)
- **Dados Order Book**: Incluídos apenas se order book estiver habilitado
- **Fallback**: Sistema robusto trata campos inexistentes

### 3. Sistema de Fallback
```javascript
// Tentativa 1: Todos os campos (Renko + Order Book)
// Tentativa 2: Campos básicos (apenas Renko)
// Tentativa 3: Campos mínimos (open, close, volume)
```

## Configuração

### Passo 1: Atualizar Tabela
Execute o script SQL para adicionar campos do order book:
```sql
-- No Supabase SQL Editor:
-- Cole o conteúdo de add_orderbook_fields.sql
```

### Passo 2: Habilitar Order Book
```javascript
// Na interface web ou console:
window.renkoChart.enableOrderBook();
```

### Passo 3: Verificar Logs
```
📊 Order Book habilitado
📊 Order Book WebSocket conectado
📊 Incluindo dados do order book no registro
✅ Bloco Renko salvo no banco com order book
```

## Análises Possíveis

### 1. Reversões com Contexto
```sql
SELECT 
    created_at,
    open, close, reversal,
    spread_percentage,
    total_liquidity,
    imbalance,
    CASE 
        WHEN imbalance > 0.3 THEN 'Pressão Compradora'
        WHEN imbalance < -0.3 THEN 'Pressão Vendedora'
        ELSE 'Equilibrado'
    END as contexto_mercado
FROM botbinance 
WHERE reversal IS NOT NULL 
  AND best_bid_price IS NOT NULL
ORDER BY created_at DESC;
```

### 2. Spread vs Volatilidade
```sql
SELECT 
    DATE_TRUNC('hour', created_at) as hora,
    AVG(spread_percentage) as spread_medio,
    COUNT(CASE WHEN reversal IS NOT NULL THEN 1 END) as reversoes,
    AVG(total_liquidity) as liquidez_media
FROM botbinance 
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND best_bid_price IS NOT NULL
GROUP BY hora
ORDER BY reversoes DESC;
```

### 3. Liquidez antes de Reversões
```sql
WITH reversals AS (
    SELECT *, 
           LAG(total_liquidity) OVER (ORDER BY created_at) as liquidez_anterior
    FROM botbinance 
    WHERE reversal IS NOT NULL 
      AND best_bid_price IS NOT NULL
)
SELECT 
    reversal,
    AVG(liquidez_anterior) as liquidez_media_antes,
    AVG(total_liquidity) as liquidez_media_durante,
    COUNT(*) as quantidade
FROM reversals
GROUP BY reversal;
```

## Logs de Debug

### Dados Completos
```
📊 Incluindo dados do order book no registro
💾 Salvando bloco Renko com order book no banco de dados: {
  open: 67450.00,
  close: 67460.00,
  volume: 1250.50,
  reversal: 1,
  best_bid_price: 67459.99,
  best_ask_price: 67460.01,
  spread_percentage: 0.0003,
  total_liquidity: 125000.00,
  imbalance: 0.15
}
✅ Bloco Renko salvo no banco com order book
```

### Fallback (Order Book Desabilitado)
```
💾 Salvando bloco Renko no banco de dados: {
  open: 67450.00,
  close: 67460.00,
  volume: 1250.50,
  reversal: 1
}
✅ Bloco Renko salvo no banco (campos básicos + reversal)
```

### Erro e Recuperação
```
⚠️ Alguns campos não existem, tentando apenas com campos básicos...
✅ Bloco Renko salvo no banco (apenas campos básicos)
```

## Benefícios da Integração

### 1. Análise Contextual
- **Reversões**: Entender o contexto de liquidez durante mudanças de tendência
- **Timing**: Identificar padrões de spread e liquidez
- **Qualidade**: Avaliar qualidade dos sinais baseado em contexto de mercado

### 2. Simplicidade
- **Uma tabela**: Todos os dados em local único
- **Queries simples**: JOINs desnecessários
- **Backup unificado**: Estratégia de backup simplificada

### 3. Performance
- **Menos tabelas**: Reduz complexidade de queries
- **Índices otimizados**: Índices em campos relevantes
- **Cache eficiente**: Dados relacionados próximos fisicamente

### 4. Compatibilidade
- **Dados antigos**: Campos de order book ficam NULL em registros antigos
- **Migração gradual**: Sistema funciona com ou sem order book
- **Fallback robusto**: Sempre salva pelo menos dados básicos

## Troubleshooting

### Order Book não está sendo salvo
1. Verificar se está habilitado: `window.renkoChart.orderBookEnabled`
2. Verificar WebSocket: `window.renkoChart.orderBookWs?.readyState === 1`
3. Verificar dados: `window.renkoChart.orderBookStats.lastUpdate`

### Campos não existem na tabela
1. Execute o script `add_orderbook_fields.sql`
2. Verifique permissões no Supabase
3. Sistema usará fallback automaticamente

### Performance degradada
1. Verificar índices criados
2. Considerar retenção de dados (manter apenas X dias)
3. Monitorar tamanho da tabela

## Queries de Exemplo

### Estatísticas Diárias
```sql
SELECT 
    DATE(created_at) as dia,
    COUNT(*) as blocos_total,
    COUNT(CASE WHEN reversal = 1 THEN 1 END) as reversoes_alta,
    COUNT(CASE WHEN reversal = -1 THEN 1 END) as reversoes_baixa,
    AVG(volume) as volume_medio,
    AVG(spread_percentage) as spread_medio,
    AVG(total_liquidity) as liquidez_media
FROM botbinance 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dia
ORDER BY dia DESC;
```

### Top Reversões por Liquidez
```sql
SELECT 
    created_at,
    open, close,
    CASE WHEN reversal = 1 THEN '⬆️ Alta' ELSE '⬇️ Baixa' END as tipo,
    total_liquidity,
    spread_percentage,
    imbalance
FROM botbinance 
WHERE reversal IS NOT NULL 
  AND total_liquidity IS NOT NULL
ORDER BY total_liquidity DESC
LIMIT 20;
```

### Correlação Spread vs Reversões
```sql
SELECT 
    CASE 
        WHEN spread_percentage < 0.01 THEN 'Baixo (<0.01%)'
        WHEN spread_percentage < 0.05 THEN 'Médio (0.01-0.05%)'
        ELSE 'Alto (>0.05%)'
    END as categoria_spread,
    COUNT(*) as total_blocos,
    COUNT(CASE WHEN reversal IS NOT NULL THEN 1 END) as reversoes,
    ROUND(COUNT(CASE WHEN reversal IS NOT NULL THEN 1 END)::numeric / COUNT(*) * 100, 2) as taxa_reversao
FROM botbinance 
WHERE spread_percentage IS NOT NULL
GROUP BY categoria_spread
ORDER BY taxa_reversao DESC;
```
